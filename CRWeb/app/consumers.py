import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .models import (
    LecturaMensaje,
    Mensaje,
    SalaChat,
    SolicitudViaje,
    Viaje,
)


class ChatViajeConsumer(AsyncWebsocketConsumer):
    """
    Consumer WebSocket del chat asociado a un viaje.

    Permite conectarse únicamente a:

    - El conductor propietario del viaje.
    - Pasajeros con una solicitud aceptada.
    """

    async def connect(self):

        self.usuario = self.scope.get("user")

        self.viaje_id = self.scope[
            "url_route"
        ]["kwargs"]["viaje_id"]

        self.nombre_grupo = (
            f"chat_viaje_{self.viaje_id}"
        )

        # El usuario debe estar autenticado.
        if (
            not self.usuario
            or not self.usuario.is_authenticated
        ):
            await self.close(code=4401)
            return

        datos_acceso = await self.obtener_datos_acceso()

        if not datos_acceso["viaje_existe"]:
            await self.close(code=4404)
            return

        if not datos_acceso["tiene_acceso"]:
            await self.close(code=4403)
            return

        self.sala_id = datos_acceso["sala_id"]
        self.sala_activa = datos_acceso["sala_activa"]

        # La página puede mostrar el historial de una sala cerrada,
        # pero no necesita mantener una conexión WebSocket.
        if not self.sala_activa:
            await self.close(code=4409)
            return

        await self.channel_layer.group_add(
            self.nombre_grupo,
            self.channel_name,
        )

        await self.accept()

        await self.send_json({
            "tipo": "conexion",
            "mensaje": (
                "Conexión con el chat establecida."
            ),
            "viaje_id": int(self.viaje_id),
            "usuario_id": self.usuario.id,
            "sala_activa": True,
        })

    async def disconnect(self, close_code):

        if hasattr(self, "nombre_grupo"):

            await self.channel_layer.group_discard(
                self.nombre_grupo,
                self.channel_name,
            )

    async def receive(
        self,
        text_data=None,
        bytes_data=None,
    ):

        if not text_data:
            return

        try:
            datos = json.loads(text_data)

        except json.JSONDecodeError:

            await self.enviar_error(
                "Los datos enviados no son válidos."
            )

            return

        tipo_evento = datos.get(
            "tipo",
            "mensaje",
        )

        if tipo_evento == "ping":

            await self.send_json({
                "tipo": "pong",
            })

            return

        if tipo_evento != "mensaje":

            await self.enviar_error(
                "El tipo de evento no es válido."
            )

            return

        contenido = str(
            datos.get("contenido", "")
        ).strip()

        if not contenido:

            await self.enviar_error(
                "El mensaje no puede estar vacío."
            )

            return

        if len(contenido) > 1000:

            await self.enviar_error(
                "El mensaje no puede superar "
                "los 1000 caracteres."
            )

            return

        sala_activa = await self.comprobar_sala_activa()

        if not sala_activa:

            await self.send_json({
                "tipo": "sala_cerrada",
                "mensaje": (
                    "La sala ya no se encuentra activa."
                ),
            })

            await self.close(code=4409)

            return

        mensaje = await self.guardar_mensaje(
            contenido
        )

        if mensaje is None:

            await self.enviar_error(
                "No fue posible guardar el mensaje."
            )

            return

        await self.channel_layer.group_send(
            self.nombre_grupo,
            {
                "type": "mensaje_chat",
                "mensaje": mensaje,
            },
        )

    async def mensaje_chat(self, event):

        mensaje = event["mensaje"]

        es_propio = (
            mensaje["emisor_id"]
            == self.usuario.id
        )

        if not es_propio:

            await self.registrar_lectura(
                mensaje["id"]
            )

        datos_salida = dict(mensaje)

        datos_salida["tipo"] = "mensaje"
        datos_salida["es_propio"] = es_propio

        await self.send_json(
            datos_salida
        )

    async def sala_cerrada(self, event):

        self.sala_activa = False

        await self.send_json({
            "tipo": "sala_cerrada",
            "mensaje": event.get(
                "mensaje",
                (
                    "El chat fue cerrado porque "
                    "el viaje terminó."
                ),
            ),
        })

        await self.close(code=4409)

    async def enviar_error(self, mensaje):

        await self.send_json({
            "tipo": "error",
            "mensaje": mensaje,
        })

    async def send_json(self, datos):

        await self.send(
            text_data=json.dumps(
                datos,
                ensure_ascii=False,
            )
        )

    # =====================================================
    # BASE DE DATOS
    # =====================================================

    @database_sync_to_async
    def obtener_datos_acceso(self):

        try:

            viaje = (
                Viaje.objects
                .select_related(
                    "conductor__usuario",
                )
                .get(pk=self.viaje_id)
            )

        except Viaje.DoesNotExist:

            return {
                "viaje_existe": False,
                "tiene_acceso": False,
                "sala_id": None,
                "sala_activa": False,
            }

        es_conductor = (
            viaje.conductor.usuario_id
            == self.usuario.id
        )

        es_pasajero_aceptado = (
            SolicitudViaje.objects.filter(
                viaje=viaje,
                pasajero=self.usuario,
                estado=(
                    SolicitudViaje
                    .EstadosSolicitud
                    .ACEPTADA
                ),
            ).exists()
        )

        tiene_acceso = (
            es_conductor
            or es_pasajero_aceptado
        )

        if not tiene_acceso:

            return {
                "viaje_existe": True,
                "tiene_acceso": False,
                "sala_id": None,
                "sala_activa": False,
            }

        sala, _ = SalaChat.objects.get_or_create(
            viaje=viaje,
            defaults={
                "activa": True,
            },
        )

        return {
            "viaje_existe": True,
            "tiene_acceso": True,
            "sala_id": sala.id,
            "sala_activa": sala.activa,
        }

    @database_sync_to_async
    def comprobar_sala_activa(self):

        return SalaChat.objects.filter(
            pk=self.sala_id,
            activa=True,
        ).exists()

    @database_sync_to_async
    def guardar_mensaje(self, contenido):

        try:

            sala = SalaChat.objects.get(
                pk=self.sala_id,
                activa=True,
            )

            mensaje = Mensaje.objects.create(
                sala=sala,
                emisor=self.usuario,
                contenido=contenido,
            )

            return {
                "id": mensaje.id,
                "contenido": mensaje.contenido,
                "emisor_id": self.usuario.id,
                "emisor": self.usuario.nombre_completo,
                "foto": (
                    self.usuario.foto.url
                    if self.usuario.foto
                    else ""
                ),
                "fecha": (
                    timezone.localtime(
                        mensaje.fecha_envio
                    ).strftime("%H:%M")
                ),
            }

        except SalaChat.DoesNotExist:

            return None

    @database_sync_to_async
    def registrar_lectura(self, mensaje_id):

        LecturaMensaje.objects.get_or_create(
            mensaje_id=mensaje_id,
            usuario=self.usuario,
        )