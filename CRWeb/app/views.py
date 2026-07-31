from urllib.parse import urlencode
from django.contrib import messages
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login as auth_login,
    logout as auth_logout,
)
from django.contrib.auth.decorators import (
    login_required,
    user_passes_test,
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST, require_http_methods

import json

from .models import (
    InformacionMedica,
    PerfilConductor,
    Vehiculo,
    Viaje,
    SalaChat,
    AlertaEmergencia,

)
from .forms import PublicarViajeForm
from .validators import validar_imagen_jpeg

Usuario = get_user_model()


# =========================================================
# FUNCIONES AUXILIARES
# =========================================================

def inicio(request):
    if request.user.is_authenticated:
        return redirect("home")
    return redirect("login")

def es_administrador(usuario):
    return (
        usuario.is_authenticated
        and (
            usuario.is_staff
            or usuario.is_superuser
            or getattr(usuario, "rol", "") == Usuario.Roles.ADMINISTRADOR
        )
    )


def obtener_rol(usuario):
    return getattr(usuario, "rol", Usuario.Roles.PASAJERO)


def redirigir_segun_rol(usuario):
    if es_administrador(usuario):
        return redirect("index")

    rol = obtener_rol(usuario)
    if rol == Usuario.Roles.CONDUCTOR:
        base_url = reverse("perfil")
        query_string = urlencode({"tab": "vehiculo"})
        return redirect(f"{base_url}?{query_string}")

    return redirect("home")


def valor_booleano(request, nombre):
    return request.POST.get(nombre) in {"on", "true", "True", "1", "si", "sí"}


# =========================================================
# VISTAS PÚBLICAS
# =========================================================

def home(request):
    return render(request, "home.html")


def sobrenosotros(request):
    return render(request, "nosotros.html")


def agendarviaje(request):
    return render(request, "agendarviaje.html")


def filtroviajes(request):
    return render(request, "filtroviajes.html")



# =========================================================
# LOGIN
# =========================================================

def login_view(request):
    if request.user.is_authenticated:
        return redirigir_segun_rol(request.user)

    redirect_to = request.POST.get("next") or request.GET.get("next") or ""

    if request.method == "POST":
        correo = (
            request.POST.get("correo")
            or request.POST.get("email")
            or ""
        ).strip().lower()
        password = request.POST.get("password", "")

        if not correo or not password:
            messages.error(request, "Debes ingresar tu correo y contraseña.")
            return render(request, "forms/login.html", {"correo_ingresado": correo})

        usuario = authenticate(request, username=correo, password=password)

        if usuario is None:
            messages.error(request, "El correo o la contraseña son incorrectos.")
            return render(request, "forms/login.html", {"correo_ingresado": correo})

        if not usuario.is_active:
            messages.error(request, "Esta cuenta se encuentra desactivada.")
            return render(request, "forms/login.html", {"correo_ingresado": correo})

        estado_cuenta = getattr(usuario, "estado_cuenta", "activa")
        if estado_cuenta in {"suspendida", "bloqueada"}:
            messages.error(request, "Tu cuenta no está disponible actualmente.")
            return render(request, "forms/login.html", {"correo_ingresado": correo})

        auth_login(request, usuario)

        # Redirigir a 'next' si existe y es seguro, de lo contrario al flujo por rol
        if redirect_to:
            return redirect(redirect_to)

        return redirigir_segun_rol(usuario)

    return render(request, "forms/login.html")


# =========================================================
# REGISTRO
# =========================================================

def register(request):
    if request.user.is_authenticated:
        return redirigir_segun_rol(request.user)

    if request.method == "POST":
        nombre = request.POST.get("nombre", "").strip()
        apellido_paterno = request.POST.get("apellido_paterno", "").strip()
        apellido_materno = request.POST.get("apellido_materno", "").strip()
        matricula = request.POST.get("matricula", "").strip().upper()
        carrera = request.POST.get("carrera", "").strip()
        grado_grupo = request.POST.get("grado_grupo", "").strip()
        telefono = request.POST.get("telefono", "").strip()
        correo = (request.POST.get("correo") or request.POST.get("email") or "").strip().lower()
        password = request.POST.get("password", "")
        confirmar_password = request.POST.get("confirmar_password", "")
        rol = request.POST.get("rol", Usuario.Roles.PASAJERO).strip().lower()

        datos_formulario = {
            "nombre": nombre,
            "apellido_paterno": apellido_paterno,
            "apellido_materno": apellido_materno,
            "matricula": matricula,
            "carrera": carrera,
            "grado_grupo": grado_grupo,
            "telefono": telefono,
            "correo": correo,
            "rol": rol,
        }

        errores = []

        if not nombre: errores.append("El nombre es obligatorio.")
        if not apellido_paterno: errores.append("El apellido paterno es obligatorio.")
        if not matricula: errores.append("La matrícula es obligatoria.")
        if not carrera: errores.append("La carrera es obligatoria.")
        if not grado_grupo: errores.append("El grado y grupo son obligatorios.")
        if not telefono: errores.append("El teléfono es obligatorio.")
        if not correo: errores.append("El correo electrónico es obligatorio.")
        if not password: errores.append("La contraseña es obligatoria.")
        if not confirmar_password: errores.append("Debes confirmar la contraseña.")

        if password and confirmar_password and password != confirmar_password:
            errores.append("Las contraseñas no coinciden.")

        if password:
            try:
                validate_password(password)
            except ValidationError as error_password:
                errores.extend(error_password.messages)

        roles_validos = {Usuario.Roles.PASAJERO, Usuario.Roles.CONDUCTOR}
        if rol not in roles_validos:
            errores.append("El rol seleccionado no es válido.")

        if correo and Usuario.objects.filter(email__iexact=correo).exists():
            errores.append("Ya existe una cuenta registrada con ese correo.")

        if matricula and Usuario.objects.filter(matricula__iexact=matricula).exists():
            errores.append("Ya existe una cuenta registrada con esa matrícula.")

        if errores:
            for error in errores:
                messages.error(request, error)
            return render(request, "forms/register.html", {"datos": datos_formulario})

        try:
            with transaction.atomic():
                usuario = Usuario.objects.create_user(
                    email=correo,
                    password=password,
                    nombre=nombre,
                    first_name=apellido_paterno,
                    last_name=apellido_materno,
                    matricula=matricula,
                    carrera=carrera,
                    grado_grupo=grado_grupo,
                    telefono=telefono,
                    rol=rol,
                    estado_cuenta=Usuario.EstadosCuenta.ACTIVA,
                    correo_verificado=False,
                )
                InformacionMedica.objects.create(usuario=usuario)

        except IntegrityError:
            messages.error(
                request,
                "No fue posible crear la cuenta. El correo o la matrícula ya están registrados.",
            )
            return render(request, "forms/register.html", {"datos": datos_formulario})
        except Exception as error:
            messages.error(request, "Ocurrió un error inesperado al crear la cuenta.")
            return render(request, "forms/register.html", {"datos": datos_formulario})

        auth_login(request, usuario)
        messages.success(request, "Tu cuenta fue creada correctamente.")
        return redirect("infoMedica")

    return render(request, "forms/register.html")


# =========================================================
# INFORMACIÓN MÉDICA Y PERFIL
# =========================================================

@login_required(login_url="login")
def infoMedica(request):
    informacion_medica, _ = InformacionMedica.objects.get_or_create(usuario=request.user)

    if request.method == "POST":
        informacion_medica.tipo_sangre = request.POST.get("tipo_sangre") or None
        informacion_medica.discapacidad = valor_booleano(request, "discapacidad")
        informacion_medica.tipo_discapacidad = request.POST.get("tipo_discapacidad") or None
        informacion_medica.descripcion_discapacidad = request.POST.get("descripcion_discapacidad", "").strip()
        informacion_medica.vehiculo_adaptado = valor_booleano(request, "vehiculo_adaptado")
        informacion_medica.cuidados_especiales = valor_booleano(request, "cuidados_especiales")
        informacion_medica.usa_baston = valor_booleano(request, "usa_baston")
        informacion_medica.usa_perro_guia = valor_booleano(request, "usa_perro_guia")
        informacion_medica.usa_silla_ruedas = valor_booleano(request, "usa_silla_ruedas")
        informacion_medica.usa_andadera = valor_booleano(request, "usa_andadera")
        informacion_medica.usa_muletas = valor_booleano(request, "usa_muletas")
        informacion_medica.usa_protesis = valor_booleano(request, "usa_protesis")
        informacion_medica.otro_apoyo = request.POST.get("otro_apoyo", "").strip()
        informacion_medica.alergias = request.POST.get("alergias", "").strip()
        informacion_medica.medicamentos = request.POST.get("medicamentos", "").strip()
        informacion_medica.condiciones_medicas = request.POST.get("condiciones_medicas", "").strip()
        informacion_medica.nombre_contacto = request.POST.get("nombre_contacto", "").strip()
        informacion_medica.telefono_contacto = request.POST.get("telefono_contacto", "").strip()
        informacion_medica.parentesco_contacto = request.POST.get("parentesco_contacto", "").strip()
        informacion_medica.observaciones = request.POST.get("observaciones", "").strip()

        try:
            informacion_medica.full_clean()
            informacion_medica.save()
        except ValidationError as error:
            for mensajes_campo in error.message_dict.values():
                for mensaje in mensajes_campo:
                    messages.error(request, mensaje)
            return render(request, "forms/infoMedica.html", {"informacion_medica": informacion_medica})

        messages.success(request, "La información médica fue guardada correctamente.")

        if obtener_rol(request.user) == Usuario.Roles.CONDUCTOR:
            base_url = reverse("perfil")
            query_string = urlencode({"tab": "vehiculo"})
            return redirect(f"{base_url}?{query_string}")

        return redirect("home")

    return render(request, "forms/infoMedica.html", {"informacion_medica": informacion_medica})


@login_required(login_url="login")
def perfil(request):
    informacion_medica, _ = InformacionMedica.objects.get_or_create(usuario=request.user)

    if request.method == "POST":
        tipo_formulario = request.POST.get("tipo_formulario", "").strip()

        # ----------------------------------------------------
        # FORMULARIO: CONFIGURACIÓN
        # ----------------------------------------------------
        if tipo_formulario == "configuracion":
            nuevo_rol = request.POST.get("rol", "").strip().lower()
            roles_permitidos = {Usuario.Roles.PASAJERO, Usuario.Roles.CONDUCTOR}

            if nuevo_rol not in roles_permitidos:
                messages.error(request, "El rol seleccionado no es válido.")
                return redirect("perfil")

            rol_anterior = obtener_rol(request.user)
            request.user.rol = nuevo_rol
            request.user.save(update_fields=["rol"])

            if nuevo_rol == Usuario.Roles.CONDUCTOR:
                PerfilConductor.objects.get_or_create(usuario=request.user)
                if rol_anterior != nuevo_rol:
                    messages.success(request, "Tu cuenta fue cambiada al rol de conductor.")
                else:
                    messages.info(request, "Tu cuenta ya tenía el rol de conductor.")
                
                base_url = reverse("perfil")
                query_string = urlencode({"tab": "vehiculo"})
                return redirect(f"{base_url}?{query_string}")

            if rol_anterior != nuevo_rol:
                messages.success(request, "Tu cuenta fue cambiada al rol de pasajero.")
            else:
                messages.info(request, "Tu cuenta ya tenía el rol de pasajero.")

            return redirect("perfil")
        # ----------------------------------------------------
        # FORMULARIO: Datos Conductor
        # ----------------------------------------------------
        if tipo_formulario == "datos_conductor":
            if not request.user.es_conductor:
                messages.error(request, "Solo los usuarios con rol de conductor pueden editar esta información.")
                return redirect("perfil")

            perfil_conductor, _ = PerfilConductor.objects.get_or_create(usuario=request.user)

            numero_licencia = request.POST.get("numero_licencia", "").strip()
            fecha_vencimiento = request.POST.get("fecha_vencimiento", "").strip()
            foto_frontal = request.FILES.get("foto_licencia_frontal")
            foto_reverso = request.FILES.get("foto_licencia_reverso")

            for etiqueta, archivo in (
                ("frontal", foto_frontal),
                ("posterior", foto_reverso),
            ):
                if archivo is not None:
                    try:
                        validar_imagen_jpeg(archivo)
                    except ValidationError as error:
                        messages.error(request, f"Foto {etiqueta}: {'; '.join(error.messages)}")
                        return redirect("perfil")

            if numero_licencia:
                perfil_conductor.numero_licencia = numero_licencia
            if fecha_vencimiento:
                perfil_conductor.fecha_vencimiento = fecha_vencimiento
            if foto_frontal is not None:
                perfil_conductor.foto_licencia_frontal = foto_frontal
            if foto_reverso is not None:
                perfil_conductor.foto_licencia_reverso = foto_reverso

            if perfil_conductor.estado_verificacion in {
                PerfilConductor.EstadosVerificacion.RECHAZADO,
                PerfilConductor.EstadosVerificacion.APROBADO,
            }:
                perfil_conductor.estado_verificacion = PerfilConductor.EstadosVerificacion.EN_REVISION
                perfil_conductor.motivo_rechazo = ""

            try:
                perfil_conductor.full_clean()
                perfil_conductor.save()
            except ValidationError as error:
                for mensajes_campo in error.message_dict.values():
                    for mensaje in mensajes_campo:
                        messages.error(request, mensaje)
                return redirect("perfil")

            messages.success(request, "Tus datos de conductor fueron guardados correctamente.")

            base_url = reverse("perfil")
            query_string = urlencode({"tab": "conductor"})
            return redirect(f"{base_url}?{query_string}")

        # ----------------------------------------------------
        # FORMULARIO: Vehiculo
        # ----------------------------------------------------
        if tipo_formulario == "vehiculo":
            if not request.user.es_conductor:
                messages.error(request, "Solo los usuarios con rol de conductor pueden registrar un vehículo.")
                return redirect("perfil")

            perfil_conductor, _ = PerfilConductor.objects.get_or_create(usuario=request.user)

            vehiculo = (
                Vehiculo.objects.filter(conductor=perfil_conductor, activo=True)
                .order_by("-fecha_registro")
                .first()
            )

            foto_vehiculo = request.FILES.get("foto_vehiculo")

            if foto_vehiculo is not None:
                try:
                    validar_imagen_jpeg(foto_vehiculo)
                except ValidationError as error:
                    messages.error(request, "; ".join(error.messages))
                    return redirect("perfil")
            elif vehiculo is None:
                messages.error(request, "Debes subir una foto del vehículo en formato JPG o JPEG.")
                return redirect("perfil")

            if vehiculo is None:
                vehiculo = Vehiculo(conductor=perfil_conductor)

            vehiculo.dueno = request.POST.get("dueno", "").strip()
            vehiculo.marca = request.POST.get("marca", "").strip()
            vehiculo.modelo = request.POST.get("modelo", "").strip()
            vehiculo.color = request.POST.get("color", "").strip()
            vehiculo.placas = request.POST.get("placas", "").strip().upper()

            capacidad = request.POST.get("capacidad")
            if capacidad:
                vehiculo.capacidad = int(capacidad)

            try:
                vehiculo.anio = int(request.POST.get("anio", 0))
                vehiculo.capacidad = int(request.POST.get("capacidad", 0))
            except (TypeError, ValueError):
                messages.error(request, "Año y capacidad deben ser números.")
                return redirect("perfil")

            if foto_vehiculo is not None:
                vehiculo.foto = foto_vehiculo

            tarjeta_circulacion = request.FILES.get("tarjeta_circulacion")
            if tarjeta_circulacion is not None:
                vehiculo.tarjeta_circulacion = tarjeta_circulacion

            documento_seguro = request.FILES.get("poliza_seguro")
            if documento_seguro is not None:
                vehiculo.documento_seguro = documento_seguro

            if vehiculo.estado in {
                Vehiculo.EstadosVehiculo.RECHAZADO,
                Vehiculo.EstadosVehiculo.APROBADO,
            }:
                vehiculo.estado = Vehiculo.EstadosVehiculo.EN_REVISION
                vehiculo.motivo_rechazo = ""

            try:
                vehiculo.full_clean()
                vehiculo.save()
            except ValidationError as error:
                for mensajes_campo in error.message_dict.values():
                    for mensaje in mensajes_campo:
                        messages.error(request, mensaje)
                return redirect("perfil")

            messages.success(request, "El vehículo fue guardado correctamente.")

            base_url = reverse("perfil")
            query_string = urlencode({"tab": "vehiculo"})
            return redirect(f"{base_url}?{query_string}")

        messages.error(request, "No se reconoció el formulario enviado.")
        return redirect("perfil")
 
    perfil_conductor = None
    vehiculo = None
    rol_usuario = obtener_rol(request.user)

    if rol_usuario == Usuario.Roles.CONDUCTOR:
        perfil_conductor, _ = PerfilConductor.objects.get_or_create(usuario=request.user)
        vehiculo = (
            Vehiculo.objects.filter(conductor=perfil_conductor, activo=True)
            .order_by("-fecha_registro")
            .first()
        )

    contexto = {
        "rol_usuario": rol_usuario,
        "informacion_medica": informacion_medica,
        "historial_medico": informacion_medica,
        "perfil_conductor": perfil_conductor,
        "vehiculo": vehiculo,
    }

    return render(request, "perfil/perfil.html", contexto)

# =========================================================
# PUBLICAR VIAJE
# =========================================================

@login_required(login_url="login")
def publicar_viaje(request):

    if not request.user.es_conductor:
        messages.error(
            request,
            "Solo los usuarios con rol de conductor "
            "pueden publicar viajes."
        )
        return redirect("home")

    try:
        perfil_conductor = request.user.perfil_conductor

    except PerfilConductor.DoesNotExist:
        messages.warning(
            request,
            "Debes completar primero tu perfil de conductor."
        )

        base_url = reverse("perfil")
        query_string = urlencode({
            "tab": "vehiculo"
        })

        return redirect(
            f"{base_url}?{query_string}"
        )

    if (
        perfil_conductor.estado_verificacion
        != PerfilConductor.EstadosVerificacion.APROBADO
    ):
        messages.warning(
            request,
            "Tu perfil de conductor debe estar aprobado "
            "antes de publicar viajes."
        )

        return redirect("perfil")

    vehiculos_disponibles = (
        Vehiculo.objects.filter(
            conductor=perfil_conductor,
            activo=True,
            estado=Vehiculo.EstadosVehiculo.APROBADO,
        )
        .order_by("-fecha_registro")
    )

    if not vehiculos_disponibles.exists():
        messages.warning(
            request,
            "Necesitas tener al menos un vehículo aprobado "
            "y activo para publicar un viaje."
        )

        base_url = reverse("perfil")
        query_string = urlencode({
            "tab": "vehiculo"
        })

        return redirect(
            f"{base_url}?{query_string}"
        )

    if request.method == "POST":

        formulario = PublicarViajeForm(
            request.POST,
            conductor=perfil_conductor,
        )

        if formulario.is_valid():

            try:
                with transaction.atomic():

                    viaje = formulario.save(
                        commit=False
                    )

                    viaje.conductor = perfil_conductor

                    viaje.asientos_disponibles = (
                        viaje.asientos_totales
                    )

                    viaje.estado = (
                        Viaje.EstadosViaje.DISPONIBLE
                    )

                    viaje.full_clean()
                    viaje.save()

                    SalaChat.objects.create(
                        viaje=viaje,
                        activa=True,
                    )

            except ValidationError as error:

                if hasattr(error, "message_dict"):
                    for campo, errores in (
                        error.message_dict.items()
                    ):
                        for mensaje in errores:

                            if campo in formulario.fields:
                                formulario.add_error(
                                    campo,
                                    mensaje,
                                )
                            else:
                                formulario.add_error(
                                    None,
                                    mensaje,
                                )
                else:
                    formulario.add_error(
                        None,
                        error.message,
                    )

            except IntegrityError:

                formulario.add_error(
                    None,
                    (
                        "No fue posible publicar el viaje. "
                        "Inténtalo nuevamente."
                    ),
                )

            else:

                messages.success(
                    request,
                    "El viaje fue publicado correctamente."
                )

                return redirect("mis_viajes_conductor")

    else:

        formulario = PublicarViajeForm(
            conductor=perfil_conductor,
        )

    contexto = {
        "formulario": formulario,
        "perfil_conductor": perfil_conductor,
        "vehiculos_disponibles": vehiculos_disponibles,
    }

    return render(
        request,
        "viajes/publicar_viaje.html",
        contexto,
    )

#==========================================================
# Mis Viajes - Conductor
#==========================================================

@login_required(login_url="login")
def mis_viajes_conductor(request):

    if request.user.rol != request.user.Roles.CONDUCTOR:
        messages.error(
            request,
            "Esta sección está disponible únicamente para conductores."
        )
        return redirect("home")

    try:
        perfil_conductor = request.user.perfil_conductor
    except PerfilConductor.DoesNotExist:
        messages.warning(
            request,
            "Primero debes completar tu perfil de conductor."
        )

        return redirect("perfil")

    filtro = request.GET.get("estado", "todos").lower()

    viajes = (
        Viaje.objects
        .filter(conductor=perfil_conductor)
        .select_related("vehiculo")
        .order_by("-fecha_hora_salida")
    )

    filtros_permitidos = {
        "todos",
        "disponibles",
        "en_curso",
        "finalizados",
        "cancelados",
    }

    if filtro not in filtros_permitidos:
        filtro = "todos"

    if filtro == "disponibles":
        viajes = viajes.filter(
            estado__in=[
                Viaje.EstadosViaje.DISPONIBLE,
                Viaje.EstadosViaje.COMPLETO,
            ]
        )

    elif filtro == "en_curso":
        viajes = viajes.filter(
            estado=Viaje.EstadosViaje.EN_CURSO
        )

    elif filtro == "finalizados":
        viajes = viajes.filter(
            estado=Viaje.EstadosViaje.FINALIZADO
        )

    elif filtro == "cancelados":
        viajes = viajes.filter(
            estado=Viaje.EstadosViaje.CANCELADO
        )

    todos_los_viajes = Viaje.objects.filter(
        conductor=perfil_conductor
    )

    estadisticas = {
        "total": todos_los_viajes.count(),

        "disponibles": todos_los_viajes.filter(
            estado__in=[
                Viaje.EstadosViaje.DISPONIBLE,
                Viaje.EstadosViaje.COMPLETO,
            ]
        ).count(),

        "en_curso": todos_los_viajes.filter(
            estado=Viaje.EstadosViaje.EN_CURSO
        ).count(),

        "finalizados": todos_los_viajes.filter(
            estado=Viaje.EstadosViaje.FINALIZADO
        ).count(),

        "cancelados": todos_los_viajes.filter(
            estado=Viaje.EstadosViaje.CANCELADO
        ).count(),
    }

    contexto = {
        "viajes": viajes,
        "filtro_actual": filtro,
        "estadisticas": estadisticas,
    }

    return render(
        request,
        "viajes/mis_viajes_conductor.html",
        contexto
    )

#==========================================================
# Mis viajes - Pasajero
#==========================================================

@login_required
def mis_viajes_pasajero(request):

    if request.user.rol != "pasajero":
        return render(request, "403.html", status=403)

    filtro = request.GET.get("estado", "todos")

    solicitudes = SolicitudViaje.objects.filter(
        pasajero=request.user
    ).select_related(
        "viaje",
        "viaje__conductor__usuario",
        "viaje__vehiculo"
    )

    if filtro == "pendientes":
        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.PENDIENTE
        )

    elif filtro == "aceptadas":
        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.ACEPTADA
        )

    elif filtro == "rechazadas":
        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.RECHAZADA
        )

    elif filtro == "canceladas":
        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.CANCELADA
        )

    elif filtro == "completadas":
        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.COMPLETADA
        )

    estadisticas = {
        "total": SolicitudViaje.objects.filter(
            pasajero=request.user
        ).count(),

        "pendientes": SolicitudViaje.objects.filter(
            pasajero=request.user,
            estado=SolicitudViaje.EstadosSolicitud.PENDIENTE
        ).count(),

        "aceptadas": SolicitudViaje.objects.filter(
            pasajero=request.user,
            estado=SolicitudViaje.EstadosSolicitud.ACEPTADA
        ).count(),

        "completadas": SolicitudViaje.objects.filter(
            pasajero=request.user,
            estado=SolicitudViaje.EstadosSolicitud.COMPLETADA
        ).count(),

        "canceladas": SolicitudViaje.objects.filter(
            pasajero=request.user,
            estado=SolicitudViaje.EstadosSolicitud.CANCELADA
        ).count(),
    }

    return render(
        request,
        "viajes/mis_viajes_pasajero.html",
        {
            "solicitudes": solicitudes,
            "estadisticas": estadisticas,
            "filtro_actual": filtro,
        },
    )

