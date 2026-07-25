from django.urls import path
from . import views


urlpatterns = [
    # ---------------------------------------------------------
    # Vistas Públicas / Navegación
    # ---------------------------------------------------------
    path("", views.home, name="home"),
    path("nosotros/", views.sobrenosotros, name="sobrenosotros"),
    path("agendar-viaje/", views.agendarviaje, name="agendarviaje"),
    path("filtro-viajes/", views.filtroviajes, name="filtroviajes"),

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
    path('panel/vista/<str:vista>/', views.cargar_vista, name='cargar_vista'),
    path('api/admin/usuarios/<int:usuario_id>/', views.api_obtener_usuario, name='api_obtener_usuario'),
    path('api/admin/usuarios/<int:usuario_id>/actualizar/', views.api_actualizar_usuario, name='api_actualizar_usuario'),
    
]