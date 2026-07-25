from decimal import Decimal

from django.conf import settings
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
)
from django.db import models
from django.db.models import F, Q
from django.utils import timezone


# =========================================================
# MANAGER DE USUARIO
# =========================================================

class UsuarioManager(BaseUserManager):
    """
    Manager personalizado para un modelo de usuario
    que utiliza el correo electrónico en lugar de username.
    """

    use_in_migrations = True

    def create_user(
        self,
        email,
        password=None,
        **extra_fields
    ):
        """
        Crea y guarda un usuario normal.
        """

        if not email:
            raise ValueError(
                "El correo electrónico es obligatorio."
            )

        email = self.normalize_email(
            email
        ).lower()

        extra_fields.setdefault(
            "is_staff",
            False
        )

        extra_fields.setdefault(
            "is_superuser",
            False
        )

        extra_fields.setdefault(
            "is_active",
            True
        )

        usuario = self.model(
            email=email,
            **extra_fields
        )

        usuario.set_password(
            password
        )

        usuario.save(
            using=self._db
        )

        return usuario

    def create_superuser(
        self,
        email,
        password=None,
        **extra_fields
    ):
        """
        Crea y guarda un superusuario.
        """

        extra_fields.setdefault(
            "is_staff",
            True
        )

        extra_fields.setdefault(
            "is_superuser",
            True
        )

        extra_fields.setdefault(
            "is_active",
            True
        )

        extra_fields.setdefault(
            "rol",
            Usuario.Roles.ADMINISTRADOR
        )

        extra_fields.setdefault(
            "estado_cuenta",
            Usuario.EstadosCuenta.ACTIVA
        )

        if extra_fields.get("is_staff") is not True:
            raise ValueError(
                "El superusuario debe tener is_staff=True."
            )

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(
                "El superusuario debe tener is_superuser=True."
            )

        return self.create_user(
            email=email,
            password=password,
            **extra_fields
        )


# =========================================================
# USUARIO
# =========================================================

class Usuario(AbstractUser):

    class Roles(models.TextChoices):
        PASAJERO = "pasajero", "Pasajero"
        CONDUCTOR = "conductor", "Conductor"
        ADMINISTRADOR = "administrador", "Administrador"

    class EstadosCuenta(models.TextChoices):
        ACTIVA = "activa", "Activa"
        SUSPENDIDA = "suspendida", "Suspendida"
        BLOQUEADA = "bloqueada", "Bloqueada"
        PENDIENTE = "pendiente", "Pendiente de verificación"

    # Eliminamos username porque el inicio de sesión será con correo.
    username = None

    email = models.EmailField(
        unique=True,
        verbose_name="Correo electrónico"
    )

    # Nombre o nombres de la persona.
    nombre = models.CharField(
        max_length=150,
        verbose_name="Nombre o nombres"
    )

    # Campos heredados de AbstractUser.
    # Los redefinimos únicamente para cambiar sus etiquetas
    # y dejar clara su función en Cuervo-Ride.

    first_name = models.CharField(
        max_length=150,
        verbose_name="Apellido paterno"
    )

    last_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Apellido materno"
    )

    matricula = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Matrícula"
    )

    carrera = models.CharField(
        max_length=100,
        verbose_name="Carrera"
    )

    grado_grupo = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Grado y grupo"
    )

    telefono = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Teléfono"
    )

    rol = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.PASAJERO,
        verbose_name="Rol"
    )

    foto = models.ImageField(
        upload_to="usuarios/perfiles/",
        blank=True,
        null=True,
        verbose_name="Foto de perfil"
    )

    estado_cuenta = models.CharField(
        max_length=20,
        choices=EstadosCuenta.choices,
        default=EstadosCuenta.ACTIVA,
        verbose_name="Estado de la cuenta"
    )

    correo_verificado = models.BooleanField(
        default=False,
        verbose_name="Correo verificado"
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de registro"
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización"
    )

    objects = UsuarioManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = [
        "nombre",
        "first_name",
        "matricula",
        "carrera",
        "rol",
    ]

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = [
            "nombre",
            "first_name",
            "last_name",
        ]

        indexes = [
            models.Index(
                fields=["matricula"],
                name="idx_usuario_matricula"
            ),
            models.Index(
                fields=["rol"],
                name="idx_usuario_rol"
            ),
            models.Index(
                fields=["estado_cuenta"],
                name="idx_usuario_estado"
            ),
            models.Index(
                fields=["email"],
                name="idx_usuario_email"
            ),
        ]

    def __str__(self):
        return (
            f"{self.nombre_completo} - "
            f"{self.matricula}"
        )

    @property
    def nombre_completo(self):
        """
        Construye el nombre completo del usuario.

        nombre:
            Nombre o nombres

        first_name:
            Apellido paterno

        last_name:
            Apellido materno
        """

        partes = [
            self.nombre,
            self.first_name,
            self.last_name,
        ]

        return " ".join(
            parte.strip()
            for parte in partes
            if parte and parte.strip()
        )

    @property
    def apellido_paterno(self):
        """
        Alias legible para first_name.
        """
        return self.first_name

    @property
    def apellido_materno(self):
        """
        Alias legible para last_name.
        """
        return self.last_name

    @property
    def es_pasajero(self):
        return (
            self.rol == self.Roles.PASAJERO
        )

    @property
    def es_conductor(self):
        return (
            self.rol == self.Roles.CONDUCTOR
        )

    @property
    def es_administrador(self):
        return (
            self.rol == self.Roles.ADMINISTRADOR
            or self.is_staff
            or self.is_superuser
        )


