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

            abrirResumenViaje(boton);

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

/* =========================================================
   MODAL RESUMEN DEL VIAJE
========================================================= */

function abrirResumenViaje(boton){

    const tarjeta = boton.closest(".solicitud-card");

    if(!tarjeta){

        mostrarToast(
            "No fue posible obtener la información del viaje.",
            "error"
        );

        return;

    }

    const modal = document.getElementById(
        "modalResumenViaje"
    );

    const contenido = document.getElementById(
        "contenidoResumenViaje"
    );

    if(!modal || !contenido){

        mostrarToast(
            "No se encontró el modal del resumen.",
            "error"
        );

        return;

    }

    contenido.innerHTML = construirResumenHTML(
        tarjeta.dataset
    );

    modal.classList.add("activo");

    document.body.classList.add(
        "modal-resumen-abierto"
    );

}

/* =========================================================
   CERRAR MODAL RESUMEN
========================================================= */

function cerrarResumenViaje(){

    const modal = document.getElementById(
        "modalResumenViaje"
    );

    if(!modal){
        return;
    }

    modal.classList.remove("activo");

    document.body.classList.remove(
        "modal-resumen-abierto"
    );

}

/* =========================================================
   CONSTRUIR HTML DEL RESUMEN
========================================================= */

function construirResumenHTML(data) {

    const permiteMascotas =
        data.resumenMascotas === "1";

    const aceptaSilla =
        data.resumenSilla === "1";

    const requiereAsistencia =
        data.resumenAsistencia === "1";


    const preferencias = [];

    if (permiteMascotas) {

        preferencias.push(`
            <span class="ticket-preferencia activa">

                <i class="fa-solid fa-paw"></i>

                Mascotas permitidas

            </span>
        `);

    }

    if (aceptaSilla) {

        preferencias.push(`
            <span class="ticket-preferencia activa">

                <i class="fa-solid fa-wheelchair"></i>

                Accesible

            </span>
        `);

    }

    if (requiereAsistencia) {

        preferencias.push(`
            <span class="ticket-preferencia activa">

                <i class="fa-solid fa-hand-holding-medical"></i>

                Asistencia solicitada

            </span>
        `);

    }

    if (!preferencias.length) {

        preferencias.push(`
            <span class="ticket-preferencia">

                <i class="fa-solid fa-circle-minus"></i>

                Sin preferencias adicionales

            </span>
        `);

    }


    return `

        <article class="ticket-viaje">

            <!-- =========================================
                ENCABEZADO
            ========================================== -->

            <header class="ticket-header">

                <div class="ticket-marca">

                    <span class="ticket-etiqueta">

                        Comprobante de viaje

                    </span>

                    <h2 id="tituloModalResumen">

                        Cuervo-Ride

                    </h2>

                    <p>

                        Folio:

                        <strong>

                            ${escaparHtml(
                                data.resumenFolio
                                || "Sin folio"
                            )}

                        </strong>

                    </p>

                </div>


                <span
                    class="ticket-estado
                    ticket-estado-${escaparHtml(
                        data.estado
                        || "completada"
                    )}">

                    <i class="fa-solid fa-circle-check"></i>

                    ${escaparHtml(
                        data.estadoLabel
                        || "Completada"
                    )}

                </span>

            </header>


            <div class="ticket-separador"></div>


            <!-- =========================================
                INFORMACIÓN GENERAL
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-solid fa-circle-info"></i>

                    Información del viaje

                </h3>


                <div class="ticket-grid">

                    <div class="ticket-item">

                        <span>
                            Conductor
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenConductor
                                || "No disponible"
                            )}

                        </strong>

                    </div>


                    <div class="ticket-item">

                        <span>
                            Vehículo
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenVehiculo
                                || "No especificado"
                            )}

                        </strong>

                        <small>

                            ${escaparHtml(
                                data.resumenVehiculoDetalle
                                || "Sin información adicional"
                            )}

                        </small>

                    </div>


                    <div class="ticket-item">

                        <span>
                            Fecha de salida
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenFecha
                                || "Sin fecha"
                            )}

                        </strong>

                        <small>

                            ${escaparHtml(
                                data.resumenHora
                                || "Sin hora"
                            )}

                        </small>

                    </div>


                    <div class="ticket-item">

                        <span>
                            Llegada estimada
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenLlegada
                                || "No especificada"
                            )}

                        </strong>

                    </div>

                </div>

            </section>


            <!-- =========================================
                RUTA
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-solid fa-route"></i>

                    Ruta del viaje

                </h3>


                <div class="ticket-ruta">

                    <div class="ticket-ruta-punto origen">

                        <span class="ticket-ruta-marcador"></span>

                        <div>

                            <small>
                                Origen
                            </small>

                            <strong>

                                ${escaparHtml(
                                    data.resumenOrigen
                                    || "No especificado"
                                )}

                            </strong>

                        </div>

                    </div>


                    <div class="ticket-ruta-linea">

                        <i class="fa-solid fa-arrow-right"></i>

                    </div>


                    <div class="ticket-ruta-punto destino">

                        <span class="ticket-ruta-marcador"></span>

                        <div>

                            <small>
                                Destino
                            </small>

                            <strong>

                                ${escaparHtml(
                                    data.resumenDestino
                                    || "No especificado"
                                )}

                            </strong>

                        </div>

                    </div>

                </div>

            </section>


            <!-- =========================================
                PUNTOS PERSONALIZADOS
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-solid fa-location-crosshairs"></i>

                    Puntos acordados

                </h3>


                <div class="ticket-grid ticket-grid-dos">

                    <div class="ticket-item">

                        <span>
                            Punto de recogida
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenRecogida
                                || "No especificado"
                            )}

                        </strong>

                    </div>


                    <div class="ticket-item">

                        <span>
                            Punto de descenso
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenDescenso
                                || "No especificado"
                            )}

                        </strong>

                    </div>

                </div>

            </section>


            <!-- =========================================
                DESGLOSE DEL COSTO
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-solid fa-receipt"></i>

                    Desglose

                </h3>


                <div class="ticket-desglose">

                    <div>

                        <span>
                            Asientos reservados
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenAsientos
                                || "0"
                            )}

                        </strong>

                    </div>


                    <div>

                        <span>
                            Costo por pasajero
                        </span>

                        <strong>

                            $${escaparHtml(
                                data.resumenPrecio
                                || "0.00"
                            )}
                            MXN

                        </strong>

                    </div>


                    <div class="ticket-total">

                        <span>
                            Total del viaje
                        </span>

                        <strong>

                            $${escaparHtml(
                                data.resumenTotal
                                || "0.00"
                            )}
                            MXN

                        </strong>

                    </div>

                </div>

            </section>


            <!-- =========================================
                PREFERENCIAS
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-solid fa-sliders"></i>

                    Preferencias

                </h3>


                <div class="ticket-preferencias">

                    ${preferencias.join("")}

                </div>

            </section>


            <!-- =========================================
                COMENTARIOS E INDICACIONES
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-solid fa-message"></i>

                    Información adicional

                </h3>


                <div class="ticket-textos">

                    <article>

                        <span>

                            <i class="fa-solid fa-comment"></i>

                            Comentario del pasajero

                        </span>

                        <p>

                            ${escaparHtml(
                                data.resumenComentario
                                || "No se agregó ningún comentario"
                            )}

                        </p>

                    </article>


                    <article>

                        <span>

                            <i class="fa-solid fa-circle-info"></i>

                            Indicaciones del conductor

                        </span>

                        <p>

                            ${escaparHtml(
                                data.resumenIndicaciones
                                || "El conductor no agregó indicaciones"
                            )}

                        </p>

                    </article>

                </div>

            </section>


            <!-- =========================================
                REGISTRO DE LA SOLICITUD
            ========================================== -->

            <section class="ticket-seccion">

                <h3>

                    <i class="fa-regular fa-calendar-check"></i>

                    Registro de la solicitud

                </h3>


                <div class="ticket-grid ticket-grid-dos">

                    <div class="ticket-item">

                        <span>
                            Solicitud enviada
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenSolicitudFecha
                                || "Sin registro"
                            )}

                        </strong>

                    </div>


                    <div class="ticket-item">

                        <span>
                            Respuesta recibida
                        </span>

                        <strong>

                            ${escaparHtml(
                                data.resumenRespuestaFecha
                                || "Sin respuesta registrada"
                            )}

                        </strong>

                    </div>

                </div>

            </section>


            <!-- =========================================
                CALIFICACIÓN
            ========================================== -->

            <section class="ticket-calificacion">

                <div>

                    <span>

                        <i class="fa-solid fa-star"></i>

                        Estado de la calificación

                    </span>

                    <strong>

                        ${escaparHtml(
                            data.resumenCalificacion
                            || "Calificación pendiente"
                        )}

                    </strong>

                </div>

            </section>


            <!-- =========================================
                PIE
            ========================================== -->

            <footer class="ticket-footer">

                <i class="fa-solid fa-crow"></i>

                <div>

                    <strong>
                        Gracias por viajar con Cuervo-Ride
                    </strong>

                    <span>
                        Este documento es un comprobante interno
                        del viaje y no representa una factura fiscal.
                    </span>

                </div>

            </footer>

        </article>

    `;

}

