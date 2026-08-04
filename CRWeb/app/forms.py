from decimal import Decimal

from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone

from .constants import (
    UTT_LATITUD,
    UTT_LONGITUD,
    UTT_NOMBRE,
)
from .models import Calificacion,Viaje, Vehiculo, SolicitudViaje


class PublicarViajeForm(forms.ModelForm):

    class Meta:
        model = Viaje

        fields = [
            "vehiculo",
            "origen",
            "destino",
            "origen_latitud",
            "origen_longitud",
            "destino_latitud",
            "destino_longitud",
            "fecha_hora_salida",
            "fecha_hora_llegada_estimada",
            "asientos_totales",
            "costo_por_pasajero",
            "indicaciones",
            "permite_mascota",
            "acepta_silla_ruedas",
        ]

        widgets = {

            "vehiculo": forms.Select(
                attrs={
                    "class": "form-control",
                    "id": "id_vehiculo",
                }
            ),

            "origen": forms.TextInput(
                attrs={
                    "class": "form-control location-input",
                    "id": "id_origen",
                    "placeholder": (
                        "Escribe o selecciona el punto de origen"
                    ),
                    "autocomplete": "off",
                }
            ),

            "destino": forms.TextInput(
                attrs={
                    "class": "form-control location-input",
                    "id": "id_destino",
                    "placeholder": (
                        "Escribe o selecciona el destino"
                    ),
                    "autocomplete": "off",
                }
            ),

            # Estos campos serán llenados por el mapa.
            "origen_latitud": forms.HiddenInput(
                attrs={
                    "id": "id_origen_latitud",
                }
            ),

            "origen_longitud": forms.HiddenInput(
                attrs={
                    "id": "id_origen_longitud",
                }
            ),

            "destino_latitud": forms.HiddenInput(
                attrs={
                    "id": "id_destino_latitud",
                }
            ),

            "destino_longitud": forms.HiddenInput(
                attrs={
                    "id": "id_destino_longitud",
                }
            ),

            "fecha_hora_salida": forms.DateTimeInput(
                attrs={
                    "class": "form-control",
                    "id": "id_fecha_hora_salida",
                    "type": "datetime-local",
                },
                format="%Y-%m-%dT%H:%M",
            ),

            "fecha_hora_llegada_estimada": forms.DateTimeInput(
                attrs={
                    "class": "form-control",
                    "id": "id_fecha_hora_llegada_estimada",
                    "type": "datetime-local",
                },
                format="%Y-%m-%dT%H:%M",
            ),

            "asientos_totales": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "id": "id_asientos_totales",
                    "min": "1",
                    "max": "20",
                    "placeholder": "Número de lugares disponibles",
                }
            ),

            "costo_por_pasajero": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "id": "id_costo_por_pasajero",
                    "min": "0",
                    "step": "0.01",
                    "placeholder": "0.00",
                }
            ),

            "indicaciones": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "id": "id_indicaciones",
                    "rows": "4",
                    "placeholder": (
                        "Agrega referencias, punto de encuentro "
                        "o indicaciones adicionales"
                    ),
                }
            ),

            "permite_mascota": forms.CheckboxInput(
                attrs={
                    "class": "form-check-input",
                    "id": "id_permite_mascota",
                }
            ),

            "acepta_silla_ruedas": forms.CheckboxInput(
                attrs={
                    "class": "form-check-input",
                    "id": "id_acepta_silla_ruedas",
                }
            ),
        }

        labels = {
            "vehiculo": "Vehículo para realizar el viaje",
            "origen": "Punto de origen",
            "destino": "Destino",
            "fecha_hora_salida": "Fecha y hora de salida",
            "fecha_hora_llegada_estimada": (
                "Fecha y hora estimada de llegada"
            ),
            "asientos_totales": "Lugares disponibles",
            "costo_por_pasajero": "Costo por pasajero",
            "indicaciones": "Indicaciones adicionales",
            "permite_mascota": "Permitir mascotas",
            "acepta_silla_ruedas": (
                "Aceptar pasajeros con silla de ruedas"
            ),
        }

    def __init__(self, *args, conductor=None, **kwargs):
        super().__init__(*args, **kwargs)

        self.conductor = conductor

        self.fields[
            "fecha_hora_salida"
        ].input_formats = [
            "%Y-%m-%dT%H:%M"
        ]

        self.fields[
            "fecha_hora_llegada_estimada"
        ].input_formats = [
            "%Y-%m-%dT%H:%M"
        ]

        # El origen SIEMPRE es la UTT -- ya no depende de lo que mande el
        # cliente. Se muestra fijo/no editable en el template, y aquí se
        # refuerza también server-side en clean() (ver abajo), por si
        # alguien manda otro valor directamente a la vista.
        self.fields["origen"].required = False
        self.fields["origen_latitud"].required = False
        self.fields["origen_longitud"].required = False
        self.initial["origen"] = UTT_NOMBRE
        self.initial["origen_latitud"] = UTT_LATITUD
        self.initial["origen_longitud"] = UTT_LONGITUD

        # El destino sí depende del mapa (ver mapa_publicar.js), que un
        # compañero está integrando por separado. Mientras esa integración
        # no esté lista, NO bloqueamos la publicación exigiendo
        # coordenadas de destino -- basta con el texto del destino.
        self.fields["destino_latitud"].required = False
        self.fields["destino_longitud"].required = False

        if conductor is not None:
            self.fields["vehiculo"].queryset = (
                Vehiculo.objects.filter(
                    conductor=conductor,
                    activo=True,
                    estado=Vehiculo.EstadosVehiculo.APROBADO,
                )
                .order_by("-fecha_registro")
            )
        else:
            self.fields["vehiculo"].queryset = (
                Vehiculo.objects.none()
            )

    def clean_fecha_hora_salida(self):
        fecha_salida = self.cleaned_data.get(
            "fecha_hora_salida"
        )

        if (
            fecha_salida
            and fecha_salida <= timezone.now()
        ):
            raise ValidationError(
                "La fecha y hora de salida deben ser futuras."
            )

        return fecha_salida

    def clean_asientos_totales(self):
        asientos = self.cleaned_data.get(
            "asientos_totales"
        )

        vehiculo = self.cleaned_data.get(
            "vehiculo"
        )

        if (
            vehiculo
            and asientos
            and asientos > vehiculo.capacidad
        ):
            raise ValidationError(
                "Los lugares ofrecidos no pueden superar "
                f"la capacidad del vehículo ({vehiculo.capacidad})."
            )

        return asientos

    def clean(self):
        cleaned_data = super().clean()

        # El origen SIEMPRE es la UTT, sin importar qué haya llegado en el
        # POST -- así que lo forzamos aquí, sea cual sea el valor enviado.
        cleaned_data["origen"] = UTT_NOMBRE
        cleaned_data["origen_latitud"] = Decimal(
            str(UTT_LATITUD)
        ).quantize(
            Decimal("0.0000001")
        )

        cleaned_data["origen_longitud"] = Decimal(
            str(UTT_LONGITUD)
        ).quantize(
            Decimal("0.0000001")
        )

        vehiculo = cleaned_data.get("vehiculo")
        fecha_salida = cleaned_data.get(
            "fecha_hora_salida"
        )
        fecha_llegada = cleaned_data.get(
            "fecha_hora_llegada_estimada"
        )

        if (
            vehiculo
            and self.conductor
            and vehiculo.conductor_id
            != self.conductor.id
        ):
            self.add_error(
                "vehiculo",
                (
                    "El vehículo seleccionado no pertenece "
                    "a tu perfil de conductor."
                ),
            )

        if (
            fecha_salida
            and fecha_llegada
            and fecha_llegada <= fecha_salida
        ):
            self.add_error(
                "fecha_hora_llegada_estimada",
                (
                    "La hora estimada de llegada debe ser "
                    "posterior a la salida."
                ),
            )

        # NOTA: ya no exigimos destino_latitud/destino_longitud aquí --
        # la integración del mapa para el destino está en curso por
        # separado. Cuando esté lista, se puede volver a añadir esa
        # validación si se quiere exigir un punto exacto en el mapa.

        return cleaned_data