# =========================================================
# INFORMACIÓN MÉDICA
# =========================================================

class InformacionMedica(models.Model):

    class TiposSangre(models.TextChoices):
        A_POSITIVO = "A+", "A+"
        A_NEGATIVO = "A-", "A-"
        B_POSITIVO = "B+", "B+"
        B_NEGATIVO = "B-", "B-"
        AB_POSITIVO = "AB+", "AB+"
        AB_NEGATIVO = "AB-", "AB-"
        O_POSITIVO = "O+", "O+"
        O_NEGATIVO = "O-", "O-"

    class TiposDiscapacidad(models.TextChoices):
        VISUAL = "visual", "Visual"
        AUDITIVA = "auditiva", "Auditiva"
        MOTRIZ = "motriz", "Motriz"
        INTELECTUAL = "intelectual", "Intelectual"
        PSICOSOCIAL = "psicosocial", "Psicosocial"
        MULTIPLE = "multiple", "Múltiple"
        OTRA = "otra", "Otra"

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="informacion_medica",
        verbose_name="Usuario"
    )

    discapacidad = models.BooleanField(
        default=False,
        verbose_name="Tiene discapacidad"
    )

    tipo_sangre = models.CharField(
        max_length=3,
        choices=TiposSangre.choices,
        blank=True,
        null=True,
        verbose_name="Tipo de sangre"
    )

    tipo_discapacidad = models.CharField(
        max_length=50,
        choices=TiposDiscapacidad.choices,
        blank=True,
        null=True,
        verbose_name="Tipo de discapacidad"
    )

    descripcion_discapacidad = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Descripción de discapacidad"
    )

    vehiculo_adaptado = models.BooleanField(
        default=False,
        verbose_name="Requiere vehículo adaptado"
    )

    cuidados_especiales = models.BooleanField(
        default=False,
        verbose_name="Requiere cuidados especiales"
    )

    usa_baston = models.BooleanField(
        default=False,
        verbose_name="Usa bastón"
    )

    usa_perro_guia = models.BooleanField(
        default=False,
        verbose_name="Usa perro guía"
    )

    usa_silla_ruedas = models.BooleanField(
        default=False,
        verbose_name="Usa silla de ruedas"
    )

    usa_andadera = models.BooleanField(
        default=False,
        verbose_name="Usa andadera"
    )

    usa_muletas = models.BooleanField(
        default=False,
        verbose_name="Usa muletas"
    )

    usa_protesis = models.BooleanField(
        default=False,
        verbose_name="Usa prótesis"
    )

    otro_apoyo = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Otro apoyo"
    )

    alergias = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Alergias"
    )

    medicamentos = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Medicamentos"
    )

    condiciones_medicas = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Condiciones médicas"
    )

    nombre_contacto = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Contacto de emergencia"
    )

    telefono_contacto = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Teléfono de emergencia"
    )

    parentesco_contacto = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Parentesco"
    )

    observaciones = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Observaciones"
    )

    verificado = models.BooleanField(
        default=False,
        verbose_name="Información verificada"
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Información médica"
        verbose_name_plural = "Información médica"

    def clean(self):
        super().clean()

        if not self.discapacidad:
            self.tipo_discapacidad = None
            self.descripcion_discapacidad = ""
            self.vehiculo_adaptado = False
            self.cuidados_especiales = False

    def __str__(self):
        return f"Información médica de {self.usuario.nombre}"


# =========================================================
# PERFIL DEL CONDUCTOR
# =========================================================

class PerfilConductor(models.Model):

    class EstadosVerificacion(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        EN_REVISION = "en_revision", "En revisión"
        APROBADO = "aprobado", "Aprobado"
        RECHAZADO = "rechazado", "Rechazado"
        SUSPENDIDO = "suspendido", "Suspendido"

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil_conductor",
        verbose_name="Usuario"
    )

    numero_licencia = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Número de licencia"
    )

    fecha_vencimiento = models.DateField(
        blank=True,
        null=True,
        verbose_name="Fecha de vencimiento"
    )

    foto_licencia_frontal = models.ImageField(
        upload_to="conductores/licencias/frontal/",
        blank=True,
        null=True,
        verbose_name="Foto frontal de la licencia"
    )

    foto_licencia_reverso = models.ImageField(
        upload_to="conductores/licencias/reverso/",
        blank=True,
        null=True,
        verbose_name="Foto reverso de la licencia"
    )

    estado_verificacion = models.CharField(
        max_length=20,
        choices=EstadosVerificacion.choices,
        default=EstadosVerificacion.PENDIENTE,
        verbose_name="Estado de verificación"
    )

    motivo_rechazo = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Motivo de rechazo"
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Perfil de conductor"
        verbose_name_plural = "Perfiles de conductor"
        indexes = [
            models.Index(
                fields=["estado_verificacion"],
                name="idx_conductor_estado"
            )
        ]

    def clean(self):
        super().clean()

        if self.usuario_id and (
            self.usuario.rol != Usuario.Roles.CONDUCTOR
        ):
            raise ValidationError({
                "usuario": (
                    "Solo un usuario con rol de conductor "
                    "puede tener un perfil de conductor."
                )
            })

    def __str__(self):
        return f"Conductor: {self.usuario.nombre}"


