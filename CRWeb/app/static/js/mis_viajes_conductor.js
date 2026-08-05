"use strict";

/*==================================================
    MIS VIAJES DEL CONDUCTOR
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

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


    /*==================================================
        TOASTS
    ==================================================*/

    function obtenerContenedorToast() {

        let contenedor =
            document.querySelector(
                ".contenedor-toast"
            );

        if (contenedor) {

            return contenedor;

        }

        contenedor =
            document.createElement("div");

        contenedor.className =
            "contenedor-toast";

        contenedor.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(
            contenedor
        );

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

        const toast =
            document.createElement("div");

        toast.className =
            `toast-viaje ${tipo}`;

        toast.innerHTML = `
            <i class="fa-solid ${
                iconos[tipo] || iconos.info
            }"></i>

            <span></span>
        `;

        const texto =
            toast.querySelector("span");

        if (texto) {

            texto.textContent =
                mensaje;

        }

        obtenerContenedorToast()
            .appendChild(toast);

        window.requestAnimationFrame(
            () => {

                toast.classList.add(
                    "visible"
                );

            }
        );

        window.setTimeout(() => {

            toast.classList.remove(
                "visible"
            );

            window.setTimeout(() => {

                toast.remove();

            }, 260);

        }, duracion);

    }

/*==================================================
    MODAL DETALLES DEL VIAJE
==================================================*/

