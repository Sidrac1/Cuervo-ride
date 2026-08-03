/*==================================================
    CUERVO-RIDE
    PANEL ADMINISTRATIVO - RIDES
==================================================*/

"use strict";


/*==================================================
    INICIAR VISTA DE RIDES
==================================================*/

function iniciarRides() {

    console.log("Vista Rides cargada");

    const tabla =
        document.getElementById("tablaRides");

    const buscador =
        document.getElementById("buscarRide");

    const campoFecha =
        document.getElementById("filtroFecha");

    const filtroEstado =
        document.getElementById("filtroEstado");

    const botonFiltrar =
        document.getElementById("btnFiltrar");


    /*
     * Si el partial todavía no ha sido insertado
     * en el DOM, no intentamos inicializarlo.
     */
    if (!tabla) {

        console.warn(
            "No se encontró #tablaRides."
        );

        return;

    }


    /*==================================================
        CALENDARIO FLATPICKR
    ==================================================*/

    if (
        campoFecha &&
        typeof flatpickr !== "undefined"
    ) {

        /*
         * Evita inicializar Flatpickr varias veces
         * cuando el usuario vuelve a abrir la vista.
         */
        if (campoFecha._flatpickr) {

            campoFecha._flatpickr.destroy();

        }


        const configuracionCalendario = {

            dateFormat: "Y-m-d",

            allowInput: true,

            disableMobile: true,

            onChange: function () {

                filtrarRides();

            }

        };


        /*
         * Solo asignamos locale español si fue cargado.
         * De esta manera no provoca error si falta es.js.
         */
        if (
            flatpickr.l10ns &&
            flatpickr.l10ns.es
        ) {

            configuracionCalendario.locale =
                flatpickr.l10ns.es;

        }


        flatpickr(
            campoFecha,
            configuracionCalendario
        );

    }


    /*==================================================
        EVITAR EVENTOS DUPLICADOS
    ==================================================*/

    if (buscador) {

        buscador.removeEventListener(
            "input",
            filtrarRides
        );

        buscador.addEventListener(
            "input",
            filtrarRides
        );

    }


    if (campoFecha) {

        campoFecha.removeEventListener(
            "change",
            filtrarRides
        );

        campoFecha.addEventListener(
            "change",
            filtrarRides
        );

    }


    if (filtroEstado) {

        filtroEstado.removeEventListener(
            "change",
            filtrarRides
        );

        filtroEstado.addEventListener(
            "change",
            filtrarRides
        );

    }


    if (botonFiltrar) {

        botonFiltrar.removeEventListener(
            "click",
            filtrarRides
        );

        botonFiltrar.addEventListener(
            "click",
            filtrarRides
        );

    }


    /*
     * Muestra todos los viajes al cargar inicialmente
     * y actualiza correctamente el contador.
     */
    filtrarRides();

}


/*==================================================
    FILTRAR RIDES
==================================================*/

function filtrarRides() {

    const tabla =
        document.getElementById("tablaRides");

    if (!tabla) {
        return;
    }


    const buscador =
        document.getElementById("buscarRide");

    const campoFecha =
        document.getElementById("filtroFecha");

    const filtroEstado =
        document.getElementById("filtroEstado");


    const textoBusqueda =
        normalizarTextoRides(
            buscador
                ? buscador.value
                : ""
        );


    const fechaSeleccionada =
        campoFecha
            ? campoFecha.value.trim()
            : "";


    const estadoSeleccionado =
        filtroEstado
            ? filtroEstado.value.trim().toLowerCase()
            : "todos";


    /*
     * Solo seleccionamos filas reales de viajes.
     * No incluye la fila vacía ni el mensaje generado
     * cuando una búsqueda no tiene resultados.
     */
    const filasViajes =
        tabla.querySelectorAll(
            'tr[data-ride-id]'
        );


    let visibles = 0;


    filasViajes.forEach(
        function (fila) {

            const id =
                normalizarTextoRides(
                    fila.dataset.rideId || ""
                );


            const conductor =
                normalizarTextoRides(
                    fila.dataset.conductor || ""
                );


            const origen =
                normalizarTextoRides(
                    fila.dataset.origen || ""
                );


            const destino =
                normalizarTextoRides(
                    fila.dataset.destino || ""
                );


            const fechaRide =
                String(
                    fila.dataset.fecha || ""
                ).trim();


            const estadoRide =
                String(
                    fila.dataset.estado || ""
                )
                    .trim()
                    .toLowerCase();


            const contenidoBusqueda = [
                id,
                conductor,
                origen,
                destino
            ].join(" ");


            const coincideBusqueda =
                textoBusqueda === "" ||
                contenidoBusqueda.includes(
                    textoBusqueda
                );


            /*
             * data-fecha ya utiliza Y-m-d y coincide
             * con el formato generado por Flatpickr.
             */
            const coincideFecha =
                fechaSeleccionada === "" ||
                fechaRide === fechaSeleccionada;


            /*
             * Los valores correctos del modelo son:
             *
             * borrador
             * disponible
             * completo
             * en_curso
             * finalizado
             * cancelado
             */
            const coincideEstado =
                estadoSeleccionado === "todos" ||
                estadoRide === estadoSeleccionado;


            const debeMostrar =
                coincideBusqueda &&
                coincideFecha &&
                coincideEstado;


            fila.hidden =
                !debeMostrar;


            if (debeMostrar) {

                visibles++;

            }

        }
    );


    if (visibles === 0) {

        mostrarSinResultadosRides();

    } else {

        ocultarSinResultadosRides();

    }


    actualizarContadorRides(
        visibles,
        filasViajes.length
    );

}


