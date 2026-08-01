"use strict";


document.addEventListener("DOMContentLoaded", function () {

    const chatMain =
        document.querySelector(".chat-main");

    const formulario =
        document.getElementById("formEnviarMensaje");

    const campoMensaje =
        document.getElementById("contenidoMensaje");

    const botonEnviar =
        document.getElementById("botonEnviarMensaje");

    const contenedorMensajes =
        document.getElementById("mensajesChat");

    const mensajeError =
        document.getElementById("mensajeErrorChat");

    const estadoChat =
        document.querySelector(".estado-chat");


    if (
        !chatMain ||
        !formulario ||
        !campoMensaje ||
        !botonEnviar ||
        !contenedorMensajes
    ) {

        console.error(
            "No se encontraron los elementos principales del chat."
        );

        return;

    }


    const viajeId =
        chatMain.dataset.viajeId;

    const usuarioActualId =
        Number(chatMain.dataset.usuarioId);


    let socket = null;

    let socketConectado = false;

    let conexionManualCerrada = false;

    let intentoReconexion = 0;

    let temporizadorReconexion = null;

    let temporizadorPing = null;


    const MAX_INTENTOS_RECONEXION = 6;

    const TIEMPO_BASE_RECONEXION = 1500;


    /*==================================================
        CREAR URL WEBSOCKET
    ==================================================*/

    function obtenerUrlWebSocket() {

        const protocolo =
            window.location.protocol === "https:"
                ? "wss"
                : "ws";

        return (
            `${protocolo}://` +
            `${window.location.host}` +
            `/ws/viajes/${viajeId}/chat/`
        );

    }


    /*==================================================
        CONECTAR
    ==================================================*/

    function conectarWebSocket() {

        if (
            conexionManualCerrada ||
            !viajeId
        ) {
            return;
        }


        actualizarEstadoConexion(
            "conectando"
        );


        socket = new WebSocket(
            obtenerUrlWebSocket()
        );


        socket.addEventListener(
            "open",
            function () {

                socketConectado = true;

                intentoReconexion = 0;

                ocultarError();

                actualizarEstadoConexion(
                    "conectado"
                );

                iniciarPing();

            }
        );


        socket.addEventListener(
            "message",
            function (evento) {

                procesarEventoWebSocket(
                    evento
                );

            }
        );


        socket.addEventListener(
            "error",
            function (error) {

                console.error(
                    "Error del WebSocket:",
                    error
                );

            }
        );


        socket.addEventListener(
            "close",
            function (evento) {

                socketConectado = false;

                detenerPing();

                manejarCierreSocket(
                    evento
                );

            }
        );

    }


    /*==================================================
        PROCESAR EVENTOS
    ==================================================*/

    function procesarEventoWebSocket(evento) {

        let datos;

        try {

            datos = JSON.parse(
                evento.data
            );

        } catch {

            console.error(
                "El servidor envió un mensaje no válido."
            );

            return;

        }


        switch (datos.tipo) {

            case "conexion":

                actualizarEstadoConexion(
                    "conectado"
                );

                break;


            case "mensaje":

                agregarMensaje(
                    datos
                );

                break;


            case "error":

                mostrarError(
                    datos.mensaje ||
                    "Ocurrió un error en el chat."
                );

                establecerEstadoEnvio(
                    false
                );

                break;


            case "sala_cerrada":

                desactivarSala(
                    datos.mensaje
                );

                break;


            case "pong":

                break;


            default:

                console.warn(
                    "Evento WebSocket desconocido:",
                    datos
                );

        }

    }


    /*==================================================
        MANEJAR CIERRE
    ==================================================*/

    function manejarCierreSocket(evento) {

        if (conexionManualCerrada) {
            return;
        }


        switch (evento.code) {

            case 4401:

                desactivarSala(
                    "Debes iniciar sesión nuevamente."
                );

                return;


            case 4403:

                desactivarSala(
                    "No tienes permiso para entrar en este chat."
                );

                return;


            case 4404:

                desactivarSala(
                    "El viaje solicitado no existe."
                );

                return;


            case 4409:

                desactivarSala(
                    "La sala del chat ya no está activa."
                );

                return;


            default:

                actualizarEstadoConexion(
                    "desconectado"
                );

                programarReconexion();

        }

    }


    /*==================================================
        RECONECTAR
    ==================================================*/

    function programarReconexion() {

        if (
            conexionManualCerrada ||
            intentoReconexion
            >= MAX_INTENTOS_RECONEXION
        ) {

            mostrarError(
                "Se perdió la conexión con el chat. "
                + "Recarga la página para intentarlo nuevamente."
            );

            return;

        }


        intentoReconexion += 1;


        const tiempoEspera = Math.min(
            TIEMPO_BASE_RECONEXION
            * intentoReconexion,
            8000
        );


        window.clearTimeout(
            temporizadorReconexion
        );


        temporizadorReconexion =
            window.setTimeout(
                conectarWebSocket,
                tiempoEspera
            );

    }


    /*==================================================
        PING
    ==================================================*/

    function iniciarPing() {

        detenerPing();


        temporizadorPing =
            window.setInterval(
                function () {

                    if (
                        socket &&
                        socket.readyState
                        === WebSocket.OPEN
                    ) {

                        socket.send(
                            JSON.stringify({
                                tipo: "ping"
                            })
                        );

                    }

                },
                25000
            );

    }


    function detenerPing() {

        if (!temporizadorPing) {
            return;
        }

        window.clearInterval(
            temporizadorPing
        );

        temporizadorPing = null;

    }


    /*==================================================
        ENVIAR MENSAJE
    ==================================================*/

    function enviarMensaje() {

        if (!socketConectado) {

            mostrarError(
                "No hay conexión con el chat."
            );

            return;

        }


        if (
            !socket ||
            socket.readyState
            !== WebSocket.OPEN
        ) {

            mostrarError(
                "La conexión todavía no está disponible."
            );

            return;

        }


        const contenido =
            campoMensaje.value.trim();


        if (!contenido) {

            mostrarError(
                "Escribe un mensaje antes de enviarlo."
            );

            campoMensaje.focus();

            return;

        }


        if (contenido.length > 1000) {

            mostrarError(
                "El mensaje no puede superar "
                + "los 1000 caracteres."
            );

            return;

        }


        ocultarError();

        establecerEstadoEnvio(
            true
        );


        socket.send(
            JSON.stringify({
                tipo: "mensaje",
                contenido: contenido
            })
        );


        /*
         * El campo se limpia cuando el servidor acepta
         * el envío. El mensaje propio regresará por el
         * mismo WebSocket dentro del grupo.
         */

        campoMensaje.value = "";

        ajustarAlturaTextarea();

        establecerEstadoEnvio(
            false
        );

        campoMensaje.focus();

    }


    formulario.addEventListener(
        "submit",
        function (evento) {

            evento.preventDefault();

            enviarMensaje();

        }
    );


    campoMensaje.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Enter"
                && !evento.shiftKey
            ) {

                evento.preventDefault();

                enviarMensaje();

            }

        }
    );


    /*==================================================
        CREAR MENSAJE
    ==================================================*/

    function crearElementoMensaje(datos) {

        const esPropio =
            datos.es_propio === true
            || Number(datos.emisor_id)
            === usuarioActualId;


        const articulo =
            document.createElement(
                "article"
            );


        articulo.className = [
            "mensaje-chat",
            esPropio
                ? "mensaje-propio"
                : "mensaje-ajeno"
        ].join(" ");


        articulo.dataset.mensajeId =
            String(datos.id);


        const avatar =
            document.createElement(
                "div"
            );

        avatar.className =
            "mensaje-avatar";


        if (datos.foto) {

            const imagen =
                document.createElement(
                    "img"
                );

            imagen.src =
                datos.foto;

            imagen.alt =
                datos.emisor || "Usuario";

            avatar.appendChild(
                imagen
            );

        } else {

            const icono =
                document.createElement(
                    "i"
                );

            icono.className =
                "fa-solid fa-user";

            avatar.appendChild(
                icono
            );

        }


        const contenido =
            document.createElement(
                "div"
            );

        contenido.className =
            "mensaje-contenido";


        const cabecera =
            document.createElement(
                "div"
            );

        cabecera.className =
            "mensaje-cabecera";


        const emisor =
            document.createElement(
                "strong"
            );

        emisor.textContent =
            datos.emisor || "Usuario";


        const hora =
            document.createElement(
                "time"
            );

        hora.textContent =
            datos.fecha || "";


        const texto =
            document.createElement(
                "p"
            );

        texto.textContent =
            datos.contenido || "";


        cabecera.append(
            emisor,
            hora
        );


        contenido.append(
            cabecera,
            texto
        );


        articulo.append(
            avatar,
            contenido
        );


        return articulo;

    }


    /*==================================================
        AGREGAR MENSAJE
    ==================================================*/

    function agregarMensaje(datos) {

        if (!datos || !datos.id) {
            return;
        }


        const existente =
            contenedorMensajes.querySelector(
                `[data-mensaje-id="${datos.id}"]`
            );


        if (existente) {
            return;
        }


        const estabaCercaDelFinal =
            usuarioEstaCercaDelFinal();


        const chatVacio =
            document.getElementById(
                "chatVacio"
            );


        if (chatVacio) {

            chatVacio.remove();

        }


        const elemento =
            crearElementoMensaje(
                datos
            );


        contenedorMensajes.appendChild(
            elemento
        );


        const esPropio =
            datos.es_propio === true
            || Number(datos.emisor_id)
            === usuarioActualId;


        if (
            esPropio
            || estabaCercaDelFinal
        ) {

            desplazarAlFinal();

        }

    }


    /*==================================================
        AUTOAJUSTAR TEXTAREA
    ==================================================*/

    function ajustarAlturaTextarea() {

        campoMensaje.style.height =
            "auto";


        const altura =
            Math.min(
                campoMensaje.scrollHeight,
                145
            );


        campoMensaje.style.height =
            `${altura}px`;

    }


    campoMensaje.addEventListener(
        "input",
        ajustarAlturaTextarea
    );


    /*==================================================
        SCROLL
    ==================================================*/

    function usuarioEstaCercaDelFinal() {

        const diferencia =
            contenedorMensajes.scrollHeight
            - contenedorMensajes.scrollTop
            - contenedorMensajes.clientHeight;


        return diferencia < 140;

    }


    function desplazarAlFinal(
        comportamiento = "smooth"
    ) {

        contenedorMensajes.scrollTo({
            top: contenedorMensajes.scrollHeight,
            behavior: comportamiento
        });

    }


    /*==================================================
        ESTADOS
    ==================================================*/

    function establecerEstadoEnvio(enviando) {

        botonEnviar.disabled =
            enviando || !socketConectado;

    }


    function actualizarEstadoConexion(estado) {

        if (!estadoChat) {
            return;
        }


        if (estado === "conectando") {

            estadoChat.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Conectando
            `;

            campoMensaje.disabled = true;

            botonEnviar.disabled = true;

            return;

        }


        if (estado === "conectado") {

            estadoChat.innerHTML = `
                <i class="fa-solid fa-circle"></i>
                Chat activo
            `;

            estadoChat.removeAttribute(
                "style"
            );

            campoMensaje.disabled = false;

            botonEnviar.disabled = false;

            return;

        }


        estadoChat.innerHTML = `
            <i class="fa-solid fa-plug-circle-xmark"></i>
            Reconectando
        `;

        campoMensaje.disabled = true;

        botonEnviar.disabled = true;

    }


    function desactivarSala(mensaje) {

        socketConectado = false;

        conexionManualCerrada = true;

        detenerPing();

        window.clearTimeout(
            temporizadorReconexion
        );


        campoMensaje.disabled = true;

        botonEnviar.disabled = true;

        campoMensaje.placeholder =
            "Este chat ya no está activo.";


        if (estadoChat) {

            estadoChat.innerHTML = `
                <i class="fa-solid fa-circle-xmark"></i>
                Chat finalizado
            `;

            estadoChat.style.color =
                "var(--rojo)";

            estadoChat.style.background =
                "var(--rojo-suave)";

            estadoChat.style.borderColor =
                "rgba(255, 93, 108, 0.35)";

        }


        mostrarError(
            mensaje
            || "La sala ya no se encuentra activa."
        );

    }


    /*==================================================
        ERRORES
    ==================================================*/

    function mostrarError(mensaje) {

        if (!mensajeError) {
            return;
        }

        mensajeError.textContent =
            mensaje;

        mensajeError.hidden =
            false;

    }


    function ocultarError() {

        if (!mensajeError) {
            return;
        }

        mensajeError.textContent = "";

        mensajeError.hidden = true;

    }


    /*==================================================
        CERRAR AL SALIR
    ==================================================*/

    window.addEventListener(
        "beforeunload",
        function () {

            conexionManualCerrada = true;

            detenerPing();

            window.clearTimeout(
                temporizadorReconexion
            );


            if (
                socket
                && socket.readyState
                === WebSocket.OPEN
            ) {

                socket.close(
                    1000,
                    "Página cerrada"
                );

            }

        }
    );


    /*==================================================
        INICIALIZACIÓN
    ==================================================*/

    ajustarAlturaTextarea();

    desplazarAlFinal("auto");

    conectarWebSocket();

});