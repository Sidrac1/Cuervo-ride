document.addEventListener("DOMContentLoaded", function () {

    iniciarTabs();
    iniciarEdicionFormularios();
    abrirTabDesdeURL();

});


/*=========================================
    SISTEMA DE PESTAÑAS
=========================================*/

function iniciarTabs() {

    const botonesTabs =
        document.querySelectorAll(".menu-lateral .icon");

    const tabs =
        document.querySelectorAll(".tabs .tab");


    botonesTabs.forEach(function (boton) {

        boton.addEventListener("click", function () {

            const nombreTab =
                boton.dataset.tab;

            activarTab(
                nombreTab,
                botonesTabs,
                tabs
            );

        });

    });

}


/*=========================================
    ACTIVAR UNA PESTAÑA
=========================================*/

function activarTab(
    nombreTab,
    botonesTabs = document.querySelectorAll(".menu-lateral .icon"),
    tabs = document.querySelectorAll(".tabs .tab")
) {

    const tabDestino =
        document.getElementById(nombreTab);

    const botonDestino =
        document.querySelector(
            `.menu-lateral .icon[data-tab="${nombreTab}"]`
        );


    /*
        Si la pestaña no existe, detenemos la función.

        Esto puede pasar si un pasajero intenta abrir:

        ?tab=vehiculo

        pero esa pestaña solamente existe para conductores.
    */

    if (!tabDestino || !botonDestino) {

        return;

    }


    botonesTabs.forEach(function (boton) {

        boton.classList.remove("active");

    });


    tabs.forEach(function (tab) {

        tab.classList.remove("active");

    });


    botonDestino.classList.add("active");

    tabDestino.classList.add("active");

}


/*=========================================
    ABRIR PESTAÑA DESDE LA URL
=========================================*/

function abrirTabDesdeURL() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const nombreTab =
        parametros.get("tab");


    /*
        Si no hay una pestaña indicada en la URL,
        se conserva la pestaña activa del HTML.
    */

    if (!nombreTab) {

        return;

    }


    const tabDestino =
        document.getElementById(nombreTab);

    const botonDestino =
        document.querySelector(
            `.menu-lateral .icon[data-tab="${nombreTab}"]`
        );


    /*
        Si la pestaña solicitada no existe para ese usuario,
        abrimos la pestaña de datos personales.
    */

    if (!tabDestino || !botonDestino) {

        activarTab("datos");

        return;

    }


    activarTab(nombreTab);

}


/*=========================================
    EDICIÓN DE FORMULARIOS
=========================================*/

function iniciarEdicionFormularios() {

    const formularios =
        document.querySelectorAll(".tab form.formulario");


    formularios.forEach(function (formulario) {

        iniciarFormularioEditable(formulario);

    });

}


/*=========================================
    CONFIGURAR UN FORMULARIO
=========================================*/

function iniciarFormularioEditable(formulario) {

    const botonesEditar =
        formulario.querySelectorAll(".editar");

    const botonCancelar =
        formulario.querySelector(".cancelar");

    const contenedorBotones =
        formulario.querySelector(".botones");


    /*
        Guardamos una copia de los valores originales.

        Esto permite recuperar los datos al pulsar Cancelar.
    */

    guardarValoresOriginales(formulario);


    botonesEditar.forEach(function (botonEditar) {

        botonEditar.addEventListener(
            "click",
            function () {

                activarEdicion(
                    formulario,
                    botonEditar,
                    contenedorBotones
                );

            }
        );

    });


    if (botonCancelar) {

        botonCancelar.addEventListener(
            "click",
            function () {

                cancelarEdicion(
                    formulario,
                    contenedorBotones
                );

            }
        );

    }


    formulario.addEventListener(
        "submit",
        function () {

            habilitarCamposAntesDeEnviar(formulario);

        }
    );

}


/*=========================================
    GUARDAR VALORES ORIGINALES
=========================================*/

function guardarValoresOriginales(formulario) {

    const campos =
        formulario.querySelectorAll(
            "input, select, textarea"
        );


    campos.forEach(function (campo) {

        /*
            Los archivos no pueden recuperar automáticamente
            el archivo seleccionado por razones de seguridad.
        */

        if (campo.type === "file") {

            return;

        }


        if (
            campo.type === "checkbox" ||
            campo.type === "radio"
        ) {

            campo.dataset.valorOriginal =
                campo.checked
                    ? "true"
                    : "false";

            return;

        }


        campo.dataset.valorOriginal =
            campo.value;

    });

}


/*=========================================
    ACTIVAR EDICIÓN
=========================================*/

function activarEdicion(
    formulario,
    botonEditar,
    contenedorBotones
) {

    const inputBox =
        botonEditar.closest(".input-box");

    if (!inputBox) {

        return;

    }


    const campo =
        inputBox.querySelector(
            "input, select, textarea"
        );

    if (!campo) {

        return;

    }


    /*
        Para inputs normales se elimina readonly.

        Para select y campos file se elimina disabled.
    */

    if (
        campo.tagName === "SELECT" ||
        campo.type === "file"
    ) {

        campo.disabled = false;

    } else {

        campo.readOnly = false;

    }


    campo.classList.add("editando");


    if (
        campo.type !== "file" &&
        campo.type !== "date"
    ) {

        campo.focus();

        if (
            typeof campo.select === "function"
        ) {

            campo.select();

        }

    } else {

        campo.focus();

    }


    if (contenedorBotones) {

        contenedorBotones.classList.remove("oculto");

    }

}


/*=========================================
    CANCELAR EDICIÓN
=========================================*/

function cancelarEdicion(
    formulario,
    contenedorBotones
) {

    const campos =
        formulario.querySelectorAll(
            "input, select, textarea"
        );


    campos.forEach(function (campo) {

        /*
            Campos ocultos como CSRF y tipo_formulario
            no deben alterarse.
        */

        if (campo.type === "hidden") {

            return;

        }


        if (campo.type === "file") {

            campo.value = "";
            campo.disabled = true;
            campo.classList.remove("editando");

            return;

        }


        if (
            campo.type === "checkbox" ||
            campo.type === "radio"
        ) {

            campo.checked =
                campo.dataset.valorOriginal === "true";

        } else if (
            campo.dataset.valorOriginal !== undefined
        ) {

            campo.value =
                campo.dataset.valorOriginal;

        }


        /*
            El select de configuración debe conservar
            su comportamiento normal.

            Los demás select editables se bloquean.
        */

        if (campo.tagName === "SELECT") {

            if (
                formulario.id !== "formConfiguracion"
            ) {

                campo.disabled = true;

            }

        } else {

            campo.readOnly = true;

        }


        campo.classList.remove("editando");

    });


    if (contenedorBotones) {

        contenedorBotones.classList.add("oculto");

    }

}


/*=========================================
    HABILITAR CAMPOS ANTES DE ENVIAR
=========================================*/

function habilitarCamposAntesDeEnviar(formulario) {

    const campos =
        formulario.querySelectorAll(
            "input, select, textarea"
        );


    campos.forEach(function (campo) {

        /*
            Un campo disabled no se envía en el POST.

            Por eso se habilita justo antes de enviar
            el formulario.
        */

        if (campo.disabled) {

            campo.disabled = false;

        }

    });

}