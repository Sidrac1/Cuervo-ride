/*=====================================
        CUERVO RIDE - ADMIN PANEL
=====================================*/

document.addEventListener("DOMContentLoaded", () => {
    iniciarMenu();

    const logo = document.getElementById("btnInicio");
    if (logo) {
        logo.addEventListener("click", () => {
            cargarVista("inicio");
        });
    }

    // Comprobar si existe un hash en la URL para restaurar la vista al recargar (F5)
    const hashVista = window.location.hash.replace("#", "").trim();
    if (hashVista) {
        cargarVista(hashVista, true);
    } else {
        cargarVista("inicio");
    }
});

// Manejo del botón "Regresar" y "Adelante" del navegador
window.addEventListener("popstate", (event) => {
    const vista = event.state?.vista || window.location.hash.replace("#", "").trim() || "inicio";
    cargarVista(vista, true);
});


/*=====================================
        INICIAR MENÚ
=====================================*/

function iniciarMenu() {
    const botones = document.querySelectorAll(".menu-btn");

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const vista = boton.dataset.view;
            if (vista) {
                cargarVista(vista);
            }
        });
    });
}


/*=====================================
        CARGAR CSS DE LA VISTA
=====================================*/

function cargarCSS(nombreVista) {
    const enlaceCSS = document.getElementById("vista-css");

    if (!enlaceCSS) {
        console.error("No existe el elemento <link id='vista-css'>");
        return;
    }

    const staticURL = APP_CONFIG.STATIC_URL.endsWith("/")
        ? APP_CONFIG.STATIC_URL
        : `${APP_CONFIG.STATIC_URL}/`;

    enlaceCSS.href = `${staticURL}css/adminCSS/${nombreVista}.css?v=${Date.now()}`;
}


/*=====================================
        CARGAR VISTA (AJAX - DJANGO)
=====================================*/

async function cargarVista(vista, esNavegacionAtras = false) {
    const contenido = document.getElementById("contenido");

    if (!contenido) {
        console.error('No se encontró el contenedor con id="contenido".');
        return;
    }

    if (typeof APP_CONFIG === "undefined") {
        console.error("APP_CONFIG no está definido en la plantilla.");
        return;
    }

    try {
        contenido.style.opacity = "0";

        cargarCSS(vista);

        const baseUrl = APP_CONFIG.PANEL_URL.endsWith("/")
            ? APP_CONFIG.PANEL_URL
            : `${APP_CONFIG.PANEL_URL}/`;

        const url = `${baseUrl}${vista}/`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const html = await response.text();
        contenido.innerHTML = html;

        actualizarBotonMenuActivo(vista);
        iniciarEventosVista(vista);

        // Guardar el historial de navegación si no se presionó el botón "Atrás"
        if (!esNavegacionAtras) {
            history.pushState({ vista: vista }, "", `#${vista}`);
        }

        requestAnimationFrame(() => {
            contenido.style.opacity = "1";
        });

    } catch (error) {
        console.error("No se pudo cargar la vista:", error);
        contenido.innerHTML = `
            <div class="mensaje error" style="padding: 20px; color: red;">
                No fue posible cargar esta sección.
            </div>
        `;
        contenido.style.opacity = "1";
    }
}

function actualizarBotonMenuActivo(vista) {
    const botones = document.querySelectorAll(".menu-btn");
    botones.forEach((boton) => {
        if (boton.dataset.view === vista) {
            boton.classList.add("active");
        } else {
            boton.classList.remove("active");
        }
    });
}


/*=====================================
        EVENTOS DE CADA VISTA
=====================================*/

