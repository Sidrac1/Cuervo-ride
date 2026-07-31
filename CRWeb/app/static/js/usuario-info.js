/*=====================================
        USUARIO INFO
=====================================*/

function iniciarUsuarioInfo(usuarioIdParam = null) {
    console.log("Vista Información Usuario cargada");

    // OBTENER ID (Parámetro o sessionStorage)
    const usuarioId = usuarioIdParam || sessionStorage.getItem("usuarioId") || window.ADMIN_STATE?.usuarioId;

    if (!usuarioId) {
        alert("No se encontró información del usuario.");
        cargarVista("usuarios");
        return;
    }

    sessionStorage.setItem("usuarioId", usuarioId);

    // CONSULTAR INFORMACIÓN DE LA API
    fetch(`/api/admin/usuarios/${usuarioId}/`)
        .then((res) => res.json())
        .then((data) => {
            if (!data.ok) {
                alert(data.error || "No se pudo cargar la información del usuario.");
                cargarVista("usuarios");
                return;
            }
            pintarUsuario(data.usuario);
        })
        .catch((err) => {
            console.error("Error al cargar usuario:", err);
            alert("Error de conexión al cargar la información del usuario.");
        });

    // BOTÓN REGRESAR
    const btnVolver = document.getElementById("volver");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => cargarVista("usuarios"));
    }

    // MANEJO DE PESTAÑAS
    const btnGeneral = document.getElementById("btnGeneral");
    const btnMedico = document.getElementById("btnMedico");
    const btnVerificacion = document.getElementById("btnVerificacion");
    const panelGeneral = document.getElementById("panelGeneral");
    const panelVerificacion = document.getElementById("panelVerificacion");

    function mostrarPanel(panelActivo) {
        if (panelGeneral) panelGeneral.style.display = panelGeneral === panelActivo ? "block" : "none";
        if (panelVerificacion) panelVerificacion.style.display = panelVerificacion === panelActivo ? "block" : "none";

        if (btnGeneral) btnGeneral.classList.remove("active");
        if (btnVerificacion) btnVerificacion.classList.remove("active");
    }

    if (btnGeneral) {
        btnGeneral.addEventListener("click", () => {
            mostrarPanel(panelGeneral);
            btnGeneral.classList.add("active");
        });
    }

    if (btnVerificacion) {
        btnVerificacion.addEventListener("click", () => {
            mostrarPanel(panelVerificacion);
            btnVerificacion.classList.add("active");
        });
    }

    if (btnMedico) {
        btnMedico.addEventListener("click", () => cargarVista("expediente", usuarioId));
    }

    // GUARDAR INFORMACIÓN GENERAL
    const formGeneral = document.getElementById("formGeneral");
    if (formGeneral) {
        formGeneral.addEventListener("submit", function (e) {
            e.preventDefault();

            const payload = {
                nombre: document.getElementById("nombre")?.value || "",
                correo: document.getElementById("correo")?.value || "",
                matricula: document.getElementById("matricula")?.value || "",
                cuatrimestre: document.getElementById("cuatrimestre")?.value || "",
                carrera: document.getElementById("carrera")?.value || "",
                rol: document.getElementById("rol")?.value || "",
                estado: document.getElementById("estado")?.value || "",
                telefono: document.getElementById("telefono")?.value || "",
            };

            const passElem = document.getElementById("password");
            if (passElem && passElem.value.trim()) {
                payload.password = passElem.value;
            }

            fetch(`/api/admin/usuarios/${usuarioId}/actualizar/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": obtenerCSRFToken(),
                },
                body: JSON.stringify(payload),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.ok) {
                        alert("Información guardada correctamente.");
                        if (passElem) passElem.value = "";
                        iniciarUsuarioInfo(usuarioId);
                    } else {
                        alert(data.error || "No se pudo guardar la información.");
                    }
                })
                .catch((err) => {
                    console.error("Error al guardar:", err);
                    alert("Error de conexión al guardar los datos.");
                });
        });
    }

    // PINTAR DATOS DE USUARIO
    function pintarUsuario(usuario) {
        const foto = document.getElementById("fotoUsuario");
        if (foto) foto.src = usuario.foto || "/static/img/admin.png";

        if (document.getElementById("nombreTitulo")) document.getElementById("nombreTitulo").textContent = usuario.nombre || "Usuario";
        if (document.getElementById("nombre")) document.getElementById("nombre").value = usuario.nombre || "";
        if (document.getElementById("correo")) document.getElementById("correo").value = usuario.correo || "";
        if (document.getElementById("matricula")) document.getElementById("matricula").value = usuario.matricula || "";
        if (document.getElementById("cuatrimestre")) document.getElementById("cuatrimestre").value = usuario.cuatrimestre || "";
        if (document.getElementById("carrera")) document.getElementById("carrera").value = usuario.carrera || "";
        if (document.getElementById("rol")) document.getElementById("rol").value = (usuario.rol || "").toLowerCase();
        if (document.getElementById("estado")) document.getElementById("estado").value = usuario.estado || "activa";
        if (document.getElementById("password")) document.getElementById("password").value = "";
        if (document.getElementById("telefono")) document.getElementById("telefono").value = usuario.telefono || "";

        // Habilitar / Mostrar la pestaña de verificación siempre que aplique
        if (btnVerificacion) {
            btnVerificacion.style.display = "";
            pintarVerificacion(usuario);
        }
    }

    // PINTAR SECCIÓN DE VERIFICACIÓN (CONDUCTOR Y VEHÍCULO)
    function pintarVerificacion(usuario) {
        const conductor = usuario.conductor;
        const vehiculo = usuario.vehiculo;
        const contenedor = document.getElementById("verificacionContenido");

        if (!contenedor) return;

        if (!conductor || Object.keys(conductor).length === 0) {
            contenedor.innerHTML = "<p style='padding:20px; color:#666;'>Este usuario no tiene solicitud de licencia pendiente ni datos de conductor asociados.</p>";
            return;
        }

        const fotoFrontalHtml = conductor.foto_licencia_frontal
            ? `<a href="${conductor.foto_licencia_frontal}" target="_blank" class="btn-link">Ver foto frontal</a>`
            : "<span>Sin foto frontal</span>";

        const fotoReversoHtml = conductor.foto_licencia_reverso
            ? `<a href="${conductor.foto_licencia_reverso}" target="_blank" class="btn-link">Ver foto posterior</a>`
            : "<span>Sin foto posterior</span>";

        let vehiculoHtml = "<p style='margin-top:20px; color:#666;'>Este usuario todavía no ha registrado un vehículo.</p>";

        if (vehiculo && Object.keys(vehiculo).length > 0) {
            const fotoVehiculoHtml = vehiculo.foto
                ? `<a href="${vehiculo.foto}" target="_blank" class="btn-link">Ver foto vehículo</a>`
                : "<span>Sin foto</span>";

            const tarjetaCirculacionHtml = vehiculo.tarjeta_circulacion
                ? `<a href="${vehiculo.tarjeta_circulacion}" target="_blank" class="btn-link">Ver tarjeta de circulación</a>`
                : "<span>Sin tarjeta</span>";

            const seguroHtml = vehiculo.documento_seguro
                ? `<a href="${vehiculo.documento_seguro}" target="_blank" class="btn-link">Ver póliza de seguro</a>`
                : "<span>Sin seguro</span>";

            vehiculoHtml = `
                <div class="verificacion-bloque" style="margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px;">
                    <h3>Información del Vehículo</h3>
                    <p><strong>Marca/Modelo:</strong> ${vehiculo.marca || ""} ${vehiculo.modelo || ""} (${vehiculo.anio || ""})</p>
                    <p><strong>Placas:</strong> ${vehiculo.placas || "N/A"} | <strong>Color:</strong> ${vehiculo.color || "N/A"}</p>
                    <p><strong>Estado Vehículo:</strong> <span class="badge ${vehiculo.estado}">${vehiculo.estado_display || vehiculo.estado || "Pendiente"}</span></p>
                    ${vehiculo.motivo_rechazo ? `<p style="color:red;"><strong>Motivo rechazo:</strong> ${vehiculo.motivo_rechazo}</p>` : ""}

                    <div class="documentos-grid" style="margin: 10px 0;">
                        ${fotoVehiculoHtml} | ${tarjetaCirculacionHtml} | ${seguroHtml}
                    </div>

                    <div class="acciones-verificacion" style="margin-top: 10px;">
                        <button type="button" class="btn-aprobar" onclick="verificarVehiculo(${vehiculo.id}, 'aprobado')">Aprobar Vehículo</button>
                        <button type="button" class="btn-rechazar" onclick="verificarVehiculo(${vehiculo.id}, 'rechazado')">Rechazar Vehículo</button>
                    </div>
                </div>
            `;
        }

        contenedor.innerHTML = `
            <div class="verificacion-bloque">
                <h3>Licencia de Conducir</h3>
                <p><strong>Número de Licencia:</strong> ${conductor.numero_licencia || "No registrada"}</p>
                <p><strong>Vencimiento:</strong> ${conductor.fecha_vencimiento || "No registrada"}</p>
                <p><strong>Estado Licencia:</strong> <span class="badge ${conductor.estado_verificacion}">${conductor.estado_verificacion_display || conductor.estado_verificacion || "Pendiente"}</span></p>
                ${conductor.motivo_rechazo ? `<p style="color:red;"><strong>Motivo rechazo:</strong> ${conductor.motivo_rechazo}</p>` : ""}

                <div class="documentos-grid" style="margin: 10px 0;">
                    ${fotoFrontalHtml} | ${fotoReversoHtml}
                </div>

                <div class="acciones-verificacion" style="margin-top: 10px;">
                    <button type="button" class="btn-aprobar" onclick="verificarConductor(${usuario.id}, 'aprobado')">Aprobar Licencia</button>
                    <button type="button" class="btn-rechazar" onclick="verificarConductor(${usuario.id}, 'rechazado')">Rechazar Licencia</button>
                </div>
            </div>

            ${vehiculoHtml}
        `;
    }
}

// FUNCIONES GLOBALES PARA VERIFICAR VÍA API
async function verificarConductor(usuarioId, decision) {
    let motivo = "";
    if (decision === "rechazado") {
        motivo = prompt("Ingresa el motivo del rechazo:");
        if (!motivo) return;
    }

    try {
        const res = await fetch(`/api/admin/conductores/${usuarioId}/verificar/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": obtenerCSRFToken(),
            },
            body: JSON.stringify({ decision, motivo }),
        });
        const data = await res.json();
        if (data.ok) {
            alert(data.mensaje || "Conductor verificado correctamente.");
            iniciarUsuarioInfo(usuarioId);
        } else {
            alert("Error: " + (data.error || "No se pudo actualizar"));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión al verificar el conductor.");
    }
}

async function verificarVehiculo(vehiculoId, decision) {
    let motivo = "";
    if (decision === "rechazado") {
        motivo = prompt("Ingresa el motivo del rechazo del vehículo:");
        if (!motivo) return;
    }

    try {
        const res = await fetch(`/api/admin/vehiculos/${vehiculoId}/verificar/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": obtenerCSRFToken(),
            },
            body: JSON.stringify({ decision, motivo }),
        });
        const data = await res.json();
        if (data.ok) {
            alert(data.mensaje || "Vehículo verificado correctamente.");
            const usuarioId = sessionStorage.getItem("usuarioId");
            iniciarUsuarioInfo(usuarioId);
        } else {
            alert("Error: " + (data.error || "No se pudo actualizar"));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión al verificar el vehículo.");
    }
}

/* Función Auxiliar para Obtener la Cookie CSRF */
function obtenerCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === "csrftoken=") {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue;
}