# =========================================================
# VEHÍCULO
# =========================================================

class Vehiculo(models.Model):

    class EstadosVehiculo(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        EN_REVISION = "en_revision", "En revisión"
        APROBADO = "aprobado", "Aprobado"
        RECHAZADO = "rechazado", "Rechazado"
        INACTIVO = "inactivo", "Inactivo"

    conductor = models.ForeignKey(
        PerfilConductor,
        on_delete=models.CASCADE,
        related_name="vehiculos",
        verbose_name="Conductor"
    )

    dueno = models.CharField(
        max_length=150,
        verbose_name="Dueño del vehículo"
    )

    marca = models.CharField(
        max_length=100,
        verbose_name="Marca"
    )

    modelo = models.CharField(
        max_length=100,
        verbose_name="Modelo"
    )

    anio = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1980),
            MaxValueValidator(2100),
        ],
        verbose_name="Año"
    )

    color = models.CharField(
        max_length=50,
        verbose_name="Color"
    )

    placas = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Placas"
    )

    capacidad = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(20),
        ],
        verbose_name="Capacidad de pasajeros"
    )

    foto = models.ImageField(
        upload_to="vehiculos/fotos/",
        blank=True,
        null=True,
        verbose_name="Foto del vehículo"
    )

    tarjeta_circulacion = models.ImageField(
        upload_to="vehiculos/documentos/circulacion/",
        blank=True,
        null=True,
        verbose_name="Tarjeta de circulación"
    )

    documento_seguro = models.ImageField(
        upload_to="vehiculos/documentos/seguro/",
        blank=True,
        null=True,
        verbose_name="Documento del seguro"
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadosVehiculo.choices,
        default=EstadosVehiculo.PENDIENTE,
        verbose_name="Estado"
    )

    motivo_rechazo = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Motivo de rechazo"
    )

    activo = models.BooleanField(
        default=True,
        verbose_name="Vehículo activo"
    )

    fecha_registro = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"
        ordering = [
            "-fecha_registro"
        ]
        indexes = [
            models.Index(
                fields=["placas"],
                name="idx_vehiculo_placas"
            ),
            models.Index(
                fields=["estado"],
                name="idx_vehiculo_estado"
            ),
        ]

    def __str__(self):
        return f"{self.marca} {self.modelo} - {self.placas}"


