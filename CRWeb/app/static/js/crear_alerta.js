"use strict";


document.addEventListener("DOMContentLoaded", function () {

    const formulario =
        document.getElementById("alertaForm");

    const tipoAlerta =
        document.getElementById("tipoAlerta");

    const descripcion =
        document.getElementById("descripcionAlerta");

    const contador =
        document.getElementById("contadorDescripcion");

    const botonUbicacion =
        document.getElementById("obtenerUbicacion");

    const estadoUbicacion =
        document.getElementById("estadoUbicacion");

    const latitudInput =
        document.getElementById("latitud");

    const longitudInput =
        document.getElementById("longitud");

    const bloqueUbicacion =
        document.querySelector(".ubicacion-alerta");

    const botonEnviar =
        document.getElementById("enviarAlerta");


    /* =====================================================
       CONTADOR DE CARACTERES
    ====================================================== */

    function actualizarContador() {

        if (!descripcion || !contador) {
            return;
        }

        const cantidad =
            descripcion.value.length;

        contador.textContent =
            String(cantidad);

        const contenedor =
            contador.closest(
                ".contador-caracteres"
            );

        if (!contenedor) {
            return;
        }

        contenedor.classList.remove(
            "limite-cercano",
            "limite-alcanzado"
        );

        if (cantidad >= 1000) {

            contenedor.classList.add(
                "limite-alcanzado"
            );

        } else if (cantidad >= 850) {

            contenedor.classList.add(
                "limite-cercano"
            );

        }

    }


    if (descripcion) {

        descripcion.addEventListener(
            "input",
            actualizarContador
        );

        actualizarContador();

    }


    /* =====================================================
       ESTADOS VISUALES DE UBICACIÓN
    ====================================================== */

    function limpiarEstadoUbicacion() {

        if (!bloqueUbicacion) {
            return;
        }

        bloqueUbicacion.classList.remove(
            "ubicacion-obtenida",
            "ubicacion-error"
        );

    }


    function marcarUbicacionObtenida(
        latitud,
        longitud
    ) {

        limpiarEstadoUbicacion();

        if (bloqueUbicacion) {

            bloqueUbicacion.classList.add(
                "ubicacion-obtenida"
            );

        }

        if (estadoUbicacion) {

            estadoUbicacion.textContent =
                `Ubicación obtenida: ` +
                `${latitud.toFixed(6)}, ` +
                `${longitud.toFixed(6)}`;

        }

        if (botonUbicacion) {

            botonUbicacion.disabled = false;

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-rotate"></i>
                Actualizar ubicación
            `;

        }

    }


    function marcarErrorUbicacion(mensaje) {

        limpiarEstadoUbicacion();

        if (bloqueUbicacion) {

            bloqueUbicacion.classList.add(
                "ubicacion-error"
            );

        }

        if (estadoUbicacion) {

            estadoUbicacion.textContent =
                mensaje;

        }

        if (botonUbicacion) {

            botonUbicacion.disabled = false;

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                Intentar nuevamente
            `;

        }

    }


    /* =====================================================
       OBTENER UBICACIÓN
    ====================================================== */

    function obtenerUbicacionActual() {

        if (!navigator.geolocation) {

            marcarErrorUbicacion(
                "Tu navegador no permite obtener la ubicación."
            );

            return;

        }

        limpiarEstadoUbicacion();

        if (estadoUbicacion) {

            estadoUbicacion.textContent =
                "Obteniendo tu ubicación actual...";

        }

        if (botonUbicacion) {

            botonUbicacion.disabled = true;

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Obteniendo ubicación...
            `;

        }


        navigator.geolocation.getCurrentPosition(

            function (posicion) {

                const latitud =
                    posicion.coords.latitude;

                const longitud =
                    posicion.coords.longitude;

                if (latitudInput) {

                    latitudInput.value =
                        latitud.toFixed(7);

                }

                if (longitudInput) {

                    longitudInput.value =
                        longitud.toFixed(7);

                }

                marcarUbicacionObtenida(
                    latitud,
                    longitud
                );

            },

            function (error) {

                let mensaje =
                    "No fue posible obtener la ubicación.";

                switch (error.code) {

                    case error.PERMISSION_DENIED:

                        mensaje =
                            "No autorizaste el acceso a tu ubicación.";

                        break;

                    case error.POSITION_UNAVAILABLE:

                        mensaje =
                            "Tu ubicación actual no está disponible.";

                        break;

                    case error.TIMEOUT:

                        mensaje =
                            "La solicitud de ubicación tardó demasiado.";

                        break;

                    default:

                        mensaje =
                            "Ocurrió un error al obtener tu ubicación.";

                }

                marcarErrorUbicacion(
                    mensaje
                );

            },

            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 30000
            }

        );

    }


    if (botonUbicacion) {

        botonUbicacion.addEventListener(
            "click",
            obtenerUbicacionActual
        );

    }


    /* =====================================================
       RESTAURAR UBICACIÓN EXISTENTE
    ====================================================== */

    if (
        latitudInput &&
        longitudInput &&
        latitudInput.value &&
        longitudInput.value
    ) {

        const latitud =
            Number(latitudInput.value);

        const longitud =
            Number(longitudInput.value);

        if (
            Number.isFinite(latitud) &&
            Number.isFinite(longitud)
        ) {

            marcarUbicacionObtenida(
                latitud,
                longitud
            );

        }

    }


    /* =====================================================
       VALIDACIÓN CLIENTE
    ====================================================== */

    function validarFormulario() {

        const errores = [];

        if (
            !tipoAlerta ||
            !tipoAlerta.value
        ) {

            errores.push(
                "Selecciona el tipo de emergencia."
            );

        }

        if (
            !descripcion ||
            !descripcion.value.trim()
        ) {

            errores.push(
                "Describe brevemente lo que está ocurriendo."
            );

        }

        if (
            descripcion &&
            descripcion.value.trim().length > 1000
        ) {

            errores.push(
                "La descripción no puede superar 1000 caracteres."
            );

        }

        return errores;

    }


    /* =====================================================
       MODAL DE CONFIRMACIÓN
    ====================================================== */

    function cerrarModal() {

        const overlay =
            document.querySelector(
                ".modal-alerta-overlay"
            );

        if (!overlay) {
            return;
        }

        overlay.classList.remove(
            "activo"
        );

        document.body.style.overflow = "";

        window.setTimeout(
            function () {

                overlay.remove();

            },
            250
        );

    }


    function abrirModalConfirmacion() {

        cerrarModal();

        const tipoTexto =
            tipoAlerta
                ? tipoAlerta.options[
                    tipoAlerta.selectedIndex
                ]?.text || "Sin seleccionar"
                : "Sin seleccionar";

        const tieneUbicacion =
            Boolean(
                latitudInput?.value &&
                longitudInput?.value
            );

        const overlay =
            document.createElement("div");

        overlay.className =
            "modal-alerta-overlay";

        overlay.innerHTML = `

            <div
                class="modal-alerta"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalAlertaTitulo"
            >

                <div class="modal-alerta-icono">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <h2 id="modalAlertaTitulo">
                    ¿Enviar alerta de emergencia?
                </h2>

                <p>
                    La alerta será registrada y quedará visible
                    para el equipo encargado de atender incidentes.
                </p>

                <div class="modal-alerta-resumen">

                    <span>
                        <strong>Tipo:</strong>
                        ${escaparHtml(tipoTexto)}
                    </span>

                    <span>
                        <strong>Ubicación:</strong>
                        ${
                            tieneUbicacion
                                ? "Incluida"
                                : "No incluida"
                        }
                    </span>

                </div>

                <div class="modal-alerta-acciones">

                    <button
                        type="button"
                        class="modal-btn-cancelar"
                        data-modal-action="cancelar"
                    >
                        Regresar
                    </button>

                    <button
                        type="button"
                        class="modal-btn-confirmar"
                        data-modal-action="confirmar"
                    >
                        <i class="fa-solid fa-bell"></i>
                        Enviar alerta
                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(
            overlay
        );

        document.body.style.overflow =
            "hidden";

        const botonCancelar =
            overlay.querySelector(
                '[data-modal-action="cancelar"]'
            );

        const botonConfirmar =
            overlay.querySelector(
                '[data-modal-action="confirmar"]'
            );


        botonCancelar?.addEventListener(
            "click",
            cerrarModal
        );


        botonConfirmar?.addEventListener(
            "click",
            function () {

                cerrarModal();

                enviarFormulario();

            }
        );


        overlay.addEventListener(
            "click",
            function (evento) {

                if (evento.target === overlay) {

                    cerrarModal();

                }

            }
        );


        requestAnimationFrame(
            function () {

                overlay.classList.add(
                    "activo"
                );

                botonCancelar?.focus();

            }
        );

    }


    /* =====================================================
       ENVIAR FORMULARIO
    ====================================================== */

    let enviandoFormulario = false;


    function enviarFormulario() {

        if (
            !formulario ||
            enviandoFormulario
        ) {
            return;
        }

        enviandoFormulario = true;

        if (botonEnviar) {

            botonEnviar.disabled = true;

            botonEnviar.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Enviando alerta...
            `;

        }

        /*
         * requestSubmit permite conservar la validación
         * nativa del formulario. En este punto ya se
         * confirmó el envío, así que utilizamos submit()
         * para evitar volver a disparar este listener.
         */

        formulario.submit();

    }


    if (formulario) {

        formulario.addEventListener(
            "submit",
            function (evento) {

                if (enviandoFormulario) {
                    return;
                }

                evento.preventDefault();

                const errores =
                    validarFormulario();

                if (errores.length) {

                    mostrarMensajeValidacion(
                        errores[0]
                    );

                    return;

                }

                abrirModalConfirmacion();

            }
        );

    }


    /* =====================================================
       MENSAJE DE VALIDACIÓN
    ====================================================== */

    function mostrarMensajeValidacion(mensaje) {

        let contenedor =
            document.querySelector(
                ".mensaje-validacion-cliente"
            );

        if (!contenedor) {

            contenedor =
                document.createElement("div");

            contenedor.className =
                "mensaje mensaje-validacion-cliente error";

            const formularioActual =
                document.getElementById(
                    "alertaForm"
                );

            formularioActual?.prepend(
                contenedor
            );

        }

        contenedor.innerHTML = `

            <i class="fa-solid fa-circle-exclamation"></i>

            <span>
                ${escaparHtml(mensaje)}
            </span>

        `;

        contenedor.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /* =====================================================
       ESCAPAR TEXTO
    ====================================================== */

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


    /* =====================================================
       CERRAR MODAL CON ESCAPE
    ====================================================== */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                document.querySelector(
                    ".modal-alerta-overlay.activo"
                )
            ) {

                cerrarModal();

            }

        }
    );

});