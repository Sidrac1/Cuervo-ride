from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Viaje, Vehiculo


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

        # Las coordenadas son obligatorias para publicar
        # aunque en el modelo sean opcionales.
        self.fields["origen_latitud"].required = True
        self.fields["origen_longitud"].required = True
        self.fields["destino_latitud"].required = True
        self.fields["destino_longitud"].required = True

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

        vehiculo = cleaned_data.get("vehiculo")
        fecha_salida = cleaned_data.get(
            "fecha_hora_salida"
        )
        fecha_llegada = cleaned_data.get(
            "fecha_hora_llegada_estimada"
        )

        origen_latitud = cleaned_data.get(
            "origen_latitud"
        )
        origen_longitud = cleaned_data.get(
            "origen_longitud"
        )
        destino_latitud = cleaned_data.get(
            "destino_latitud"
        )
        destino_longitud = cleaned_data.get(
            "destino_longitud"
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

        coordenadas_completas = all([
            origen_latitud is not None,
            origen_longitud is not None,
            destino_latitud is not None,
            destino_longitud is not None,
        ])

        if not coordenadas_completas:
            raise ValidationError(
                "Debes seleccionar un origen y un destino "
                "válidos en el mapa."
            )

        return cleaned_data
