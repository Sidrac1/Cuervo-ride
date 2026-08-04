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
from django.db.models import (
    Avg,
    Count,
    Q,
)
from django.http import Http404, JsonResponse
from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST, require_http_methods

import json

from .models import (
    Notificacion,
    SolicitudViaje,
    Usuario,
    InformacionMedica,
    PerfilConductor,
    Vehiculo,
    Viaje,
    SalaChat,
    Mensaje,
    LecturaMensaje,
    AlertaEmergencia,
    SolicitudViaje,
    Calificacion,
)
from .forms import SolicitudViajeForm
from .forms import PublicarViajeForm
from .forms import CalificarConductorForm
from .forms import CalificarPasajeroForm
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

def usuario_pertenece_al_viaje(usuario, viaje):
    """
    Determina si el usuario puede acceder al viaje y a su chat.

    Puede acceder:
    - El conductor propietario del viaje.
    - Un pasajero cuya solicitud haya sido aceptada.
    """

    if (
        viaje.conductor_id
        and viaje.conductor.usuario_id == usuario.id
    ):
        return True

    return SolicitudViaje.objects.filter(
        viaje=viaje,
        pasajero=usuario,
        estado__in=[SolicitudViaje.EstadosSolicitud.ACEPTADA,
        SolicitudViaje.EstadosSolicitud.COMPLETADA],
    ).exists()


# =========================================================
# VISTAS PÚBLICAS
# =========================================================

def home(request):
    return render(request, "home.html")


def sobrenosotros(request):
    return render(request, "nosotros.html")


def filtroviajes(request):
    return render(request, "filtroviajes.html")

#==========================================================
# Agendar viaje 
#==========================================================

@login_required(login_url="login")
def agendarviaje(request):

    if obtener_rol(request.user) != Usuario.Roles.PASAJERO:

        messages.error(
            request,
            "Esta sección está disponible únicamente para pasajeros."
        )

        return redirect("home")

    busqueda = request.GET.get(
        "q",
        ""
    ).strip()

    viajes = (
        Viaje.objects
        .filter(
            estado=Viaje.EstadosViaje.DISPONIBLE,
            fecha_hora_salida__gt=timezone.now(),
            asientos_disponibles__gt=0,
        )
        .select_related(
            "conductor__usuario",
            "vehiculo",
        )
    )

    if busqueda:

        viajes = viajes.filter(

            Q(destino__icontains=busqueda)

            | Q(origen__icontains=busqueda)

            | Q(
                conductor__usuario__nombre__icontains=busqueda
            )

            | Q(
                conductor__usuario__first_name__icontains=busqueda
            )

            | Q(
                conductor__usuario__last_name__icontains=busqueda
            )

            | Q(
                vehiculo__marca__icontains=busqueda
            )

            | Q(
                vehiculo__modelo__icontains=busqueda
            )
        )

    viajes = viajes.order_by(
        "fecha_hora_salida"
    )

    contexto = {
        "viajes": viajes,
        "busqueda": busqueda,
    }

    return render(
        request,
        "agendarviaje.html",
        contexto,
    )

# =========================================================
# SOLICITAR LUGAR EN UN VIAJE
# =========================================================

@login_required(login_url="login")
def solicitar_viaje(request, viaje_id):

    # -----------------------------------------------------
    # VALIDAR ROL
    # -----------------------------------------------------

    if request.user.rol != Usuario.Roles.PASAJERO:

        messages.error(
            request,
            "Solo los usuarios con rol de pasajero "
            "pueden solicitar lugares."
        )

        return redirect("home")

    # -----------------------------------------------------
    # OBTENER EL VIAJE
    # -----------------------------------------------------

    viaje = get_object_or_404(
        Viaje.objects.select_related(
            "conductor__usuario",
            "vehiculo",
        ),
        pk=viaje_id,
    )

    # -----------------------------------------------------
    # VALIDACIONES DEL VIAJE
    # -----------------------------------------------------

    if (
        viaje.conductor.usuario_id
        == request.user.id
    ):

        messages.error(
            request,
            "No puedes solicitar un lugar "
            "en tu propio viaje."
        )

        return redirect("agendarviaje")

    if viaje.estado not in {
        Viaje.EstadosViaje.DISPONIBLE,
        Viaje.EstadosViaje.COMPLETO,
    }:

        messages.error(
            request,
            "Este viaje ya no admite solicitudes."
        )

        return redirect("agendarviaje")

    if (
        viaje.fecha_hora_salida
        <= timezone.now()
    ):

        messages.error(
            request,
            "No puedes solicitar un lugar "
            "en un viaje que ya comenzó."
        )

        return redirect("agendarviaje")

    if viaje.asientos_disponibles <= 0:

        messages.error(
            request,
            "Este viaje ya no tiene lugares disponibles."
        )

        return redirect("agendarviaje")

    # -----------------------------------------------------
    # BUSCAR SOLICITUD EXISTENTE
    # -----------------------------------------------------

    solicitud_existente = (
        SolicitudViaje.objects
        .filter(
            viaje=viaje,
            pasajero=request.user,
        )
        .first()
    )

    if solicitud_existente:

        if solicitud_existente.estado == (
            SolicitudViaje
            .EstadosSolicitud
            .PENDIENTE
        ):

            messages.warning(
                request,
                "Ya tienes una solicitud pendiente "
                "para este viaje."
            )

            return redirect(
                "mis_viajes_pasajero"
            )

        if solicitud_existente.estado == (
            SolicitudViaje
            .EstadosSolicitud
            .ACEPTADA
        ):

            messages.info(
                request,
                "Ya tienes un lugar aceptado "
                "en este viaje."
            )

            return redirect(
                "mis_viajes_pasajero"
            )

        if solicitud_existente.estado in {
            SolicitudViaje
            .EstadosSolicitud
            .COMPLETADA,

            SolicitudViaje
            .EstadosSolicitud
            .NO_PRESENTADO,
        }:

            messages.error(
                request,
                "No es posible volver a solicitar "
                "este viaje."
            )

            return redirect(
                "mis_viajes_pasajero"
            )

    # -----------------------------------------------------
    # FORMULARIO
    # -----------------------------------------------------

    if request.method == "POST":

        formulario = SolicitudViajeForm(
            request.POST,
            viaje=viaje,
            instance=solicitud_existente,
        )

        if formulario.is_valid():

            try:

                with transaction.atomic():

                    # Volvemos a bloquear y consultar el viaje
                    # para evitar solicitudes simultáneas que
                    # superen los lugares disponibles.

                    viaje_bloqueado = (
                        Viaje.objects
                        .select_for_update()
                        .select_related(
                            "conductor__usuario",
                            "vehiculo",
                        )
                        .get(pk=viaje.id)
                    )

                    asientos = (
                        formulario.cleaned_data[
                            "asientos_solicitados"
                        ]
                    )

                    if (
                        viaje_bloqueado.estado
                        != Viaje.EstadosViaje.DISPONIBLE
                    ):

                        messages.error(
                            request,
                            "El viaje dejó de estar disponible."
                        )

                        return redirect(
                            "agendarviaje"
                        )

                    if (
                        asientos
                        > viaje_bloqueado
                        .asientos_disponibles
                    ):

                        formulario.add_error(
                            "asientos_solicitados",
                            (
                                "Ya no hay suficientes lugares "
                                "disponibles."
                            ),
                        )

                    else:

                        solicitud = formulario.save(
                            commit=False
                        )

                        solicitud.viaje = (
                            viaje_bloqueado
                        )

                        solicitud.pasajero = (
                            request.user
                        )

                        solicitud.estado = (
                            SolicitudViaje
                            .EstadosSolicitud
                            .PENDIENTE
                        )

                        solicitud.respondida_por = None
                        solicitud.fecha_respuesta = None

                        solicitud.full_clean()
                        solicitud.save()

                        # Crear aviso para el conductor.

                        Notificacion.objects.create(
                            usuario=(
                                viaje_bloqueado
                                .conductor
                                .usuario
                            ),
                            actor=request.user,
                            viaje=viaje_bloqueado,
                            solicitud=solicitud,
                            tipo=(
                                Notificacion
                                .TiposNotificacion
                                .SOLICITUD
                            ),
                            titulo=(
                                "Nueva solicitud de viaje"
                            ),
                            descripcion=(
                                f"{request.user.nombre_completo} "
                                f"solicitó {asientos} "
                                f"lugar"
                                f"{'es' if asientos != 1 else ''} "
                                f"para el viaje hacia "
                                f"{viaje_bloqueado.destino}."
                            ),
                            url_destino=(
                                reverse(
                                    "mis_viajes_conductor"
                                )
                            ),
                        )

                        messages.success(
                            request,
                            "Tu solicitud fue enviada "
                            "al conductor correctamente."
                        )

                        return redirect(
                            "mis_viajes_pasajero"
                        )

            except ValidationError as error:

                if hasattr(
                    error,
                    "message_dict"
                ):

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

                    for mensaje in error.messages:

                        formulario.add_error(
                            None,
                            mensaje,
                        )

            except IntegrityError:

                formulario.add_error(
                    None,
                    (
                        "Ya existe una solicitud tuya "
                        "para este viaje."
                    ),
                )

    else:

        formulario = SolicitudViajeForm(
            viaje=viaje,
            instance=solicitud_existente,
        )

    contexto = {
        "viaje": viaje,
        "formulario": formulario,
        "solicitud_existente": (
            solicitud_existente
        ),
    }

    return render(
        request,
        "viajes/solicitar_viaje.html",
        contexto,
    )