function iniciarEventosVista(vista) {
    switch (vista) {
        case "inicio":
            if (typeof iniciarInicio === "function") iniciarInicio();
            break;

        case "usuarios":
            iniciarUsuarios();
            break;

        case "usuario-info":
            iniciarUsuarioInfo();
            break;

        case "expediente":
            if (typeof iniciarExpediente === "function") iniciarExpediente();
            break;

        case "rides":
            if (typeof iniciarRides === "function") iniciarRides();
            break;

        case "alertas":
            if (typeof iniciarAlertas === "function") iniciarAlertas();
            break;

        case "puntuacion":
            if (typeof iniciarPuntuacion === "function") iniciarPuntuacion();
            break;

        default:
            console.warn(`No existen eventos configurados para: ${vista}`);
    }
}


/*=====================================
        LOGICA: USUARIOS
=====================================*/

function iniciarUsuarios() {
    console.log("Vista Usuarios cargada");

    // Delegación / Asignación de evento para los botones Editar
    const botonesEditar = document.querySelectorAll(".editar-btn");
    botonesEditar.forEach((boton) => {
        boton.addEventListener("click", () => {
            const usuarioId = boton.dataset.id;
            if (usuarioId) {
                sessionStorage.setItem("usuarioIdSeleccionado", usuarioId);
                cargarVista("usuario-info");
            }
        });
    });

    // Búsqueda y Filtros
    const btnFiltrar = document.getElementById("btnFiltrar");
    if (btnFiltrar) btnFiltrar.addEventListener("click", filtrarUsuarios);

    const buscador = document.getElementById("buscarUsuario");
    if (buscador) buscador.addEventListener("input", filtrarUsuarios);

    const filtroRol = document.getElementById("filtroRol");
    if (filtroRol) filtroRol.addEventListener("change", filtrarUsuarios);

    const filtroEstado = document.getElementById("filtroEstado");
    if (filtroEstado) filtroEstado.addEventListener("change", filtrarUsuarios);
}

function filtrarUsuarios() {
    const texto = document.getElementById("buscarUsuario")?.value.toLowerCase().trim() || "";
    const rol = document.getElementById("filtroRol")?.value || "Todos";
    const estado = document.getElementById("filtroEstado")?.value || "Todos";

    const filas = document.querySelectorAll("#tablaUsuarios tr");
    let visibles = 0;

    filas.forEach((fila) => {
        // Ignorar fila de sin resultados
        if (fila.id === "sinResultados") return;

        const nombre = fila.children[1]?.textContent.toLowerCase() || "";
        const correo = fila.children[2]?.textContent.toLowerCase() || "";
        const rolUsuario = fila.querySelector(".badge")?.textContent.trim() || "";
        const estadoUsuario = fila.querySelector(".estado")?.textContent.trim() || "";

        const coincideBusqueda = nombre.includes(texto) || correo.includes(texto);
        const coincideRol = rol === "Todos" || rolUsuario.toLowerCase() === rol.toLowerCase();
        const coincideEstado = estado === "Todos" || estadoUsuario.toLowerCase() === estado.toLowerCase();

        if (coincideBusqueda && coincideRol && coincideEstado) {
            fila.style.display = "";
            visibles++;
        } else {
            fila.style.display = "none";
        }
    });

    if (visibles === 0) {
        mostrarSinResultados();
    } else {
        ocultarSinResultados();
    }

    actualizarContador(visibles);
}

function actualizarContador(visibles) {
    const contador = document.querySelector(".footer-tabla p");
    if (!contador) return;
    contador.textContent = `Mostrando ${visibles} usuario(s)`;
}

function mostrarSinResultados() {
    const tbody = document.getElementById("tablaUsuarios");
    if (!tbody) return;

    let mensaje = document.getElementById("sinResultados");
    if (!mensaje) {
        mensaje = document.createElement("tr");
        mensaje.id = "sinResultados";
        mensaje.innerHTML = `
            <td colspan="6" style="text-align:center; padding:40px; color:#9aa8b8; font-size:16px;">
                No se encontraron usuarios que coincidan con la búsqueda.
            </td>
        `;
        tbody.appendChild(mensaje);
    }
    mensaje.style.display = "";
}