# =========================================================
# VIAJE
# =========================================================

class Viaje(models.Model):

    class EstadosViaje(models.TextChoices):
        BORRADOR = "borrador", "Borrador"
        DISPONIBLE = "disponible", "Disponible"
        COMPLETO = "completo", "Sin lugares disponibles"
        EN_CURSO = "en_curso", "En curso"
        FINALIZADO = "finalizado", "Finalizado"
        CANCELADO = "cancelado", "Cancelado"

    conductor = models.ForeignKey(
        PerfilConductor,
        on_delete=models.PROTECT,
        related_name="viajes",
        verbose_name="Conductor"
    )

    vehiculo = models.ForeignKey(
        Vehiculo,
        on_delete=models.PROTECT,
        related_name="viajes",
        verbose_name="Vehículo"
    )

    origen = models.CharField(
        max_length=255,
        verbose_name="Origen"
    )

    destino = models.CharField(
        max_length=255,
        verbose_name="Destino"
    )

    origen_latitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    origen_longitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    destino_latitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    destino_longitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    fecha_hora_salida = models.DateTimeField(
        verbose_name="Fecha y hora de salida"
    )

    fecha_hora_llegada_estimada = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Llegada estimada"
    )

    asientos_totales = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(20),
        ],
        verbose_name="Asientos ofrecidos"
    )

    asientos_disponibles = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(0),
            MaxValueValidator(20),
        ],
        verbose_name="Asientos disponibles"
    )

    costo_por_pasajero = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00"))
        ],
        verbose_name="Costo por pasajero"
    )

    indicaciones = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="Indicaciones"
    )

    permite_mascota = models.BooleanField(
        default=False
    )

    acepta_silla_ruedas = models.BooleanField(
        default=False
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadosViaje.choices,
        default=EstadosViaje.DISPONIBLE
    )

    motivo_cancelacion = models.TextField(
        max_length=500,
        blank=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        verbose_name = "Viaje"
        verbose_name_plural = "Viajes"
        ordering = [
            "fecha_hora_salida"
        ]
        indexes = [
            models.Index(
                fields=["estado", "fecha_hora_salida"],
                name="idx_viaje_estado_fecha"
            ),
            models.Index(
                fields=["origen"],
                name="idx_viaje_origen"
            ),
            models.Index(
                fields=["destino"],
                name="idx_viaje_destino"
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    asientos_disponibles__lte=F(
                        "asientos_totales"
                    )
                ),
                name="viaje_disponibles_lte_totales"
            ),
            models.CheckConstraint(
                condition=Q(
                    costo_por_pasajero__gte=0
                ),
                name="viaje_costo_no_negativo"
            ),
        ]

    def clean(self):
        super().clean()

        errores = {}

        if (
            self.vehiculo_id
            and self.conductor_id
            and self.vehiculo.conductor_id != self.conductor_id
        ):
            errores["vehiculo"] = (
                "El vehículo seleccionado no pertenece "
                "al conductor del viaje."
            )

        if (
            self.asientos_totales
            and self.vehiculo_id
            and self.asientos_totales > self.vehiculo.capacidad
        ):
            errores["asientos_totales"] = (
                "Los asientos ofrecidos no pueden superar "
                "la capacidad del vehículo."
            )

        if (
            self.fecha_hora_llegada_estimada
            and self.fecha_hora_salida
            and self.fecha_hora_llegada_estimada
            <= self.fecha_hora_salida
        ):
            errores["fecha_hora_llegada_estimada"] = (
                "La llegada estimada debe ser posterior "
                "a la salida."
            )

        if errores:
            raise ValidationError(errores)

    def __str__(self):
        return (
            f"{self.origen} → {self.destino} "
            f"({self.fecha_hora_salida:%d/%m/%Y %H:%M})"
        )