# =========================================================
# PANEL ADMINISTRATIVO
# =========================================================

VISTAS_ADMIN = {
    "inicio": "dashAd/partials/inicio.html",
    "usuarios": "dashAd/partials/usuarios.html",
    "usuario-info": "dashAd/partials/usuario-info.html",
    "expediente": "dashAd/partials/expediente.html",
    "rides": "dashAd/partials/rides.html",
    "alertas": "dashAd/partials/alertas.html",
    "puntuacion": "dashAd/partials/puntuacion.html",
}


@user_passes_test(es_administrador, login_url="login")
def index(request):
    return render(request, "dashAd/index.html")

@user_passes_test(es_administrador, login_url="login")
def cargar_vista(request, vista):
    plantilla = VISTAS_ADMIN.get(vista)
    if plantilla is None:
        raise Http404("Vista administrativa no encontrada.")

    contexto = {}

    if vista == "usuarios":
        contexto["usuarios"] = Usuario.objects.all().order_by("-id")

    return render(request, plantilla, contexto)


@user_passes_test(es_administrador, login_url="login")
def panel_admin(request):
    return redirect("index")


# ========================================================
# CONTEO DE ALERTAS PARA EL ADMINISTRADOR
# ========================================================

@user_passes_test(es_administrador, login_url="login")
def panel_alertas(request):
    alertas = (
        AlertaEmergencia.objects
        .select_related("usuario", "viaje")
        .order_by("-fecha_activacion")
    )

    contexto = {
        "alertas": alertas,
        "total_alertas": alertas.count(),
        "total_alertas_urgentes": alertas.filter(tipo=AlertaEmergencia.TiposAlerta.PANICO).count(),
        "total_alertas_medio": alertas.filter(tipo=AlertaEmergencia.TiposAlerta.ACCIDENTE).count(),
        "total_alertas_bajo": alertas.filter(tipo=AlertaEmergencia.TiposAlerta.OTRO).count(),
        "total_alertas_activas": alertas.filter(estado=AlertaEmergencia.EstadosAlerta.ACTIVA).count(),
        "total_alertas_resueltas": alertas.filter(estado=AlertaEmergencia.EstadosAlerta.RESUELTA).count(),
    }

    return render(request, "dashAd/partials/alertas.html", contexto)


