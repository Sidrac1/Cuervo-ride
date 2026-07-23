from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Viaje, DetalleViaje, Usuario, Notificacion

solicitudes_bp = Blueprint("solicitudes", __name__, url_prefix="/api/viajes/<int:viaje_id>/solicitudes")


@solicitudes_bp.post("")
def solicitar_ride(viaje_id):
    """RF9: el pasajero solicita un ride confirmando la aportación voluntaria."""
    viaje = Viaje.query.get_or_404(viaje_id)
    if viaje.estado != "activo":
        return jsonify({"error": f"El ride no admite solicitudes (estado: {viaje.estado})"}), 409
    if viaje.cupo_disponible <= 0:
        return jsonify({"error": "No hay cupo disponible en este ride"}), 409

    data = request.get_json(silent=True) or {}
    id_usuario = data.get("id_usuario")
    if not id_usuario:
        return jsonify({"error": "id_usuario es requerido"}), 400

    usuario = Usuario.query.get_or_404(id_usuario)
    if usuario.rol != "pasajero":
        return jsonify({"error": "Solo usuarios con rol 'pasajero' pueden solicitar rides"}), 400

    existente = DetalleViaje.query.get((viaje_id, id_usuario))
    if existente and existente.estatus_pasajero in ("pendiente", "aceptado"):
        return jsonify({"error": "Ya existe una solicitud activa de este usuario para este ride"}), 409

    solicitud = DetalleViaje(
        id_viaje=viaje_id,
        id_usuario=id_usuario,
        tipo_solicitud=data.get("tipo_solicitud", "unica"),  # RF: rutas fijas vs. viajeros esporádicos
        estatus_pasajero="pendiente",
        aportacion_pasajero=data.get("aportacion_pasajero", viaje.costo_sugerido),
    )
    db.session.add(solicitud)

    if viaje.id_conductor:
        db.session.add(Notificacion(
            id_usuario=viaje.id_conductor,
            tipo="solicitud_ride",
            descripcion=f"Nueva solicitud de {usuario.nombre} para el ride #{viaje.id}",
        ))

    db.session.commit()
    return jsonify({"mensaje": "Solicitud enviada", "solicitud": solicitud.to_dict()}), 201


@solicitudes_bp.delete("/<int:usuario_id>")
def cancelar_solicitud(viaje_id, usuario_id):
    """RF10: el pasajero cancela su solicitud antes del inicio del viaje."""
    solicitud = DetalleViaje.query.get_or_404((viaje_id, usuario_id))
    viaje = Viaje.query.get_or_404(viaje_id)

    if viaje.estado not in ("activo",):
        return jsonify({"error": f"No se puede cancelar, el ride ya está '{viaje.estado}'"}), 409

    if solicitud.estatus_pasajero == "aceptado":
        viaje.cupo_disponible += 1  # RF12: liberar el lugar reservado

    solicitud.estatus_pasajero = "cancelado"
    db.session.commit()
    return jsonify({"mensaje": "Solicitud cancelada", "solicitud": solicitud.to_dict()}), 200


@solicitudes_bp.get("")
def listar_solicitudes(viaje_id):
    """Lista las solicitudes de un ride (usado por el conductor para revisar y decidir)."""
    Viaje.query.get_or_404(viaje_id)
    solicitudes = DetalleViaje.query.filter_by(id_viaje=viaje_id).all()
    return jsonify([s.to_dict() for s in solicitudes]), 200


@solicitudes_bp.patch("/<int:usuario_id>")
def resolver_solicitud(viaje_id, usuario_id):
    """RF11: el conductor acepta o rechaza una solicitud en tiempo real.
    RF12: al aceptar, se actualiza automáticamente el cupo disponible.
    RF13: se notifica al pasajero del resultado."""
    solicitud = DetalleViaje.query.get_or_404((viaje_id, usuario_id))
    viaje = Viaje.query.get_or_404(viaje_id)

    data = request.get_json(silent=True) or {}
    decision = data.get("decision")
    if decision not in ("aceptado", "rechazado"):
        return jsonify({"error": "decision debe ser 'aceptado' o 'rechazado'"}), 400

    if solicitud.estatus_pasajero != "pendiente":
        return jsonify({"error": f"La solicitud ya fue resuelta ('{solicitud.estatus_pasajero}')"}), 409

    if decision == "aceptado":
        if viaje.cupo_disponible <= 0:
            return jsonify({"error": "No hay cupo disponible para aceptar esta solicitud"}), 409
        viaje.cupo_disponible -= 1  # RF12

    solicitud.estatus_pasajero = decision

    db.session.add(Notificacion(
        id_usuario=usuario_id,
        tipo="respuesta_solicitud",
        descripcion=f"Tu solicitud para el ride #{viaje_id} fue {decision}",
    ))

    db.session.commit()
    return jsonify({
        "mensaje": f"Solicitud {decision}",
        "solicitud": solicitud.to_dict(),
        "cupo_disponible": viaje.cupo_disponible,
    }), 200