function iniciarModalDetallesViaje() {

    const modal =
        document.getElementById(
            "modalDetallesViaje"
        );

    const ventana =
        modal?.querySelector(
            ".modal-detalles-viaje"
        );

    const contenido =
        document.getElementById(
            "contenidoModalDetalles"
        );

    const cerrar =
        document.getElementById(
            "btnCerrarDetalles"
        );

    if (
        !modal ||
        !ventana ||
        !contenido
    ){

        return;

    }

    let botonActual = null;

    document.querySelectorAll(
        '[data-accion="detalles"]'
    ).forEach((boton)=>{

        boton.addEventListener(
            "click",
            (e)=>{

                e.preventDefault();

                const tarjeta =
                    boton.closest(
                        ".viaje-card"
                    );

                if(!tarjeta){

                    return;

                }

                const detalles =
                    tarjeta.querySelector(
                        ".detalles-expandibles-contenido"
                    );

                if(!detalles){

                    mostrarToast(
                        "No se encontraron detalles.",
                        "error"
                    );

                    return;

                }

                botonActual = boton;

                contenido.innerHTML =
                    detalles.innerHTML;

                modal.classList.add(
                    "activo"
                );

                modal.setAttribute(
                    "aria-hidden",
                    "false"
                );

                document.body.classList.add(
                    "modal-detalles-abierto"
                );

            }
        );

    });


    function cerrarModal(){

        modal.classList.remove(
            "activo"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-detalles-abierto"
        );

        contenido.innerHTML = "";

        if(botonActual){

            botonActual.focus();

            botonActual = null;

        }

    }

    cerrar?.addEventListener(
        "click",
        cerrarModal
    );

    modal.addEventListener(
        "click",
        (e)=>{

            if(e.target===modal){

                cerrarModal();

            }

        }
    );

    document.addEventListener(
        "keydown",
        (e)=>{

            if(
                e.key==="Escape"
                &&
                modal.classList.contains(
                    "activo"
                )
            ){

                cerrarModal();

            }

        }
    );

}

    /*==================================================
        MODAL GENERAL
    ==================================================*/

    function crearModalConfirmacion() {

        const modalExistente =
            document.querySelector(
                ".modal-viaje-overlay"
            );

        if (modalExistente) {

            return modalExistente;

        }

        const overlay =
            document.createElement("div");

        overlay.className =
            "modal-viaje-overlay";

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        overlay.innerHTML = `
            <section
                class="modal-viaje"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalViajeTitulo">

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
                        data-modal-cancelar>

                        Regresar

                    </button>

                    <button
                        type="button"
                        class="modal-btn modal-btn-confirmar"
                        data-modal-confirmar>

                        Confirmar

                    </button>

                </div>

            </section>
        `;

        document.body.appendChild(
            overlay
        );

        return overlay;

    }


    const modalGeneral =
        crearModalConfirmacion();

    const modalTitulo =
        modalGeneral.querySelector(
            "#modalViajeTitulo"
        );

    const modalMensaje =
        modalGeneral.querySelector(
            "#modalViajeMensaje"
        );

    const modalConfirmar =
        modalGeneral.querySelector(
            "[data-modal-confirmar]"
        );

    const modalCancelar =
        modalGeneral.querySelector(
            "[data-modal-cancelar]"
        );


    function abrirModalGeneral({
        titulo,
        mensaje,
        textoConfirmar = "Confirmar",
        accion,
    }) {

        accionPendiente =
            accion;

        if (modalTitulo) {

            modalTitulo.textContent =
                titulo;

        }

        if (modalMensaje) {

            modalMensaje.textContent =
                mensaje;

        }

        if (modalConfirmar) {

            modalConfirmar.disabled =
                false;

            modalConfirmar.textContent =
                textoConfirmar;

        }

        modalGeneral.classList.add(
            "abierto"
        );

        modalGeneral.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

        window.setTimeout(() => {

            modalCancelar?.focus();

        }, 100);

    }


    function cerrarModalGeneral() {

        modalGeneral.classList.remove(
            "abierto"
        );

        modalGeneral.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        accionPendiente =
            null;

    }


    modalCancelar?.addEventListener(
        "click",
        cerrarModalGeneral
    );


    modalGeneral.addEventListener(
        "click",
        (evento) => {

            if (
                evento.target
                === modalGeneral
            ) {

                cerrarModalGeneral();

            }

        }
    );


    modalConfirmar?.addEventListener(
        "click",
        async () => {

            if (
                typeof accionPendiente
                !== "function"
            ) {

                cerrarModalGeneral();

                return;

            }

            const accion =
                accionPendiente;

            modalConfirmar.disabled =
                true;

            modalConfirmar.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Procesando...
            `;

            try {

                await accion();

            } catch (error) {

                console.error(error);

                mostrarToast(
                    "No fue posible completar la acción.",
                    "error"
                );

                modalConfirmar.disabled =
                    false;

                modalConfirmar.textContent =
                    "Confirmar";

                return;

            }

            cerrarModalGeneral();

        }
    );


    /*==================================================
        NAVEGACIÓN
    ==================================================*/

    function obtenerUrlBoton(boton) {

        return (
            boton.dataset.url?.trim()
            || boton.getAttribute("href")?.trim()
            || ""
        );

    }


    function navegarAUrl(url) {

        if (!url) {

            mostrarToast(
                "Esta función todavía no tiene una ruta configurada.",
                "info"
            );

            return;

        }

        window.location.href =
            url;

    }


    function bloquearBoton(
        boton,
        texto = "Cargando..."
    ) {

        if (!boton) {

            return;

        }

        boton.dataset.contenidoOriginal =
            boton.innerHTML;

        if (
            boton.tagName
            === "BUTTON"
        ) {

            boton.disabled =
                true;

        }

        boton.classList.add(
            "cargando"
        );

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${escaparHtml(texto)}
        `;

    }


    function restaurarBoton(boton) {

        if (!boton) {

            return;

        }

        if (
            boton.tagName
            === "BUTTON"
        ) {

            boton.disabled =
                false;

        }

        boton.classList.remove(
            "cargando"
        );

        if (
            boton.dataset
                .contenidoOriginal
        ) {

            boton.innerHTML =
                boton.dataset
                    .contenidoOriginal;

            delete boton.dataset
                .contenidoOriginal;

        }

    }


    /*==================================================
        ACCIONES DE VIAJE
    ==================================================*/

    function gestionarAccion(boton) {

        const accion =
            boton.dataset.accion;

        const viajeId =
            boton.dataset.viajeId;

        const tarjeta =
            boton.closest(
                ".viaje-card"
            );

        const url =
            obtenerUrlBoton(
                boton
            );

        if (
            !accion
            || !tarjeta
        ) {

            return;

        }

        switch (accion) {


            case "editar":

                navegarAUrl(
                    url
                );

                break;


            case "duplicar":

                abrirModalGeneral({

                    titulo:
                        "Duplicar viaje",

                    mensaje:
                        "Se creará un nuevo viaje usando los datos de este recorrido. Después podrás cambiar la fecha y la hora.",

                    textoConfirmar:
                        "Duplicar",

                    accion:
                        async () => {

                            if (url) {

                                navegarAUrl(
                                    url
                                );

                                return;

                            }

                            mostrarToast(
                                `La duplicación del viaje #${viajeId} todavía no está conectada.`,
                                "info"
                            );

                        },

                });

                break;


            case "iniciar":

                abrirModalGeneral({

                    titulo:
                        "Iniciar viaje",

                    mensaje:
                        "El viaje cambiará al estado En curso y los pasajeros podrán acceder al seguimiento y al chat.",

                    textoConfirmar:
                        "Iniciar viaje",

                    accion:
                        async () => {

                            const formulario =
                                boton.closest(
                                    "form"
                                );

                            if (formulario) {

                                formulario.submit();

                                return;

                            }

                            if (url) {

                                navegarAUrl(
                                    url
                                );

                                return;

                            }

                            mostrarToast(
                                `No se encontró la acción para iniciar el viaje #${viajeId}.`,
                                "error"
                            );

                        },

                });

                break;


            case "continuar":

                bloquearBoton(
                    boton,
                    "Abriendo..."
                );

                if (url) {

                    navegarAUrl(
                        url
                    );

                    return;

                }

                window.setTimeout(() => {

                    restaurarBoton(
                        boton
                    );

                    mostrarToast(
                        "La página del viaje en progreso no tiene una ruta configurada.",
                        "info"
                    );

                }, 550);

                break;


            default:

                mostrarToast(
                    "Acción no reconocida.",
                    "error"
                );

        }

    }


    botonesAccion.forEach((boton)=>{

    if(
        boton.dataset.accion==="detalles"
    ){

        return;

    }

    boton.addEventListener(
                "click",
                (evento) => {

                    const accion =
                        boton.dataset.accion;

                    if (
                        accion === "iniciar"
                        && boton.closest("form")
                    ) {

                        evento.preventDefault();

                    }

                    gestionarAccion(
                        boton
                    );

                }
            );

        }
    );


    /*==================================================
        TECLADO
    ==================================================*/

    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key
                !== "Escape"
            ) {

                return;

            }

            if (
                modalGeneral.classList
                    .contains("abierto")
            ) {

                cerrarModalGeneral();

                return;

            }

        }
    );


    /*==================================================
        UTILIDADES
    ==================================================*/

    function escaparHtml(valor) {

        const elemento =
            document.createElement(
                "div"
            );

        elemento.textContent =
            String(valor ?? "");

        return elemento.innerHTML;

    }


    /*==================================================
        INICIALIZACIÓN
    ==================================================*/

    animarTarjetas();

    iniciarModalDetallesViaje();

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

    let ultimoBotonActivo =
        null;


    if (
        !modal
        || !formulario
    ) {

        return;

    }


    function restablecerBotonConfirmar() {

        if (!botonConfirmar) {

            return;

        }

        botonConfirmar.disabled =
            false;

        botonConfirmar.innerHTML = `
            <i class="fa-solid fa-ban"></i>
            Sí, cancelar viaje
        `;

    }


    function abrirModal(boton) {

        const url =
            boton.dataset
                .cancelarUrl
                ?.trim()
            || "";

        const origen =
            boton.dataset
                .viajeOrigen
            || "Sin origen";

        const destino =
            boton.dataset
                .viajeDestino
            || "Sin destino";

        if (!url) {

            console.error(
                "El botón no tiene data-cancelar-url."
            );

            return;

        }

        ultimoBotonActivo =
            boton;

        formulario.setAttribute(
            "action",
            url
        );

        if (textoOrigen) {

            textoOrigen.textContent =
                origen;

        }

        if (textoDestino) {

            textoDestino.textContent =
                destino;

        }

        restablecerBotonConfirmar();

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

        window.setTimeout(() => {

            botonNoCancelar?.focus();

        }, 100);

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

        restablecerBotonConfirmar();

        ultimoBotonActivo?.focus();

        ultimoBotonActivo =
            null;

    }


    botonesAbrir.forEach(
        (boton) => {

            boton.addEventListener(
                "click",
                () => {

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
        (evento) => {

            if (
                evento.target
                === modal
            ) {

                cerrarModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key === "Escape"
                && modal.classList
                    .contains("activo")
            ) {

                cerrarModal();

            }

        }
    );


    formulario.addEventListener(
        "submit",
        (evento) => {

            const action =
                formulario.getAttribute(
                    "action"
                );

            if (!action) {

                evento.preventDefault();

                console.error(
                    "El formulario no tiene una URL de cancelación válida."
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