# =========================================================
# CERRAR SESIÓN
# =========================================================

@require_POST
@login_required(login_url="login")
def logout_view(request):
    auth_logout(request)
    messages.success(request, "La sesión se cerró correctamente.")
    return redirect("login")


# =========================================================
# API REST JSON PARA USUARIOS EN EL PANEL ADMIN
# =========================================================

@user_passes_test(es_administrador, login_url="login")
def api_obtener_usuario(request, usuario_id):
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        
        grado = getattr(usuario, "grado_grupo", "")
        
        data = {
            "id": usuario.id,
            "nombre": usuario.get_full_name() or usuario.nombre,
            "first_name": usuario.nombre,
            "correo": usuario.email,
            "matricula": usuario.matricula,
            "cuatrimestre": grado,
            "carrera": usuario.carrera,
            "rol": usuario.rol,
            "estado": usuario.estado_cuenta,
            "estado_display": usuario.get_estado_cuenta_display(),
            "telefono": usuario.telefono,
        }

        if usuario.rol == Usuario.Roles.CONDUCTOR:
            try:
                perfil_conductor = getattr(usuario, "perfil_conductor", None)

                if perfil_conductor is not None:
                    data["conductor"] = {
                        "numero_licencia": perfil_conductor.numero_licencia,
                        "fecha_vencimiento": (
                            perfil_conductor.fecha_vencimiento.isoformat()
                            if perfil_conductor.fecha_vencimiento else None
                        ),
                        "foto_licencia_frontal": (
                            perfil_conductor.foto_licencia_frontal.url
                            if perfil_conductor.foto_licencia_frontal else None
                        ),
                        "foto_licencia_reverso": (
                            perfil_conductor.foto_licencia_reverso.url
                            if perfil_conductor.foto_licencia_reverso else None
                        ),
                        "estado_verificacion": perfil_conductor.estado_verificacion,
                        "estado_verificacion_display": perfil_conductor.get_estado_verificacion_display(),
                        "motivo_rechazo": perfil_conductor.motivo_rechazo,
                    }

                    vehiculo = (
                        Vehiculo.objects.filter(conductor=perfil_conductor, activo=True)
                        .order_by("-fecha_registro")
                        .first()
                    )
                    if vehiculo is not None:
                        data["vehiculo"] = {
                            "id": vehiculo.id,
                            "marca": vehiculo.marca,
                            "modelo": vehiculo.modelo,
                            "anio": vehiculo.anio,
                            "color": vehiculo.color,
                            "placas": vehiculo.placas,
                            "capacidad": vehiculo.capacidad,
                            "foto": vehiculo.foto.url if vehiculo.foto else None,
                            "tarjeta_circulacion": (
                                vehiculo.tarjeta_circulacion.url if vehiculo.tarjeta_circulacion else None
                            ),
                            "documento_seguro": (
                                vehiculo.documento_seguro.url if vehiculo.documento_seguro else None
                            ),
                            "estado": vehiculo.estado,
                            "estado_display": vehiculo.get_estado_display(),
                            "motivo_rechazo": vehiculo.motivo_rechazo,
                        }
            except Exception as e:
                data["error_verificacion"] = (
                    f"No se pudieron cargar los datos de verificación: {e}"
                )

        return JsonResponse({"ok": True, "usuario": data})
    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Usuario no encontrado."}, status=404)


