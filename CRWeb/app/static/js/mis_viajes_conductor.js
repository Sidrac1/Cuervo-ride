"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /*==================================================
                    ELEMENTOS PRINCIPALES
    ==================================================*/

    const tarjetas = Array.from(
        document.querySelectorAll(".viaje-card")
    );

    const botonesAccion = Array.from(
        document.querySelectorAll(
            ".btn-viaje[data-accion]"
        )
    );

    let accionPendiente = null;


    /*==================================================
                  ANIMACIÓN DE TARJETAS
    ==================================================*/

    function animarTarjetas() {

        tarjetas.forEach((tarjeta, indice) => {

            window.setTimeout(() => {

                tarjeta.classList.add("visible");

            }, indice * 75);

        });

    }

    animarTarjetas();


    /*==================================================
                       TOASTS
    ==================================================*/

    function obtenerContenedorToast() {

        let contenedor = document.querySelector(
            ".contenedor-toast"
        );

        if (contenedor) {
            return contenedor;
        }

        contenedor = document.createElement("div");

        contenedor.className = "contenedor-toast";

        contenedor.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(contenedor);

        return contenedor;

    }


    function mostrarToast(
        mensaje,
        tipo = "info",
        duracion = 3500
    ) {

        const iconos = {
            info: "fa-circle-info",
            exito: "fa-circle-check",
            error: "fa-circle-exclamation",
        };

        const toast = document.createElement("div");

        toast.className = `toast-viaje ${tipo}`;

        toast.innerHTML = `
            <i class="fa-solid ${
                iconos[tipo] || iconos.info
            }"></i>

            <span></span>
        `;

        const texto = toast.querySelector("span");

        texto.textContent = mensaje;

        obtenerContenedorToast().appendChild(toast);

        requestAnimationFrame(() => {

            toast.classList.add("visible");

        });

        window.setTimeout(() => {

            toast.classList.remove("visible");

            window.setTimeout(() => {

                toast.remove();

            }, 260);

        }, duracion);

    }


    /*==================================================
                 DETALLES DE LA TARJETA
    ==================================================*/

    function crearDetallesExpandibles(tarjeta) {

        let detalles = tarjeta.querySelector(
            ".detalles-expandibles"
        );

        if (detalles) {
            return detalles;
        }

        detalles = document.createElement("div");

        detalles.className = "detalles-expandibles";

        const estado = tarjeta.dataset.estado || "";
        const viajeId = tarjeta.dataset.viajeId || "";

        detalles.innerHTML = `
            <div class="detalles-expandibles-contenido">

                <h3>
                    Información adicional
                </h3>

                <p>
                    Viaje #${escaparHtml(viajeId)}.
                    Estado actual:
                    ${escaparHtml(
                        obtenerNombreEstado(estado)
                    )}.
                </p>

                <p>
                    Más adelante esta sección mostrará
                    pasajeros, solicitudes, indicaciones
                    y el resumen completo de la ruta.
                </p>

            </div>
        `;

        const footer = tarjeta.querySelector(
            ".viaje-card-footer"
        );

        if (footer) {

            tarjeta.insertBefore(
                detalles,
                footer
            );

        } else {

            tarjeta.appendChild(detalles);

        }

        return detalles;

    }


    function alternarDetalles(tarjeta, boton) {

        const detalles = crearDetallesExpandibles(
            tarjeta
        );

        const estaAbierto = tarjeta.classList.contains(
            "detalles-abiertos"
        );

        cerrarDetallesOtrasTarjetas(tarjeta);

        tarjeta.classList.toggle(
            "detalles-abiertos",
            !estaAbierto
        );

        tarjeta.classList.toggle(
            "seleccionada",
            !estaAbierto
        );

        boton.innerHTML = !estaAbierto
            ? `
                <i class="fa-solid fa-chevron-up"></i>
                Ocultar detalles
            `
            : `
                <i class="fa-regular fa-eye"></i>
                Ver detalles
            `;

        detalles.setAttribute(
            "aria-hidden",
            String(estaAbierto)
        );

    }


    function cerrarDetallesOtrasTarjetas(
        tarjetaActual
    ) {

        tarjetas.forEach((tarjeta) => {

            if (tarjeta === tarjetaActual) {
                return;
            }

            tarjeta.classList.remove(
                "detalles-abiertos",
                "seleccionada"
            );

            const botonDetalles = tarjeta.querySelector(
                '[data-accion="detalles"]'
            );

            if (botonDetalles) {

                botonDetalles.innerHTML = `
                    <i class="fa-regular fa-eye"></i>
                    Ver detalles
                `;

            }

        });

    }


    /*==================================================
                 MODAL DE CONFIRMACIÓN GENERAL
    ==================================================*/

    function crearModalConfirmacion() {

        const overlay = document.createElement("div");

        overlay.className = "modal-viaje-overlay";

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        overlay.innerHTML = `
            <section
                class="modal-viaje"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalViajeTitulo"
            >

                <span class="modal-icono">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </span>

                <h2 id="modalViajeTitulo">

                    Confirmar acción

                </h2>

                <p id="modalViajeMensaje">

                    ¿Deseas continuar?

                </p>

                <div class="modal-acciones">

                    <button
                        type="button"
                        class="modal-btn modal-btn-cancelar"
                        data-modal-cancelar
                    >

                        Regresar

                    </button>

                    <button
                        type="button"
                        class="modal-btn modal-btn-confirmar"
                        data-modal-confirmar
                    >

                        Confirmar

                    </button>

                </div>

            </section>
        `;

        document.body.appendChild(overlay);

        return overlay;

    }


    const modal = crearModalConfirmacion();

    const modalTitulo = modal.querySelector(
        "#modalViajeTitulo"
    );

    const modalMensaje = modal.querySelector(
        "#modalViajeMensaje"
    );

    const modalConfirmar = modal.querySelector(
        "[data-modal-confirmar]"
    );

    const modalCancelar = modal.querySelector(
        "[data-modal-cancelar]"
    );


    function abrirModal({
        titulo,
        mensaje,
        textoConfirmar = "Confirmar",
        accion,
    }) {

        accionPendiente = accion;

        modalTitulo.textContent = titulo;
        modalMensaje.textContent = mensaje;
        modalConfirmar.textContent = textoConfirmar;

        modal.classList.add("abierto");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";

        window.setTimeout(() => {

            modalCancelar.focus();

        }, 100);

    }


    function cerrarModal() {

        modal.classList.remove("abierto");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";

        accionPendiente = null;

    }


    modalCancelar.addEventListener(
        "click",
        cerrarModal
    );


    modal.addEventListener("click", (evento) => {

        if (evento.target === modal) {

            cerrarModal();

        }

    });


    modalConfirmar.addEventListener(
        "click",
        async () => {

            if (
                typeof accionPendiente
                !== "function"
            ) {

                cerrarModal();

                return;

            }

            const accion = accionPendiente;

            modalConfirmar.disabled = true;

            modalConfirmar.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Procesando
            `;

            try {

                await accion();

                cerrarModal();

            } catch (error) {

                console.error(error);

                mostrarToast(
                    "No fue posible completar la acción.",
                    "error"
                );

            } finally {

                modalConfirmar.disabled = false;

                modalConfirmar.textContent =
                    "Confirmar";

            }

        }
    );


    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key === "Escape"
                && modal.classList.contains("abierto")
            ) {

                cerrarModal();

            }

        }
    );


    /*==================================================
                 UTILIDADES DE NAVEGACIÓN
    ==================================================*/

    function obtenerUrlBoton(boton) {

        return boton.dataset.url?.trim() || "";

    }


    function navegarAUrl(url) {

        if (!url) {

            mostrarToast(
                "Esta función todavía no tiene una ruta configurada.",
                "info"
            );

            return;

        }

        window.location.href = url;

    }


    function bloquearBoton(
        boton,
        texto = "Cargando..."
    ) {

        if (!boton) {
            return;
        }

        boton.disabled = true;

        boton.dataset.contenidoOriginal =
            boton.innerHTML;

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${escaparHtml(texto)}
        `;

    }


    function restaurarBoton(boton) {

        if (!boton) {
            return;
        }

        boton.disabled = false;

        if (boton.dataset.contenidoOriginal) {

            boton.innerHTML =
                boton.dataset.contenidoOriginal;

            delete boton.dataset.contenidoOriginal;

        }

    }


    /*==================================================
                    ACCIONES DEL VIAJE
    ==================================================*/

    function gestionarAccion(boton) {

        const accion = boton.dataset.accion;
        const viajeId = boton.dataset.viajeId;
        const tarjeta = boton.closest(".viaje-card");
        const url = obtenerUrlBoton(boton);

        if (!accion || !tarjeta) {
            return;
        }

        switch (accion) {

            case "detalles":

                alternarDetalles(
                    tarjeta,
                    boton
                );

                break;


            case "editar":

                navegarAUrl(url);

                break;


            case "duplicar":

                abrirModal({

                    titulo:
                        "Duplicar viaje",

                    mensaje:
                        "Se creará un nuevo viaje usando los datos de este recorrido. Después podrás cambiar la fecha y la hora.",

                    textoConfirmar:
                        "Duplicar",

                    accion: async () => {

                        if (url) {

                            navegarAUrl(url);

                            return;

                        }

                        mostrarToast(
                            `La duplicación del viaje #${viajeId} se conectará posteriormente.`,
                            "info"
                        );

                    },

                });

                break;


            case "iniciar":

                abrirModal({

                    titulo:
                        "Iniciar viaje",

                    mensaje:
                        "Al iniciar el recorrido, el viaje cambiará a En curso y los pasajeros podrán acceder al seguimiento y al chat.",

                    textoConfirmar:
                        "Iniciar viaje",

                    accion: async () => {

                        if (url) {

                            navegarAUrl(url);

                            return;

                        }

                        mostrarToast(
                            `El inicio del viaje #${viajeId} se conectará cuando creemos Ride en progreso.`,
                            "info"
                        );

                    },

                });

                break;


            case "continuar":

                bloquearBoton(
                    boton,
                    "Abriendo"
                );

                if (url) {

                    navegarAUrl(url);

                } else {

                    window.setTimeout(() => {

                        restaurarBoton(boton);

                        mostrarToast(
                            "La página de viaje en progreso todavía no está conectada.",
                            "info"
                        );

                    }, 550);

                }

                break;


            default:

                mostrarToast(
                    "Acción no reconocida.",
                    "error"
                );

        }

    }


    botonesAccion.forEach((boton) => {

        boton.addEventListener(
            "click",
            () => gestionarAccion(boton)
        );

    });


    /*==================================================
                         UTILIDADES
    ==================================================*/

    function obtenerNombreEstado(estado) {

        const nombres = {

            borrador:
                "Borrador",

            disponible:
                "Disponible",

            completo:
                "Completo",

            en_curso:
                "En curso",

            finalizado:
                "Finalizado",

            cancelado:
                "Cancelado",

        };

        return nombres[estado]
            || estado
            || "Desconocido";

    }


    function escaparHtml(valor) {

        const elemento =
            document.createElement("div");

        elemento.textContent =
            String(valor ?? "");

        return elemento.innerHTML;

    }


    /*==================================================
        INICIAR MODAL PERSONALIZADO DE CANCELACIÓN
    ==================================================*/

    iniciarModalCancelarViaje();

});


