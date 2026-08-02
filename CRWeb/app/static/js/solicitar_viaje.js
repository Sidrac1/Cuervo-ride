"use strict";


document.addEventListener("DOMContentLoaded", function () {

    /*==================================================
        ELEMENTOS
    ==================================================*/

    const formulario =
        document.getElementById("formSolicitudViaje");

    const campoAsientos =
        document.getElementById("id_asientos_solicitados");

    const campoRecogida =
        document.getElementById("id_punto_recogida");

    const campoDescenso =
        document.getElementById("id_punto_descenso");

    const campoComentario =
        document.getElementById("id_comentario");

    const campoAsistencia =
        document.getElementById("id_requiere_asistencia");

    const contadorComentario =
        document.getElementById("contadorComentario");

    const botonEnviar =
        document.getElementById("btnEnviarSolicitud");


    if (!formulario) {

        console.error(
            "No se encontró el formulario de solicitud."
        );

        return;

    }


    let enviandoFormulario = false;


    /*==================================================
        CONTADOR DEL COMENTARIO
    ==================================================*/

    function actualizarContadorComentario() {

        if (
            !campoComentario ||
            !contadorComentario
        ) {
            return;
        }


        const cantidad =
            campoComentario.value.length;


        contadorComentario.textContent =
            String(cantidad);


        const contenedor =
            contadorComentario.closest(
                ".contador-comentario"
            );


        if (!contenedor) {
            return;
        }


        contenedor.classList.remove(
            "limite-cercano",
            "limite-alcanzado"
        );


        if (cantidad >= 500) {

            contenedor.classList.add(
                "limite-alcanzado"
            );

        } else if (cantidad >= 425) {

            contenedor.classList.add(
                "limite-cercano"
            );

        }

    }


    if (campoComentario) {

        campoComentario.addEventListener(
            "input",
            actualizarContadorComentario
        );


        actualizarContadorComentario();

    }


    /*==================================================
        LIMPIAR ERRORES VISUALES
    ==================================================*/

    function limpiarErroresVisuales() {

        formulario
            .querySelectorAll(
                ".campo-invalido"
            )
            .forEach(
                function (campo) {

                    campo.classList.remove(
                        "campo-invalido"
                    );

                }
            );


        const mensaje =
            formulario.querySelector(
                ".mensaje-validacion-solicitud"
            );


        if (mensaje) {

            mensaje.remove();

        }

    }


    /*==================================================
        MARCAR CAMPO INVÁLIDO
    ==================================================*/

    function marcarCampoInvalido(
        campo
    ) {

        if (!campo) {
            return;
        }


        campo.classList.add(
            "campo-invalido"
        );

    }


    /*==================================================
        MOSTRAR MENSAJE
    ==================================================*/

    function mostrarMensajeValidacion(
        mensaje
    ) {

        let contenedor =
            formulario.querySelector(
                ".mensaje-validacion-solicitud"
            );


        if (!contenedor) {

            contenedor =
                document.createElement("div");


            contenedor.className =
                "mensaje-validacion-solicitud";


            formulario.prepend(
                contenedor
            );

        }


        contenedor.innerHTML = `

            <i class="fa-solid fa-circle-exclamation"></i>

            <span></span>

        `;


        const texto =
            contenedor.querySelector(
                "span"
            );


        if (texto) {

            texto.textContent =
                mensaje;

        }


        contenedor.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /*==================================================
        VALIDAR FORMULARIO
    ==================================================*/

    function validarFormulario() {

        limpiarErroresVisuales();


        const errores = [];


        /*------------------------------------------
            ASIENTOS
        ------------------------------------------*/

        if (campoAsientos) {

            const asientos =
                Number.parseInt(
                    campoAsientos.value,
                    10
                );


            const minimo =
                Number.parseInt(
                    campoAsientos.min || "1",
                    10
                );


            const maximo =
                Number.parseInt(
                    campoAsientos.max || "10",
                    10
                );


            if (
                !Number.isFinite(asientos) ||
                asientos < minimo
            ) {

                errores.push({
                    campo: campoAsientos,
                    mensaje:
                        "Debes solicitar al menos un lugar."
                });

            } else if (
                Number.isFinite(maximo) &&
                asientos > maximo
            ) {

                errores.push({
                    campo: campoAsientos,
                    mensaje:
                        `Solo puedes solicitar hasta ${maximo} lugar`
                        + `${maximo === 1 ? "" : "es"}.`
                });

            }

        }


        /*------------------------------------------
            PUNTO DE RECOGIDA
        ------------------------------------------*/

        if (
            campoRecogida &&
            campoRecogida.value.length > 255
        ) {

            errores.push({
                campo: campoRecogida,
                mensaje:
                    "El punto de recogida no puede superar "
                    + "los 255 caracteres."
            });

        }


        /*------------------------------------------
            PUNTO DE DESCENSO
        ------------------------------------------*/

        if (
            campoDescenso &&
            campoDescenso.value.length > 255
        ) {

            errores.push({
                campo: campoDescenso,
                mensaje:
                    "El punto de descenso no puede superar "
                    + "los 255 caracteres."
            });

        }


        /*------------------------------------------
            COMENTARIO
        ------------------------------------------*/

        if (
            campoComentario &&
            campoComentario.value.length > 500
        ) {

            errores.push({
                campo: campoComentario,
                mensaje:
                    "El comentario no puede superar "
                    + "los 500 caracteres."
            });

        }


        return errores;

    }


    /*==================================================
        CERRAR MODAL
    ==================================================*/

    function cerrarModal() {

        const overlay =
            document.querySelector(
                ".modal-solicitud-overlay"
            );


        if (!overlay) {
            return;
        }


        overlay.classList.remove(
            "activo"
        );


        document.body.style.overflow =
            "";


        window.setTimeout(
            function () {

                overlay.remove();

            },
            240
        );

    }


    /*==================================================
        ABRIR MODAL
    ==================================================*/

    function abrirModalConfirmacion() {

        cerrarModal();


        const cantidadAsientos =
            campoAsientos
                ? campoAsientos.value
                : "1";


        const asistencia =
            campoAsistencia &&
            campoAsistencia.checked
                ? "Sí"
                : "No";


        const puntoRecogida =
            campoRecogida &&
            campoRecogida.value.trim()
                ? campoRecogida.value.trim()
                : "No especificado";


        const puntoDescenso =
            campoDescenso &&
            campoDescenso.value.trim()
                ? campoDescenso.value.trim()
                : "No especificado";


        const overlay =
            document.createElement("div");


        overlay.className =
            "modal-solicitud-overlay";


        overlay.innerHTML = `

            <div
                class="modal-solicitud"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalSolicitudTitulo"
            >

                <div class="modal-solicitud-icono">

                    <i class="fa-solid fa-ticket"></i>

                </div>


                <h2 id="modalSolicitudTitulo">

                    ¿Enviar solicitud?

                </h2>


                <p>

                    El conductor recibirá tu solicitud y
                    decidirá si acepta los lugares solicitados.

                </p>


                <div class="modal-resumen">

                    <span>

                        <strong>Lugares:</strong>

                        ${escaparHtml(cantidadAsientos)}

                    </span>


                    <span>

                        <strong>Recogida:</strong>

                        ${escaparHtml(puntoRecogida)}

                    </span>


                    <span>

                        <strong>Descenso:</strong>

                        ${escaparHtml(puntoDescenso)}

                    </span>


                    <span>

                        <strong>Asistencia especial:</strong>

                        ${escaparHtml(asistencia)}

                    </span>

                </div>


                <div class="modal-solicitud-acciones">

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

                        <i class="fa-solid fa-paper-plane"></i>

                        Enviar solicitud

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


                botonCancelar?.focus();

            }
        );

    }


    /*==================================================
        ENVIAR FORMULARIO
    ==================================================*/

    function enviarFormulario() {

        if (enviandoFormulario) {
            return;
        }


        enviandoFormulario =
            true;


        if (botonEnviar) {

            botonEnviar.disabled =
                true;


            botonEnviar.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Enviando solicitud...

            `;

        }


        /*
         * Usamos submit() para evitar que se vuelva
         * a ejecutar el evento de confirmación.
         */

        formulario.submit();

    }


    /*==================================================
        EVENTO SUBMIT
    ==================================================*/

    formulario.addEventListener(
        "submit",
        function (evento) {

            if (enviandoFormulario) {
                return;
            }


            evento.preventDefault();


            const errores =
                validarFormulario();


            if (errores.length > 0) {

                errores.forEach(
                    function (error) {

                        marcarCampoInvalido(
                            error.campo
                        );

                    }
                );


                mostrarMensajeValidacion(
                    errores[0].mensaje
                );


                errores[0].campo?.focus();


                return;

            }


            abrirModalConfirmacion();

        }
    );


    /*==================================================
        LIMPIAR ERROR AL ESCRIBIR
    ==================================================*/

    [
        campoAsientos,
        campoRecogida,
        campoDescenso,
        campoComentario
    ].forEach(
        function (campo) {

            if (!campo) {
                return;
            }


            campo.addEventListener(
                "input",
                function () {

                    campo.classList.remove(
                        "campo-invalido"
                    );

                }
            );

        }
    );


    /*==================================================
        NORMALIZAR ASIENTOS
    ==================================================*/

    if (campoAsientos) {

        campoAsientos.addEventListener(
            "change",
            function () {

                const minimo =
                    Number.parseInt(
                        campoAsientos.min || "1",
                        10
                    );


                const maximo =
                    Number.parseInt(
                        campoAsientos.max || "10",
                        10
                    );


                let valor =
                    Number.parseInt(
                        campoAsientos.value,
                        10
                    );


                if (!Number.isFinite(valor)) {

                    valor = minimo;

                }


                valor =
                    Math.max(
                        minimo,
                        valor
                    );


                if (Number.isFinite(maximo)) {

                    valor =
                        Math.min(
                            maximo,
                            valor
                        );

                }


                campoAsientos.value =
                    String(valor);

            }
        );

    }


    /*==================================================
        CERRAR MODAL CON ESCAPE
    ==================================================*/

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                document.querySelector(
                    ".modal-solicitud-overlay.activo"
                )
            ) {

                cerrarModal();

            }

        }
    );


    /*==================================================
        EVITAR DOBLE CLIC
    ==================================================*/

    if (botonEnviar) {

        botonEnviar.addEventListener(
            "dblclick",
            function (evento) {

                evento.preventDefault();

            }
        );

    }


    /*==================================================
        ESCAPAR HTML
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