@user_passes_test(es_administrador, login_url="login")
@require_http_methods(["POST"])
def api_actualizar_usuario(request, usuario_id):
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        data = json.loads(request.body)

        usuario.nombre = data.get("nombre", usuario.nombre)
        usuario.email = data.get("correo", usuario.email)
        usuario.matricula = data.get("matricula", usuario.matricula)
        usuario.grado_grupo = data.get("cuatrimestre", usuario.grado_grupo)
        usuario.carrera = data.get("carrera", usuario.carrera)
        usuario.telefono = data.get("telefono", usuario.telefono)
        
        nuevo_rol = data.get("rol", "").lower()
        if nuevo_rol in {Usuario.Roles.ADMINISTRADOR, Usuario.Roles.CONDUCTOR, Usuario.Roles.PASAJERO}:
            usuario.rol = nuevo_rol

        nuevo_estado = data.get("estado", "")
        estados_validos = {
            "activa": Usuario.EstadosCuenta.ACTIVA,
            "suspendida": Usuario.EstadosCuenta.SUSPENDIDA,
            "bloqueada": Usuario.EstadosCuenta.BLOQUEADA,
            "pendiente": Usuario.EstadosCuenta.PENDIENTE,
            "activo": Usuario.EstadosCuenta.ACTIVA,
            "inactivo": Usuario.EstadosCuenta.SUSPENDIDA,
        }
        estado_normalizado = estados_validos.get(nuevo_estado.strip().lower())
        if estado_normalizado:
            usuario.estado_cuenta = estado_normalizado

        nueva_password = data.get("password")
        if nueva_password and nueva_password.strip():
            usuario.set_password(nueva_password)

        usuario.save()
        return JsonResponse({"ok": True, "mensaje": "Usuario actualizado correctamente."})

    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "El usuario no existe."}, status=404)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)