# =========================================================
# SOLICITUDES RECIBIDAS POR EL CONDUCTOR
# =========================================================

@login_required(login_url="login")
def solicitudes_conductor(request):

    if request.user.rol != Usuario.Roles.CONDUCTOR:

        messages.error(
            request,
            "Solo los conductores pueden consultar solicitudes."
        )

        return redirect("home")

    try:

        perfil_conductor = request.user.perfil_conductor

    except PerfilConductor.DoesNotExist:

        messages.error(
            request,
            "No tienes un perfil de conductor registrado."
        )

        return redirect("perfil")

    estado = request.GET.get(
        "estado",
        "pendientes"
    ).strip()

    solicitudes = (
        SolicitudViaje.objects
        .filter(
            viaje__conductor=perfil_conductor
        )
        .select_related(
            "pasajero",
            "viaje",
            "viaje__vehiculo",
        )
        .order_by("-fecha_solicitud")
    )

    if estado == "pendientes":

        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.PENDIENTE
        )

    elif estado == "aceptadas":

        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.ACEPTADA
        )

    elif estado == "rechazadas":

        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.RECHAZADA
        )

    elif estado == "canceladas":

        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.CANCELADA
        )

    elif estado != "todas":

        estado = "pendientes"

        solicitudes = solicitudes.filter(
            estado=SolicitudViaje.EstadosSolicitud.PENDIENTE
        )

    estadisticas = {

        "total": SolicitudViaje.objects.filter(
            viaje__conductor=perfil_conductor
        ).count(),

        "pendientes": SolicitudViaje.objects.filter(
            viaje__conductor=perfil_conductor,
            estado=SolicitudViaje.EstadosSolicitud.PENDIENTE,
        ).count(),

        "aceptadas": SolicitudViaje.objects.filter(
            viaje__conductor=perfil_conductor,
            estado=SolicitudViaje.EstadosSolicitud.ACEPTADA,
        ).count(),

        "rechazadas": SolicitudViaje.objects.filter(
            viaje__conductor=perfil_conductor,
            estado=SolicitudViaje.EstadosSolicitud.RECHAZADA,
        ).count(),
    }

    return render(
        request,
        "viajes/solicitudes_conductor.html",
        {
            "solicitudes": solicitudes,
            "filtro_actual": estado,
            "estadisticas": estadisticas,
        },
    )

#==========================================================
# Aceptar el pasajero - conductor
#==========================================================

@login_required(login_url="login")
@require_POST
def aceptar_solicitud_viaje(request, solicitud_id):

    if request.user.rol != Usuario.Roles.CONDUCTOR:

        return JsonResponse(
            {
                "ok": False,
                "error": "No tienes permiso para realizar esta acción.",
            },
            status=403,
        )

    try:

        with transaction.atomic():

            solicitud = (
                SolicitudViaje.objects
                .select_for_update()
                .select_related(
                    "viaje",
                    "viaje__conductor__usuario",
                    "pasajero",
                )
                .get(pk=solicitud_id)
            )

            viaje = (
                Viaje.objects
                .select_for_update()
                .get(pk=solicitud.viaje_id)
            )

            if (
                viaje.conductor.usuario_id
                != request.user.id
            ):

                return JsonResponse(
                    {
                        "ok": False,
                        "error": (
                            "Esta solicitud no pertenece "
                            "a uno de tus viajes."
                        ),
                    },
                    status=403,
                )

            if (
                solicitud.estado
                != SolicitudViaje.EstadosSolicitud.PENDIENTE
            ):

                return JsonResponse(
                    {
                        "ok": False,
                        "error": (
                            "La solicitud ya fue respondida."
                        ),
                    },
                    status=400,
                )

            if (
                viaje.estado
                != Viaje.EstadosViaje.DISPONIBLE
            ):

                return JsonResponse(
                    {
                        "ok": False,
                        "error": (
                            "El viaje ya no está disponible."
                        ),
                    },
                    status=400,
                )

            if (
                solicitud.asientos_solicitados
                > viaje.asientos_disponibles
            ):

                return JsonResponse(
                    {
                        "ok": False,
                        "error": (
                            "Ya no hay suficientes lugares disponibles."
                        ),
                    },
                    status=400,
                )

            solicitud.estado = (
                SolicitudViaje.EstadosSolicitud.ACEPTADA
            )

            solicitud.respondida_por = request.user
            solicitud.fecha_respuesta = timezone.now()

            solicitud.save(
                update_fields=[
                    "estado",
                    "respondida_por",
                    "fecha_respuesta",
                ]
            )

            viaje.asientos_disponibles -= (
                solicitud.asientos_solicitados
            )

            if viaje.asientos_disponibles == 0:

                viaje.estado = (
                    Viaje.EstadosViaje.COMPLETO
                )

                viaje.save(
                    update_fields=[
                        "asientos_disponibles",
                        "estado",
                        "fecha_actualizacion",
                    ]
                )

            else:

                viaje.save(
                    update_fields=[
                        "asientos_disponibles",
                        "fecha_actualizacion",
                    ]
                )

            Notificacion.objects.create(
                usuario=solicitud.pasajero,
                actor=request.user,
                viaje=viaje,
                solicitud=solicitud,
                tipo=(
                    Notificacion
                    .TiposNotificacion
                    .SOLICITUD_ACEPTADA
                ),
                titulo="Solicitud aceptada",
                descripcion=(
                    f"Tu solicitud para el viaje hacia "
                    f"{viaje.destino} fue aceptada."
                ),
                url_destino=reverse(
                    "mis_viajes_pasajero"
                ),
            )

    except SolicitudViaje.DoesNotExist:

        return JsonResponse(
            {
                "ok": False,
                "error": "La solicitud no existe.",
            },
            status=404,
        )

    return JsonResponse(
        {
            "ok": True,
            "mensaje": "Solicitud aceptada correctamente.",
            "estado": "aceptada",
            "asientos_disponibles": viaje.asientos_disponibles,
        }
    )

#==========================================================
# Rechazar pasajero - conductor
#==========================================================

@login_required(login_url="login")
@require_POST
def rechazar_solicitud_viaje(request, solicitud_id):

    if request.user.rol != Usuario.Roles.CONDUCTOR:

        return JsonResponse(
            {
                "ok": False,
                "error": "No tienes permiso para realizar esta acción.",
            },
            status=403,
        )

    solicitud = get_object_or_404(
        SolicitudViaje.objects.select_related(
            "viaje__conductor__usuario",
            "pasajero",
        ),
        pk=solicitud_id,
    )

    if (
        solicitud.viaje.conductor.usuario_id
        != request.user.id
    ):

        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "Esta solicitud no pertenece "
                    "a uno de tus viajes."
                ),
            },
            status=403,
        )

    if (
        solicitud.estado
        != SolicitudViaje.EstadosSolicitud.PENDIENTE
    ):

        return JsonResponse(
            {
                "ok": False,
                "error": "La solicitud ya fue respondida.",
            },
            status=400,
        )

    solicitud.estado = (
        SolicitudViaje.EstadosSolicitud.RECHAZADA
    )

    solicitud.respondida_por = request.user
    solicitud.fecha_respuesta = timezone.now()

    solicitud.save(
        update_fields=[
            "estado",
            "respondida_por",
            "fecha_respuesta",
        ]
    )

    Notificacion.objects.create(
        usuario=solicitud.pasajero,
        actor=request.user,
        viaje=solicitud.viaje,
        solicitud=solicitud,
        tipo=(
            Notificacion
            .TiposNotificacion
            .SOLICITUD_RECHAZADA
        ),
        titulo="Solicitud rechazada",
        descripcion=(
            f"Tu solicitud para el viaje hacia "
            f"{solicitud.viaje.destino} fue rechazada."
        ),
        url_destino=reverse(
            "mis_viajes_pasajero"
        ),
    )

    return JsonResponse(
        {
            "ok": True,
            "mensaje": "Solicitud rechazada correctamente.",
            "estado": "rechazada",
        }
    )

