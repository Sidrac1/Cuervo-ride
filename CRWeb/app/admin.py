from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):

    model = Usuario

    ordering = (
        "email",
    )

    list_display = (
        "email",
        "nombre",
        "first_name",
        "last_name",
        "matricula",
        "rol",
        "estado_cuenta",
        "correo_verificado",
        "is_staff",
        "is_active",
    )

    list_filter = (
        "rol",
        "estado_cuenta",
        "correo_verificado",
        "is_staff",
        "is_active",
        "is_superuser",
    )

    search_fields = (
        "email",
        "nombre",
        "first_name",
        "last_name",
        "matricula",
    )

    fieldsets = (
        (
            "Acceso",
            {
                "fields": (
                    "email",
                    "password",
                )
            },
        ),
        (
            "Información personal",
            {
                "fields": (
                    "nombre",
                    "first_name",
                    "last_name",
                    "matricula",
                    "carrera",
                    "grado_grupo",
                    "telefono",
                    "foto",
                )
            },
        ),
        (
            "Cuenta Cuervo-Ride",
            {
                "fields": (
                    "rol",
                    "estado_cuenta",
                    "correo_verificado",
                )
            },
        ),
        (
            "Permisos de Django",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Fechas importantes",
            {
                "fields": (
                    "last_login",
                    "date_joined",
                    "fecha_registro",
                    "fecha_actualizacion",
                )
            },
        ),
    )

    readonly_fields = (
        "fecha_registro",
        "fecha_actualizacion",
        "last_login",
        "date_joined",
    )

    add_fieldsets = (
        (
            "Crear usuario",
            {
                "classes": (
                    "wide",
                ),
                "fields": (
                    "email",
                    "nombre",
                    "first_name",
                    "last_name",
                    "matricula",
                    "carrera",
                    "grado_grupo",
                    "telefono",
                    "rol",
                    "estado_cuenta",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                    "is_active",
                ),
            },
        ),
    )