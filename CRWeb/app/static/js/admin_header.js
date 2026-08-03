"use strict";


document.addEventListener("DOMContentLoaded", function () {

    /*==================================================
        ELEMENTOS DEL HEADER
    ==================================================*/

    const adminHeader =
        document.getElementById("adminHeader");

    const botonInicio =
        document.getElementById("btnInicio");

    const botonMenuMovil =
        document.getElementById("adminMenuToggle");

    const menuAdmin =
        document.getElementById("menuAdmin");

    const botonesMenu =
        document.querySelectorAll(
            ".menu-admin .menu-btn[data-view]"
        );


    /*==================================================
        NOTIFICACIONES
    ==================================================*/

    const botonNotificaciones =
        document.getElementById("notificacionesBtn");

    const dropdownNotificaciones =
        document.getElementById("notificacionesDropdown");

    const cerrarNotificaciones =
        document.getElementById("cerrarNotificaciones");

    const botonesAbrirVista =
        document.querySelectorAll(
            "[data-view-target]"
        );


    /*==================================================
        PERFIL
    ==================================================*/

    const botonPerfil =
        document.getElementById("perfilAdminBtn");

    const dropdownPerfil =
        document.getElementById("perfilAdminDropdown");

    const botonConfiguracion =
        document.getElementById("btnConfiguracionAdmin");


    /*==================================================
        LOGOUT
    ==================================================*/

    const botonAbrirLogout =
        document.getElementById("abrirLogoutAdmin");

    const modalLogout =
        document.getElementById("logoutAdminModal");

    const botonCancelarLogout =
        document.getElementById("cancelarLogoutAdmin");


    /*==================================================
        ESTADO
    ==================================================*/

    let dropdownAbierto = null;


    /*==================================================
        MENÚ MÓVIL
    ==================================================*/

    function alternarMenuMovil() {

        if (
            !botonMenuMovil ||
            !menuAdmin
        ) {
            return;
        }


        const estaAbierto =
            menuAdmin.classList.toggle(
                "menu-abierto"
            );


        botonMenuMovil.classList.toggle(
            "activo",
            estaAbierto
        );


        botonMenuMovil.setAttribute(
            "aria-expanded",
            estaAbierto
                ? "true"
                : "false"
        );


        const icono =
            botonMenuMovil.querySelector("i");


        if (icono) {

            icono.className =
                estaAbierto
                    ? "fa-solid fa-xmark"
                    : "fa-solid fa-bars";

        }

    }


    function cerrarMenuMovil() {

        if (
            !botonMenuMovil ||
            !menuAdmin
        ) {
            return;
        }


        menuAdmin.classList.remove(
            "menu-abierto"
        );


        botonMenuMovil.classList.remove(
            "activo"
        );


        botonMenuMovil.setAttribute(
            "aria-expanded",
            "false"
        );


        const icono =
            botonMenuMovil.querySelector("i");


        if (icono) {

            icono.className =
                "fa-solid fa-bars";

        }

    }


    botonMenuMovil?.addEventListener(
        "click",
        function (evento) {

            evento.stopPropagation();

            cerrarDropdowns();

            alternarMenuMovil();

        }
    );


    /*==================================================
        MARCAR SECCIÓN ACTIVA
    ==================================================*/

    function marcarVistaActiva(nombreVista) {

        botonesMenu.forEach(
            function (boton) {

                const estaActivo =
                    boton.dataset.view === nombreVista;


                boton.classList.toggle(
                    "active",
                    estaActivo
                );


                boton.setAttribute(
                    "aria-current",
                    estaActivo
                        ? "page"
                        : "false"
                );

            }
        );


        if (nombreVista === "inicio") {

            botonInicio?.classList.add(
                "active"
            );

        } else {

            botonInicio?.classList.remove(
                "active"
            );

        }


        guardarVistaActiva(
            nombreVista
        );

    }


    function guardarVistaActiva(nombreVista) {

        try {

            sessionStorage.setItem(
                "adminVistaActiva",
                nombreVista
            );

        } catch (error) {

            console.warn(
                "No fue posible guardar la vista activa.",
                error
            );

        }

    }


    function recuperarVistaActiva() {

        try {

            return (
                sessionStorage.getItem(
                    "adminVistaActiva"
                ) ||
                "inicio"
            );

        } catch {

            return "inicio";

        }

    }


    botonesMenu.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                function () {

                    const nombreVista =
                        boton.dataset.view;


                    if (!nombreVista) {
                        return;
                    }


                    marcarVistaActiva(
                        nombreVista
                    );


                    cerrarMenuMovil();

                    cerrarDropdowns();

                }
            );

        }
    );


    botonInicio?.addEventListener(
        "click",
        function () {

            marcarVistaActiva(
                "inicio"
            );


            cerrarMenuMovil();

            cerrarDropdowns();

        }
    );


    /*==================================================
        ABRIR VISTA DESDE OTRO BOTÓN
    ==================================================*/

    function abrirVistaAdministrativa(nombreVista) {

        if (!nombreVista) {
            return;
        }


        const botonCorrespondiente =
            document.querySelector(
                `.menu-btn[data-view="${nombreVista}"]`
            );


        if (botonCorrespondiente) {

            botonCorrespondiente.click();

            return;

        }


        /*
         * Alternativa para vistas que no tengan botón
         * principal, siempre que admin.js exponga la
         * función cargarVista.
         */

        if (
            typeof window.cargarVista === "function"
        ) {

            window.cargarVista(
                nombreVista
            );


            marcarVistaActiva(
                nombreVista
            );

        }

    }


    botonesAbrirVista.forEach(
        function (boton) {

            boton.addEventListener(
                "click",
                function () {

                    const vista =
                        boton.dataset.viewTarget;


                    cerrarDropdowns();

                    abrirVistaAdministrativa(
                        vista
                    );

                }
            );

        }
    );


    /*==================================================
        CONTROL GENERAL DE DROPDOWNS
    ==================================================*/

    function abrirDropdown(
        boton,
        dropdown,
        nombre
    ) {

        if (
            !boton ||
            !dropdown
        ) {
            return;
        }


        const yaEstaAbierto =
            dropdown.classList.contains(
                "activo"
            );


        cerrarDropdowns();


        if (yaEstaAbierto) {
            return;
        }


        dropdown.classList.add(
            "activo"
        );


        dropdown.setAttribute(
            "aria-hidden",
            "false"
        );


        boton.classList.add(
            "activo"
        );


        boton.setAttribute(
            "aria-expanded",
            "true"
        );


        dropdownAbierto =
            nombre;

    }


    function cerrarDropdown(
        boton,
        dropdown
    ) {

        if (!dropdown) {
            return;
        }


        dropdown.classList.remove(
            "activo"
        );


        dropdown.setAttribute(
            "aria-hidden",
            "true"
        );


        boton?.classList.remove(
            "activo"
        );


        boton?.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    function cerrarDropdowns() {

        cerrarDropdown(
            botonNotificaciones,
            dropdownNotificaciones
        );


        cerrarDropdown(
            botonPerfil,
            dropdownPerfil
        );


        dropdownAbierto =
            null;

    }


    /*==================================================
        NOTIFICACIONES
    ==================================================*/

    botonNotificaciones?.addEventListener(
        "click",
        function (evento) {

            evento.stopPropagation();


            abrirDropdown(
                botonNotificaciones,
                dropdownNotificaciones,
                "notificaciones"
            );

        }
    );


    cerrarNotificaciones?.addEventListener(
        "click",
        function () {

            cerrarDropdowns();

            botonNotificaciones?.focus();

        }
    );


    dropdownNotificaciones?.addEventListener(
        "click",
        function (evento) {

            evento.stopPropagation();

        }
    );


    /*==================================================
        PERFIL
    ==================================================*/

    botonPerfil?.addEventListener(
        "click",
        function (evento) {

            evento.stopPropagation();


            abrirDropdown(
                botonPerfil,
                dropdownPerfil,
                "perfil"
            );

        }
    );


    dropdownPerfil?.addEventListener(
        "click",
        function (evento) {

            evento.stopPropagation();

        }
    );


    /*==================================================
        CONFIGURACIÓN
    ==================================================*/

    botonConfiguracion?.addEventListener(
        "click",
        function () {

            cerrarDropdowns();


            mostrarNotificacionHeader(
                "La configuración del panel se implementará en esta sección.",
                "info"
            );

        }
    );


    /*==================================================
        MODAL DE LOGOUT
    ==================================================*/

    function abrirModalLogout() {

        if (!modalLogout) {
            return;
        }


        cerrarDropdowns();

        cerrarMenuMovil();


        modalLogout.classList.add(
            "activo"
        );


        modalLogout.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "admin-modal-abierto"
        );


        window.setTimeout(
            function () {

                botonCancelarLogout?.focus();

            },
            100
        );

    }


    function cerrarModalLogout() {

        if (!modalLogout) {
            return;
        }


        modalLogout.classList.remove(
            "activo"
        );


        modalLogout.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.classList.remove(
            "admin-modal-abierto"
        );


        botonAbrirLogout?.focus();

    }


    botonAbrirLogout?.addEventListener(
        "click",
        abrirModalLogout
    );


    botonCancelarLogout?.addEventListener(
        "click",
        cerrarModalLogout
    );


    modalLogout?.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target === modalLogout
            ) {

                cerrarModalLogout();

            }

        }
    );


    /*==================================================
        CLIC FUERA
    ==================================================*/

    document.addEventListener(
        "click",
        function (evento) {

            const clickDentroHeader =
                adminHeader?.contains(
                    evento.target
                );


            if (!clickDentroHeader) {

                cerrarDropdowns();

                cerrarMenuMovil();

            }

        }
    );


    /*==================================================
        TECLA ESCAPE
    ==================================================*/

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key !== "Escape"
            ) {
                return;
            }


            if (
                modalLogout?.classList.contains(
                    "activo"
                )
            ) {

                cerrarModalLogout();

                return;

            }


            if (dropdownAbierto) {

                cerrarDropdowns();

                return;

            }


            cerrarMenuMovil();

        }
    );


    /*==================================================
        AJUSTAR AL CAMBIAR TAMAÑO
    ==================================================*/

    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth > 1050
            ) {

                cerrarMenuMovil();

            }

        }
    );


    /*==================================================
        NOTIFICACIÓN DEL HEADER
    ==================================================*/

    function mostrarNotificacionHeader(
        mensaje,
        tipo = "info"
    ) {

        const anterior =
            document.querySelector(
                ".admin-header-notificacion"
            );


        anterior?.remove();


        const notificacion =
            document.createElement("div");


        notificacion.className =
            `admin-header-notificacion ${tipo}`;


        const icono =
            tipo === "error"
                ? "fa-circle-exclamation"
                : tipo === "success"
                    ? "fa-circle-check"
                    : "fa-circle-info";


        notificacion.innerHTML = `

            <i class="fa-solid ${icono}"></i>

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
            3500
        );

    }


    /*==================================================
        INICIALIZACIÓN
    ==================================================*/

    marcarVistaActiva(
        recuperarVistaActiva()
    );

});