# =========================================================
# VER RUTA DEL VIAJE - PASAJERO
# =========================================================

@login_required(login_url="login")
def ver_ruta_viaje_pasajero(request, viaje_id):

    if request.user.rol != Usuario.Roles.PASAJERO:

        messages.error(
            request,
            "Esta sección está disponible únicamente para pasajeros."
        )

        return redirect("home")

    solicitud = get_object_or_404(
        SolicitudViaje.objects.select_related(
            "viaje",
            "viaje__conductor",
            "viaje__conductor__usuario",
            "viaje__vehiculo",
            "pasajero",
        ),
        viaje_id=viaje_id,
        pasajero=request.user,
        estado=SolicitudViaje.EstadosSolicitud.ACEPTADA,
    )

    viaje = solicitud.viaje

    if (
        viaje.origen_latitud is None
        or viaje.origen_longitud is None
        or viaje.destino_latitud is None
        or viaje.destino_longitud is None
    ):

        messages.warning(
            request,
            "Este viaje todavía no tiene coordenadas completas para mostrar la ruta."
        )

        return redirect("mis_viajes_pasajero")

    contexto = {
        "solicitud": solicitud,
        "viaje": viaje,
    }

    return render(
        request,
        "viajes/ruta_viaje_pasajero.html",
        contexto,
    )

# =========================================================
# CALIFICAR PASAJERO - CONDUCTOR
# =========================================================

@login_required(login_url="login")
def calificar_pasajero(request, solicitud_id):

    if obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:

        messages.error(
            request,
            "Solo los conductores pueden calificar pasajeros.",
        )

        return redirect("home")

    try:

        perfil_conductor = request.user.perfil_conductor

    except PerfilConductor.DoesNotExist:

        messages.error(
            request,
            "No tienes un perfil de conductor registrado.",
        )

        return redirect("perfil")

    solicitud = get_object_or_404(
        SolicitudViaje.objects.select_related(
            "viaje",
            "viaje__conductor",
            "viaje__conductor__usuario",
            "viaje__vehiculo",
            "pasajero",
        ),
        pk=solicitud_id,
        viaje__conductor=perfil_conductor,
    )

    viaje = solicitud.viaje
    pasajero = solicitud.pasajero

    if viaje.estado != Viaje.EstadosViaje.FINALIZADO:

        messages.warning(
            request,
            "Solo puedes calificar al pasajero cuando el viaje haya finalizado.",
        )

        return redirect(
            "mis_viajes_conductor"
        )

    if (
        solicitud.estado
        != SolicitudViaje.EstadosSolicitud.COMPLETADA
    ):

        messages.warning(
            request,
            "Este pasajero no tiene una participación completada.",
        )

        return redirect(
            "listar_pasajeros_calificar",
            viaje_id=viaje.id,
        )

    calificacion_existente = (
        Calificacion.objects
        .filter(
            viaje=viaje,
            autor=request.user,
            destinatario=pasajero,
            tipo=(
                Calificacion
                .TiposCalificacion
                .PASAJERO
            ),
        )
        .exists()
    )

    if calificacion_existente:

        messages.info(
            request,
            "Ya calificaste a este pasajero.",
        )

        return redirect(
            "listar_pasajeros_calificar",
            viaje_id=viaje.id,
        )

    if request.method == "POST":

        form = CalificarPasajeroForm(
            request.POST
        )

        if form.is_valid():

            calificacion = form.save(
                commit=False
            )

            calificacion.viaje = viaje
            calificacion.autor = request.user
            calificacion.destinatario = pasajero

            calificacion.tipo = (
                Calificacion
                .TiposCalificacion
                .PASAJERO
            )

            calificacion.estado = (
                Calificacion
                .EstadosCalificacion
                .VISIBLE
            )

            try:

                calificacion.full_clean()
                calificacion.save()

            except ValidationError as error:

                if hasattr(
                    error,
                    "message_dict"
                ):

                    for campo, errores in (
                        error.message_dict.items()
                    ):

                        for mensaje in errores:

                            if campo in form.fields:

                                form.add_error(
                                    campo,
                                    mensaje,
                                )

                            else:

                                form.add_error(
                                    None,
                                    mensaje,
                                )

                else:

                    form.add_error(
                        None,
                        str(error),
                    )

            else:

                messages.success(
                    request,
                    f"Calificaste correctamente a "
                    f"{pasajero.nombre_completo}.",
                )

                return redirect(
                    "listar_pasajeros_calificar",
                    viaje_id=viaje.id,
                )

    else:

        form = CalificarPasajeroForm()

    return render(
        request,
        "viajes/calificar_pasajero.html",
        {
            "form": form,
            "solicitud": solicitud,
            "viaje": viaje,
            "pasajero": pasajero,
        },
    )

# =========================================================
# LISTAR PASAJEROS PARA CALIFICAR
# =========================================================

@login_required(login_url="login")
def listar_pasajeros_calificar(request, viaje_id):

    if obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:

        messages.error(
            request,
            "Solo los conductores pueden calificar pasajeros.",
        )

        return redirect("home")

    try:

        perfil_conductor = request.user.perfil_conductor

    except PerfilConductor.DoesNotExist:

        messages.error(
            request,
            "No tienes un perfil de conductor registrado.",
        )

        return redirect("perfil")

    viaje = get_object_or_404(
        Viaje.objects.select_related(
            "conductor",
            "conductor__usuario",
            "vehiculo",
        ),
        pk=viaje_id,
        conductor=perfil_conductor,
    )

    if viaje.estado != Viaje.EstadosViaje.FINALIZADO:

        messages.warning(
            request,
            "Solo puedes calificar pasajeros cuando el viaje haya finalizado.",
        )

        return redirect(
            "mis_viajes_conductor"
        )

    solicitudes = list(
        SolicitudViaje.objects
        .filter(
            viaje=viaje,
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .COMPLETADA
            ),
        )
        .select_related(
            "pasajero",
        )
        .order_by(
            "fecha_solicitud"
        )
    )

    ids_pasajeros = [
        solicitud.pasajero_id
        for solicitud in solicitudes
    ]

    pasajeros_calificados = set(
        Calificacion.objects
        .filter(
            viaje=viaje,
            autor=request.user,
            destinatario_id__in=ids_pasajeros,
            tipo=(
                Calificacion
                .TiposCalificacion
                .PASAJERO
            ),
        )
        .values_list(
            "destinatario_id",
            flat=True,
        )
    )

    for solicitud in solicitudes:

        solicitud.pasajero_calificado = (
            solicitud.pasajero_id
            in pasajeros_calificados
        )

    return render(
        request,
        "viajes/listar_pasajeros_calificar.html",
        {
            "viaje": viaje,
            "solicitudes": solicitudes,
        },
    )

# =========================================================
# Calificar conductor
#==========================================================

