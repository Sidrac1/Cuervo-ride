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
from django.http import Http404
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from .models import (
    InformacionMedica,
    PerfilConductor,
    Vehiculo,
)

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
    return render(request, plantilla)


@user_passes_test(es_administrador, login_url="login")
def panel_admin(request):
    usuarios = Usuario.objects.all().order_by("nombre", "first_name", "last_name")

    contexto = {
        "usuarios": usuarios,
        "total_usuarios": usuarios.count(),
        "total_pasajeros": usuarios.filter(rol=Usuario.Roles.PASAJERO).count(),
        "total_conductores": usuarios.filter(rol=Usuario.Roles.CONDUCTOR).count(),
        "total_pendientes": usuarios.filter(
            estado_cuenta=Usuario.EstadosCuenta.PENDIENTE
        ).count(),
    }

    return render(request, "admin/index.html", contexto)


# ========================================================
@user_passes_test(es_administrador, login_url="login")
def panel_alertas(request):
    alertas = Usuario.objects.all().order_by("-id")
    contexto = {
        "alertas": alertas,
        "total_alertas": alertas.count(),
        "total_alertas_urgentes": alertas.filter(tipo="critico").count(),
        "total_alertas_medio": alertas.filter(tipo="medio").count(),
        "total_alertas_bajo": alertas.filter(tipo="bajo").count(),
        "total_alertas_inactivo": alertas.filter(estado="inactivo").count(),
        "total_alertas_activas": alertas.filter(estado="activo").count(),
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
# conexión de usuarios y usuario-info para vista de administrador
# =========================================================
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_http_methods
import json

# =========================================================
# VISTAS DE NAVEGACIÓN PANEL ADMIN
# =========================================================

@user_passes_test(es_administrador, login_url="login")
def cargar_vista(request, vista):
    plantilla = VISTAS_ADMIN.get(vista)
    if plantilla is None:
        raise Http404("Vista administrativa no encontrada.")
    
    contexto = {}
    
    # Si se carga la vista de la tabla de usuarios, obtenemos la lista real de la BD
    if vista == "usuarios":
        contexto["usuarios"] = Usuario.objects.all().order_by("-id")
        
    return render(request, plantilla, contexto)


# =========================================================
# API REST JSON PARA USUARIOS EN EL PANEL ADMIN
# =========================================================

@user_passes_test(es_administrador, login_url="login")
def api_obtener_usuario(request, usuario_id):
    """Devuelve los detalles de un usuario específico de la BD."""
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        
        # Extracción del cuatrimestre desde grado_grupo si aplica
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
            "estado": "Activo" if usuario.estado_cuenta == Usuario.EstadosCuenta.ACTIVA else "Inactivo",
            "telefono": usuario.telefono,
        }
        return JsonResponse({"ok": True, "usuario": data})
    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Usuario no encontrado."}, status=404)


@user_passes_test(es_administrador, login_url="login")
@require_http_methods(["POST"])
def api_actualizar_usuario(request, usuario_id):
    """Actualiza la información del usuario en la BD."""
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        data = json.loads(request.body)

        # Actualización de campos generales
        usuario.nombre = data.get("nombre", usuario.nombre)
        usuario.email = data.get("correo", usuario.email)
        usuario.matricula = data.get("matricula", usuario.matricula)
        usuario.grado_grupo = data.get("cuatrimestre", usuario.grado_grupo)
        usuario.carrera = data.get("carrera", usuario.carrera)
        usuario.telefono = data.get("telefono", usuario.telefono)
        
        # Mapeo de rol
        nuevo_rol = data.get("rol", "").lower()
        if nuevo_rol in {Usuario.Roles.ADMINISTRADOR, Usuario.Roles.CONDUCTOR, Usuario.Roles.PASAJERO}:
            usuario.rol = nuevo_rol

        # Mapeo de estado
        nuevo_estado = data.get("estado", "")
        if nuevo_estado == "Activo":
            usuario.estado_cuenta = Usuario.EstadosCuenta.ACTIVA
        elif nuevo_estado == "Inactivo":
            usuario.estado_cuenta = Usuario.EstadosCuenta.SUSPENDIDA

        # Contraseña (solo si se especifica un valor nuevo)
        nueva_password = data.get("password")
        if nueva_password and nueva_password.strip():
            usuario.set_password(nueva_password)

        usuario.save()
        return JsonResponse({"ok": True, "mensaje": "Usuario actualizado correctamente."})

    except Usuario.DoesNotExist:
        return JsonResponse({"ok": False, "error": "El usuario no existe."}, status=404)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)
