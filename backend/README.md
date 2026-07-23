# Cuervo-Ride API (Flask)

Backend REST para el sistema de gestión de transporte nocturno de la UTT,
construido sobre el esquema de `tables.sql`.

## 1. Instalación

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # y edita tus credenciales de MySQL
```

## 2. Base de datos

```bash
mysql -u root -p < tables.sql
mysql -u root -p < migrations.sql   # IMPORTANTE: ver sección 3
```

## 3. Cambios necesarios sobre el esquema original (`migrations.sql`)

El SRS pide funcionalidades que el esquema original no soportaba tal cual,
así que se agregaron los siguientes ajustes (ya incluidos en `migrations.sql`):

| Cambio | Motivo |
|---|---|
| `usuarios.contrasena` de `VARCHAR(16)` a `VARCHAR(255)` | Un hash seguro (werkzeug/bcrypt) no cabe en 16 caracteres. Con 16 solo podrías guardar texto plano, lo cual es inseguro. |
| `usuarios.activo BOOLEAN` | RF24 pide "bloquear" usuarios, no solo eliminarlos. |
| `notificacion.leida BOOLEAN` | Permite filtrar notificaciones no leídas (RF13). |
| `ubicaciones.latitud/longitud DECIMAL` | RF14 pide calcular distancia "utilizando coordenadas geográficas", pero la tabla original solo guardaba texto (`colonia`, `referencia`). |
| `viaje.id_conductor INT` (FK a `conductor`) | RF6/RF7/RF11 requieren saber qué conductor publicó y gestiona cada ride. |
| `viaje.cupo_disponible INT` | RF12 pide actualizar automáticamente los lugares disponibles al aceptar un pasajero. |

Si prefieres no alterar el esquema, dime y ajusto el código para prescindir
de estas columnas (con menor funcionalidad).

## 4. Ejecutar

```bash
python run.py
```

Health check: `GET http://localhost:5000/api/health`

## 5. Mapa de endpoints vs. Requerimientos Funcionales

| RF | Endpoint | Método |
|---|---|---|
| RF1 | `/api/auth/registro` | POST |
| RF2 | `/api/auth/login` | POST |
| RF3 | `/api/auth/recuperar-password` | POST |
| RF4 | `/api/auth/usuarios/<id>/rol` | PUT |
| RF5 | `/api/conductores/<usuario_id>/vehiculo` | POST |
| RF6 | `/api/viajes` | POST |
| RF7 | `/api/viajes/<id>` | PUT / DELETE |
| RF8 | `/api/viajes` | GET |
| RF9 | `/api/viajes/<id>/solicitudes` | POST |
| RF10 | `/api/viajes/<id>/solicitudes/<usuario_id>` | DELETE |
| RF11 | `/api/viajes/<id>/solicitudes/<usuario_id>` | PATCH |
| RF12 | (automático dentro de RF11/RF10, actualiza `cupo_disponible`) | — |
| RF13 | `/api/notificaciones/usuario/<id>` | GET |
| RF14/RF15 | cálculo interno al publicar el viaje (`coordenadas` en el body de RF6) | — |
| RF16 | el costo sugerido se devuelve en la respuesta de RF6/RF8 | — |
| RF17 | `/api/viajes/<id>/ubicacion` (endpoint de referencia, ver nota abajo) | GET |
| RF18 | responsabilidad del frontend (renderizar `ruta` con Google Maps/Leaflet) | — |
| RF19 | `/api/viajes/<id>/estado` | PATCH |
| RF20/RF21 | `/api/viajes/<id>/calificacion/<usuario_id>` | POST |
| RF22 | `/api/emergencia/viajes/<id>` | POST |
| RF23 | `/api/admin/usuarios` | GET |
| RF24 | `/api/admin/usuarios/<id>/bloquear` (PATCH), `/api/admin/usuarios/<id>` (DELETE) | — |
| RF25 | `/api/admin/reportes` | GET |

Extra (no listado como RF pero mencionado en Alcance/Funcionalidad):
- `PUT /api/pasajeros/<usuario_id>/perfil` — discapacidad motriz / filtro de vehículos adaptados.
- `POST /api/viajes/<id>/chat/mensajes`, `GET /api/viajes/<id>/chat/mensajes` — chat conductor-pasajero.
- `POST /api/admin/reportes` — crear un reporte (para que RF25 tenga datos que listar).

### Notas sobre RF17 (seguimiento en tiempo real) y RF18 (mapa)

Con REST puro no hay forma eficiente de "empujar" la ubicación en vivo del
conductor. El endpoint `GET /api/viajes/<id>/ubicacion` queda como punto de
referencia, pero para tracking real se recomienda añadir **Flask-SocketIO**
(o Server-Sent Events) en una siguiente iteración. RF18 (mostrar el mapa) es
tarea del frontend con Google Maps SDK / Leaflet, consumiendo la `ruta` que
ya devuelve `GET /api/viajes/<id>`.

## 6. Autenticación

Este proyecto usa hashing de contraseñas (`werkzeug.security`) pero **no**
incluye JWT/sesiones todavía — los endpoints de admin verifican el rol vía
`?admin_id=<id>` como ejemplo simple. Para producción, sustituir por
**Flask-JWT-Extended** y proteger todas las rutas sensibles con
`@jwt_required()`.

## 7. Estructura del proyecto

```
cuervoride_api/
├── app/
│   ├── __init__.py        # create_app()
│   ├── config.py
│   ├── extensions.py      # db, cors
│   ├── models.py          # todas las tablas de tables.sql
│   ├── utils.py           # haversine + cálculo de costo (RF14-16)
│   └── routes/
│       ├── auth.py            # RF1-4
│       ├── vehiculos.py       # RF5 + perfil pasajero
│       ├── viajes.py          # RF6-8, RF14-19
│       ├── solicitudes.py     # RF9-12
│       ├── notificaciones.py  # RF13
│       ├── calificaciones.py  # RF20-21
│       ├── emergencia.py      # RF22
│       ├── admin.py           # RF23-25
│       └── chat.py            # extra
├── tables.sql              # (tu archivo original)
├── migrations.sql          # ajustes necesarios
├── requirements.txt
├── .env.example
└── run.py
```
