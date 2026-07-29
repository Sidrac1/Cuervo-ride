"use strict";


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS PRINCIPALES
    ====================================================== */

    const tarjetas = document.querySelectorAll(".solicitud-card");

    const botonesAccion = document.querySelectorAll(
        ".btn-viaje[data-action]"
    );

    const botonesCerrarMensaje = document.querySelectorAll(
        ".cerrar-mensaje"
    );


    /* =====================================================
       ANIMACIÓN DE ENTRADA
    ====================================================== */

    iniciarAnimacionTarjetas(tarjetas);


    /* =====================================================
       CERRAR MENSAJES DE DJANGO
    ====================================================== */

    botonesCerrarMensaje.forEach((boton) => {

        boton.addEventListener("click", () => {

            const mensaje = boton.closest(".mensaje");

            if (!mensaje) {
                return;
            }

            mensaje.style.opacity = "0";
            mensaje.style.transform = "translateY(-8px)";

            window.setTimeout(() => {

                mensaje.remove();

            }, 250);

        });

    });


    /* =====================================================
       ACCIONES DE LOS BOTONES
    ====================================================== */

    botonesAccion.forEach((boton) => {

        boton.addEventListener("click", () => {

            const accion = boton.dataset.action;
            const solicitudId = boton.dataset.solicitud;

            gestionarAccion(
                accion,
                solicitudId,
                boton
            );

        });

    });

});


/* =========================================================
   ANIMACIÓN DE TARJETAS
========================================================= */

function iniciarAnimacionTarjetas(tarjetas) {

    if (!tarjetas.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {

        tarjetas.forEach((tarjeta) => {

            tarjeta.classList.add("visible");

        });

        return;
    }

    const observador = new IntersectionObserver(
        (entradas, observer) => {

            entradas.forEach((entrada) => {

                if (!entrada.isIntersecting) {
                    return;
                }

                entrada.target.classList.add("visible");

                observer.unobserve(
                    entrada.target
                );

            });

        },
        {
            threshold: 0.12
        }
    );

    tarjetas.forEach((tarjeta, indice) => {

        tarjeta.style.transitionDelay =
            `${Math.min(indice * 70, 350)}ms`;

        observador.observe(tarjeta);

    });

}


/* =========================================================
   GESTIONAR ACCIONES
========================================================= */

function gestionarAccion(
    accion,
    solicitudId,
    boton
) {

    if (!accion) {
        return;
    }

    switch (accion) {

        case "detalles":

            alternarDetalles(
                solicitudId,
                boton
            );

            break;


        case "cancelar":

            confirmarCancelacion(
                solicitudId,
                boton
            );

            break;


        case "chat":

            navegarOInformar(
                boton,
                "El chat del viaje todavía no está conectado."
            );

            break;


        case "ruta":

            navegarOInformar(
                boton,
                "La vista de la ruta todavía no está conectada."
            );

            break;


        case "continuar":

            navegarOInformar(
                boton,
                "La vista del viaje en progreso todavía no está conectada."
            );

            break;


        case "resumen":

            navegarOInformar(
                boton,
                "El resumen del viaje todavía no está conectado."
            );

            break;


        case "calificar":

            navegarOInformar(
                boton,
                "La pantalla de calificación todavía no está conectada."
            );

            break;


        case "soporte":

            navegarOInformar(
                boton,
                "La sección de soporte todavía no está conectada."
            );

            break;


        default:

            mostrarToast(
                "Esta acción todavía no está disponible.",
                "info"
            );

    }

}


/* =========================================================
   ABRIR Y CERRAR DETALLES
========================================================= */

function alternarDetalles(
    solicitudId,
    boton
) {

    if (!solicitudId) {

        mostrarToast(
            "No se pudo identificar la solicitud.",
            "error"
        );

        return;

    }

    const detalles = document.getElementById(
        `detalles-${solicitudId}`
    );

    if (!detalles) {

        mostrarToast(
            "No se encontraron los detalles del viaje.",
            "error"
        );

        return;

    }

    const estaActivo = detalles.classList.toggle(
        "activo"
    );

    const icono = boton.querySelector("i");
    const texto = boton.querySelector("span");

    boton.setAttribute(
        "aria-expanded",
        String(estaActivo)
    );

    if (icono) {

        icono.className = estaActivo
            ? "fa-solid fa-chevron-up"
            : "fa-solid fa-chevron-down";

    }

    if (texto) {

        texto.textContent = estaActivo
            ? "Ocultar detalles"
            : "Ver detalles";

    }

}


/* =========================================================
   REDIRECCIÓN O MENSAJE TEMPORAL
========================================================= */

function navegarOInformar(
    boton,
    mensajeTemporal
) {

    const url = boton.dataset.url;

    if (url && url !== "#") {

        bloquearBoton(
            boton,
            "Cargando..."
        );

        window.location.href = url;

        return;

    }

    mostrarToast(
        mensajeTemporal,
        "info"
    );

}


/* =========================================================
   CONFIRMAR CANCELACIÓN
========================================================= */

function confirmarCancelacion(
    solicitudId,
    boton
) {

    crearModalConfirmacion({

        titulo: "Cancelar solicitud",

        mensaje:
            "¿Estás seguro de que deseas cancelar esta solicitud? " +
            "Después de cancelarla dejarás de participar en este viaje.",

        textoConfirmar: "Sí, cancelar",

        textoCancelar: "Regresar",

        onConfirmar: () => {

            cancelarSolicitud(
                solicitudId,
                boton
            );

        }

    });

}


/* =========================================================
   CANCELAR SOLICITUD
========================================================= */

async function cancelarSolicitud(
    solicitudId,
    boton
) {

    const url = boton.dataset.url;

    /*
     * Cuando se conecte el backend, el botón deberá incluir:
     *
     * data-url="{% url 'cancelar_solicitud' solicitud.id %}"
     */

    if (!url || url === "#") {

        mostrarToast(
            "La cancelación todavía no está conectada con el backend.",
            "info"
        );

        return;

    }

    bloquearBoton(
        boton,
        "Cancelando..."
    );

    try {

        const respuesta = await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "X-CSRFToken": obtenerCsrfToken(),
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify({
                    solicitud_id: solicitudId
                })
            }
        );


        let datos = {};

        try {

            datos = await respuesta.json();

        } catch (errorJson) {

            datos = {};

        }


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje
                || "No fue posible cancelar la solicitud."
            );

        }


        mostrarToast(
            datos.mensaje
            || "La solicitud fue cancelada correctamente.",
            "exito"
        );


        const tarjeta = boton.closest(
            ".solicitud-card"
        );

        if (tarjeta) {

            tarjeta.style.opacity = "0";
            tarjeta.style.transform =
                "translateY(-12px) scale(0.98)";

        }


        window.setTimeout(() => {

            if (
                datos.redireccion
                && typeof datos.redireccion === "string"
            ) {

                window.location.href =
                    datos.redireccion;

                return;

            }

            window.location.reload();

        }, 850);


    } catch (error) {

        mostrarToast(
            error.message
            || "Ocurrió un error al cancelar la solicitud.",
            "error"
        );

        restaurarBoton(boton);

    }

}