# =========================================================
# PARADAS DEL VIAJE
# =========================================================

class ParadaViaje(models.Model):

    class TiposParada(models.TextChoices):
        RECOGIDA = "recogida", "Punto de recogida"
        INTERMEDIA = "intermedia", "Parada intermedia"
        DESCENSO = "descenso", "Punto de descenso"

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.CASCADE,
        related_name="paradas"
    )

    tipo = models.CharField(
        max_length=20,
        choices=TiposParada.choices,
        default=TiposParada.INTERMEDIA
    )

    nombre = models.CharField(
        max_length=200
    )

    direccion = models.CharField(
        max_length=255,
        blank=True
    )

    referencia = models.CharField(
        max_length=255,
        blank=True
    )

    latitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    longitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    orden = models.PositiveSmallIntegerField(
        default=1
    )

    class Meta:
        verbose_name = "Parada del viaje"
        verbose_name_plural = "Paradas del viaje"
        ordering = [
            "orden"
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["viaje", "orden"],
                name="parada_orden_unico_por_viaje"
            )
        ]

    def __str__(self):
        return f"{self.viaje} - {self.nombre}"


# =========================================================
# SOLICITUD DE VIAJE
# =========================================================

class SolicitudViaje(models.Model):

    class EstadosSolicitud(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ACEPTADA = "aceptada", "Aceptada"
        RECHAZADA = "rechazada", "Rechazada"
        CANCELADA = "cancelada", "Cancelada"
        COMPLETADA = "completada", "Completada"
        NO_PRESENTADO = "no_presentado", "No se presentó"

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.CASCADE,
        related_name="solicitudes"
    )

    pasajero = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="solicitudes_viaje"
    )

    asientos_solicitados = models.PositiveSmallIntegerField(
        default=1,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(10),
        ]
    )

    punto_recogida = models.CharField(
        max_length=255,
        blank=True
    )

    punto_descenso = models.CharField(
        max_length=255,
        blank=True
    )

    comentario = models.TextField(
        max_length=500,
        blank=True
    )

    requiere_asistencia = models.BooleanField(
        default=False
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadosSolicitud.choices,
        default=EstadosSolicitud.PENDIENTE
    )

    respondida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="solicitudes_respondidas",
        blank=True,
        null=True
    )

    fecha_solicitud = models.DateTimeField(
        auto_now_add=True
    )

    fecha_respuesta = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = "Solicitud de viaje"
        verbose_name_plural = "Solicitudes de viaje"
        ordering = [
            "-fecha_solicitud"
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["viaje", "pasajero"],
                name="solicitud_unica_pasajero_viaje"
            )
        ]
        indexes = [
            models.Index(
                fields=["estado", "fecha_solicitud"],
                name="idx_solicitud_estado_fecha"
            )
        ]

    def clean(self):
        super().clean()

        errores = {}

        if (
            self.viaje_id
            and self.pasajero_id
            and self.viaje.conductor.usuario_id
            == self.pasajero_id
        ):
            errores["pasajero"] = (
                "El conductor no puede solicitar un lugar "
                "en su propio viaje."
            )

        if (
            self.viaje_id
            and self.asientos_solicitados
            > self.viaje.asientos_totales
        ):
            errores["asientos_solicitados"] = (
                "La cantidad solicitada supera los lugares "
                "ofrecidos en el viaje."
            )

        if errores:
            raise ValidationError(errores)

    def __str__(self):
        return (
            f"{self.pasajero.nombre} - "
            f"{self.viaje.origen} → {self.viaje.destino}"
        )


