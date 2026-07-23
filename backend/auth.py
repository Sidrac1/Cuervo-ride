import secrets
import string
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Usuario

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _generar_password_temporal(longitud=10):
    alfabeto = string.ascii_letters + string.digits
    return "".join(secrets.choice(alfabeto) for _ in range(longitud))


@auth_bp.post("/registro")
def registro():
    """RF1: registro con correo institucional + datos básicos.
    RF4: el rol se define aquí o después en /usuarios/<id>/rol."""
    data = request.get_json(silent=True) or {}
    requeridos = ["nombre", "matricula", "carrera", "correo", "contrasena"]
    faltantes = [campo for campo in requeridos if not data.get(campo)]
    if faltantes:
        return jsonify({"error": "Campos faltantes", "campos": faltantes}), 400

    correo = data["correo"].strip().lower()
    if not correo.endswith("@utt.edu.mx"):
        return jsonify({"error": "Debe usarse el correo institucional de la UTT (@utt.edu.mx)"}), 400

    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "Ya existe un usuario registrado con ese correo"}), 409

    rol = data.get("rol")  # opcional en el registro (RF4 permite definirlo después)
    if rol and rol not in ("conductor", "pasajero", "admin"):
        return jsonify({"error": "Rol inválido. Usa 'conductor', 'pasajero' o 'admin'"}), 400

    usuario = Usuario(
        nombre=data["nombre"],
        matricula=data["matricula"],
        carrera=data["carrera"],
        correo=correo,
        telefono=data.get("telefono"),
        rol=rol,
    )
    usuario.set_password(data["contrasena"])

    db.session.add(usuario)
    db.session.commit()

    return jsonify({"mensaje": "Usuario registrado", "usuario": usuario.to_dict()}), 201


@auth_bp.post("/login")
def login():
    """RF2: inicio de sesión con verificación de credenciales."""
    data = request.get_json(silent=True) or {}
    correo = (data.get("correo") or "").strip().lower()
    contrasena = data.get("contrasena")

    if not correo or not contrasena:
        return jsonify({"error": "correo y contrasena son requeridos"}), 400

    usuario = Usuario.query.filter_by(correo=correo).first()
    if not usuario or not usuario.check_password(contrasena):
        return jsonify({"error": "Credenciales inválidas"}), 401

    if not usuario.activo:
        return jsonify({"error": "Esta cuenta ha sido bloqueada por un administrador"}), 403

    return jsonify({"mensaje": "Inicio de sesión exitoso", "usuario": usuario.to_dict()}), 200


@auth_bp.post("/recuperar-password")
def recuperar_password():
    """RF3: recuperación de contraseña mediante correo institucional.

    Nota: aquí se genera y guarda una contraseña temporal. El envío real del
    correo requiere configurar un proveedor SMTP (ver README) — se deja el
    punto de integración marcado abajo.
    """
    data = request.get_json(silent=True) or {}
    correo = (data.get("correo") or "").strip().lower()
    if not correo:
        return jsonify({"error": "correo es requerido"}), 400

    usuario = Usuario.query.filter_by(correo=correo).first()
    # Por seguridad respondemos 200 aunque el correo no exista (no revelar qué correos están registrados)
    if usuario:
        temporal = _generar_password_temporal()
        usuario.set_password(temporal)
        db.session.commit()
        # TODO: integrar proveedor de correo (SMTP / SendGrid / SES) y enviar `temporal`
        # enviar_correo(usuario.correo, "Recuperación de contraseña", temporal)

    return jsonify({"mensaje": "Si el correo está registrado, se enviaron instrucciones de recuperación"}), 200


@auth_bp.put("/usuarios/<int:usuario_id>/rol")
def actualizar_rol(usuario_id):
    """RF4: seleccionar/actualizar el rol (conductor o pasajero) desde el perfil."""
    data = request.get_json(silent=True) or {}
    rol = data.get("rol")
    if rol not in ("conductor", "pasajero"):
        return jsonify({"error": "Rol inválido. Usa 'conductor' o 'pasajero'"}), 400

    usuario = Usuario.query.get_or_404(usuario_id)
    usuario.rol = rol
    db.session.commit()
    return jsonify({"mensaje": "Rol actualizado", "usuario": usuario.to_dict()}), 200


@auth_bp.get("/usuarios/<int:usuario_id>")
def obtener_usuario(usuario_id):
    usuario = Usuario.query.get_or_404(usuario_id)
    return jsonify(usuario.to_dict()), 200