/* =========================================================
   MODAL DE CONFIRMACIÓN
========================================================= */

function crearModalConfirmacion({

    titulo,
    mensaje,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    onConfirmar

}) {

    cerrarModalExistente();

    const overlay = document.createElement("div");

    overlay.className =
        "modal-viaje-overlay";

    overlay.innerHTML = `

        <div
            class="modal-viaje"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-viaje-titulo"
        >

            <div class="modal-icono">

                <i class="fa-solid fa-triangle-exclamation"></i>

            </div>

            <h3 id="modal-viaje-titulo">
                ${escaparHtml(titulo)}
            </h3>

            <p>
                ${escaparHtml(mensaje)}
            </p>

            <div class="modal-acciones">

                <button
                    type="button"
                    class="btn-viaje btn-secundario"
                    data-modal-action="cancelar"
                >
                    ${escaparHtml(textoCancelar)}
                </button>

                <button
                    type="button"
                    class="btn-viaje btn-peligro"
                    data-modal-action="confirmar"
                >
                    <i class="fa-solid fa-xmark"></i>

                    ${escaparHtml(textoConfirmar)}
                </button>

            </div>

        </div>

    `;

    document.body.appendChild(overlay);

    document.body.style.overflow = "hidden";


    const botonCancelar = overlay.querySelector(
        '[data-modal-action="cancelar"]'
    );

    const botonConfirmar = overlay.querySelector(
        '[data-modal-action="confirmar"]'
    );


    const cerrar = () => {

        overlay.classList.remove("activo");

        document.body.style.overflow = "";

        window.setTimeout(() => {

            overlay.remove();

        }, 250);

    };


    botonCancelar.addEventListener(
        "click",
        cerrar
    );


    botonConfirmar.addEventListener(
        "click",
        () => {

            cerrar();

            if (typeof onConfirmar === "function") {

                onConfirmar();

            }

        }
    );


    overlay.addEventListener(
        "click",
        (evento) => {

            if (evento.target === overlay) {

                cerrar();

            }

        }
    );


    const manejarEscape = (evento) => {

        if (evento.key === "Escape") {

            cerrar();

            document.removeEventListener(
                "keydown",
                manejarEscape
            );

        }

    };


    document.addEventListener(
        "keydown",
        manejarEscape
    );


    requestAnimationFrame(() => {

        overlay.classList.add("activo");

        botonCancelar.focus();

    });

}