# =========================================================
# CALIFICACIONES
# =========================================================

class Calificacion(models.Model):

    class TiposCalificacion(models.TextChoices):
        CONDUCTOR = "conductor", "Calificación al conductor"
        PASAJERO = "pasajero", "Calificación al pasajero"
        VIAJE = "viaje", "Calificación del viaje"

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.CASCADE,
        related_name="calificaciones"
    )

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calificaciones_realizadas"
    )

    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calificaciones_recibidas"
    )

    tipo = models.CharField(
        max_length=20,
        choices=TiposCalificacion.choices
    )

    puntuacion = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )

    comentario = models.TextField(
        max_length=500,
        blank=True
    )

    fecha = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Calificación"
        verbose_name_plural = "Calificaciones"
        ordering = [
            "-fecha"
        ]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "viaje",
                    "autor",
                    "destinatario",
                    "tipo",
                ],
                name="calificacion_unica_por_viaje"
            ),
            models.CheckConstraint(
                condition=~Q(
                    autor=F("destinatario")
                ),
                name="calificacion_no_autocalificacion"
            ),
        ]

    def __str__(self):
        return (
            f"{self.autor.nombre} calificó a "
            f"{self.destinatario.nombre}: {self.puntuacion}"
        )


# =========================================================
# SALA DE CHAT
# =========================================================

class SalaChat(models.Model):

    viaje = models.OneToOneField(
        Viaje,
        on_delete=models.CASCADE,
        related_name="sala_chat"
    )

    activa = models.BooleanField(
        default=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Sala de chat"
        verbose_name_plural = "Salas de chat"

    def __str__(self):
        return f"Chat del viaje {self.viaje_id}"


# =========================================================
# MENSAJE
# =========================================================

class Mensaje(models.Model):

    sala = models.ForeignKey(
        SalaChat,
        on_delete=models.CASCADE,
        related_name="mensajes"
    )

    emisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mensajes_enviados"
    )

    contenido = models.TextField(
        max_length=1000
    )

    fecha_envio = models.DateTimeField(
        auto_now_add=True
    )

    editado = models.BooleanField(
        default=False
    )

    fecha_edicion = models.DateTimeField(
        blank=True,
        null=True
    )

    eliminado = models.BooleanField(
        default=False
    )

    class Meta:
        verbose_name = "Mensaje"
        verbose_name_plural = "Mensajes"
        ordering = [
            "fecha_envio"
        ]
        indexes = [
            models.Index(
                fields=["sala", "fecha_envio"],
                name="idx_mensaje_sala_fecha"
            )
        ]

    def __str__(self):
        return f"Mensaje de {self.emisor.nombre}"


# =========================================================
# LECTURA DE MENSAJES
# =========================================================

class LecturaMensaje(models.Model):

    mensaje = models.ForeignKey(
        Mensaje,
        on_delete=models.CASCADE,
        related_name="lecturas"
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mensajes_leidos"
    )

    fecha_lectura = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Lectura de mensaje"
        verbose_name_plural = "Lecturas de mensajes"
        constraints = [
            models.UniqueConstraint(
                fields=["mensaje", "usuario"],
                name="lectura_unica_mensaje_usuario"
            )
        ]

    def __str__(self):
        return f"{self.usuario.nombre} leyó {self.mensaje_id}"