# =========================================================
# VERIFICACIÓN DE CONDUCTOR / VEHÍCULO (panel admin)
# =========================================================

@user_passes_test(es_administrador, login_url="login")
@require_http_methods(["POST"])
def api_verificar_conductor(request, usuario_id):
    try:
        usuario = Usuario.objects.get(pk=usuario_id, rol=Usuario.Roles.CONDUCTOR)
        perfil_conductor = usuario.perfil_conductor
    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "El usuario no existe o no es conductor."}, status=404)
    except PerfilConductor.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Este conductor no ha registrado su información todavía."}, status=404)

    try:
        data = json.loads(request.body)
        decision = data.get("decision", "").strip().lower()

        if decision not in {"aprobado", "rechazado"}:
            return JsonResponse({"ok": False, "error": "decision debe ser 'aprobado' o 'rechazado'."}, status=400)

        if decision == "rechazado" and not data.get("motivo", "").strip():
            return JsonResponse({"ok": False, "error": "Debes indicar el motivo del rechazo."}, status=400)

        perfil_conductor.estado_verificacion = (
            PerfilConductor.EstadosVerificacion.APROBADO
            if decision == "aprobado"
            else PerfilConductor.EstadosVerificacion.RECHAZADO
        )
        perfil_conductor.motivo_rechazo = data.get("motivo", "").strip() if decision == "rechazado" else ""
        perfil_conductor.save()

        return JsonResponse({
            "ok": True,
            "mensaje": f"Conductor {decision} correctamente.",
            "estado_verificacion": perfil_conductor.estado_verificacion,
            "estado_verificacion_display": perfil_conductor.get_estado_verificacion_display(),
        })

    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)


