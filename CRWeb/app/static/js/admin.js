/*=====================================
        CUERVO RIDE - ADMIN PANEL
=====================================*/

window.ADMIN_STATE = {
    usuarioId: null,
    datosExtra: null
};

document.addEventListener("DOMContentLoaded", () => {
    iniciarMenu();

    const logo = document.getElementById("btnInicio");
    if (logo) {
        logo.addEventListener("click", () => {
            cargarVista("inicio");
        });
    }

    const hashCompleto = window.location.hash.replace("#", "").trim();
    if (hashCompleto) {
        const [vista, id] = hashCompleto.split("/");
        if (id) {
            window.ADMIN_STATE.usuarioId = id;
            sessionStorage.setItem("usuarioId", id);
        }
        cargarVista(vista, id || null, true);
    } else {
        cargarVista("inicio");
    }
});

window.addEventListener("popstate", (event) => {
    const estado = event.state || {};
    const hashCompleto = window.location.hash.replace("#", "").trim();
    const [vistaHash, idHash] = hashCompleto.split("/");

    const vista = estado.vista || vistaHash || "inicio";
    const param = estado.param || idHash || null;

    if (param) {
        window.ADMIN_STATE.usuarioId = param;
        sessionStorage.setItem("usuarioId", param);
    }
    
    cargarVista(vista, param, true);
});

function iniciarMenu() {
    const botones = document.querySelectorAll(".menu-btn");

    botones.forEach((boton) => {
        boton.addEventListener("click", () => {
            const vista = boton.dataset.view;
            if (vista) {
                window.ADMIN_STATE.usuarioId = null;
                sessionStorage.removeItem("usuarioId");
                cargarVista(vista);
            }
        });
    });
}

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

async function cargarVista(vista, param = null, esNavegacionAtras = false) {
    const contenido = document.getElementById("contenido");

    if (!contenido) {
        console.error('No se encontró el contenedor con id="contenido".');
        return;
    }

    if (typeof APP_CONFIG === "undefined") {
        console.error("APP_CONFIG no está definido en la plantilla.");
        return;
    }

    if (param !== null) {
        window.ADMIN_STATE.usuarioId = param;
        sessionStorage.setItem("usuarioId", param);
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
        
        iniciarEventosVista(vista, window.ADMIN_STATE.usuarioId);

        if (!esNavegacionAtras) {
            const hash = window.ADMIN_STATE.usuarioId ? `${vista}/${window.ADMIN_STATE.usuarioId}` : vista;
            history.pushState({ vista: vista, param: window.ADMIN_STATE.usuarioId }, "", `#${hash}`);
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

function iniciarEventosVista(vista, param = null) {
    switch (vista) {
        case "inicio":
            if (typeof iniciarInicio === "function") iniciarInicio();
            break;

        case "usuarios":
            if (typeof iniciarUsuarios === "function") iniciarUsuarios();
            break;

        case "usuario-info":
            if (typeof iniciarUsuarioInfo === "function") iniciarUsuarioInfo(param);
            break;

        case "expediente":
            if (typeof iniciarExpediente === "function") iniciarExpediente(param);
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