# =========================================================
# NOTIFICACIÓN
# =========================================================

class Notificacion(models.Model):

    class TiposNotificacion(models.TextChoices):
        SOLICITUD = "solicitud", "Solicitud de viaje"
        SOLICITUD_ACEPTADA = (
            "solicitud_aceptada",
            "Solicitud aceptada"
        )
        SOLICITUD_RECHAZADA = (
            "solicitud_rechazada",
            "Solicitud rechazada"
        )
        VIAJE = "viaje", "Información de viaje"
        MENSAJE = "mensaje", "Nuevo mensaje"
        ALERTA = "alerta", "Alerta"
        REPORTE = "reporte", "Reporte"
        SISTEMA = "sistema", "Sistema"

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificaciones"
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="notificaciones_generadas",
        blank=True,
        null=True
    )

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.CASCADE,
        related_name="notificaciones",
        blank=True,
        null=True
    )

    solicitud = models.ForeignKey(
        SolicitudViaje,
        on_delete=models.CASCADE,
        related_name="notificaciones",
        blank=True,
        null=True
    )

    tipo = models.CharField(
        max_length=30,
        choices=TiposNotificacion.choices,
        default=TiposNotificacion.SISTEMA
    )

    titulo = models.CharField(
        max_length=150
    )

    descripcion = models.TextField(
        max_length=500
    )

    url_destino = models.CharField(
        max_length=500,
        blank=True
    )

    leida = models.BooleanField(
        default=False
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_lectura = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = [
            "-fecha_creacion"
        ]
        indexes = [
            models.Index(
                fields=["usuario", "leida"],
                name="idx_notificacion_usuario_leida"
            )
        ]

    def marcar_como_leida(self):
        if not self.leida:
            self.leida = True
            self.fecha_lectura = timezone.now()

            self.save(
                update_fields=[
                    "leida",
                    "fecha_lectura",
                ]
            )

    def __str__(self):
        return f"{self.usuario.nombre}: {self.titulo}"


# =========================================================
# REPORTE
# =========================================================

class Reporte(models.Model):

    class MotivosReporte(models.TextChoices):
        CONDUCTA = "conducta", "Conducta inapropiada"
        ACOSO = "acoso", "Acoso"
        SEGURIDAD = "seguridad", "Problema de seguridad"
        VEHICULO = "vehiculo", "Problema con el vehículo"
        INCUMPLIMIENTO = "incumplimiento", "Incumplimiento"
        FRAUDE = "fraude", "Fraude"
        OTRO = "otro", "Otro"

    class EstadosReporte(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        EN_REVISION = "en_revision", "En revisión"
        RESUELTO = "resuelto", "Resuelto"
        DESCARTADO = "descartado", "Descartado"

    reportado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reportes_realizados"
    )

    usuario_reportado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reportes_recibidos"
    )

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.SET_NULL,
        related_name="reportes",
        blank=True,
        null=True
    )

    motivo = models.CharField(
        max_length=30,
        choices=MotivosReporte.choices
    )

    descripcion = models.TextField(
        max_length=1000
    )

    evidencia = models.ImageField(
        upload_to="reportes/evidencias/",
        blank=True,
        null=True
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadosReporte.choices,
        default=EstadosReporte.PENDIENTE
    )

    respuesta_administrador = models.TextField(
        max_length=1000,
        blank=True
    )

    atendido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reportes_atendidos",
        blank=True,
        null=True
    )

    fecha_reporte = models.DateTimeField(
        auto_now_add=True
    )

    fecha_resolucion = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = "Reporte"
        verbose_name_plural = "Reportes"
        ordering = [
            "-fecha_reporte"
        ]
        indexes = [
            models.Index(
                fields=["estado", "fecha_reporte"],
                name="idx_reporte_estado_fecha"
            )
        ]
        constraints = [
            models.CheckConstraint(
                condition=~Q(
                    reportado_por=F("usuario_reportado")
                ),
                name="reporte_no_autoreporte"
            )
        ]

    def __str__(self):
        return (
            f"Reporte contra {self.usuario_reportado.nombre} "
            f"- {self.get_estado_display()}"
        )