# =========================================================
# SOLICITAR LUGAR EN UN VIAJE
# =========================================================

class SolicitudViajeForm(forms.ModelForm):

    class Meta:

        model = SolicitudViaje

        fields = [
            "asientos_solicitados",
            "punto_recogida",
            "punto_descenso",
            "comentario",
            "requiere_asistencia",
        ]

        widgets = {

            "asientos_solicitados": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "id": "id_asientos_solicitados",
                    "min": "1",
                    "max": "10",
                    "inputmode": "numeric",
                }
            ),

            "punto_recogida": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "id": "id_punto_recogida",
                    "placeholder": (
                        "Ejemplo: Entrada principal de la UTT"
                    ),
                    "maxlength": "255",
                    "autocomplete": "off",
                }
            ),

            "punto_descenso": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "id": "id_punto_descenso",
                    "placeholder": (
                        "Ejemplo: Plaza Río, entrada principal"
                    ),
                    "maxlength": "255",
                    "autocomplete": "off",
                }
            ),

            "comentario": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "id": "id_comentario",
                    "placeholder": (
                        "Agrega alguna indicación para el conductor"
                    ),
                    "maxlength": "500",
                    "rows": "4",
                }
            ),

            "requiere_asistencia": forms.CheckboxInput(
                attrs={
                    "class": "form-check-input",
                    "id": "id_requiere_asistencia",
                }
            ),
        }

        labels = {
            "asientos_solicitados": "Cantidad de lugares",
            "punto_recogida": "Punto de recogida",
            "punto_descenso": "Punto de descenso",
            "comentario": "Comentario para el conductor",
            "requiere_asistencia": (
                "Requiero asistencia especial"
            ),
        }

    def __init__(
        self,
        *args,
        viaje=None,
        **kwargs
    ):

        super().__init__(
            *args,
            **kwargs
        )

        self.viaje = viaje

        self.fields[
            "asientos_solicitados"
        ].initial = 1

        if viaje is not None:

            limite = min(
                viaje.asientos_disponibles,
                10,
            )

            self.fields[
                "asientos_solicitados"
            ].widget.attrs["max"] = str(
                limite
            )

            self.fields[
                "asientos_solicitados"
            ].help_text = (
                f"Actualmente hay "
                f"{viaje.asientos_disponibles} "
                f"lugar(es) disponible(s)."
            )

    def clean_asientos_solicitados(self):

        asientos = self.cleaned_data.get(
            "asientos_solicitados"
        )

        if asientos is None:
            return asientos

        if self.viaje is None:
            return asientos

        if asientos > self.viaje.asientos_disponibles:

            raise ValidationError(
                "No puedes solicitar más lugares "
                "de los que están disponibles."
            )

        return asientos