@login_required(login_url="login")
def calificar_conductor(request, solicitud_id):

    solicitud = get_object_or_404(
        SolicitudViaje.objects.select_related(
            "viaje",
            "viaje__conductor",
            "viaje__conductor__usuario",
            "viaje__vehiculo",
            "pasajero",
        ),
        id=solicitud_id,
        pasajero=request.user,
    )

    viaje = solicitud.viaje
    conductor_usuario = viaje.conductor.usuario

    # =====================================================
    # VALIDAR ROL
    # =====================================================

    if request.user.rol != Usuario.Roles.PASAJERO:

        messages.error(
            request,
            "Solo los pasajeros pueden calificar al conductor."
        )

        return redirect(
            "mis_viajes_pasajero"
        )

    # =====================================================
    # VALIDAR VIAJE FINALIZADO
    # =====================================================

    if viaje.estado != Viaje.EstadosViaje.FINALIZADO:

        messages.warning(
            request,
            "Solo puedes calificar al conductor "
            "cuando el viaje haya finalizado."
        )

        return redirect(
            "mis_viajes_pasajero"
        )

    # =====================================================
    # VALIDAR SOLICITUD COMPLETADA
    # =====================================================

    if (
        solicitud.estado
        != SolicitudViaje.EstadosSolicitud.COMPLETADA
    ):

        messages.warning(
            request,
            "Tu participación en el viaje todavía "
            "no está marcada como completada."
        )

        return redirect(
            "mis_viajes_pasajero"
        )

    # =====================================================
    # IMPEDIR CALIFICACIÓN DUPLICADA
    # =====================================================

    calificacion_existente = (
        Calificacion.objects
        .filter(
            viaje=viaje,
            autor=request.user,
            destinatario=conductor_usuario,
            tipo=(
                Calificacion
                .TiposCalificacion
                .CONDUCTOR
            ),
        )
        .first()
    )

    if calificacion_existente:

        messages.info(
            request,
            "Ya calificaste al conductor de este viaje."
        )

        return redirect(
            "mis_viajes_pasajero"
        )

    # =====================================================
    # FORMULARIO
    # =====================================================

    if request.method == "POST":

        form = CalificarConductorForm(
            request.POST
        )

        if form.is_valid():

            calificacion = form.save(
                commit=False
            )

            calificacion.viaje = viaje
            calificacion.autor = request.user
            calificacion.destinatario = conductor_usuario

            calificacion.tipo = (
                Calificacion
                .TiposCalificacion
                .CONDUCTOR
            )

            calificacion.estado = (
                Calificacion
                .EstadosCalificacion
                .VISIBLE
            )

            try:

                calificacion.full_clean()
                calificacion.save()

            except ValidationError as error:

                if hasattr(
                    error,
                    "message_dict"
                ):

                    for campo, errores in (
                        error.message_dict.items()
                    ):

                        for mensaje in errores:

                            if campo in form.fields:

                                form.add_error(
                                    campo,
                                    mensaje,
                                )

                            else:

                                form.add_error(
                                    None,
                                    mensaje,
                                )

                else:

                    form.add_error(
                        None,
                        error.message,
                    )

            else:

                messages.success(
                    request,
                    "Tu calificación fue registrada correctamente."
                )

                return redirect(
                    "mis_viajes_pasajero"
                )

    else:

        form = CalificarConductorForm()

    contexto = {
        "form": form,
        "solicitud": solicitud,
        "viaje": viaje,
        "conductor": conductor_usuario,
    }

    return render(
        request,
        "viajes/calificar_conductor.html",
        contexto,
    )

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
        except Exception:
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
            if not getattr(request.user, "es_conductor", False) and obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:
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
            if not getattr(request.user, "es_conductor", False) and obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:
                messages.error(request, "Solo los usuarios con rol de conductor pueden registrar un vehículo.")
                return redirect("perfil")

            perfil_conductor, _ = PerfilConductor.objects.get_or_create(usuario=request.user)

            vehiculo = (
                Vehiculo.objects.filter(conductor=perfil_conductor, activo=True)
                .order_by("-fecha_registro")
                .first()
            )

            foto_vehiculo = request.FILES.get("foto")

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

            try:
                vehiculo.anio = int(request.POST.get("anio", 0))
                # Lee 'asientos' o 'capacidad' según la implementación del modelo
                capacidad_val = request.POST.get("asientos") or request.POST.get("capacidad", 0)
                if hasattr(vehiculo, "asientos"):
                    vehiculo.asientos = int(capacidad_val)
                if hasattr(vehiculo, "capacidad"):
                    vehiculo.capacidad = int(capacidad_val)
            except (TypeError, ValueError):
                messages.error(request, "Año y capacidad deben ser números válidos.")
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

    # ----------------------------------------------------
    # PUNTUACIÓN DEL USUARIO
    # ----------------------------------------------------

    calificaciones_recibidas = Calificacion.objects.filter(
        destinatario=request.user,
        estado=Calificacion.EstadosCalificacion.VISIBLE,
    )

    rol_usuario = obtener_rol(request.user)

    if rol_usuario == Usuario.Roles.CONDUCTOR:

        calificaciones_recibidas = calificaciones_recibidas.filter(
            tipo=Calificacion.TiposCalificacion.CONDUCTOR
        )

    elif rol_usuario == Usuario.Roles.PASAJERO:

        calificaciones_recibidas = calificaciones_recibidas.filter(
            tipo=Calificacion.TiposCalificacion.PASAJERO
        )


    resumen_calificaciones = calificaciones_recibidas.aggregate(
        promedio=Avg("puntuacion"),
        total=Count("id"),
    )

    puntuacion_promedio = round(
        float(
            resumen_calificaciones["promedio"] or 0
        ),
        1,
    )

    total_calificaciones = (
        resumen_calificaciones["total"] or 0
    )

    contexto = {
        "rol_usuario": rol_usuario,
        "informacion_medica": informacion_medica,
        "historial_medico": informacion_medica,
        "perfil_conductor": perfil_conductor,
        "vehiculo": vehiculo,
        "puntuacion_promedio": puntuacion_promedio,
        "total_calificaciones": total_calificaciones,
    }

    return render(request, "perfil/perfil.html", contexto)


# =========================================================
# PUBLICAR VIAJE (CONDUCTOR)
# =========================================================

@login_required(login_url="login")
def publicar_viaje(request):

    if obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:
        messages.error(request, "Solo los usuarios con rol de conductor pueden publicar viajes.")
        return redirect("home")

    try:
        perfil_conductor = request.user.perfil_conductor
    except PerfilConductor.DoesNotExist:
        messages.warning(request, "Debes completar primero tu perfil de conductor.")
        base_url = reverse("perfil")
        query_string = urlencode({"tab": "vehiculo"})
        return redirect(f"{base_url}?{query_string}")

    if perfil_conductor.estado_verificacion != PerfilConductor.EstadosVerificacion.APROBADO:
        messages.warning(request, "Tu perfil de conductor debe estar aprobado antes de publicar viajes.")
        return redirect("perfil")

    vehiculos_disponibles = Vehiculo.objects.filter(
        conductor=perfil_conductor,
        activo=True,
        estado=Vehiculo.EstadosVehiculo.APROBADO,
    ).order_by("-fecha_registro")

    if not vehiculos_disponibles.exists():
        messages.warning(request, "Necesitas tener al menos un vehículo aprobado y activo para publicar un viaje.")
        base_url = reverse("perfil")
        query_string = urlencode({"tab": "vehiculo"})
        return redirect(f"{base_url}?{query_string}")

    if request.method == "POST":
        formulario = PublicarViajeForm(request.POST, conductor=perfil_conductor)

        if formulario.is_valid():
            try:
                with transaction.atomic():
                    viaje = formulario.save(commit=False)
                    viaje.conductor = perfil_conductor

                    # Obtención de los asientos desde el vehículo seleccionado
                    capacidad_asientos = getattr(viaje.vehiculo, "asientos", None) or getattr(viaje.vehiculo, "capacidad", 4)
                    viaje.asientos_totales = capacidad_asientos
                    viaje.asientos_disponibles = capacidad_asientos

                    viaje.estado = Viaje.EstadosViaje.DISPONIBLE
                    viaje.full_clean()
                    viaje.save()

                    # Sala de chat para los pasajeros del viaje
                    SalaChat.objects.create(viaje=viaje, activa=True)

                    messages.success(request, "El viaje fue publicado correctamente.")
                    print("❌ ERRORES DEL FORMULARIO:", formulario.errors.as_json())
                    return redirect("mis_viajes_conductor")

            except ValidationError as error:
                if hasattr(error, "message_dict"):
                    for campo, errores in error.message_dict.items():
                        for mensaje in errores:
                            if campo in formulario.fields:
                                formulario.add_error(campo, mensaje)
                            else:
                                formulario.add_error(None, mensaje)
                else:
                    formulario.add_error(None, error.message)

            except IntegrityError:
                formulario.add_error(None, "No fue posible publicar el viaje. Inténtalo nuevamente.")
    else:
        # Valores iniciales estándar
        datos_iniciales = {
            "origen": "Universidad Tecnológica de Tijuana",
            "origen_latitud": 32.4619,
            "origen_longitud": -116.8275,
        }
        formulario = PublicarViajeForm(initial=datos_iniciales, conductor=perfil_conductor)

    contexto = {
        "formulario": formulario,
        "perfil_conductor": perfil_conductor,
        "vehiculos_disponibles": vehiculos_disponibles,
    }

    return render(request, "viajes/publicar_viaje.html", contexto)

# =========================================================
# CHAT DEL VIAJE
# =========================================================

