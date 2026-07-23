from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    matricula = db.Column(db.Integer, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    rol = db.Column(db.String(100))  # 'conductor' | 'pasajero' | 'admin'
    correo = db.Column(db.String(100), unique=True)
    telefono = db.Column(db.String(100))
    carrera = db.Column(db.String(100))
    contrasena = db.Column(db.String(255))  # requiere ampliar columna, ver README
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)  # soporta RF24 (bloquear usuario)

    pasajero = db.relationship("Pasajero", backref="usuario", uselist=False, cascade="all, delete-orphan")
    conductor = db.relationship("Conductor", backref="usuario", uselist=False, cascade="all, delete-orphan")

    def set_password(self, raw_password):
        self.contrasena = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.contrasena, raw_password)

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "matricula": self.matricula,
            "nombre": self.nombre,
            "rol": self.rol,
            "correo": self.correo,
            "telefono": self.telefono,
            "carrera": self.carrera,
            "fecha_registro": self.fecha_registro.isoformat() if self.fecha_registro else None,
            "activo": self.activo,
        }
        return data


class Discapacidad(db.Model):
    __tablename__ = "discapacidad"

    id = db.Column(db.Integer, primary_key=True)
    tipo_apoyo = db.Column(db.String(100))
    nombre_discapacidad = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "tipo_apoyo": self.tipo_apoyo,
            "nombre_discapacidad": self.nombre_discapacidad,
        }


class Vehiculo(db.Model):
    __tablename__ = "vehiculo"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    modelo = db.Column(db.String(255))
    detalles = db.Column(db.String(255))
    marca = db.Column(db.String(255))
    color = db.Column(db.String(255))
    matricula = db.Column(db.String(255))  # placas
    estado = db.Column(db.String(255))
    capacidad_pasajeros = db.Column(db.Integer)

    def to_dict(self):
        return {
            "id": self.id,
            "modelo": self.modelo,
            "detalles": self.detalles,
            "marca": self.marca,
            "color": self.color,
            "placas": self.matricula,
            "estado": self.estado,
            "capacidad_pasajeros": self.capacidad_pasajeros,
        }


class Notificacion(db.Model):
    __tablename__ = "notificacion"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"))
    descripcion = db.Column(db.String(255))
    tipo = db.Column(db.String(100))
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    leida = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "id_usuario": self.id_usuario,
            "descripcion": self.descripcion,
            "tipo": self.tipo,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "leida": self.leida,
        }


class ContactoEmergencia(db.Model):
    __tablename__ = "contacto_emergencia"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"))
    nombre = db.Column(db.String(255))
    telefono = db.Column(db.String(25))
    relacion = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "id_usuario": self.id_usuario,
            "nombre": self.nombre,
            "telefono": self.telefono,
            "relacion": self.relacion,
        }


class Pasajero(db.Model):
    __tablename__ = "pasajero"

    id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    id_discapacidad = db.Column(db.Integer, db.ForeignKey("discapacidad.id", ondelete="CASCADE"))
    calificacion_pasajero = db.Column(db.Integer)
    estatus_pasajero = db.Column(db.String(100))  # 'recurrente' | 'esporadico'
    requiere_asistencia = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "id_discapacidad": self.id_discapacidad,
            "calificacion_pasajero": self.calificacion_pasajero,
            "estatus_pasajero": self.estatus_pasajero,
            "requiere_asistencia": self.requiere_asistencia,
        }


class Conductor(db.Model):
    __tablename__ = "conductor"

    id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    id_vehiculo = db.Column(db.Integer, db.ForeignKey("vehiculo.id", ondelete="CASCADE"))
    calificacion_conductor = db.Column(db.Integer)
    num_licencia = db.Column(db.Integer)

    vehiculo = db.relationship("Vehiculo", backref="conductores")

    def to_dict(self):
        return {
            "id": self.id,
            "id_vehiculo": self.id_vehiculo,
            "calificacion_conductor": self.calificacion_conductor,
            "num_licencia": self.num_licencia,
        }


class GastosViaje(db.Model):
    __tablename__ = "gastos_viajes"

    id = db.Column(db.Integer, primary_key=True)
    id_conductor = db.Column(db.Integer, db.ForeignKey("conductor.id", ondelete="CASCADE"), primary_key=True)
    gasto_semanal = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "id_conductor": self.id_conductor,
            "gasto_semanal": self.gasto_semanal,
        }


class Reporte(db.Model):
    __tablename__ = "reporte"

    id = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"))
    fecha_reporte = db.Column(db.DateTime, default=datetime.utcnow)
    descripcion = db.Column(db.String(255))
    estado = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "id_usuario": self.id_usuario,
            "fecha_reporte": self.fecha_reporte.isoformat() if self.fecha_reporte else None,
            "descripcion": self.descripcion,
            "estado": self.estado,
        }