class CalificarConductorForm(forms.ModelForm):

    class Meta:

        model = Calificacion

        fields = [
            "puntuacion",
            "comentario",
        ]

        widgets = {

            "puntuacion": forms.HiddenInput(
                attrs={
                    "id": "id_puntuacion",
                }
            ),

            "comentario": forms.Textarea(
                attrs={
                    "id": "id_comentario",
                    "class": "calificacion-comentario",
                    "rows": 5,
                    "maxlength": 500,
                    "placeholder": (
                        "Cuéntanos cómo fue tu experiencia "
                        "con el conductor (opcional)."
                    ),
                }
            ),

        }

        labels = {
            "puntuacion": "Puntuación",
            "comentario": "Comentario opcional",
        }

    def clean_puntuacion(self):

        puntuacion = self.cleaned_data.get(
            "puntuacion"
        )

        if puntuacion is None:

            raise ValidationError(
                "Selecciona una puntuación de 1 a 5 estrellas."
            )

        if puntuacion < 1 or puntuacion > 5:

            raise ValidationError(
                "La puntuación debe estar entre 1 y 5 estrellas."
            )

        return puntuacion

class CalificarPasajeroForm(forms.ModelForm):

    class Meta:

        model = Calificacion

        fields = [
            "puntuacion",
            "comentario",
        ]

        widgets = {

            "puntuacion": forms.HiddenInput(
                attrs={
                    "id": "id_puntuacion",
                }
            ),

            "comentario": forms.Textarea(
                attrs={
                    "id": "id_comentario",
                    "class": "calificacion-comentario",
                    "rows": 5,
                    "maxlength": 500,
                    "placeholder": (
                        "Describe tu experiencia con este pasajero "
                        "(opcional)."
                    ),
                }
            ),
        }

    def clean_puntuacion(self):

        puntuacion = self.cleaned_data.get(
            "puntuacion"
        )

        if puntuacion is None:

            raise ValidationError(
                "Selecciona una puntuación de 1 a 5 estrellas."
            )

        if puntuacion < 1 or puntuacion > 5:

            raise ValidationError(
                "La puntuación debe estar entre 1 y 5 estrellas."
            )

        return puntuacion