function ocultarSinResultados() {
    const mensaje = document.getElementById("sinResultados");
    if (mensaje) {
        mensaje.style.display = "none";
    }
}


/*=====================================
        LOGICA: USUARIO INFO
=====================================*/

async function iniciarUsuarioInfo() {
    console.log("Vista Información Usuario cargada");

    const usuarioId = sessionStorage.getItem("usuarioIdSeleccionado");

    if (!usuarioId) {
        alert("No se seleccionó ningún usuario para consultar.");
        cargarVista("usuarios");
        return;
    }

    // OBTENER DATOS DE LA BASE DE DATOS MEDIANTE API
    try {
        const response = await fetch(`/api/admin/usuarios/${usuarioId}/`);
        const result = await response.json();

        if (!response.ok || !result.ok) {
            alert(result.error || "Ocurrió un error al cargar el usuario.");
            cargarVista("usuarios");
            return;
        }

        const usuario = result.usuario;

        // Rellenar los campos del formulario HTML
        document.getElementById("usuarioId").value = usuario.id;
        document.getElementById("nombreTitulo").textContent = usuario.nombre || "Usuario";
        document.getElementById("nombre").value = usuario.first_name || usuario.nombre || "";
        document.getElementById("correo").value = usuario.correo || "";
        document.getElementById("matricula").value = usuario.matricula || "";
        document.getElementById("cuatrimestre").value = usuario.cuatrimestre || "";
        document.getElementById("carrera").value = usuario.carrera || "";
        document.getElementById("rol").value = (usuario.rol || "pasajero").toLowerCase();
        document.getElementById("estado").value = usuario.estado || "Activo";
        document.getElementById("password").value = "";
        document.getElementById("telefono").value = usuario.telefono || "";

    } catch (error) {
        console.error("Error al obtener usuario:", error);
        alert("Ocurrió un problema de red al cargar el usuario.");
        cargarVista("usuarios");
        return;
    }

    // Botón para Regresar a la Lista
    const btnVolver = document.getElementById("volver");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => cargarVista("usuarios"));
    }

    // Botón de Pestañas (General vs Expediente)
    const btnGeneral = document.getElementById("btnGeneral");
    const btnMedico = document.getElementById("btnMedico");

    if (btnGeneral) {
        btnGeneral.addEventListener("click", () => {
            btnGeneral.classList.add("active");
            if (btnMedico) btnMedico.classList.remove("active");
        });
    }

    if (btnMedico) {
        btnMedico.addEventListener("click", () => {
            cargarVista("expediente");
        });
    }

    // Formulario Guardar Cambios
    const formGeneral = document.getElementById("formGeneral");
    if (formGeneral) {
        formGeneral.addEventListener("submit", async (e) => {
            e.preventDefault();

            const datosGuardar = {
                nombre: document.getElementById("nombre").value.trim(),
                correo: document.getElementById("correo").value.trim(),
                matricula: document.getElementById("matricula").value.trim(),
                cuatrimestre: document.getElementById("cuatrimestre").value.trim(),
                carrera: document.getElementById("carrera").value.trim(),
                rol: document.getElementById("rol").value,
                estado: document.getElementById("estado").value,
                password: document.getElementById("password").value,
                telefono: document.getElementById("telefono").value.trim(),
            };

            try {
                const response = await fetch(`/api/admin/usuarios/${usuarioId}/actualizar/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": obtenerCSRFToken()
                    },
                    body: JSON.stringify(datosGuardar)
                });

                const res = await response.json();

                if (response.ok && res.ok) {
                    alert("Cambios guardados con éxito en la base de datos.");
                    document.getElementById("nombreTitulo").textContent = datosGuardar.nombre;
                } else {
                    alert("Error al actualizar: " + (res.error || "Respuesta inválida."));
                }
            } catch (err) {
                console.error("Error al guardar:", err);
                alert("Error de conexión al guardar los datos.");
            }
        });
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