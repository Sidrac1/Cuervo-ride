from django.urls import path
from . import views


urlpatterns = [
    # ---------------------------------------------------------
    # Vistas Públicas / Navegación
    # ---------------------------------------------------------
    path("", views.inicio, name="inicio"),
    path("home/", views.home, name="home"),
    path("nosotros/", views.sobrenosotros, name="sobrenosotros"),
    path("agendar-viaje/", views.agendarviaje, name="agendarviaje"),
    path("filtro-viajes/", views.filtroviajes, name="filtroviajes"),
    path("viajes/publicar/",views.publicar_viaje,name="publicar_viaje",),
    path("viajes/mis-viajes/",views.mis_viajes_conductor,name="mis_viajes_conductor",),
    path("viajes/mis-viajes/pasajero/",views.mis_viajes_pasajero,name="mis_viajes_pasajero"),
    path("viajes/<int:viaje_id>/alerta/",views.crear_alerta_viaje,name="crear_alerta_viaje",),
    path("viajes/<int:viaje_id>/chat/",views.chat_viaje,name="chat_viaje",),
    path("viajes/<int:viaje_id>/solicitar/",views.solicitar_viaje,name="solicitar_viaje",),
    path("conductor/solicitudes/",views.solicitudes_conductor,name="solicitudes_conductor",),
    path("solicitudes/<int:solicitud_id>/aceptar/",views.aceptar_solicitud_viaje,name="aceptar_solicitud_viaje",),
    path("solicitudes/<int:solicitud_id>/rechazar/",views.rechazar_solicitud_viaje,name="rechazar_solicitud_viaje",),
    path("viajes/<int:viaje_id>/ruta/",views.ver_ruta_viaje_pasajero,name="ver_ruta_viaje_pasajero",),
    path("viajes/solicitudes/<int:solicitud_id>/calificar-conductor/",views.calificar_conductor,name="calificar_conductor",),
    path("viajes/<int:viaje_id>/iniciar/",views.iniciar_viaje,name="iniciar_viaje",),
    path("viajes/<int:viaje_id>/cancelar/",views.cancelar_viaje,name="cancelar_viaje",),
    path("viajes/<int:viaje_id>/en-progreso/",views.ride_en_progreso,name="ride_en_progreso",),
    path("viajes/<int:viaje_id>/finalizar/",views.finalizar_viaje,name="finalizar_viaje",),
    path("viajes/<int:viaje_id>/calificar-pasajeros/",views.listar_pasajeros_calificar,name="listar_pasajeros_calificar",),
    path("viajes/solicitudes/<int:solicitud_id>/calificar-pasajero/",views.calificar_pasajero,name="calificar_pasajero",),

    # ---------------------------------------------------------
    # Autenticación y Registro
    # ---------------------------------------------------------
    path("login/", views.login_view, name="login"),
    path("register/", views.register, name="register"),
    path("logout/", views.logout_view, name="logout"),

    # ---------------------------------------------------------
    # Gestión de Perfil e Información Médica
    # ---------------------------------------------------------
    path("perfil/", views.perfil, name="perfil"),
    path("info-medica/", views.infoMedica, name="infoMedica"),

    # ---------------------------------------------------------
    # Panel de Administración Dinámico
    # ---------------------------------------------------------
    path("admin-panel/", views.index, name="index"),
    path("admin-panel/cargar/<str:vista>/", views.cargar_vista, name="cargar_vista"),
    path("admin-panel/usuarios/", views.panel_admin, name="panel_admin"),
    path('admin-panel/alertas/', views.panel_alertas, name='panel_alertas'),
    path('api/admin/usuarios/<int:usuario_id>/', views.api_obtener_usuario, name='api_obtener_usuario'),
    path('api/admin/usuarios/<int:usuario_id>/actualizar/', views.api_actualizar_usuario, name='api_actualizar_usuario'),
    path('api/admin/conductores/<int:usuario_id>/verificar/', views.api_verificar_conductor, name='api_verificar_conductor'),
    path('api/admin/vehiculos/<int:vehiculo_id>/verificar/', views.api_verificar_vehiculo, name='api_verificar_vehiculo'),
    path("api/admin/usuarios/<int:usuario_id>/expediente-medico/",views.api_obtener_expediente_medico,name="api_obtener_expediente_medico",),
    path("api/admin/usuarios/<int:usuario_id>/expediente-medico/actualizar/",views.api_actualizar_expediente_medico,name="api_actualizar_expediente_medico",),
]