@login_required(login_url="login")
def chat_viaje(request, viaje_id):

    viaje = get_object_or_404(
        Viaje.objects.select_related(
            "conductor__usuario",
            "vehiculo",
        ),
        pk=viaje_id,
    )

    if not usuario_pertenece_al_viaje(
        request.user,
        viaje,
    ):
        messages.error(
            request,
            "No tienes permiso para entrar al chat de este viaje.",
        )

        return redirect("home")

    sala, _ = SalaChat.objects.get_or_create(
        viaje=viaje,
        defaults={
            "activa": True,
        },
    )

    mensajes_chat = (
        Mensaje.objects
        .filter(
            sala=sala,
            eliminado=False,
        )
        .select_related("emisor")
        .order_by("fecha_envio")
    )

    solicitudes_aceptadas = (
        SolicitudViaje.objects
        .filter(
            viaje=viaje,
            estado=SolicitudViaje.EstadosSolicitud.ACEPTADA,
        )
        .select_related("pasajero")
        .order_by("fecha_solicitud")
    )

    participantes = [
        viaje.conductor.usuario,
    ]

    participantes.extend(
        solicitud.pasajero
        for solicitud in solicitudes_aceptadas
    )

    # Registrar como leídos todos los mensajes de otros usuarios.
    lecturas_nuevas = []

    for mensaje in mensajes_chat:

        if mensaje.emisor_id == request.user.id:
            continue

        lecturas_nuevas.append(
            LecturaMensaje(
                mensaje=mensaje,
                usuario=request.user,
            )
        )

    if lecturas_nuevas:

        LecturaMensaje.objects.bulk_create(
            lecturas_nuevas,
            ignore_conflicts=True,
        )

    contexto = {
        "viaje": viaje,
        "sala": sala,
        "mensajes_chat": mensajes_chat,
        "participantes": participantes,
        "es_conductor": (
            viaje.conductor.usuario_id
            == request.user.id
        ),
    }

    return render(
        request,
        "chat/chat_viaje.html",
        contexto,
    )

#==========================================================
# Vista temporal para guardar mensajes del chat
#==========================================================

@login_required(login_url="login")
@require_POST
def enviar_mensaje_chat(request, viaje_id):

    viaje = get_object_or_404(
        Viaje.objects.select_related(
            "conductor__usuario",
        ),
        pk=viaje_id,
    )

    if not usuario_pertenece_al_viaje(
        request.user,
        viaje,
    ):
        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "No tienes permiso para escribir "
                    "en este chat."
                ),
            },
            status=403,
        )

    sala = get_object_or_404(
        SalaChat,
        viaje=viaje,
    )

    if not sala.activa:

        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "La sala de chat ya no está activa."
                ),
            },
            status=403,
        )

    contenido = request.POST.get(
        "contenido",
        "",
    ).strip()

    if not contenido:

        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "El mensaje no puede estar vacío."
                ),
            },
            status=400,
        )

    if len(contenido) > 1000:

        return JsonResponse(
            {
                "ok": False,
                "error": (
                    "El mensaje no puede superar "
                    "los 1000 caracteres."
                ),
            },
            status=400,
        )

    mensaje = Mensaje.objects.create(
        sala=sala,
        emisor=request.user,
        contenido=contenido,
    )

    return JsonResponse(
        {
            "ok": True,
            "mensaje": {
                "id": mensaje.id,
                "contenido": mensaje.contenido,
                "emisor_id": request.user.id,
                "emisor": request.user.nombre_completo,
                "foto": (
                    request.user.foto.url
                    if request.user.foto
                    else ""
                ),
                "fecha": mensaje.fecha_envio.strftime(
                    "%H:%M"
                ),
                "es_propio": True,
            },
        },
        status=201,
    )

#==========================================================
# Crear Alertas
#==========================================================

def usuario_pertenece_al_viaje(usuario, viaje):
    """
    Permite participar al conductor del viaje o a un pasajero
    cuya solicitud haya sido aceptada.
    """

    if viaje.conductor.usuario_id == usuario.id:
        return True

    return SolicitudViaje.objects.filter(
        viaje=viaje,
        pasajero=usuario,
        estado=SolicitudViaje.EstadosSolicitud.ACEPTADA,
    ).exists()


@login_required(login_url="login")
def crear_alerta_viaje(request, viaje_id):

    viaje = get_object_or_404(
        Viaje.objects.select_related(
            "conductor__usuario",
            "vehiculo",
        ),
        pk=viaje_id,
    )

    if not usuario_pertenece_al_viaje(
        request.user,
        viaje,
    ):
        messages.error(
            request,
            "No tienes permiso para crear alertas en este viaje.",
        )

        return redirect("home")

    if request.method == "POST":

        tipo = request.POST.get(
            "tipo",
            "",
        ).strip()

        descripcion = request.POST.get(
            "descripcion",
            "",
        ).strip()

        latitud_texto = request.POST.get(
            "latitud",
            "",
        ).strip()

        longitud_texto = request.POST.get(
            "longitud",
            "",
        ).strip()

        tipos_validos = {
            valor
            for valor, _ in
            AlertaEmergencia.TiposAlerta.choices
        }

        errores = []

        if tipo not in tipos_validos:
            errores.append(
                "Selecciona un tipo de emergencia válido."
            )

        if not descripcion:
            errores.append(
                "Describe brevemente lo que está ocurriendo."
            )

        if len(descripcion) > 1000:
            errores.append(
                "La descripción no puede superar los 1000 caracteres."
            )

        latitud = None
        longitud = None

        if latitud_texto or longitud_texto:

            if not latitud_texto or not longitud_texto:
                errores.append(
                    "La ubicación está incompleta."
                )

            else:

                try:
                    latitud = Decimal(latitud_texto)
                    longitud = Decimal(longitud_texto)

                except InvalidOperation:
                    errores.append(
                        "Las coordenadas de ubicación no son válidas."
                    )

        if errores:

            for error in errores:
                messages.error(
                    request,
                    error,
                )

            return render(
                request,
                "alertas/crear_alerta.html",
                {
                    "viaje": viaje,
                    "tipos_alerta": (
                        AlertaEmergencia
                        .TiposAlerta
                        .choices
                    ),
                    "datos": {
                        "tipo": tipo,
                        "descripcion": descripcion,
                        "latitud": latitud_texto,
                        "longitud": longitud_texto,
                    },
                },
            )

        alerta = AlertaEmergencia(
            viaje=viaje,
            usuario=request.user,
            tipo=tipo,
            descripcion=descripcion,
            latitud=latitud,
            longitud=longitud,
            estado=(
                AlertaEmergencia
                .EstadosAlerta
                .ACTIVA
            ),
        )

        try:
            alerta.full_clean()
            alerta.save()

        except ValidationError as error:

            if hasattr(error, "message_dict"):

                for mensajes_campo in (
                    error.message_dict.values()
                ):
                    for mensaje in mensajes_campo:
                        messages.error(
                            request,
                            mensaje,
                        )

            else:

                for mensaje in error.messages:
                    messages.error(
                        request,
                        mensaje,
                    )

            return render(
                request,
                "alertas/crear_alerta.html",
                {
                    "viaje": viaje,
                    "tipos_alerta": (
                        AlertaEmergencia
                        .TiposAlerta
                        .choices
                    ),
                    "datos": {
                        "tipo": tipo,
                        "descripcion": descripcion,
                        "latitud": latitud_texto,
                        "longitud": longitud_texto,
                    },
                },
            )

        messages.success(
            request,
            "La alerta de emergencia fue enviada correctamente.",
        )

        return redirect(
            "ride_en_progreso",
            viaje_id=viaje.id,
        )

    return render(
        request,
        "alertas/crear_alerta.html",
        {
            "viaje": viaje,
            "tipos_alerta": (
                AlertaEmergencia
                .TiposAlerta
                .choices
            ),
        },
    )

# =========================================================
# BÚSQUEDA DE VIAJES PARA PASAJEROS (AJAX / API)
# =========================================================