/*==================================================
    MODAL PERSONALIZADO PARA CANCELAR VIAJE
==================================================*/

function iniciarModalCancelarViaje() {

    const modal =
        document.getElementById(
            "modalCancelarViaje"
        );

    const botonesAbrir =
        document.querySelectorAll(
            ".btn-abrir-cancelacion"
        );

    const botonCerrar =
        document.getElementById(
            "btnCerrarCancelar"
        );

    const botonNoCancelar =
        document.getElementById(
            "btnNoCancelar"
        );

    const formulario =
        document.getElementById(
            "formCancelarViaje"
        );

    const botonConfirmar =
        document.getElementById(
            "btnConfirmarCancelacion"
        );

    const textoOrigen =
        document.getElementById(
            "modalCancelarOrigen"
        );

    const textoDestino =
        document.getElementById(
            "modalCancelarDestino"
        );


    if (!modal || !formulario) {

        return;

    }


    function abrirModal(boton) {

        const url =
            boton.dataset.cancelarUrl
                ?.trim()
            || "";

        const origen =
            boton.dataset.viajeOrigen
            || "Sin origen";

        const destino =
            boton.dataset.viajeDestino
            || "Sin destino";


        if (!url) {

            console.error(
                "El botón de cancelación no tiene data-cancelar-url."
            );

            return;

        }


        formulario.action =
            url;


        if (botonConfirmar) {

            botonConfirmar.disabled =
                false;

            botonConfirmar.innerHTML = `

                <i class="fa-solid fa-ban"></i>

                Sí, cancelar viaje

            `;

        }


        if (textoOrigen) {

            textoOrigen.textContent =
                origen;

        }


        if (textoDestino) {

            textoDestino.textContent =
                destino;

        }


        modal.classList.add(
            "activo"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-cancelar-abierto"
        );


        botonNoCancelar?.focus();

    }


    function cerrarModal() {

        modal.classList.remove(
            "activo"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-cancelar-abierto"
        );


        formulario.removeAttribute(
            "action"
        );


        if (botonConfirmar) {

            botonConfirmar.disabled =
                false;

            botonConfirmar.innerHTML = `

                <i class="fa-solid fa-ban"></i>

                Sí, cancelar viaje

            `;

        }

    }


    botonesAbrir.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                function () {

                    abrirModal(
                        boton
                    );

                }
            );

        }
    );


    botonCerrar?.addEventListener(
        "click",
        cerrarModal
    );


    botonNoCancelar?.addEventListener(
        "click",
        cerrarModal
    );


    modal.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target === modal
            ) {

                cerrarModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape"
                && modal.classList.contains(
                    "activo"
                )
            ) {

                cerrarModal();

            }

        }
    );


    formulario.addEventListener(
        "submit",
        function (evento) {

            const action =
                formulario.getAttribute(
                    "action"
                );


            if (!action) {

                evento.preventDefault();

                console.error(
                    "El formulario de cancelación no tiene una URL válida."
                );

                return;

            }


            if (botonConfirmar) {

                botonConfirmar.disabled =
                    true;

                botonConfirmar.innerHTML = `

                    <i class="fa-solid fa-spinner fa-spin"></i>

                    Cancelando...

                `;

            }

        }
    );

}