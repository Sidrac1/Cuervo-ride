/*==================================================
    CUERVO-RIDE
    PANEL ADMINISTRATIVO - PUNTUACIONES
==================================================*/

"use strict";


/*==================================================
    ESTADO GLOBAL DEL MÓDULO
==================================================*/

let graficaCalificacionesAdmin = null;


/*==================================================
    INICIAR PUNTUACIONES
==================================================*/

function iniciarPuntuacion() {

    console.log("Vista Puntuación cargada");

    iniciarGraficaCalificaciones();
    iniciarFiltrosCalificaciones();
    filtrarCalificaciones();

}


/*==================================================
    INICIAR GRÁFICA
==================================================*/

function iniciarGraficaCalificaciones() {

    const canvas =
        document.getElementById(
            "graficaCalificaciones"
        );

    const labelsScript =
        document.getElementById(
            "distribucion-calificaciones-labels"
        );

    const valoresScript =
        document.getElementById(
            "distribucion-calificaciones-valores"
        );


    if (
        !canvas ||
        !labelsScript ||
        !valoresScript
    ) {

        console.warn(
            "No se encontraron los elementos necesarios " +
            "para construir la gráfica de calificaciones."
        );

        return;

    }


    if (typeof Chart === "undefined") {

        console.error(
            "Chart.js no está cargado."
        );

        return;

    }


    let labels = [];
    let valores = [];


    try {

        labels =
            JSON.parse(
                labelsScript.textContent
            );

        valores =
            JSON.parse(
                valoresScript.textContent
            );

    } catch (error) {

        console.error(
            "No fue posible leer los datos de la gráfica:",
            error
        );

        return;

    }


    if (
        !Array.isArray(labels) ||
        !Array.isArray(valores)
    ) {

        console.error(
            "Los datos de la gráfica no tienen el formato esperado."
        );

        return;

    }


    valores =
        valores.map(
            function (valor) {

                const numero =
                    Number(valor);

                return Number.isFinite(numero)
                    ? numero
                    : 0;

            }
        );


    /*
     * Cuando se vuelve a abrir la vista por AJAX,
     * destruimos la gráfica anterior antes de crear
     * una nueva.
     */
    if (graficaCalificacionesAdmin) {

        graficaCalificacionesAdmin.destroy();

        graficaCalificacionesAdmin =
            null;

    }


    const contexto =
        canvas.getContext("2d");


    if (!contexto) {

        console.error(
            "No fue posible obtener el contexto 2D del canvas."
        );

        return;

    }


    const gradiente =
        contexto.createLinearGradient(
            0,
            0,
            0,
            280
        );


    gradiente.addColorStop(
        0,
        "rgba(152, 236, 99, 0.92)"
    );

    gradiente.addColorStop(
        1,
        "rgba(152, 236, 99, 0.28)"
    );


    graficaCalificacionesAdmin =
        new Chart(
            contexto,
            {

                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Calificaciones",

                            data:
                                valores,

                            backgroundColor:
                                gradiente,

                            borderColor:
                                "#98ec63",

                            borderWidth:
                                1,

                            borderRadius:
                                10,

                            borderSkipped:
                                false,

                            maxBarThickness:
                                58,

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    animation: {

                        duration:
                            700,

                        easing:
                            "easeOutQuart",

                    },

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false,

                    },

                    plugins: {

                        legend: {

                            display:
                                false,

                        },

                        tooltip: {

                            displayColors:
                                false,

                            backgroundColor:
                                "#101c2f",

                            titleColor:
                                "#f8fafc",

                            bodyColor:
                                "#acb9cd",

                            borderColor:
                                "rgba(152, 236, 99, 0.35)",

                            borderWidth:
                                1,

                            padding:
                                12,

                            callbacks: {

                                label:
                                    function (context) {

                                        const cantidad =
                                            Number(
                                                context.raw
                                            ) || 0;


                                        return (
                                            cantidad === 1
                                                ? "1 calificación"
                                                : `${cantidad} calificaciones`
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        x: {

                            border: {

                                display:
                                    false,

                            },

                            grid: {

                                display:
                                    false,

                            },

                            ticks: {

                                color:
                                    "#aebbd0",

                                font: {

                                    size:
                                        10,

                                    weight:
                                        "600",

                                }

                            }

                        },

                        y: {

                            beginAtZero:
                                true,

                            suggestedMax:
                                Math.max(
                                    ...valores,
                                    1
                                ),

                            border: {

                                display:
                                    false,

                            },

                            grid: {

                                color:
                                    "rgba(255, 255, 255, 0.055)",

                            },

                            ticks: {

                                color:
                                    "#7e90aa",

                                precision:
                                    0,

                                stepSize:
                                    1,

                                font: {

                                    size:
                                        9,

                                }

                            }

                        }

                    }

                }

            }
        );

}


/*==================================================
    INICIAR EVENTOS DE FILTRO
==================================================*/

function iniciarFiltrosCalificaciones() {

    const buscador =
        document.getElementById(
            "buscarCalificacion"
        );

    const filtroTipo =
        document.getElementById(
            "filtroTipoCalificacion"
        );

    const filtroPuntuacion =
        document.getElementById(
            "filtroPuntuacion"
        );

    const filtroEstado =
        document.getElementById(
            "filtroEstadoCalificacion"
        );

    const botonLimpiar =
        document.getElementById(
            "limpiarFiltrosCalificaciones"
        );


    /*
     * Al cargarse como partial, iniciarPuntuacion()
     * puede ejecutarse varias veces. Usamos propiedades
     * personalizadas para evitar listeners duplicados.
     */

    if (
        buscador &&
        !buscador.dataset.eventoPuntuacion
    ) {

        buscador.addEventListener(
            "input",
            filtrarCalificaciones
        );

        buscador.dataset.eventoPuntuacion =
            "true";

    }


    if (
        filtroTipo &&
        !filtroTipo.dataset.eventoPuntuacion
    ) {

        filtroTipo.addEventListener(
            "change",
            filtrarCalificaciones
        );

        filtroTipo.dataset.eventoPuntuacion =
            "true";

    }


    if (
        filtroPuntuacion &&
        !filtroPuntuacion.dataset.eventoPuntuacion
    ) {

        filtroPuntuacion.addEventListener(
            "change",
            filtrarCalificaciones
        );

        filtroPuntuacion.dataset.eventoPuntuacion =
            "true";

    }


    if (
        filtroEstado &&
        !filtroEstado.dataset.eventoPuntuacion
    ) {

        filtroEstado.addEventListener(
            "change",
            filtrarCalificaciones
        );

        filtroEstado.dataset.eventoPuntuacion =
            "true";

    }


    if (
        botonLimpiar &&
        !botonLimpiar.dataset.eventoPuntuacion
    ) {

        botonLimpiar.addEventListener(
            "click",
            limpiarFiltrosCalificaciones
        );

        botonLimpiar.dataset.eventoPuntuacion =
            "true";

    }

}


/*==================================================
    FILTRAR CALIFICACIONES
==================================================*/

function filtrarCalificaciones() {

    const tabla =
        document.getElementById(
            "tablaCalificaciones"
        );


    if (!tabla) {

        return;

    }


    const buscador =
        document.getElementById(
            "buscarCalificacion"
        );

    const filtroTipo =
        document.getElementById(
            "filtroTipoCalificacion"
        );

    const filtroPuntuacion =
        document.getElementById(
            "filtroPuntuacion"
        );

    const filtroEstado =
        document.getElementById(
            "filtroEstadoCalificacion"
        );


    const texto =
        normalizarTextoCalificacion(
            buscador
                ? buscador.value
                : ""
        );


    const tipo =
        filtroTipo
            ? filtroTipo.value.trim()
            : "todos";


    const puntuacion =
        filtroPuntuacion
            ? filtroPuntuacion.value.trim()
            : "todos";


    const estado =
        filtroEstado
            ? filtroEstado.value.trim()
            : "todos";


    const filas =
        tabla.querySelectorAll(
            ".fila-calificacion[data-calificacion-id]"
        );


    let visibles = 0;


    filas.forEach(
        function (fila) {

            const autor =
                normalizarTextoCalificacion(
                    fila.dataset.autor || ""
                );


            const destinatario =
                normalizarTextoCalificacion(
                    fila.dataset.destinatario || ""
                );


            const viaje =
                normalizarTextoCalificacion(
                    fila.dataset.viaje || ""
                );


            const comentario =
                normalizarTextoCalificacion(
                    fila.dataset.comentario || ""
                );


            const tipoFila =
                String(
                    fila.dataset.tipo || ""
                ).trim();


            const puntuacionFila =
                String(
                    fila.dataset.puntuacion || ""
                ).trim();


            const estadoFila =
                String(
                    fila.dataset.estado || ""
                ).trim();


            const contenidoBusqueda = [

                autor,
                destinatario,
                viaje,
                comentario,
                tipoFila,
                puntuacionFila,
                estadoFila,

            ].join(" ");


            const coincideTexto =

                texto === "" ||

                contenidoBusqueda.includes(
                    texto
                );


            const coincideTipo =

                tipo === "todos" ||

                tipoFila === tipo;


            const coincidePuntuacion =

                puntuacion === "todos" ||

                puntuacionFila === puntuacion;


            const coincideEstado =

                estado === "todos" ||

                estadoFila === estado;


            const mostrar =

                coincideTexto &&

                coincideTipo &&

                coincidePuntuacion &&

                coincideEstado;


            fila.hidden =
                !mostrar;


            if (mostrar) {

                visibles++;

            }

        }
    );


    manejarEstadoSinResultados(
        tabla,
        visibles,
        filas.length
    );


    actualizarContadorCalificaciones(
        visibles,
        filas.length
    );

}


/*==================================================
    NORMALIZAR TEXTO
==================================================*/

function normalizarTextoCalificacion(valor) {

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
    ESTADO SIN RESULTADOS
==================================================*/

function manejarEstadoSinResultados(
    tbody,
    visibles,
    total
) {

    const filaVaciaServidor =
        tbody.querySelector(
            ".fila-sin-calificaciones"
        );


    /*
     * La fila vacía de Django solo se muestra cuando
     * realmente no hay calificaciones registradas.
     */
    if (filaVaciaServidor) {

        filaVaciaServidor.hidden =
            total > 0;

    }


    let filaSinResultados =
        document.getElementById(
            "sinResultadosCalificaciones"
        );


    if (
        total > 0 &&
        visibles === 0
    ) {

        if (!filaSinResultados) {

            filaSinResultados =
                document.createElement(
                    "tr"
                );


            filaSinResultados.id =
                "sinResultadosCalificaciones";


            filaSinResultados.className =
                "fila-sin-resultados-calificaciones";


            filaSinResultados.innerHTML = `

                <td colspan="8">

                    <div class="estado-vacio-calificaciones">

                        <span>

                            <i class="fa-solid fa-magnifying-glass"></i>

                        </span>

                        <strong>

                            No encontramos coincidencias

                        </strong>

                        <p>

                            Cambia los filtros o limpia la búsqueda
                            para consultar las evaluaciones registradas.

                        </p>

                    </div>

                </td>

            `;


            tbody.appendChild(
                filaSinResultados
            );

        }


        filaSinResultados.hidden =
            false;


    } else if (filaSinResultados) {

        filaSinResultados.hidden =
            true;

    }

}


/*==================================================
    ACTUALIZAR CONTADOR
==================================================*/

function actualizarContadorCalificaciones(
    visibles,
    total
) {

    const contador =
        document.getElementById(
            "contadorCalificaciones"
        );


    if (!contador) {

        return;

    }


    if (total === 0) {

        contador.textContent =
            "Sin calificaciones registradas";

        return;

    }


    const palabra =
        total === 1
            ? "calificación"
            : "calificaciones";


    contador.textContent =
        `Mostrando ${visibles} de ${total} ${palabra}`;

}


/*==================================================
    LIMPIAR FILTROS
==================================================*/

function limpiarFiltrosCalificaciones() {

    const buscador =
        document.getElementById(
            "buscarCalificacion"
        );

    const filtroTipo =
        document.getElementById(
            "filtroTipoCalificacion"
        );

    const filtroPuntuacion =
        document.getElementById(
            "filtroPuntuacion"
        );

    const filtroEstado =
        document.getElementById(
            "filtroEstadoCalificacion"
        );


    if (buscador) {

        buscador.value =
            "";

    }


    if (filtroTipo) {

        filtroTipo.value =
            "todos";

    }


    if (filtroPuntuacion) {

        filtroPuntuacion.value =
            "todos";

    }


    if (filtroEstado) {

        filtroEstado.value =
            "todos";

    }


    filtrarCalificaciones();


    buscador?.focus();

}