@login_required(login_url="login")
def buscar_viajes_pasajero(request):
    """
    Retorna viajes disponibles filtrados opcionalmente por colonia/destino o texto.
    """
    query = request.GET.get("q", "").strip()

    # Viajes futuros con lugares y en estado disponible
    viajes_query = Viaje.objects.filter(
        fecha_hora_salida__gt=timezone.now(),
        asientos_disponibles__gt=0,
        estado=Viaje.EstadosViaje.DISPONIBLE
    )

    if query:
        viajes_query = viajes_query.filter(
            Q(destino__icontains=query) |
            Q(indicaciones__icontains=query)
        )

    viajes_query = viajes_query.select_related(
        "conductor__usuario", "vehiculo"
    ).order_by("fecha_hora_salida")

    datos_viajes = []
    for viaje in viajes_query:
        nombre_conductor = (
            viaje.conductor.usuario.get_full_name() 
            or viaje.conductor.usuario.nombre 
            or viaje.conductor.usuario.username
        )
        vehiculo_str = f"{viaje.vehiculo.marca} {viaje.vehiculo.modelo}" if viaje.vehiculo else ""

        datos_viajes.append({
            "id": viaje.id,
            "conductor": nombre_conductor,
            "origen": viaje.origen,
            "destino": viaje.destino,
            "destino_latitud": getattr(viaje, "destino_latitud", None),
            "destino_longitud": getattr(viaje, "destino_longitud", None),
            "fecha_salida": viaje.fecha_hora_salida.strftime("%d/%m/%Y"),
            "hora_salida": viaje.fecha_hora_salida.strftime("%H:%M"),
            "asientos_disponibles": viaje.asientos_disponibles,
            "vehiculo": vehiculo_str,
            "acepta_silla_ruedas": getattr(viaje, "acepta_silla_ruedas", False),
            "indicaciones": viaje.indicaciones or "",
        })

    return JsonResponse({"ok": True, "total": len(datos_viajes), "viajes": datos_viajes})


# =========================================================
# MIS VIAJES - CONDUCTOR
# =========================================================

@login_required(login_url="login")
def mis_viajes_conductor(request):

    if obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:
        messages.error(request, "Esta sección está disponible únicamente para conductores.")
        return redirect("home")

    try:
        perfil_conductor = request.user.perfil_conductor
    except PerfilConductor.DoesNotExist:
        messages.warning(request, "Primero debes completar tu perfil de conductor.")
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


# =========================================================
# MIS VIAJES - PASAJERO
# =========================================================

@login_required(login_url="login")
def mis_viajes_pasajero(request):

    # -----------------------------------------------------
    # VALIDAR ROL
    # -----------------------------------------------------

    if obtener_rol(request.user) != Usuario.Roles.PASAJERO:

        return render(
            request,
            "403.html",
            status=403,
        )

    # -----------------------------------------------------
    # FILTRO ACTUAL
    # -----------------------------------------------------

    filtro = (
        request.GET
        .get("estado", "todos")
        .strip()
        .lower()
    )

    filtros_validos = {
        "todos",
        "pendientes",
        "aceptadas",
        "rechazadas",
        "canceladas",
        "completadas",
    }

    if filtro not in filtros_validos:
        filtro = "todos"

    # -----------------------------------------------------
    # CONSULTA BASE DEL PASAJERO
    # -----------------------------------------------------

    solicitudes_base = (
        SolicitudViaje.objects
        .filter(
            pasajero=request.user
        )
    )

    # -----------------------------------------------------
    # SOLICITUDES A MOSTRAR
    # -----------------------------------------------------

    solicitudes = (
        solicitudes_base
        .select_related(
            "viaje",
            "viaje__conductor",
            "viaje__conductor__usuario",
            "viaje__vehiculo",
        )
        .order_by(
            "-fecha_solicitud"
        )
    )

    if filtro == "pendientes":

        solicitudes = solicitudes.filter(
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .PENDIENTE
            )
        )

    elif filtro == "aceptadas":

        solicitudes = solicitudes.filter(
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .ACEPTADA
            )
        )

    elif filtro == "rechazadas":

        solicitudes = solicitudes.filter(
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .RECHAZADA
            )
        )

    elif filtro == "canceladas":

        solicitudes = solicitudes.filter(
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .CANCELADA
            )
        )

    elif filtro == "completadas":

        solicitudes = solicitudes.filter(
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .COMPLETADA
            )
        )

    # Convertimos a lista porque agregaremos una propiedad
    # temporal a cada solicitud para usarla en el template.
    solicitudes = list(
        solicitudes
    )

    # -----------------------------------------------------
    # CALIFICACIONES YA REALIZADAS
    # -----------------------------------------------------

    ids_viajes = [
        solicitud.viaje_id
        for solicitud in solicitudes
    ]

    calificaciones_realizadas = set(
        Calificacion.objects
        .filter(
            viaje_id__in=ids_viajes,
            autor=request.user,
            tipo=(
                Calificacion
                .TiposCalificacion
                .CONDUCTOR
            ),
        )
        .values_list(
            "viaje_id",
            flat=True,
        )
    )

    for solicitud in solicitudes:

        solicitud.calificacion_conductor_realizada = (
            solicitud.viaje_id
            in calificaciones_realizadas
        )

    # -----------------------------------------------------
    # ESTADÍSTICAS
    # -----------------------------------------------------

    estadisticas = {

        "total": (
            solicitudes_base.count()
        ),

        "pendientes": (
            solicitudes_base
            .filter(
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .PENDIENTE
                )
            )
            .count()
        ),

        "aceptadas": (
            solicitudes_base
            .filter(
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .ACEPTADA
                )
            )
            .count()
        ),

        "completadas": (
            solicitudes_base
            .filter(
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .COMPLETADA
                )
            )
            .count()
        ),

        "canceladas": (
            solicitudes_base
            .filter(
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .CANCELADA
                )
            )
            .count()
        ),

    }

    # -----------------------------------------------------
    # RENDER
    # -----------------------------------------------------

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
# INICIAR VIAJE - CONDUCTOR
# =========================================================

@login_required(login_url="login")
@require_POST
def iniciar_viaje(request, viaje_id):

    # -----------------------------------------------------
    # VALIDAR ROL
    # -----------------------------------------------------

    if obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:

        messages.error(
            request,
            "Solo los conductores pueden iniciar un viaje.",
        )

        return redirect("home")

    # -----------------------------------------------------
    # OBTENER PERFIL DEL CONDUCTOR
    # -----------------------------------------------------

    try:

        perfil_conductor = (
            request.user.perfil_conductor
        )

    except PerfilConductor.DoesNotExist:

        messages.error(
            request,
            "No tienes un perfil de conductor registrado.",
        )

        return redirect("perfil")

    # -----------------------------------------------------
    # CAMBIAR EL ESTADO DEL VIAJE
    # -----------------------------------------------------

    try:

        with transaction.atomic():

            viaje = (
                Viaje.objects
                .select_for_update()
                .select_related(
                    "conductor",
                    "conductor__usuario",
                    "vehiculo",
                )
                .get(
                    pk=viaje_id,
                    conductor=perfil_conductor,
                )
            )

            # El viaje solo puede iniciarse si todavía
            # está disponible o ya está completo.
            if viaje.estado not in {
                Viaje.EstadosViaje.DISPONIBLE,
                Viaje.EstadosViaje.COMPLETO,
            }:

                messages.warning(
                    request,
                    (
                        "Este viaje no puede iniciarse "
                        "en su estado actual."
                    ),
                )

                return redirect(
                    "mis_viajes_conductor"
                )

            # Impedir que el mismo conductor tenga
            # dos viajes activos simultáneamente.
            existe_otro_viaje_en_curso = (
                Viaje.objects
                .filter(
                    conductor=perfil_conductor,
                    estado=Viaje.EstadosViaje.EN_CURSO,
                )
                .exclude(
                    pk=viaje.pk
                )
                .exists()
            )

            if existe_otro_viaje_en_curso:

                messages.warning(
                    request,
                    (
                        "Ya tienes otro viaje en curso. "
                        "Debes finalizarlo antes de iniciar este."
                    ),
                )

                return redirect(
                    "mis_viajes_conductor"
                )

            viaje.estado = (
                Viaje.EstadosViaje.EN_CURSO
            )

            viaje.save(
                update_fields=[
                    "estado",
                    "fecha_actualizacion",
                ]
            )

            # Crear o reactivar la sala de chat.
            sala_chat, creada = (
                SalaChat.objects.get_or_create(
                    viaje=viaje,
                    defaults={
                        "activa": True,
                    },
                )
            )

            if not creada and not sala_chat.activa:

                sala_chat.activa = True

                sala_chat.save(
                    update_fields=[
                        "activa",
                    ]
                )

            # Notificar a los pasajeros aceptados.
            solicitudes_aceptadas = (
                SolicitudViaje.objects
                .filter(
                    viaje=viaje,
                    estado=(
                        SolicitudViaje
                        .EstadosSolicitud
                        .ACEPTADA
                    ),
                )
                .select_related(
                    "pasajero"
                )
            )

            notificaciones = []

            for solicitud in solicitudes_aceptadas:

                notificaciones.append(
                    Notificacion(
                        usuario=solicitud.pasajero,
                        actor=request.user,
                        viaje=viaje,
                        solicitud=solicitud,
                        tipo=(
                            Notificacion
                            .TiposNotificacion
                            .VIAJE
                        ),
                        titulo="El viaje ha comenzado",
                        descripcion=(
                            f"El viaje desde {viaje.origen} "
                            f"hacia {viaje.destino} ya está en curso."
                        ),
                        url_destino=reverse(
                            "ride_en_progreso",
                            kwargs={
                                "viaje_id": viaje.id,
                            },
                        ),
                    )
                )

            if notificaciones:

                Notificacion.objects.bulk_create(
                    notificaciones
                )

    except Viaje.DoesNotExist:

        messages.error(
            request,
            (
                "El viaje no existe o no pertenece "
                "a tu cuenta de conductor."
            ),
        )

        return redirect(
            "mis_viajes_conductor"
        )

    messages.success(
        request,
        "El viaje fue iniciado correctamente.",
    )

    return redirect(
        "ride_en_progreso",
        viaje_id=viaje.id,
    )

