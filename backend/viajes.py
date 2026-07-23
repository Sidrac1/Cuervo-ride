from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models import Viaje, Vehiculo, Conductor, Ubicacion, DetalleViaje, Pasajero
from app.utils import haversine_km, costo_sugerido

viajes_bp = Blueprint("viajes", __name__, url_prefix="/api/viajes")

ESTADOS_VALIDOS = {"activo", "en curso", "finalizado", "cancelado"}


@viajes_bp.post("")
def publicar_viaje():
    """RF6: el conductor publica un ride (origen UTT, destino, horario, cupo, ruta).
    RF14/RF15/RF16: si se envían coordenadas, se calcula distancia y costo sugerido."""
    data = request.get_json(silent=True) or {}
    requeridos = ["id_conductor", "lugar_fin", "hora_inicio", "cupo_disponible"]
    faltantes = [c for c in requeridos if not data.get(c)]
    if faltantes:
        return jsonify({"error": "Campos faltantes", "campos": faltantes}), 400

    conductor = Conductor.query.get(data["id_conductor"])
    if not conductor:
        return jsonify({"error": "Conductor no encontrado (registra primero su vehículo)"}), 404

    try:
        hora_inicio = datetime.fromisoformat(data["hora_inicio"])
    except ValueError:
        return jsonify({"error": "hora_inicio debe tener formato ISO 8601, ej. 2026-07-23T21:15:00"}), 400

    costo = None
    distancia_km = None
    coords = data.get("coordenadas")  # opcional: {"lat_origen":.., "lon_origen":.., "lat_destino":.., "lon_destino":..}
    if coords:
        try:
            distancia_km = haversine_km(
                coords["lat_origen"], coords["lon_origen"],
                coords["lat_destino"], coords["lon_destino"],
            )
            costo = costo_sugerido(distancia_km, current_app.config["TARIFA_BASE"], current_app.config["COSTO_POR_KM"])
        except (KeyError, TypeError):
            return jsonify({"error": "coordenadas incompletas: se requieren lat_origen, lon_origen, lat_destino, lon_destino"}), 400

    viaje = Viaje(
        id_vehiculo=conductor.id_vehiculo,
        id_conductor=conductor.id,
        lugar_inicio=data.get("lugar_inicio", "UTT"),
        lugar_fin=data["lugar_fin"],
        hora_inicio=hora_inicio,
        dias_semana=data.get("dias_semana"),
        estado="activo",
        cupo_disponible=data["cupo_disponible"],
        costo_sugerido=costo,
    )
    db.session.add(viaje)
    db.session.flush()

    ruta = data.get("ruta", [])  # lista opcional de puntos [{colonia, referencia}, ...]
    for punto in ruta:
        db.session.add(Ubicacion(id_viaje=viaje.id, colonia=punto.get("colonia"), referencia=punto.get("referencia")))

    db.session.commit()

    respuesta = viaje.to_dict()
    if distancia_km is not None:
        respuesta["distancia_km"] = distancia_km
    return jsonify({"mensaje": "Ride publicado", "viaje": respuesta}), 201


@viajes_bp.put("/<int:viaje_id>")
def modificar_viaje(viaje_id):
    """RF7: el conductor modifica un ride antes de su inicio."""
    viaje = Viaje.query.get_or_404(viaje_id)
    if viaje.estado not in ("activo",):
        return jsonify({"error": f"No se puede modificar un ride en estado '{viaje.estado}'"}), 409

    data = request.get_json(silent=True) or {}
    for campo in ("lugar_fin", "lugar_inicio", "dias_semana", "cupo_disponible"):
        if campo in data:
            setattr(viaje, campo, data[campo])
    if "hora_inicio" in data:
        try:
            viaje.hora_inicio = datetime.fromisoformat(data["hora_inicio"])
        except ValueError:
            return jsonify({"error": "hora_inicio debe tener formato ISO 8601"}), 400

    db.session.commit()
    return jsonify({"mensaje": "Ride actualizado", "viaje": viaje.to_dict()}), 200


@viajes_bp.delete("/<int:viaje_id>")
def cancelar_viaje(viaje_id):
    """RF7: el conductor cancela un ride antes de su inicio."""
    viaje = Viaje.query.get_or_404(viaje_id)
    if viaje.estado in ("finalizado", "cancelado"):
        return jsonify({"error": f"El ride ya está '{viaje.estado}'"}), 409

    viaje.estado = "cancelado"
    db.session.commit()
    return jsonify({"mensaje": "Ride cancelado", "viaje": viaje.to_dict()}), 200


@viajes_bp.get("")
def listar_viajes():
    """RF8: el pasajero visualiza los rides disponibles (ruta, horario, conductor)."""
    query = Viaje.query.filter(Viaje.estado == "activo").filter(Viaje.cupo_disponible > 0)

    destino = request.args.get("destino")
    if destino:
        query = query.filter(Viaje.lugar_fin.ilike(f"%{destino}%"))

    requiere_adaptado = request.args.get("requiere_adaptado")
    if requiere_adaptado and requiere_adaptado.lower() == "true":
        query = query.join(Vehiculo, Viaje.id_vehiculo == Vehiculo.id).filter(
            Vehiculo.detalles.ilike("%adaptado%")
        )

    viajes = query.order_by(Viaje.hora_inicio.asc()).all()

    resultado = []
    for v in viajes:
        item = v.to_dict()
        item["vehiculo"] = v.vehiculo.to_dict() if v.vehiculo else None
        resultado.append(item)

    return jsonify(resultado), 200


@viajes_bp.get("/<int:viaje_id>")
def obtener_viaje(viaje_id):
    viaje = Viaje.query.get_or_404(viaje_id)
    item = viaje.to_dict()
    item["vehiculo"] = viaje.vehiculo.to_dict() if viaje.vehiculo else None
    item["ruta"] = [u.to_dict() for u in Ubicacion.query.filter_by(id_viaje=viaje_id).all()]
    return jsonify(item), 200


@viajes_bp.patch("/<int:viaje_id>/estado")
def actualizar_estado_viaje(viaje_id):
    """RF19: marcar el ride como 'activo', 'en curso' o 'finalizado'."""
    viaje = Viaje.query.get_or_404(viaje_id)
    data = request.get_json(silent=True) or {}
    nuevo_estado = data.get("estado")
    if nuevo_estado not in ESTADOS_VALIDOS:
        return jsonify({"error": f"estado inválido, usa uno de {sorted(ESTADOS_VALIDOS)}"}), 400

    viaje.estado = nuevo_estado
    if nuevo_estado == "finalizado":
        viaje.hora_fin = datetime.utcnow()
    db.session.commit()
    return jsonify({"mensaje": "Estado actualizado", "viaje": viaje.to_dict()}), 200


@viajes_bp.get("/<int:viaje_id>/ubicacion")
def seguimiento_viaje(viaje_id):
    """RF17: seguimiento en tiempo real.

    Nota: la posición en vivo del conductor no se persiste en el esquema actual
    (viaje/ubicaciones son estáticos). Este endpoint es el punto de integración
    para un feed en tiempo real (ej. WebSocket o Server-Sent Events) que reciba
    la posición del conductor desde su app y la retransmita al pasajero.
    """
    viaje = Viaje.query.get_or_404(viaje_id)
    return jsonify({
        "mensaje": "Endpoint de referencia para tracking en tiempo real",
        "viaje_id": viaje.id,
        "estado": viaje.estado,
        "sugerencia": "Integrar WebSocket (Flask-SocketIO) para push de coordenadas en vivo",
    }), 200
