/*==================================================
    CUERVO-RIDE
    CALIFICAR CONDUCTOR
==================================================*/

"use strict";


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const formulario =
            document.getElementById(
                "calificacionForm"
            );

        const selector =
            document.getElementById(
                "estrellasSelector"
            );

        const botonesEstrella =
            selector
                ? Array.from(
                    selector.querySelectorAll(
                        ".estrella-btn"
                    )
                )
                : [];

        const campoPuntuacion =
            document.getElementById(
                "id_puntuacion"
            );

        const textoPuntuacion =
            document.getElementById(
                "textoPuntuacion"
            );

        const valorPuntuacion =
            document.getElementById(
                "valorPuntuacion"
            );

        const comentario =
            document.getElementById(
                "id_comentario"
            );

        const contadorComentario =
            document.getElementById(
                "contadorComentario"
            );

        const botonEnviar =
            document.getElementById(
                "btnEnviarCalificacion"
            );


        let puntuacionSeleccionada =
            Number(
                campoPuntuacion?.value
            ) || 0;


        const textosPuntuacion = {

            0:
                "Selecciona una puntuación",

            1:
                "Muy mala experiencia",

            2:
                "La experiencia pudo ser mejor",

            3:
                "Experiencia aceptable",

            4:
                "Muy buena experiencia",

            5:
                "Excelente experiencia",

        };


        /*==================================================
            ACTUALIZAR ESTRELLAS
        ==================================================*/

        function actualizarEstrellas(
            valor,
            guardar = false
        ) {

            const valorSeguro =
                Math.max(
                    0,
                    Math.min(
                        Number(valor) || 0,
                        5
                    )
                );


            botonesEstrella.forEach(
                function (boton) {

                    const numero =
                        Number(
                            boton.dataset.value
                        );


                    const activa =
                        numero <= valorSeguro;


                    boton.classList.toggle(
                        guardar
                            ? "seleccionada"
                            : "hover",
                        activa
                    );


                    if (guardar) {

                        boton.setAttribute(
                            "aria-checked",
                            numero === valorSeguro
                                ? "true"
                                : "false"
                        );


                        const icono =
                            boton.querySelector("i");


                        if (icono) {

                            icono.className =
                                activa
                                    ? "fa-solid fa-star"
                                    : "fa-regular fa-star";

                        }

                    }

                }
            );


            if (textoPuntuacion) {

                textoPuntuacion.textContent =
                    textosPuntuacion[
                        valorSeguro
                    ] ||
                    textosPuntuacion[0];

            }


            if (valorPuntuacion) {

                valorPuntuacion.textContent =
                    `${valorSeguro}/5`;

            }


            if (
                guardar &&
                campoPuntuacion
            ) {

                puntuacionSeleccionada =
                    valorSeguro;


                campoPuntuacion.value =
                    valorSeguro > 0
                        ? String(valorSeguro)
                        : "";

            }

        }


        /*==================================================
            EVENTOS DE ESTRELLAS
        ==================================================*/

        botonesEstrella.forEach(
            function (boton) {

                const valor =
                    Number(
                        boton.dataset.value
                    );


                boton.addEventListener(
                    "mouseenter",
                    function () {

                        botonesEstrella.forEach(
                            function (elemento) {

                                elemento.classList.remove(
                                    "hover"
                                );

                            }
                        );


                        actualizarEstrellas(
                            valor,
                            false
                        );

                    }
                );


                boton.addEventListener(
                    "mouseleave",
                    function () {

                        botonesEstrella.forEach(
                            function (elemento) {

                                elemento.classList.remove(
                                    "hover"
                                );

                            }
                        );


                        actualizarEstrellas(
                            puntuacionSeleccionada,
                            true
                        );

                    }
                );


                boton.addEventListener(
                    "click",
                    function () {

                        actualizarEstrellas(
                            valor,
                            true
                        );

                    }
                );


                boton.addEventListener(
                    "keydown",
                    function (evento) {

                        if (
                            evento.key === "ArrowRight" ||
                            evento.key === "ArrowUp"
                        ) {

                            evento.preventDefault();


                            const siguiente =
                                Math.min(
                                    valor + 1,
                                    5
                                );


                            seleccionarPorTeclado(
                                siguiente
                            );

                        }


                        if (
                            evento.key === "ArrowLeft" ||
                            evento.key === "ArrowDown"
                        ) {

                            evento.preventDefault();


                            const anterior =
                                Math.max(
                                    valor - 1,
                                    1
                                );


                            seleccionarPorTeclado(
                                anterior
                            );

                        }

                    }
                );

            }
        );


        function seleccionarPorTeclado(
            valor
        ) {

            actualizarEstrellas(
                valor,
                true
            );


            const boton =
                botonesEstrella.find(
                    function (elemento) {

                        return (
                            Number(
                                elemento.dataset.value
                            ) === valor
                        );

                    }
                );


            boton?.focus();

        }


        /*==================================================
            CONTADOR DEL COMENTARIO
        ==================================================*/

        function actualizarContador() {

            if (
                !comentario ||
                !contadorComentario
            ) {
                return;
            }


            const longitud =
                comentario.value.length;


            contadorComentario.textContent =
                String(longitud);


            contadorComentario.parentElement
                ?.classList.toggle(
                    "limite-cercano",
                    longitud >= 450
                );

        }


        comentario?.addEventListener(
            "input",
            actualizarContador
        );


        /*==================================================
            VALIDACIÓN DEL FORMULARIO
        ==================================================*/

        formulario?.addEventListener(
            "submit",
            function (evento) {

                if (
                    puntuacionSeleccionada < 1 ||
                    puntuacionSeleccionada > 5
                ) {

                    evento.preventDefault();


                    selector?.classList.add(
                        "selector-error"
                    );


                    if (textoPuntuacion) {

                        textoPuntuacion.textContent =
                            "Selecciona una puntuación antes de continuar.";

                    }


                    botonesEstrella[0]?.focus();


                    window.setTimeout(
                        function () {

                            selector?.classList.remove(
                                "selector-error"
                            );

                        },
                        900
                    );


                    return;

                }


                if (botonEnviar) {

                    botonEnviar.disabled =
                        true;


                    botonEnviar.innerHTML = `

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        <span>
                            Enviando...
                        </span>

                    `;

                }

            }
        );


        /*==================================================
            INICIALIZACIÓN
        ==================================================*/

        actualizarEstrellas(
            puntuacionSeleccionada,
            true
        );

        actualizarContador();

    }
);