/* =========================================================
   EVENTOS DEL MODAL RESUMEN
========================================================= */

document.addEventListener("DOMContentLoaded",()=>{

    const modal = document.getElementById(
        "modalResumenViaje"
    );

    if(!modal){
        return;
    }

    const cerrar = document.getElementById(
        "btnCerrarResumen"
    );

    if(cerrar){

        cerrar.addEventListener(
            "click",
            cerrarResumenViaje
        );

    }

    modal.addEventListener(
        "click",
        (e)=>{

            if(e.target===modal){

                cerrarResumenViaje();

            }

        }
    );

    document.addEventListener(
        "keydown",
        (e)=>{

            if(
                e.key==="Escape" &&
                modal.classList.contains("activo")
            ){

                cerrarResumenViaje();

            }

        }
    );

});

/*==================================================
        MODAL CALIFICAR VIAJE
==================================================*/

document.addEventListener("DOMContentLoaded", function () {

    const modalOverlay = document.getElementById(
        "modalCalificarViaje"
    );

    if (!modalOverlay) {
        return;
    }

    const modal = modalOverlay.querySelector(
        ".modal-calificar-viaje"
    );

    const botonCerrar = document.getElementById(
        "btnCerrarCalificarViaje"
    );

    const botonOmitir = document.getElementById(
        "btnOmitirCalificacionViaje"
    );

    const formulario = document.getElementById(
        "formCalificarViaje"
    );

    const inputPuntuacion = document.getElementById(
        "puntuacionViaje"
    );

    const textareaComentario = document.getElementById(
        "comentarioViaje"
    );

    const contadorComentario = document.getElementById(
        "contadorComentarioViaje"
    );

    const textoPuntuacion = document.getElementById(
        "textoPuntuacionViaje"
    );

    const errorCalificacion = document.getElementById(
        "errorCalificarViaje"
    );

    const origenModal = document.getElementById(
        "calificarViajeOrigen"
    );

    const destinoModal = document.getElementById(
        "calificarViajeDestino"
    );

    const conductorModal = document.getElementById(
        "calificarViajeConductor"
    );

    const estrellas = Array.from(
        modalOverlay.querySelectorAll(
            ".estrella-viaje"
        )
    );

    const botonesAbrir = document.querySelectorAll(
        '[data-action="calificar-viaje"]'
    );

    let botonActivo = null;

    const textosPuntuacion = {
        1: "Muy mala experiencia",
        2: "Mala experiencia",
        3: "Experiencia regular",
        4: "Buena experiencia",
        5: "Excelente experiencia",
    };


    /*==================================================
            MOSTRAR ERROR
    ==================================================*/

    function mostrarError(mensaje) {

        if (!errorCalificacion) {
            return;
        }

        const textoError = errorCalificacion.querySelector(
            "span"
        );

        if (textoError) {
            textoError.textContent = mensaje;
        } else {
            errorCalificacion.textContent = mensaje;
        }

        errorCalificacion.classList.add(
            "visible"
        );

    }


    /*==================================================
            OCULTAR ERROR
    ==================================================*/

    function ocultarError() {

        if (!errorCalificacion) {
            return;
        }

        errorCalificacion.classList.remove(
            "visible"
        );

    }


    /*==================================================
            ACTUALIZAR ESTRELLAS
    ==================================================*/

    function actualizarEstrellas(valor) {

        estrellas.forEach(function (estrella) {

            const puntuacionEstrella = Number(
                estrella.dataset.value
                || estrella.dataset.puntuacion
                || 0
            );

            estrella.classList.toggle(
                "seleccionada",
                puntuacionEstrella <= valor
            );

            estrella.setAttribute(
                "aria-pressed",
                puntuacionEstrella === valor
                    ? "true"
                    : "false"
            );

        });

        if (inputPuntuacion) {
            inputPuntuacion.value = valor || "";
        }

        if (textoPuntuacion) {

            textoPuntuacion.textContent = (
                textosPuntuacion[valor]
                || "Selecciona una puntuación"
            );

        }

        ocultarError();

    }


    /*==================================================
            EFECTO HOVER
    ==================================================*/

    function mostrarHoverEstrellas(valor) {

        estrellas.forEach(function (estrella) {

            const puntuacionEstrella = Number(
                estrella.dataset.value
                || estrella.dataset.puntuacion
                || 0
            );

            estrella.classList.toggle(
                "hover",
                puntuacionEstrella <= valor
            );

        });

    }


    function limpiarHoverEstrellas() {

        estrellas.forEach(function (estrella) {

            estrella.classList.remove(
                "hover"
            );

        });

    }


    /*==================================================
            REINICIAR FORMULARIO
    ==================================================*/

    function reiniciarFormulario() {

        if (formulario) {
            formulario.reset();
        }

        if (inputPuntuacion) {
            inputPuntuacion.value = "";
        }

        if (contadorComentario) {
            contadorComentario.textContent = "0 / 500";
        }

        actualizarEstrellas(0);

        ocultarError();

    }


    /*==================================================
            ABRIR MODAL
    ==================================================*/

    function abrirModal(boton) {

        botonActivo = boton;

        reiniciarFormulario();

        const url = boton.dataset.url || "";

        const origen = (
            boton.dataset.origen
            || "Origen no disponible"
        );

        const destino = (
            boton.dataset.destino
            || "Destino no disponible"
        );

        const conductor = (
            boton.dataset.conductor
            || "Conductor no disponible"
        );

        if (formulario) {
            formulario.action = url;
        }

        if (origenModal) {
            origenModal.textContent = origen;
        }

        if (destinoModal) {
            destinoModal.textContent = destino;
        }

        if (conductorModal) {
            conductorModal.textContent = conductor;
        }

        boton.setAttribute(
            "aria-expanded",
            "true"
        );

        modalOverlay.classList.add(
            "activo"
        );

        modalOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-calificar-viaje-abierto"
        );

        window.setTimeout(function () {

            if (modal) {
                modal.focus();
            }

        }, 100);

    }


    /*==================================================
            CERRAR MODAL
    ==================================================*/

    function cerrarModal() {

        modalOverlay.classList.remove(
            "activo"
        );

        modalOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-calificar-viaje-abierto"
        );

        if (botonActivo) {

            botonActivo.setAttribute(
                "aria-expanded",
                "false"
            );

            botonActivo.focus();

        }

        botonActivo = null;

        reiniciarFormulario();

    }


    /*==================================================
            EVENTOS BOTONES ABRIR
    ==================================================*/

    botonesAbrir.forEach(function (boton) {

        boton.addEventListener(
            "click",
            function () {

                abrirModal(boton);

            }
        );

    });


    /*==================================================
            EVENTOS ESTRELLAS
    ==================================================*/

    estrellas.forEach(function (estrella) {

        const valor = Number(
            estrella.dataset.value
            || estrella.dataset.puntuacion
            || 0
        );

        estrella.addEventListener(
            "click",
            function () {

                actualizarEstrellas(
                    valor
                );

            }
        );

        estrella.addEventListener(
            "mouseenter",
            function () {

                mostrarHoverEstrellas(
                    valor
                );

            }
        );

        estrella.addEventListener(
            "mouseleave",
            function () {

                limpiarHoverEstrellas();

            }
        );

        estrella.addEventListener(
            "keydown",
            function (evento) {

                if (
                    evento.key === "Enter"
                    || evento.key === " "
                ) {

                    evento.preventDefault();

                    actualizarEstrellas(
                        valor
                    );

                }

            }
        );

    });


    /*==================================================
            CONTADOR DEL COMENTARIO
    ==================================================*/

    if (textareaComentario) {

        textareaComentario.addEventListener(
            "input",
            function () {

                const longitud = (
                    textareaComentario.value.length
                );

                if (contadorComentario) {

                    contadorComentario.textContent = (
                        `${longitud} / 500`
                    );

                }

            }
        );

    }


    /*==================================================
            VALIDAR ENVÍO
    ==================================================*/

    if (formulario) {

        formulario.addEventListener(
            "submit",
            function (evento) {

                const puntuacion = Number(
                    inputPuntuacion
                    ? inputPuntuacion.value
                    : 0
                );

                if (
                    puntuacion < 1
                    || puntuacion > 5
                ) {

                    evento.preventDefault();

                    mostrarError(
                        "Selecciona una puntuación de 1 a 5 estrellas."
                    );

                    const primeraEstrella = (
                        estrellas[0]
                    );

                    if (primeraEstrella) {
                        primeraEstrella.focus();
                    }

                    return;
                }

                const botonEnviar = (
                    formulario.querySelector(
                        ".btn-enviar-calificacion-viaje"
                    )
                );

                if (botonEnviar) {

                    botonEnviar.disabled = true;

                    botonEnviar.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Enviando...
                    `;

                }

            }
        );

    }


    /*==================================================
            BOTONES CERRAR
    ==================================================*/

    if (botonCerrar) {

        botonCerrar.addEventListener(
            "click",
            cerrarModal
        );

    }

    if (botonOmitir) {

        botonOmitir.addEventListener(
            "click",
            cerrarModal
        );

    }


    /*==================================================
            CERRAR AL HACER CLIC FUERA
    ==================================================*/

    modalOverlay.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target === modalOverlay
            ) {

                cerrarModal();

            }

        }
    );


    /*==================================================
            CERRAR CON ESCAPE
    ==================================================*/

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape"
                && modalOverlay.classList.contains(
                    "activo"
                )
            ) {

                cerrarModal();

            }

        }
    );

});