@user_passes_test(es_administrador, login_url="login")
@require_http_methods(["POST"])
def api_verificar_vehiculo(request, vehiculo_id):
    try:
        vehiculo = Vehiculo.objects.select_related("conductor__usuario").get(pk=vehiculo_id)
    except Vehiculo.DoesNotExist:
        return JsonResponse({"ok": False, "error": "El vehículo no existe."}, status=404)

    try:
        data = json.loads(request.body)
        decision = data.get("decision", "").strip().lower()

        if decision not in {"aprobado", "rechazado"}:
            return JsonResponse({"ok": False, "error": "decision debe ser 'aprobado' o 'rechazado'."}, status=400)

        if decision == "rechazado" and not data.get("motivo", "").strip():
            return JsonResponse({"ok": False, "error": "Debes indicar el motivo del rechazo."}, status=400)

        vehiculo.estado = (
            Vehiculo.EstadosVehiculo.APROBADO
            if decision == "aprobado"
            else Vehiculo.EstadosVehiculo.RECHAZADO
        )
        vehiculo.motivo_rechazo = data.get("motivo", "").strip() if decision == "rechazado" else ""
        vehiculo.save()

        return JsonResponse({
            "ok": True,
            "mensaje": f"Vehículo {decision} correctamente.",
            "estado": vehiculo.estado,
            "estado_display": vehiculo.get_estado_display(),
        })

    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)


