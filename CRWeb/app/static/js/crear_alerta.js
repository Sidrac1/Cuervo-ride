/*==================================================
                CREAR ALERTA
    Usado por pasajero y conductor
==================================================*/

document.addEventListener(
    "DOMContentLoaded",
    iniciarCrearAlerta
);


/*==================================================
                CONFIGURACIÓN
==================================================*/

const LIMITE_DESCRIPCION = 500;


/*==================================================
            INICIAR CREAR ALERTA
==================================================*/

function iniciarCrearAlerta() {

    const formulario = document.getElementById(
        "alertaForm"
    );

    const textareaDescripcion = document.getElementById(
        "descripcionAlerta"
    );

    const contadorDescripcion = document.getElementById(
        "contadorDescripcion"
    );

    const botonUbicacion = document.getElementById(
        "obtenerUbicacion"
    );

    const estadoUbicacion = document.getElementById(
        "estadoUbicacion"
    );

    const inputLatitud = document.getElementById(
        "latitud"
    );

    const inputLongitud = document.getElementById(
        "longitud"
    );

    const botonEnviar = document.getElementById(
        "enviarAlerta"
    );


    /*==================================================
            CONTADOR DE DESCRIPCIÓN
    ==================================================*/

    function actualizarContadorDescripcion() {

        if (
            !textareaDescripcion
            || !contadorDescripcion
        ) {

            return;

        }

        if (
            textareaDescripcion.value.length
            > LIMITE_DESCRIPCION
        ) {

            textareaDescripcion.value = (
                textareaDescripcion.value.slice(
                    0,
                    LIMITE_DESCRIPCION
                )
            );

        }

        const cantidadCaracteres = (
            textareaDescripcion.value.length
        );

        contadorDescripcion.textContent = (
            cantidadCaracteres
        );

        const contenedorContador = (
            contadorDescripcion.closest(
                ".contador-caracteres"
            )
        );

        if (contenedorContador) {

            contenedorContador.classList.toggle(
                "cerca-limite",
                cantidadCaracteres >= 450
                && cantidadCaracteres < LIMITE_DESCRIPCION
            );

            contenedorContador.classList.toggle(
                "limite-alcanzado",
                cantidadCaracteres
                >= LIMITE_DESCRIPCION
            );

        }

    }


    if (textareaDescripcion) {

        textareaDescripcion.setAttribute(
            "maxlength",
            String(LIMITE_DESCRIPCION)
        );

        textareaDescripcion.addEventListener(
            "input",
            actualizarContadorDescripcion
        );

        actualizarContadorDescripcion();

    }


    /*==================================================
            ACTUALIZAR ESTADO DE UBICACIÓN
    ==================================================*/

    function actualizarEstadoUbicacion(
        mensaje,
        estado = "normal"
    ) {

        if (!estadoUbicacion) {

            return;

        }

        estadoUbicacion.textContent = mensaje;

        estadoUbicacion.classList.remove(
            "ubicacion-cargando",
            "ubicacion-correcta",
            "ubicacion-error"
        );

        if (estado === "cargando") {

            estadoUbicacion.classList.add(
                "ubicacion-cargando"
            );

        } else if (estado === "correcta") {

            estadoUbicacion.classList.add(
                "ubicacion-correcta"
            );

        } else if (estado === "error") {

            estadoUbicacion.classList.add(
                "ubicacion-error"
            );

        }

    }


    /*==================================================
            ESTADO DEL BOTÓN DE UBICACIÓN
    ==================================================*/

    function cambiarEstadoBotonUbicacion(
        cargando
    ) {

        if (!botonUbicacion) {

            return;

        }

        botonUbicacion.disabled = cargando;

        if (cargando) {

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Obteniendo ubicación...
            `;

        } else {

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                Compartir ubicación
            `;

        }

    }


    /*==================================================
            GUARDAR COORDENADAS
    ==================================================*/

    function guardarCoordenadas(
        posicion
    ) {

        const latitud = (
            posicion.coords.latitude
        );

        const longitud = (
            posicion.coords.longitude
        );

        if (inputLatitud) {

            inputLatitud.value = (
                latitud.toFixed(7)
            );

        }

        if (inputLongitud) {

            inputLongitud.value = (
                longitud.toFixed(7)
            );

        }

        actualizarEstadoUbicacion(
            "Ubicación compartida correctamente.",
            "correcta"
        );

        cambiarEstadoBotonUbicacion(
            false
        );

        if (botonUbicacion) {

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                Ubicación compartida
            `;

            botonUbicacion.classList.add(
                "ubicacion-obtenida"
            );

        }

    }


    /*==================================================
            ERROR DE GEOLOCALIZACIÓN
    ==================================================*/

    function manejarErrorUbicacion(
        error
    ) {

        let mensaje = (
            "No fue posible obtener tu ubicación."
        );

        switch (error.code) {

            case error.PERMISSION_DENIED:

                mensaje = (
                    "No autorizaste el acceso a tu ubicación."
                );

                break;

            case error.POSITION_UNAVAILABLE:

                mensaje = (
                    "Tu ubicación no está disponible en este momento."
                );

                break;

            case error.TIMEOUT:

                mensaje = (
                    "La solicitud de ubicación tardó demasiado."
                );

                break;

            default:

                mensaje = (
                    "No fue posible obtener tu ubicación."
                );

        }

        actualizarEstadoUbicacion(
            mensaje,
            "error"
        );

        cambiarEstadoBotonUbicacion(
            false
        );

    }


    /*==================================================
            OBTENER UBICACIÓN
    ==================================================*/

    function obtenerUbicacionActual() {

        if (!navigator.geolocation) {

            actualizarEstadoUbicacion(
                (
                    "Tu navegador no permite "
                    + "compartir la ubicación."
                ),
                "error"
            );

            return;

        }

        cambiarEstadoBotonUbicacion(
            true
        );

        actualizarEstadoUbicacion(
            "Obteniendo tu ubicación actual...",
            "cargando"
        );

        navigator.geolocation.getCurrentPosition(
            guardarCoordenadas,
            manejarErrorUbicacion,
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            }
        );

    }


    if (botonUbicacion) {

        botonUbicacion.addEventListener(
            "click",
            obtenerUbicacionActual
        );

    }


    /*==================================================
            RESTAURAR UBICACIÓN PREVIA
    ==================================================*/

    if (
        inputLatitud
        && inputLongitud
        && inputLatitud.value
        && inputLongitud.value
    ) {

        actualizarEstadoUbicacion(
            "La ubicación ya está preparada para enviarse.",
            "correcta"
        );

        if (botonUbicacion) {

            botonUbicacion.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                Ubicación compartida
            `;

            botonUbicacion.classList.add(
                "ubicacion-obtenida"
            );

        }

    }


    /*==================================================
            MOSTRAR ERROR DEL FORMULARIO
    ==================================================*/

    function mostrarErrorFormulario(
        mensaje,
        elemento
    ) {

        let error = document.getElementById(
            "errorCrearAlerta"
        );

        if (!error) {

            error = document.createElement(
                "div"
            );

            error.id = "errorCrearAlerta";

            error.className = (
                "mensaje-alerta-formulario error"
            );

            if (formulario) {

                formulario.prepend(
                    error
                );

            }

        }

        error.innerHTML = `
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>${mensaje}</span>
        `;

        error.hidden = false;

        if (elemento) {

            elemento.focus();

        }

    }


    /*==================================================
            OCULTAR ERROR DEL FORMULARIO
    ==================================================*/

    function ocultarErrorFormulario() {

        const error = document.getElementById(
            "errorCrearAlerta"
        );

        if (error) {

            error.hidden = true;

        }

    }


    /*==================================================
            VALIDAR FORMULARIO
    ==================================================*/

    function validarFormulario() {

        const selectorTipo = document.getElementById(
            "tipoAlerta"
        );

        const tipo = selectorTipo
            ? selectorTipo.value.trim()
            : "";

        const descripcion = textareaDescripcion
            ? textareaDescripcion.value.trim()
            : "";

        if (!tipo) {

            mostrarErrorFormulario(
                "Selecciona un tipo de emergencia.",
                selectorTipo
            );

            return false;

        }

        if (!descripcion) {

            mostrarErrorFormulario(
                (
                    "Describe brevemente "
                    + "lo que está ocurriendo."
                ),
                textareaDescripcion
            );

            return false;

        }

        if (
            descripcion.length
            > LIMITE_DESCRIPCION
        ) {

            mostrarErrorFormulario(
                (
                    "La descripción no puede superar "
                    + "los 500 caracteres."
                ),
                textareaDescripcion
            );

            return false;

        }

        ocultarErrorFormulario();

        return true;

    }


    /*==================================================
            ESTADO DE ENVÍO
    ==================================================*/

    function cambiarEstadoEnvio(
        enviando
    ) {

        if (!botonEnviar) {

            return;

        }

        botonEnviar.disabled = enviando;

        if (enviando) {

            botonEnviar.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Enviando alerta...
            `;

        } else {

            botonEnviar.innerHTML = `
                <i class="fa-solid fa-bell"></i>
                Enviar alerta
            `;

        }

    }


    /*==================================================
            ENVIAR FORMULARIO
    ==================================================*/

    if (formulario) {

        formulario.addEventListener(
            "submit",
            function (evento) {

                if (!validarFormulario()) {

                    evento.preventDefault();

                    return;

                }

                cambiarEstadoEnvio(
                    true
                );

            }
        );

    }

}