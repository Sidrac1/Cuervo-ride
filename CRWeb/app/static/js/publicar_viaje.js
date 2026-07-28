"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById(
        "formPublicarViaje"
    );

    if (!formulario) {
        return;
    }

    const botonPublicar = document.getElementById(
        "btnPublicarViaje"
    );

    const textoBoton = botonPublicar?.querySelector(
        ".btn-texto"
    );

    const cargandoBoton = botonPublicar?.querySelector(
        ".btn-cargando"
    );

    const indicaciones = document.getElementById(
        "id_indicaciones"
    );

    const contadorIndicaciones = document.getElementById(
        "contadorIndicaciones"
    );

    const fechaSalida = document.getElementById(
        "id_fecha_hora_salida"
    );

    const fechaLlegada = document.getElementById(
        "id_fecha_hora_llegada_estimada"
    );

    const asientos = document.getElementById(
        "id_asientos_totales"
    );

    const vehiculo = document.getElementById(
        "id_vehiculo"
    );

    let enviando = false;

    /*==================================================
                      CONTADOR DE TEXTO
    ==================================================*/

    function actualizarContador() {
        if (
            !indicaciones
            || !contadorIndicaciones
        ) {
            return;
        }

        contadorIndicaciones.textContent =
            indicaciones.value.length;
    }

    indicaciones?.addEventListener(
        "input",
        actualizarContador
    );

    actualizarContador();

    /*==================================================
                  FECHA MÍNIMA DE SALIDA
    ==================================================*/

    function formatearFechaLocal(fecha) {
        const compensacion =
            fecha.getTimezoneOffset() * 60000;

        return new Date(
            fecha.getTime() - compensacion
        )
            .toISOString()
            .slice(0, 16);
    }

    function configurarFechaMinima() {
        if (!fechaSalida) {
            return;
        }

        const ahora = new Date();

        fechaSalida.min =
            formatearFechaLocal(ahora);

        if (fechaLlegada) {
            fechaLlegada.min =
                fechaSalida.value
                || fechaSalida.min;
        }
    }

    fechaSalida?.addEventListener(
        "change",
        () => {
            if (!fechaLlegada) {
                return;
            }

            fechaLlegada.min =
                fechaSalida.value;

            if (
                fechaLlegada.value
                && fechaLlegada.value
                <= fechaSalida.value
            ) {
                fechaLlegada.value = "";
            }
        }
    );

    configurarFechaMinima();

    /*==================================================
                     MENSAJES DE ERROR
    ==================================================*/

    function eliminarErrorCliente(campo) {
        const contenedor = campo.closest(
            ".campo-formulario"
        );

        campo.classList.remove(
            "campo-invalido"
        );

        contenedor
            ?.querySelector(
                ".error-cliente"
            )
            ?.remove();
    }

    function mostrarErrorCliente(
        campo,
        mensaje
    ) {
        eliminarErrorCliente(campo);

        campo.classList.add(
            "campo-invalido"
        );

        const error = document.createElement(
            "span"
        );

        error.className =
            "error-campo error-cliente";

        error.textContent = mensaje;

        const contenedor = campo.closest(
            ".campo-formulario"
        );

        contenedor?.appendChild(error);
    }

    function validarCampoObligatorio(
        campo,
        mensaje
    ) {
        if (!campo || campo.value.trim()) {
            return true;
        }

        mostrarErrorCliente(
            campo,
            mensaje
        );

        return false;
    }

    /*==================================================
                    VALIDACIÓN GENERAL
    ==================================================*/

    function validarFormulario() {
        let valido = true;
        let primerCampoInvalido = null;

        formulario.querySelectorAll(
            ".error-cliente"
        ).forEach((error) => error.remove());

        formulario.querySelectorAll(
            ".campo-invalido"
        ).forEach((campo) => {
            campo.classList.remove(
                "campo-invalido"
            );
        });

        const camposObligatorios = [
            {
                campo: vehiculo,
                mensaje:
                    "Selecciona el vehículo del viaje.",
            },
            {
                campo: document.getElementById(
                    "id_origen"
                ),
                mensaje:
                    "Selecciona un punto de origen.",
            },
            {
                campo: document.getElementById(
                    "id_destino"
                ),
                mensaje:
                    "Selecciona el destino.",
            },
            {
                campo: fechaSalida,
                mensaje:
                    "Selecciona la fecha y hora de salida.",
            },
            {
                campo: asientos,
                mensaje:
                    "Indica cuántos asientos ofrecerás.",
            },
        ];

        camposObligatorios.forEach((elemento) => {
            const campoValido =
                validarCampoObligatorio(
                    elemento.campo,
                    elemento.mensaje
                );

            if (!campoValido) {
                valido = false;

                primerCampoInvalido ??=
                    elemento.campo;
            }
        });

        const mapa = window.CUERVO_RIDE_MAPA;

        if (
            mapa
            && !mapa.tieneOrigen()
        ) {
            const campo = document.getElementById(
                "id_origen"
            );

            mostrarErrorCliente(
                campo,
                "Busca y selecciona un origen válido."
            );

            valido = false;
            primerCampoInvalido ??= campo;
        }

        if (
            mapa
            && !mapa.tieneDestino()
        ) {
            const campo = document.getElementById(
                "id_destino"
            );

            mostrarErrorCliente(
                campo,
                "Busca y selecciona un destino válido."
            );

            valido = false;
            primerCampoInvalido ??= campo;
        }

        if (
            fechaSalida?.value
            && new Date(fechaSalida.value)
            <= new Date()
        ) {
            mostrarErrorCliente(
                fechaSalida,
                "La salida debe programarse para una fecha futura."
            );

            valido = false;
            primerCampoInvalido ??=
                fechaSalida;
        }

        if (
            fechaLlegada?.value
            && fechaSalida?.value
            && fechaLlegada.value
            <= fechaSalida.value
        ) {
            mostrarErrorCliente(
                fechaLlegada,
                "La llegada debe ser posterior a la salida."
            );

            valido = false;
            primerCampoInvalido ??=
                fechaLlegada;
        }

        const cantidadAsientos = Number.parseInt(
            asientos?.value,
            10
        );

        if (
            asientos?.value
            && (
                !Number.isInteger(cantidadAsientos)
                || cantidadAsientos < 1
            )
        ) {
            mostrarErrorCliente(
                asientos,
                "Debes ofrecer al menos un asiento."
            );

            valido = false;
            primerCampoInvalido ??= asientos;
        }

        if (primerCampoInvalido) {
            primerCampoInvalido.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            primerCampoInvalido.focus();
        }

        return valido;
    }

    /*==================================================
                       ENVÍO DEL FORM
    ==================================================*/

    function establecerEstadoEnvio(cargando) {
        enviando = cargando;

        if (!botonPublicar) {
            return;
        }

        botonPublicar.disabled = cargando;

        if (textoBoton) {
            textoBoton.hidden = cargando;
        }

        if (cargandoBoton) {
            cargandoBoton.hidden = !cargando;
        }
    }

    formulario.addEventListener(
        "submit",
        (evento) => {
            if (enviando) {
                evento.preventDefault();
                return;
            }

            if (!validarFormulario()) {
                evento.preventDefault();
                return;
            }

            establecerEstadoEnvio(true);
        }
    );

    formulario.querySelectorAll(
        "input, select, textarea"
    ).forEach((campo) => {
        campo.addEventListener(
            "input",
            () => eliminarErrorCliente(campo)
        );

        campo.addEventListener(
            "change",
            () => eliminarErrorCliente(campo)
        );
    });

});