class Viaje(db.Model):
    __tablename__ = "viaje"

    id = db.Column(db.Integer, primary_key=True)
    id_vehiculo = db.Column(db.Integer, db.ForeignKey("vehiculo.id", ondelete="CASCADE"))
    hora_inicio = db.Column(db.DateTime)
    hora_fin = db.Column(db.DateTime)
    lugar_inicio = db.Column(db.String(255))
    lugar_fin = db.Column(db.String(255))
    calificacion = db.Column(db.Integer)
    estado = db.Column(db.String(255), default="activo")  # activo | en curso | finalizado | cancelado
    dias_semana = db.Column(db.String(255))
    costo_sugerido = db.Column(db.Numeric(10, 2))

    # Campos auxiliares no persistidos en tabla original, usados en memoria por rutas
    id_conductor = db.Column(db.Integer, db.ForeignKey("conductor.id", ondelete="SET NULL"), nullable=True)
    cupo_disponible = db.Column(db.Integer, default=0)

    vehiculo = db.relationship("Vehiculo", backref="viajes")

    def to_dict(self):
        return {
            "id": self.id,
            "id_vehiculo": self.id_vehiculo,
            "id_conductor": self.id_conductor,
            "hora_inicio": self.hora_inicio.isoformat() if self.hora_inicio else None,
            "hora_fin": self.hora_fin.isoformat() if self.hora_fin else None,
            "lugar_inicio": self.lugar_inicio,
            "lugar_fin": self.lugar_fin,
            "calificacion": self.calificacion,
            "estado": self.estado,
            "dias_semana": self.dias_semana,
            "costo_sugerido": float(self.costo_sugerido) if self.costo_sugerido is not None else None,
            "cupo_disponible": self.cupo_disponible,
        }


class Ubicacion(db.Model):
    __tablename__ = "ubicaciones"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_viaje = db.Column(db.Integer, db.ForeignKey("viaje.id", ondelete="CASCADE"))
    colonia = db.Column(db.String(255))
    referencia = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "id_viaje": self.id_viaje,
            "colonia": self.colonia,
            "referencia": self.referencia,
        }


class DetalleViaje(db.Model):
    """Representa la solicitud/participación de un usuario en un viaje (RF9-RF12, RF20-RF21)."""

    __tablename__ = "detalle_viaje"

    id_viaje = db.Column(db.Integer, db.ForeignKey("viaje.id", ondelete="CASCADE"), primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    calificacion_pasajero = db.Column(db.Integer)
    calificacion_conductor = db.Column(db.Integer)
    comentarios = db.Column(db.String(255))
    tipo_solicitud = db.Column(db.String(255))  # 'fija' | 'unica'
    estatus_pasajero = db.Column(db.String(255))  # 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado'
    aportacion_pasajero = db.Column(db.Numeric(10, 2))

    def to_dict(self):
        return {
            "id_viaje": self.id_viaje,
            "id_usuario": self.id_usuario,
            "calificacion_pasajero": self.calificacion_pasajero,
            "calificacion_conductor": self.calificacion_conductor,
            "comentarios": self.comentarios,
            "tipo_solicitud": self.tipo_solicitud,
            "estatus_pasajero": self.estatus_pasajero,
            "aportacion_pasajero": float(self.aportacion_pasajero) if self.aportacion_pasajero is not None else None,
        }


class AlertaEmergencia(db.Model):
    __tablename__ = "alertas_emergencia"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_viaje = db.Column(db.Integer, db.ForeignKey("viaje.id", ondelete="CASCADE"))
    tipo_alerta = db.Column(db.String(100))
    tiempo = db.Column(db.String(100))
    ubicacion = db.Column(db.String(255))
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "id_viaje": self.id_viaje,
            "tipo_alerta": self.tipo_alerta,
            "tiempo": self.tiempo,
            "ubicacion": self.ubicacion,
            "fecha": self.fecha.isoformat() if self.fecha else None,
        }


class SalaChat(db.Model):
    __tablename__ = "sala_chat"

    id = db.Column(db.Integer, primary_key=True)
    id_viaje = db.Column(db.Integer, db.ForeignKey("viaje.id", ondelete="CASCADE"))

    def to_dict(self):
        return {"id": self.id, "id_viaje": self.id_viaje}


class Mensaje(db.Model):
    __tablename__ = "mensajes"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_emisor = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"))
    sala_chat_id = db.Column(db.Integer, db.ForeignKey("sala_chat.id", ondelete="CASCADE"))
    contenido = db.Column(db.String(255))
    fecha_hora = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "id_emisor": self.id_emisor,
            "sala_chat_id": self.sala_chat_id,
            "contenido": self.contenido,
            "fecha_hora": self.fecha_hora.isoformat() if self.fecha_hora else None,
        }
