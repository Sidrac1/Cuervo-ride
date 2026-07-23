-- ============================================================
-- Ajustes necesarios sobre tables.sql para que la API funcione
-- Ejecutar DESPUÉS de tables.sql
-- ============================================================
USE cuervoride;

-- 1) La columna original (VARCHAR(16)) no alcanza para un hash seguro
--    (werkzeug/bcrypt generan cadenas de 90+ caracteres).
ALTER TABLE usuarios MODIFY COLUMN contrasena VARCHAR(255);

-- 2) Bandera para RF24 (admin bloquea/elimina usuarios sin borrar el registro)
ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT TRUE;

-- 3) Bandera de lectura para notificaciones (mejora de UX, no rompe nada existente)
ALTER TABLE notificacion ADD COLUMN leida BOOLEAN DEFAULT FALSE;

-- 4) RF14 pide "coordenadas geográficas" para calcular distancia,
--    pero ubicaciones solo guarda texto (colonia/referencia).
ALTER TABLE ubicaciones ADD COLUMN latitud DECIMAL(10, 7);
ALTER TABLE ubicaciones ADD COLUMN longitud DECIMAL(10, 7);

-- 5) viaje necesita saber qué conductor lo publicó (RF6/RF7/RF11)
--    y cuántos lugares quedan disponibles (RF12) sin recalcular siempre
--    contando detalle_viaje.
ALTER TABLE viaje ADD COLUMN id_conductor INT NULL;
ALTER TABLE viaje ADD CONSTRAINT fk_viaje_conductor
    FOREIGN KEY (id_conductor) REFERENCES conductor(id) ON DELETE SET NULL;
ALTER TABLE viaje ADD COLUMN cupo_disponible INT DEFAULT 0;
