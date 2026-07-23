CREATE DATABASE IF NOT EXISTS cuervoride;
USE cuervoride;

CREATE TABLE IF NOT EXISTS usuarios(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    matricula INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(100),
    correo VARCHAR(100),
    telefono VARCHAR(100),
    carrera VARCHAR(100),
    contrasena VARCHAR(16),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discapacidad(
    id INT PRIMARY KEY NOT NULL,
    tipo_apoyo VARCHAR(100),
    nombre_discapacidad VARCHAR(100) -- Corregido: Se agregó VARCHAR
);

CREATE TABLE IF NOT EXISTS vehiculo(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    modelo VARCHAR(255),
    detalles VARCHAR(255),
    marca VARCHAR(255),
    color VARCHAR(255),
    matricula VARCHAR(255),
    estado VARCHAR(255),
    capacidad_pasajeros INT
);

CREATE TABLE IF NOT EXISTS notificacion(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    id_usuario INT,
    descripcion VARCHAR(255),
    tipo VARCHAR(100),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contacto_emergencia(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    id_usuario INT,
    nombre VARCHAR(255),
    telefono VARCHAR(25),
    relacion VARCHAR(100),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE -- Agregado según MR
);

CREATE TABLE IF NOT EXISTS pasajero(
    id INT PRIMARY KEY NOT NULL,
    id_discapacidad INT,
    calificacion_pasajero INT,
    estatus_pasajero VARCHAR(100),
    requiere_asistencia VARCHAR(100),
    FOREIGN KEY (id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_discapacidad) REFERENCES discapacidad(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conductor(
    id INT PRIMARY KEY NOT NULL,
    id_vehiculo INT,
    calificacion_conductor INT,
    num_licencia INT,
    FOREIGN KEY (id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gastos_viajes( -- Nombre unificado con el MR
    id INT NOT NULL,
    id_conductor INT NOT NULL,
    gasto_semanal DOUBLE,
    PRIMARY KEY (id, id_conductor),
    FOREIGN KEY (id_conductor) REFERENCES conductor(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reporte(
    id INT PRIMARY KEY NOT NULL,
    id_usuario INT,
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP,
    descripcion VARCHAR(255),
    estado VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de viajes estructurada según las necesidades cruzadas del SRS y MR
CREATE TABLE IF NOT EXISTS viaje(
    id INT PRIMARY KEY NOT NULL,
    id_vehiculo INT,
    hora_inicio TIMESTAMP,
    hora_fin TIMESTAMP,
    lugar_inicio VARCHAR(255),
    lugar_fin VARCHAR(255),
    calificacion INT,
    estado VARCHAR(255),
    dias_semana VARCHAR(255),
    costo_sugerido DECIMAL(10,2), -- Agregado para cumplir con RF15 y RF16
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id) ON DELETE CASCADE
);

-- Ubicaciones ajustadas al MR (Un viaje puede tener múltiples ubicaciones/rutas)
CREATE TABLE IF NOT EXISTS ubicaciones(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    id_viaje INT,
    colonia VARCHAR(255),
    referencia VARCHAR(255),
    FOREIGN KEY (id_viaje) REFERENCES viaje(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detalle_viaje(
    id_viaje INT NOT NULL,
    id_usuario INT NOT NULL,
    calificacion_pasajero INT,
    calificacion_conductor INT,
    comentarios VARCHAR(255),
    tipo_solicitud VARCHAR(255),
    estatus_pasajero VARCHAR(255),
    aportacion_pasajero DECIMAL(10,2), -- Agregado para el control de gastos del SRS
    PRIMARY KEY (id_viaje, id_usuario), -- Clave primaria compuesta agregada
    FOREIGN KEY (id_viaje) REFERENCES viaje(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE -- FK agregada
);

-- Nombre y campos actualizados según el MR y el botón de emergencia (RF22)
CREATE TABLE IF NOT EXISTS alertas_emergencia(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    id_viaje INT,
    tipo_alerta VARCHAR(100),
    tiempo VARCHAR(100),
    ubicacion VARCHAR(255),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_viaje) REFERENCES viaje(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sala_chat(
    id INT PRIMARY KEY NOT NULL,
    id_viaje INT,
    FOREIGN KEY (id_viaje) REFERENCES viaje(id) ON DELETE CASCADE -- Corregido error de sintaxis y añadido FK
);

CREATE TABLE IF NOT EXISTS mensajes(
    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    id_emisor INT,
    sala_chat_id INT,
    contenido VARCHAR(255),
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_chat_id) REFERENCES sala_chat(id) ON DELETE CASCADE,
    FOREIGN KEY (id_emisor) REFERENCES usuarios(id) ON DELETE CASCADE
);