/* =========================================================
   CERRAR MODAL EXISTENTE
========================================================= */

function cerrarModalExistente() {

    const modalExistente = document.querySelector(
        ".modal-viaje-overlay"
    );

    if (!modalExistente) {
        return;
    }

    modalExistente.remove();

    document.body.style.overflow = "";

}


/* =========================================================
   TOASTS
========================================================= */

function mostrarToast(
    mensaje,
    tipo = "info",
    duracion = 4000
) {

    let contenedor = document.querySelector(
        ".toast-contenedor"
    );

    if (!contenedor) {

        contenedor = document.createElement("div");

        contenedor.className =
            "toast-contenedor";

        contenedor.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(
            contenedor
        );

    }


    const toast = document.createElement("div");

    const configuracion = obtenerConfiguracionToast(
        tipo
    );

    toast.className =
        `toast-viaje ${configuracion.clase}`;

    toast.innerHTML = `

        <i class="${configuracion.icono}"></i>

        <span>
            ${escaparHtml(mensaje)}
        </span>

        <button
            type="button"
            class="toast-cerrar"
            aria-label="Cerrar notificación"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>

    `;


    contenedor.appendChild(toast);


    const eliminarToast = () => {

        toast.classList.remove("visible");

        window.setTimeout(() => {

            toast.remove();

            if (!contenedor.children.length) {

                contenedor.remove();

            }

        }, 300);

    };


    toast
        .querySelector(".toast-cerrar")
        .addEventListener(
            "click",
            eliminarToast
        );


    requestAnimationFrame(() => {

        toast.classList.add("visible");

    });


    window.setTimeout(
        eliminarToast,
        duracion
    );

}


/* =========================================================
   CONFIGURACIÓN DEL TOAST
========================================================= */

function obtenerConfiguracionToast(tipo) {

    const tipos = {

        exito: {
            clase: "toast-exito",
            icono: "fa-solid fa-circle-check"
        },

        error: {
            clase: "toast-error",
            icono: "fa-solid fa-circle-xmark"
        },

        info: {
            clase: "toast-info",
            icono: "fa-solid fa-circle-info"
        }

    };

    return tipos[tipo] || tipos.info;

}


/* =========================================================
   BLOQUEAR BOTÓN
========================================================= */

function bloquearBoton(
    boton,
    textoTemporal
) {

    if (!boton) {
        return;
    }

    if (!boton.dataset.textoOriginal) {

        boton.dataset.textoOriginal =
            boton.innerHTML;

    }

    boton.disabled = true;

    boton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        ${escaparHtml(textoTemporal)}

    `;

}


/* =========================================================
   RESTAURAR BOTÓN
========================================================= */

function restaurarBoton(boton) {

    if (!boton) {
        return;
    }

    boton.disabled = false;

    if (boton.dataset.textoOriginal) {

        boton.innerHTML =
            boton.dataset.textoOriginal;

        delete boton.dataset.textoOriginal;

    }

}


/* =========================================================
   OBTENER CSRF TOKEN DE DJANGO
========================================================= */

function obtenerCsrfToken() {

    const nombreCookie = "csrftoken";

    const cookies = document.cookie
        ? document.cookie.split(";")
        : [];

    for (const cookieOriginal of cookies) {

        const cookie = cookieOriginal.trim();

        if (
            cookie.startsWith(
                `${nombreCookie}=`
            )
        ) {

            return decodeURIComponent(
                cookie.substring(
                    nombreCookie.length + 1
                )
            );

        }

    }

    /*
     * Como alternativa, también busca un input
     * generado con {% csrf_token %}.
     */

    const inputCsrf = document.querySelector(
        'input[name="csrfmiddlewaretoken"]'
    );

    return inputCsrf
        ? inputCsrf.value
        : "";

}


/* =========================================================
   ESCAPAR TEXTO PARA HTML
========================================================= */

function escaparHtml(valor) {

    const elemento = document.createElement("div");

    elemento.textContent =
        valor === null || valor === undefined
            ? ""
            : String(valor);

    return elemento.innerHTML;

}