# =========================================================
# VISTAS Y ENDPOINTS ADICIONALES PARA PANEL DE ADMINISTRACIÓN
# =========================================================

@user_passes_test(es_administrador, login_url="login")
def cargar_vista(request, vista):
    plantilla = VISTAS_ADMIN.get(vista)
    if plantilla is None:
        raise Http404("Vista administrativa no encontrada.")

    contexto = {}

    if vista == "inicio":
        contexto["total_usuarios"] = Usuario.objects.count()
        contexto["total_alertas_activas"] = AlertaEmergencia.objects.filter(
            estado=AlertaEmergencia.EstadosAlerta.ACTIVA
        ).count()

    elif vista == "usuarios":
        contexto["usuarios"] = Usuario.objects.all().order_by("-id")

    elif vista == "rides":
        # Carga los viajes con sus datos de conductor y vehículo
        contexto["rides"] = Viaje.objects.select_related(
            "conductor__usuario", "vehiculo"
        ).order_by("-fecha_hora_salida")

    elif vista == "alertas":
        contexto["alertas"] = AlertaEmergencia.objects.select_related(
            "usuario", "viaje"
        ).order_by("-fecha_activacion")

    return render(request, plantilla, contexto)


@user_passes_test(es_administrador, login_url="login")
def api_obtener_expediente_medico(request, usuario_id):
    """
    Retorna la información médica asociada a un usuario en formato JSON.
    """
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        info, _ = InformacionMedica.objects.get_or_create(usuario=usuario)

        data = {
            "usuario_id": usuario.id,
            "nombre_completo": usuario.nombre_completo,
            "tipo_sangre": info.tipo_sangre or "",
            "discapacidad": info.discapacidad,
            "tipo_discapacidad": info.tipo_discapacidad or "",
            "descripcion_discapacidad": info.descripcion_discapacidad or "",
            "alergias": info.alergias or "",
            "medicamentos": info.medicamentos or "",
            "condiciones_medicas": info.condiciones_medicas or "",
            "nombre_contacto": info.nombre_contacto or "",
            "telefono_contacto": info.telefono_contacto or "",
            "parentesco_contacto": info.parentesco_contacto or "",
            "observaciones": info.observaciones or "",
            "verificado": info.verificado,
        }
        return JsonResponse({"ok": True, "expediente": data})
    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Usuario no encontrado."}, status=404)


@user_passes_test(es_administrador, login_url="login")
@require_http_methods(["POST"])
def api_actualizar_expediente_medico(request, usuario_id):
    """
    Actualiza el expediente médico del usuario desde el panel de admin.
    """
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        info, _ = InformacionMedica.objects.get_or_create(usuario=usuario)
        data = json.loads(request.body)

        info.tipo_sangre = data.get("tipo_sangre") or None
        info.alergias = data.get("alergias", "").strip()
        info.medicamentos = data.get("medicamentos", "").strip()
        info.condiciones_medicas = data.get("condiciones_medicas", "").strip()
        info.nombre_contacto = data.get("contacto", "").strip()
        info.telefono_contacto = data.get("telefonoEmergencia", "").strip()
        info.observaciones = data.get("observaciones", "").strip()

        info.full_clean()
        info.save()

        return JsonResponse({"ok": True, "mensaje": "Expediente médico actualizado correctamente."})
    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Usuario no encontrado."}, status=404)
    except ValidationError as e:
        return JsonResponse({"ok": False, "error": e.message_dict}, status=400)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)