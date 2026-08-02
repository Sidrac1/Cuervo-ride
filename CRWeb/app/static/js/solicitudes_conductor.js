"use strict";


document.addEventListener("DOMContentLoaded", function () {

    /*==================================================
        ELEMENTOS
    ==================================================*/

    const tarjetas =
        document.querySelectorAll(".solicitud-card");

    const csrfInput =
        document.querySelector(
            '#csrfFormSolicitudes input[name="csrfmiddlewaretoken"]'
        );


    const csrfToken =
        csrfInput ? csrfInput.value : "";


    let solicitudProcesando = false;

    let modalActual = null;


    /*==================================================
        EVENTOS DE LOS BOTONES
    ==================================================*/

    tarjetas.forEach(
        function (tarjeta) {

            const botonAceptar =
                tarjeta.querySelector(
                    '[data-action="aceptar"]'
                );

            const botonRechazar =
                tarjeta.querySelector(
                    '[data-action="rechazar"]'
                );


            botonAceptar?.addEventListener(
                "click",
                function () {

                    abrirConfirmacion(
                        tarjeta,
                        "aceptar"
                    );

                }
            );


            botonRechazar?.addEventListener(
                "click",
                function () {

                    abrirConfirmacion(
                        tarjeta,
                        "rechazar"
                    );

                }
            );

        }
    );


    /*==================================================
        ABRIR MODAL
    ==================================================*/

    function abrirConfirmacion(
        tarjeta,
        accion
    ) {

        if (
            solicitudProcesando ||
            !tarjeta
        ) {
            return;
        }


        cerrarModal();


        const esAceptar =
            accion === "aceptar";


        const nombrePasajero =
            tarjeta.querySelector(
                ".pasajero-datos h2"
            )?.textContent.trim()
            || "el pasajero";


        const asientos =
            tarjeta.querySelector(
                ".viaje-datos-grid .dato-viaje:nth-child(3) strong"
            )?.textContent.trim()
            || "los lugares solicitados";


        const overlay =
            document.createElement("div");


        overlay.className =
            "modal-solicitud-overlay";


        overlay.innerHTML = `

            <div
                class="modal-solicitud ${esAceptar ? "aceptar" : "rechazar"}"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalDecisionTitulo"
            >

                <div class="modal-icono">

                    <i class="fa-solid ${
                        esAceptar
                            ? "fa-user-check"
                            : "fa-user-xmark"
                    }"></i>

                </div>


                <h2 id="modalDecisionTitulo">

                    ${
                        esAceptar
                            ? "¿Aceptar solicitud?"
                            : "¿Rechazar solicitud?"
                    }

                </h2>


                <p>

                    ${
                        esAceptar
                            ? `Se reservarán ${escaparHtml(asientos)} para ${escaparHtml(nombrePasajero)}.`
                            : `La solicitud de ${escaparHtml(nombrePasajero)} será rechazada.`
                    }

                </p>


                <div class="modal-acciones">

                    <button
                        type="button"
                        class="modal-btn cancelar"
                        data-modal-action="cancelar"
                    >

                        Volver

                    </button>


                    <button
                        type="button"
                        class="modal-btn ${
                            esAceptar
                                ? "confirmar-aceptar"
                                : "confirmar-rechazar"
                        }"
                        data-modal-action="confirmar"
                    >

                        <i class="fa-solid ${
                            esAceptar
                                ? "fa-check"
                                : "fa-xmark"
                        }"></i>

                        ${
                            esAceptar
                                ? "Aceptar solicitud"
                                : "Rechazar solicitud"
                        }

                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        modalActual =
            overlay;


        document.body.style.overflow =
            "hidden";


        overlay
            .querySelector(
                '[data-modal-action="cancelar"]'
            )
            ?.addEventListener(
                "click",
                cerrarModal
            );


        overlay
            .querySelector(
                '[data-modal-action="confirmar"]'
            )
            ?.addEventListener(
                "click",
                function () {

                    cerrarModal();

                    responderSolicitud(
                        tarjeta,
                        accion
                    );

                }
            );


        overlay.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target === overlay
                ) {

                    cerrarModal();

                }

            }
        );


        requestAnimationFrame(
            function () {

                overlay.classList.add(
                    "activo"
                );


                overlay
                    .querySelector(
                        '[data-modal-action="cancelar"]'
                    )
                    ?.focus();

            }
        );

    }


    /*==================================================
        CERRAR MODAL
    ==================================================*/

    function cerrarModal() {

        if (!modalActual) {
            return;
        }


        const modalQueSeCierra =
            modalActual;


        modalActual =
            null;


        modalQueSeCierra.classList.remove(
            "activo"
        );


        document.body.style.overflow =
            "";


        window.setTimeout(
            function () {

                modalQueSeCierra.remove();

            },
            240
        );

    }


    /*==================================================
        RESPONDER SOLICITUD
    ==================================================*/

    async function responderSolicitud(
        tarjeta,
        accion
    ) {

        if (
            solicitudProcesando ||
            !tarjeta
        ) {
            return;
        }


        const url =
            accion === "aceptar"
                ? tarjeta.dataset.aceptarUrl
                : tarjeta.dataset.rechazarUrl;


        if (!url) {

            mostrarNotificacion(
                "No se encontró la dirección para responder la solicitud.",
                "error"
            );

            return;

        }


        solicitudProcesando =
            true;


        tarjeta.classList.add(
            "procesando"
        );


        cambiarEstadoBotones(
            tarjeta,
            true,
            accion
        );


        try {

            const respuesta =
                await fetch(
                    url,
                    {
                        method: "POST",

                        headers: {
                            "X-CSRFToken":
                                csrfToken,

                            "X-Requested-With":
                                "XMLHttpRequest",

                            "Accept":
                                "application/json"
                        },

                        credentials:
                            "same-origin"
                    }
                );


            let datos;


            try {

                datos =
                    await respuesta.json();

            } catch {

                throw new Error(
                    "El servidor devolvió una respuesta no válida."
                );

            }


            if (
                !respuesta.ok ||
                datos.ok !== true
            ) {

                throw new Error(
                    datos.error ||
                    "No fue posible responder la solicitud."
                );

            }


            mostrarNotificacion(
                datos.mensaje ||
                (
                    accion === "aceptar"
                        ? "Solicitud aceptada correctamente."
                        : "Solicitud rechazada correctamente."
                ),
                "success"
            );


            /*
             * Recargamos la vista para actualizar:
             *
             * - estadísticas;
             * - filtros;
             * - asientos disponibles;
             * - estado de la solicitud;
             * - enlace del chat.
             *
             * La acción ya fue guardada antes de recargar.
             */

            window.setTimeout(
                function () {

                    window.location.reload();

                },
                800
            );


        } catch (error) {

            console.error(
                "Error al responder la solicitud:",
                error
            );


            tarjeta.classList.remove(
                "procesando"
            );


            cambiarEstadoBotones(
                tarjeta,
                false,
                accion
            );


            mostrarNotificacion(
                error.message ||
                "Ocurrió un error al procesar la solicitud.",
                "error"
            );


            solicitudProcesando =
                false;

        }

    }


    /*==================================================
        ESTADO DE LOS BOTONES
    ==================================================*/

    function cambiarEstadoBotones(
        tarjeta,
        procesando,
        accion
    ) {

        const botones =
            tarjeta.querySelectorAll(
                ".acciones-pendientes button"
            );


        botones.forEach(
            function (boton) {

                boton.disabled =
                    procesando;

            }
        );


        if (!procesando) {

            const aceptar =
                tarjeta.querySelector(
                    '[data-action="aceptar"]'
                );


            const rechazar =
                tarjeta.querySelector(
                    '[data-action="rechazar"]'
                );


            if (aceptar) {

                aceptar.innerHTML = `

                    <i class="fa-solid fa-check"></i>

                    Aceptar solicitud

                `;

            }


            if (rechazar) {

                rechazar.innerHTML = `

                    <i class="fa-solid fa-xmark"></i>

                    Rechazar

                `;

            }


            return;

        }


        const botonActivo =
            tarjeta.querySelector(
                `[data-action="${accion}"]`
            );


        if (botonActivo) {

            botonActivo.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                ${
                    accion === "aceptar"
                        ? "Aceptando..."
                        : "Rechazando..."
                }

            `;

        }

    }


    /*==================================================
        NOTIFICACIÓN
    ==================================================*/

    function mostrarNotificacion(
        mensaje,
        tipo = "success"
    ) {

        const anterior =
            document.querySelector(
                ".notificacion-solicitudes"
            );


        if (anterior) {

            anterior.remove();

        }


        const notificacion =
            document.createElement("div");


        notificacion.className =
            `notificacion-solicitudes ${tipo}`;


        notificacion.innerHTML = `

            <i class="fa-solid ${
                tipo === "success"
                    ? "fa-circle-check"
                    : "fa-circle-exclamation"
            }"></i>

            <span></span>

        `;


        const texto =
            notificacion.querySelector(
                "span"
            );


        if (texto) {

            texto.textContent =
                mensaje;

        }


        document.body.appendChild(
            notificacion
        );


        requestAnimationFrame(
            function () {

                notificacion.classList.add(
                    "visible"
                );

            }
        );


        window.setTimeout(
            function () {

                notificacion.classList.remove(
                    "visible"
                );


                window.setTimeout(
                    function () {

                        notificacion.remove();

                    },
                    250
                );

            },
            3800
        );

    }


    /*==================================================
        CERRAR CON ESCAPE
    ==================================================*/

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                modalActual
            ) {

                cerrarModal();

            }

        }
    );


    /*==================================================
        ESCAPAR TEXTO
    ==================================================*/

    function escaparHtml(valor) {

        const elemento =
            document.createElement("div");


        elemento.textContent =
            valor === null ||
            valor === undefined
                ? ""
                : String(valor);


        return elemento.innerHTML;

    }

});