# =========================================================
# RIDE EN PROGRESO
# =========================================================

@login_required(login_url="login")
def ride_en_progreso(request, viaje_id):

    viaje = get_object_or_404(
        Viaje.objects.select_related(
            "conductor",
            "conductor__usuario",
            "vehiculo",
        ),
        pk=viaje_id,
    )

    es_conductor = (
        viaje.conductor.usuario_id
        == request.user.id
    )

    solicitud_pasajero = None

    # -----------------------------------------------------
    # VALIDAR ACCESO
    # -----------------------------------------------------

    if not es_conductor:

        solicitud_pasajero = (
            SolicitudViaje.objects
            .filter(
                viaje=viaje,
                pasajero=request.user,
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .ACEPTADA
                ),
            )
            .select_related(
                "pasajero",
            )
            .first()
        )

        if solicitud_pasajero is None:

            messages.error(
                request,
                "No tienes permiso para consultar este viaje.",
            )

            return redirect("home")

    # -----------------------------------------------------
    # VALIDAR ESTADO
    # -----------------------------------------------------

    if viaje.estado == Viaje.EstadosViaje.FINALIZADO:

        messages.info(
            request,
            "Este viaje ya fue finalizado.",
        )

        if es_conductor:

            return redirect(
                "mis_viajes_conductor"
            )

        return redirect(
            "mis_viajes_pasajero"
        )

    if viaje.estado == Viaje.EstadosViaje.CANCELADO:

        messages.warning(
            request,
            "Este viaje fue cancelado.",
        )

        if es_conductor:

            return redirect(
                "mis_viajes_conductor"
            )

        return redirect(
            "mis_viajes_pasajero"
        )

    if viaje.estado != Viaje.EstadosViaje.EN_CURSO:

        messages.warning(
            request,
            "El viaje todavía no ha sido iniciado.",
        )

        if es_conductor:

            return redirect(
                "mis_viajes_conductor"
            )

        return redirect(
            "mis_viajes_pasajero"
        )

    # -----------------------------------------------------
    # PASAJEROS ACEPTADOS
    # -----------------------------------------------------

    solicitudes_aceptadas = (
        SolicitudViaje.objects
        .filter(
            viaje=viaje,
            estado=(
                SolicitudViaje
                .EstadosSolicitud
                .ACEPTADA
            ),
        )
        .select_related(
            "pasajero",
        )
        .order_by(
            "fecha_solicitud"
        )
    )

    total_pasajeros = sum(
        solicitud.asientos_solicitados
        for solicitud in solicitudes_aceptadas
    )

    # -----------------------------------------------------
    # CHAT
    # -----------------------------------------------------

    sala_chat, _ = (
        SalaChat.objects
        .get_or_create(
            viaje=viaje,
            defaults={
                "activa": True,
            },
        )
    )

    if not sala_chat.activa:

        sala_chat.activa = True

        sala_chat.save(
            update_fields=[
                "activa",
            ]
        )

    # -----------------------------------------------------
    # ALERTAS ACTIVAS
    # -----------------------------------------------------

    alertas_activas = (
        AlertaEmergencia.objects
        .filter(
            viaje=viaje,
            estado=(
                AlertaEmergencia
                .EstadosAlerta
                .ACTIVA
            ),
        )
        .select_related(
            "usuario",
        )
        .order_by(
            "-fecha_activacion"
        )
    )

    contexto = {
        "viaje": viaje,
        "vehiculo": viaje.vehiculo,
        "conductor": viaje.conductor,
        "solicitudes_aceptadas": solicitudes_aceptadas,
        "total_pasajeros": total_pasajeros,
        "sala_chat": sala_chat,
        "alertas_activas": alertas_activas,
        "total_alertas_activas": alertas_activas.count(),
        "es_conductor": es_conductor,
        "solicitud_pasajero": solicitud_pasajero,
    }

    return render(
        request,
        "viajes/ride_en_progreso.html",
        contexto,
    )

# =========================================================
# FINALIZAR VIAJE
# =========================================================

@login_required(login_url="login")
@require_POST
def finalizar_viaje(request, viaje_id):

    if obtener_rol(request.user) != Usuario.Roles.CONDUCTOR:

        messages.error(
            request,
            "Solo el conductor puede finalizar el viaje.",
        )

        return redirect("home")

    try:

        perfil_conductor = (
            request.user.perfil_conductor
        )

    except PerfilConductor.DoesNotExist:

        messages.error(
            request,
            "No tienes un perfil de conductor registrado.",
        )

        return redirect("perfil")

    try:

        with transaction.atomic():

            viaje = (
                Viaje.objects
                .select_for_update()
                .get(
                    pk=viaje_id,
                    conductor=perfil_conductor,
                )
            )

            if viaje.estado != Viaje.EstadosViaje.EN_CURSO:

                messages.warning(
                    request,
                    "Solo puedes finalizar un viaje que esté en curso.",
                )

                return redirect(
                    "mis_viajes_conductor"
                )

            viaje.estado = (
                Viaje.EstadosViaje.FINALIZADO
            )

            viaje.save(
                update_fields=[
                    "estado",
                    "fecha_actualizacion",
                ]
            )

            # Marcar como completadas las solicitudes aceptadas.
            SolicitudViaje.objects.filter(
                viaje=viaje,
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .ACEPTADA
                ),
            ).update(
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .COMPLETADA
                ),
            )

            # Cerrar la sala del chat.
            SalaChat.objects.filter(
                viaje=viaje,
            ).update(
                activa=False,
            )

    except Viaje.DoesNotExist:

        messages.error(
            request,
            "El viaje no existe o no te pertenece.",
        )

        return redirect(
            "mis_viajes_conductor"
        )

    messages.success(
        request,
        "El viaje fue finalizado correctamente.",
    )

    return redirect(
        "mis_viajes_conductor"
    )


# =========================================================
# PANEL ADMINISTRATIVO Y VISTAS ASOCIADAS
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