/*==================================================
    NORMALIZAR TEXTO
==================================================*/

function normalizarTextoRides(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


/*==================================================
    ACTUALIZAR CONTADOR
==================================================*/

function actualizarContadorRides(
    visibles,
    total
) {

    const contador =
        document.getElementById(
            "textoResultados"
        ) ||
        document.querySelector(
            ".footer-tabla p"
        );


    if (!contador) {
        return;
    }


    const palabra =
        total === 1
            ? "viaje"
            : "viajes";


    contador.textContent =
        `Mostrando ${visibles} de ${total} ${palabra}`;

}


/*==================================================
    MOSTRAR SIN RESULTADOS
==================================================*/

function mostrarSinResultadosRides() {

    const tbody =
        document.getElementById(
            "tablaRides"
        );


    if (!tbody) {
        return;
    }


    /*
     * Ocultamos el estado vacío que generó Django,
     * porque este mensaje corresponde a un filtro
     * sin coincidencias y no a una base de datos vacía.
     */
    const filaVaciaDjango =
        tbody.querySelector(
            ".fila-vacia"
        );


    if (filaVaciaDjango) {

        filaVaciaDjango.hidden =
            true;

    }


    let mensaje =
        document.getElementById(
            "sinResultadosRides"
        );


    if (!mensaje) {

        mensaje =
            document.createElement(
                "tr"
            );


        mensaje.id =
            "sinResultadosRides";


        mensaje.className =
            "fila-sin-resultados";


        mensaje.innerHTML = `

            <td colspan="8">

                <div class="estado-vacio-rides">

                    <i class="fa-solid fa-magnifying-glass"></i>

                    <strong>
                        No encontramos coincidencias
                    </strong>

                    <span>
                        Cambia los filtros o limpia la búsqueda
                        para consultar los viajes registrados.
                    </span>

                </div>

            </td>

        `;


        tbody.appendChild(
            mensaje
        );

    }


    mensaje.hidden =
        false;

}


/*==================================================
    OCULTAR SIN RESULTADOS
==================================================*/

function ocultarSinResultadosRides() {

    const mensaje =
        document.getElementById(
            "sinResultadosRides"
        );


    if (mensaje) {

        mensaje.hidden =
            true;

    }


    /*
     * La fila vacía del servidor solo debe mostrarse
     * cuando realmente no existen viajes registrados.
     */
    const tbody =
        document.getElementById(
            "tablaRides"
        );


    if (!tbody) {
        return;
    }


    const filasReales =
        tbody.querySelectorAll(
            'tr[data-ride-id]'
        );


    const filaVaciaDjango =
        tbody.querySelector(
            ".fila-vacia"
        );


    if (filaVaciaDjango) {

        filaVaciaDjango.hidden =
            filasReales.length > 0;

    }

}


/*==================================================
    LIMPIAR FILTROS
==================================================*/

function limpiarFiltrosRides() {

    const buscador =
        document.getElementById(
            "buscarRide"
        );

    const campoFecha =
        document.getElementById(
            "filtroFecha"
        );

    const filtroEstado =
        document.getElementById(
            "filtroEstado"
        );


    if (buscador) {

        buscador.value =
            "";

    }


    if (campoFecha) {

        if (campoFecha._flatpickr) {

            campoFecha._flatpickr.clear();

        } else {

            campoFecha.value =
                "";

        }

    }


    if (filtroEstado) {

        filtroEstado.value =
            "todos";

    }


    filtrarRides();

}