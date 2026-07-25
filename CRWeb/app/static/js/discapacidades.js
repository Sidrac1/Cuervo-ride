// ======================================
// FORMULARIO DE INFORMACIÓN MÉDICA
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // ELEMENTOS PRINCIPALES
    // ======================================

    const radioDiscapacidadSi = document.getElementById("discapacidadSi");
    const radioDiscapacidadNo = document.getElementById("discapacidadNo");

    const datosDiscapacidad =
        document.getElementById("datosDiscapacidad");

    const apoyosDiscapacidad =
        document.getElementById("apoyosDiscapacidad");


    // ======================================
    // RADIOS DE DISCAPACIDAD
    // ======================================

    const vehiculoAdaptadoNo =
        document.getElementById("vehiculoAdaptadoNo");

    const cuidadosEspecialesNo =
        document.getElementById("cuidadosEspecialesNo");


    // ======================================
    // CAMPO OTRO APOYO
    // ======================================

    const checkboxOtroApoyo =
        document.getElementById("usaOtroApoyo");

    const campoOtroApoyo =
        document.getElementById("campoOtroApoyo");

    const inputOtroApoyo =
        document.getElementById("otroApoyo");


    // ======================================
    // VALIDACIÓN DE ELEMENTOS
    // ======================================

    if (
        !radioDiscapacidadSi ||
        !radioDiscapacidadNo ||
        !datosDiscapacidad ||
        !apoyosDiscapacidad
    ) {

        console.error(
            "No se encontraron todos los elementos del formulario médico."
        );

        return;

    }


    // ======================================
    // HABILITAR O DESHABILITAR CAMPOS
    // ======================================

    function habilitarCampos(contenedor, estado) {

        const elementos =
            contenedor.querySelectorAll("input, select, textarea");

        elementos.forEach((elemento) => {

            elemento.disabled = !estado;

        });

    }


    // ======================================
    // LIMPIAR CAMPOS
    // ======================================

    function limpiarCampos(contenedor) {

        const elementos =
            contenedor.querySelectorAll("input, select, textarea");

        elementos.forEach((elemento) => {

            if (
                elemento.type === "checkbox" ||
                elemento.type === "radio"
            ) {

                elemento.checked = false;

            } else {

                elemento.value = "";

            }

        });

    }


    // ======================================
    // RESTABLECER VALORES PREDETERMINADOS
    // ======================================

    function restablecerValoresDiscapacidad() {

        if (vehiculoAdaptadoNo) {

            vehiculoAdaptadoNo.checked = true;

        }

        if (cuidadosEspecialesNo) {

            cuidadosEspecialesNo.checked = true;

        }

    }


    // ======================================
    // CONTROLAR CAMPO "OTRO APOYO"
    // ======================================

    function actualizarOtroApoyo() {

        if (
            !checkboxOtroApoyo ||
            !campoOtroApoyo ||
            !inputOtroApoyo
        ) {

            return;

        }

        if (checkboxOtroApoyo.checked) {

            campoOtroApoyo.classList.remove("oculto");

            inputOtroApoyo.disabled = false;

            inputOtroApoyo.focus();

        } else {

            campoOtroApoyo.classList.add("oculto");

            inputOtroApoyo.value = "";

            inputOtroApoyo.disabled = true;

        }

    }


    // ======================================
    // MOSTRAR U OCULTAR SECCIONES
    // ======================================

    function actualizarFormulario() {

        if (radioDiscapacidadSi.checked) {

            // Mostrar secciones

            datosDiscapacidad.classList.remove("oculto");
            apoyosDiscapacidad.classList.remove("oculto");

            // Habilitar campos

            habilitarCampos(datosDiscapacidad, true);
            habilitarCampos(apoyosDiscapacidad, true);

            // El campo otro depende de su checkbox

            actualizarOtroApoyo();

        } else {

            // Limpiar datos

            limpiarCampos(datosDiscapacidad);
            limpiarCampos(apoyosDiscapacidad);

            // Restablecer radios en "No"

            restablecerValoresDiscapacidad();

            // Ocultar y deshabilitar otro apoyo

            if (checkboxOtroApoyo) {

                checkboxOtroApoyo.checked = false;

            }

            if (inputOtroApoyo) {

                inputOtroApoyo.value = "";
                inputOtroApoyo.disabled = true;

            }

            if (campoOtroApoyo) {

                campoOtroApoyo.classList.add("oculto");

            }

            // Deshabilitar secciones

            habilitarCampos(datosDiscapacidad, false);
            habilitarCampos(apoyosDiscapacidad, false);

            // Ocultar secciones

            datosDiscapacidad.classList.add("oculto");
            apoyosDiscapacidad.classList.add("oculto");

        }

    }


    // ======================================
    // EVENTOS
    // ======================================

    radioDiscapacidadSi.addEventListener(
        "change",
        actualizarFormulario
    );

    radioDiscapacidadNo.addEventListener(
        "change",
        actualizarFormulario
    );

    if (checkboxOtroApoyo) {

        checkboxOtroApoyo.addEventListener(
            "change",
            actualizarOtroApoyo
        );

    }


    // ======================================
    // ESTADO INICIAL
    // ======================================

    campoOtroApoyo?.classList.add("oculto");

    actualizarFormulario();

});