@user_passes_test(
    es_administrador,
    login_url="login"
)
def cargar_vista(request, vista):

    plantilla = VISTAS_ADMIN.get(vista)

    if plantilla is None:

        raise Http404(
            "Vista administrativa no encontrada."
        )

    contexto = {}


    # =====================================================
    # INICIO
    # =====================================================

    if vista == "inicio":

        contexto["total_usuarios"] = (
            Usuario.objects.count()
        )

        contexto["total_alertas_activas"] = (
            AlertaEmergencia.objects
            .filter(
                estado=(
                    AlertaEmergencia
                    .EstadosAlerta
                    .ACTIVA
                )
            )
            .count()
        )


    # =====================================================
    # USUARIOS
    # =====================================================

    elif vista == "usuarios":

        contexto["usuarios"] = (
            Usuario.objects
            .all()
            .order_by("-id")
        )


    # =====================================================
    # RIDES / VIAJES
    # =====================================================

    elif vista == "rides":

        viajes = (
            Viaje.objects
            .select_related(
                "conductor",
                "conductor__usuario",
                "vehiculo",
            )
            .order_by(
                "-fecha_hora_salida"
            )
        )

        contexto.update({

            # Debe llamarse "viajes" porque así
            # lo utiliza partials/rides.html.
            "viajes": viajes,

            "total_viajes": viajes.count(),

            "viajes_borrador": viajes.filter(
                estado=Viaje.EstadosViaje.BORRADOR
            ).count(),

            "viajes_disponibles": viajes.filter(
                estado=Viaje.EstadosViaje.DISPONIBLE
            ).count(),

            "viajes_completos": viajes.filter(
                estado=Viaje.EstadosViaje.COMPLETO
            ).count(),

            "viajes_en_curso": viajes.filter(
                estado=Viaje.EstadosViaje.EN_CURSO
            ).count(),

            "viajes_finalizados": viajes.filter(
                estado=Viaje.EstadosViaje.FINALIZADO
            ).count(),

            "viajes_cancelados": viajes.filter(
                estado=Viaje.EstadosViaje.CANCELADO
            ).count(),

        })


    # =====================================================
    # ALERTAS
    # =====================================================

    elif vista == "alertas":

        contexto["alertas"] = (
            AlertaEmergencia.objects
            .select_related(
                "usuario",
                "viaje",
            )
            .order_by(
                "-fecha_activacion"
            )
        )

    # =====================================================
    # PUNTOCACIONES
    # =====================================================

    elif vista == "puntuacion":

        # -------------------------------------------------
        # Todas las calificaciones para la tabla del admin
        # -------------------------------------------------

        calificaciones = (
            Calificacion.objects
            .select_related(
                "autor",
                "destinatario",
                "viaje",
                "viaje__conductor",
                "viaje__conductor__usuario",
                "revisada_por",
            )
            .order_by("-fecha")
        )


        # -------------------------------------------------
        # Calificaciones que cuentan para estadísticas
        # -------------------------------------------------

        calificaciones_metricas = (
            calificaciones
            .filter(
                estado__in=[
                    Calificacion
                    .EstadosCalificacion
                    .VISIBLE,

                    Calificacion
                    .EstadosCalificacion
                    .EN_REVISION,
                ]
            )
        )


        # -------------------------------------------------
        # RESUMEN GENERAL
        # -------------------------------------------------

        resumen_general = (
            calificaciones_metricas
            .aggregate(
                promedio=Avg("puntuacion"),
                total=Count("id"),
            )
        )

        promedio_general = (
            resumen_general.get("promedio")
            or 0
        )

        total_calificaciones = (
            resumen_general.get("total")
            or 0
        )


        # -------------------------------------------------
        # ÍNDICE DE SATISFACCIÓN
        # 4 o 5 estrellas
        # -------------------------------------------------

        total_positivas = (
            calificaciones_metricas
            .filter(
                puntuacion__gte=4
            )
            .count()
        )

        indice_satisfaccion = 0

        if total_calificaciones > 0:

            indice_satisfaccion = round(
                (
                    total_positivas
                    / total_calificaciones
                )
                * 100,
                1,
            )


        # -------------------------------------------------
        # PROMEDIO DE CONDUCTORES
        # -------------------------------------------------

        promedio_conductores = (
            calificaciones_metricas
            .filter(
                tipo=(
                    Calificacion
                    .TiposCalificacion
                    .CONDUCTOR
                )
            )
            .aggregate(
                promedio=Avg("puntuacion")
            )
            .get("promedio")
            or 0
        )


        # -------------------------------------------------
        # PROMEDIO DE PASAJEROS
        # -------------------------------------------------

        promedio_pasajeros = (
            calificaciones_metricas
            .filter(
                tipo=(
                    Calificacion
                    .TiposCalificacion
                    .PASAJERO
                )
            )
            .aggregate(
                promedio=Avg("puntuacion")
            )
            .get("promedio")
            or 0
        )


        # -------------------------------------------------
        # PROMEDIO DE EXPERIENCIA DE VIAJE
        # -------------------------------------------------

        promedio_viajes = (
            calificaciones_metricas
            .filter(
                tipo=(
                    Calificacion
                    .TiposCalificacion
                    .VIAJE
                )
            )
            .aggregate(
                promedio=Avg("puntuacion")
            )
            .get("promedio")
            or 0
        )


        # -------------------------------------------------
        # CONVERTIR PROMEDIOS EN PORCENTAJES DE BARRA
        # -------------------------------------------------

        def calcular_porcentaje_promedio(valor):

            valor_numerico = float(
                valor or 0
            )

            valor_numerico = max(
                0,
                min(valor_numerico, 5),
            )

            return round(
                (
                    valor_numerico
                    / 5
                )
                * 100,
                1,
            )


        porcentaje_conductores = (
            calcular_porcentaje_promedio(
                promedio_conductores
            )
        )

        porcentaje_pasajeros = (
            calcular_porcentaje_promedio(
                promedio_pasajeros
            )
        )

        porcentaje_viajes = (
            calcular_porcentaje_promedio(
                promedio_viajes
            )
        )


        # -------------------------------------------------
        # DISTRIBUCIÓN DE ESTRELLAS
        # -------------------------------------------------

        distribucion = {}

        for numero in range(1, 6):

            distribucion[numero] = (
                calificaciones_metricas
                .filter(
                    puntuacion=numero
                )
                .count()
            )


        # -------------------------------------------------
        # VIAJES FINALIZADOS SIN EVALUACIÓN
        # -------------------------------------------------

        viajes_finalizados = (
            Viaje.objects
            .filter(
                estado=(
                    Viaje
                    .EstadosViaje
                    .FINALIZADO
                )
            )
        )

        total_viajes_finalizados = (
            viajes_finalizados.count()
        )

        viajes_evaluados = (
            viajes_finalizados
            .filter(
                calificaciones__isnull=False
            )
            .distinct()
            .count()
        )

        viajes_sin_evaluar = max(
            total_viajes_finalizados
            - viajes_evaluados,
            0,
        )


        # -------------------------------------------------
        # CANTIDADES DE MODERACIÓN
        # -------------------------------------------------

        total_reportadas = (
            calificaciones
            .filter(
                estado=(
                    Calificacion
                    .EstadosCalificacion
                    .REPORTADA
                )
            )
            .count()
        )

        total_en_revision = (
            calificaciones
            .filter(
                estado=(
                    Calificacion
                    .EstadosCalificacion
                    .EN_REVISION
                )
            )
            .count()
        )

        total_ocultas = (
            calificaciones
            .filter(
                estado=(
                    Calificacion
                    .EstadosCalificacion
                    .OCULTA
                )
            )
            .count()
        )


        # -------------------------------------------------
        # CONTEXTO DEL TEMPLATE
        # -------------------------------------------------

        contexto.update({

            "calificaciones":
                calificaciones,

            "promedio_general":
                round(
                    float(promedio_general),
                    1,
                ),

            "total_calificaciones":
                total_calificaciones,

            "indice_satisfaccion":
                indice_satisfaccion,

            "promedio_conductores":
                round(
                    float(promedio_conductores),
                    1,
                ),

            "promedio_pasajeros":
                round(
                    float(promedio_pasajeros),
                    1,
                ),

            "promedio_viajes":
                round(
                    float(promedio_viajes),
                    1,
                ),

            "porcentaje_conductores":
                porcentaje_conductores,

            "porcentaje_pasajeros":
                porcentaje_pasajeros,

            "porcentaje_viajes":
                porcentaje_viajes,

            "viajes_sin_evaluar":
                viajes_sin_evaluar,

            "total_reportadas":
                total_reportadas,

            "total_en_revision":
                total_en_revision,

            "total_ocultas":
                total_ocultas,

            "distribucion_labels": [
                "1 estrella",
                "2 estrellas",
                "3 estrellas",
                "4 estrellas",
                "5 estrellas",
            ],

            "distribucion_valores": [
                distribucion[1],
                distribucion[2],
                distribucion[3],
                distribucion[4],
                distribucion[5],
            ],

        })

    return render(
        request,
        plantilla,
        contexto,
    )


@user_passes_test(es_administrador, login_url="login")
def panel_admin(request):
    return redirect("index")


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
# API REST JSON PARA USUARIOS Y VERIFICACIÓN (ADMIN)
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
                        capacidad_val = getattr(vehiculo, "asientos", None) or getattr(vehiculo, "capacidad", None)
                        data["vehiculo"] = {
                            "id": vehiculo.id,
                            "marca": vehiculo.marca,
                            "modelo": vehiculo.modelo,
                            "anio": vehiculo.anio,
                            "color": vehiculo.color,
                            "placas": vehiculo.placas,
                            "capacidad": capacidad_val,
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


@user_passes_test(es_administrador, login_url="login")
def api_obtener_expediente_medico(request, usuario_id):
    """
    Retorna la información médica asociada a un usuario en formato JSON.
    """
    try:
        usuario = Usuario.objects.get(pk=usuario_id)
        info, _ = InformacionMedica.objects.get_or_create(usuario=usuario)

        nombre_completo = getattr(usuario, "nombre_completo", f"{usuario.nombre} {getattr(usuario, 'first_name', '')}".strip())

        data = {
            "usuario_id": usuario.id,
            "nombre_completo": nombre_completo,
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
            "verificado": getattr(info, "verificado", False),
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