# =========================================================
# ALERTA DE EMERGENCIA
# =========================================================

class AlertaEmergencia(models.Model):

    class TiposAlerta(models.TextChoices):
        PANICO = "panico", "Botón de pánico"
        ACCIDENTE = "accidente", "Accidente"
        MEDICA = "medica", "Emergencia médica"
        SEGURIDAD = "seguridad", "Problema de seguridad"
        OTRO = "otro", "Otra emergencia"

    class EstadosAlerta(models.TextChoices):
        ACTIVA = "activa", "Activa"
        EN_ATENCION = "en_atencion", "En atención"
        RESUELTA = "resuelta", "Resuelta"
        FALSA_ALARMA = "falsa_alarma", "Falsa alarma"

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.SET_NULL,
        related_name="alertas_emergencia",
        blank=True,
        null=True
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="alertas_emergencia"
    )

    tipo = models.CharField(
        max_length=30,
        choices=TiposAlerta.choices,
        default=TiposAlerta.PANICO
    )

    descripcion = models.TextField(
        max_length=500,
        blank=True
    )

    latitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    longitud = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        blank=True,
        null=True
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadosAlerta.choices,
        default=EstadosAlerta.ACTIVA
    )

    atendida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="alertas_atendidas",
        blank=True,
        null=True
    )

    fecha_activacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_atencion = models.DateTimeField(
        blank=True,
        null=True
    )

    fecha_resolucion = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        verbose_name = "Alerta de emergencia"
        verbose_name_plural = "Alertas de emergencia"
        ordering = [
            "-fecha_activacion"
        ]
        indexes = [
            models.Index(
                fields=["estado", "fecha_activacion"],
                name="idx_alerta_estado_fecha"
            )
        ]

    def __str__(self):
        return (
            f"{self.get_tipo_display()} - "
            f"{self.usuario.nombre}"
        )


# =========================================================
# GASTO DEL VIAJE
# =========================================================

class GastoViaje(models.Model):

    class TiposGasto(models.TextChoices):
        GASOLINA = "gasolina", "Gasolina"
        ESTACIONAMIENTO = "estacionamiento", "Estacionamiento"
        CASETA = "caseta", "Caseta"
        MANTENIMIENTO = "mantenimiento", "Mantenimiento"
        OTRO = "otro", "Otro"

    viaje = models.ForeignKey(
        Viaje,
        on_delete=models.CASCADE,
        related_name="gastos"
    )

    conductor = models.ForeignKey(
        PerfilConductor,
        on_delete=models.CASCADE,
        related_name="gastos"
    )

    tipo = models.CharField(
        max_length=30,
        choices=TiposGasto.choices
    )

    concepto = models.CharField(
        max_length=200
    )

    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01"))
        ]
    )

    comprobante = models.ImageField(
        upload_to="viajes/gastos/comprobantes/",
        blank=True,
        null=True
    )

    fecha = models.DateTimeField(
        default=timezone.now
    )

    class Meta:
        verbose_name = "Gasto del viaje"
        verbose_name_plural = "Gastos de viajes"
        ordering = [
            "-fecha"
        ]

    def clean(self):
        super().clean()

        if (
            self.viaje_id
            and self.conductor_id
            and self.viaje.conductor_id != self.conductor_id
        ):
            raise ValidationError({
                "conductor": (
                    "El gasto debe pertenecer al conductor "
                    "responsable del viaje."
                )
            })

    def __str__(self):
        return f"{self.concepto}: ${self.monto}"