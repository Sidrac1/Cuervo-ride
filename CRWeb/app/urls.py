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
    # TODO: placeholder mientras se construye la vista real de "mis viajes"
    # para pasajeros (historial de solicitudes). Por ahora apunta a la
    # pantalla de búsqueda para que el link del sidebar no truene con
    # NoReverseMatch cuando un pasajero la visita.
    path("filtro-viajes/", views.filtroviajes, name="mis_viajes_pasajero"),

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
    path(
        "api/admin/usuarios/<int:usuario_id>/expediente-medico/",
        views.api_obtener_expediente_medico,
        name="api_obtener_expediente_medico",
    ),
    path(
        "api/admin/usuarios/<int:usuario_id>/expediente-medico/actualizar/",
        views.api_actualizar_expediente_medico,
        name="api_actualizar_expediente_medico",
    ),
]
