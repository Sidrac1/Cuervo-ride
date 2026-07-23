from django.urls import path
from . import views


urlpatterns = [

    path(
        "",
        views.home,
        name="home"
    ),

    path(
        "perfil/",
        views.perfil,
        name="perfil"
    ),

    path(
        "nosotros/",
        views.sobrenosotros,
        name="sobrenosotros"
    ),

    path(
        "agendarviaje/",
        views.agendarviaje,
        name="agendarviaje"
    ),

    path(
        "filtroviajes/",
        views.filtroviajes,
        name="filtroviajes"
    ),

    path(
        "login/",
        views.login_view,
        name="login"
    ),

    path(
        "register/",
        views.register,
        name="register"
    ),

    path(
        "infoMedica/",
        views.infoMedica,
        name="infoMedica"
    ),

    path(
        "index/",
        views.index,
        name="index"
    ),

    path(
        "panel/cargar/<str:vista>/",
        views.cargar_vista,
        name="cargar_vista"
    ),

    path(
        "panel-administrador/",
        views.panel_admin,
        name="panel_admin"
    ),

    path(
        "logout/",
        views.logout_view,
        name="logout"
    ),

]