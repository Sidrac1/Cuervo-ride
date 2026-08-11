"use strict";

document.addEventListener("DOMContentLoaded", function () {

    /*==================================================
        ELEMENTOS
    ==================================================*/

    const rutaMain =
        document.getElementById("rutaMain");

    const mapaElemento =
        document.getElementById("mapaRuta");

    const mensajeMapa =
        document.getElementById("mensajeMapa");


    /*==================================================
        VALIDACIONES INICIALES
    ==================================================*/

    if (!rutaMain) {

        console.error(
            "No se encontró el elemento #rutaMain."
        );

        return;

    }

    if (!mapaElemento) {

        console.error(
            "No se encontró el elemento #mapaRuta."
        );

        return;

    }

    if (typeof L === "undefined") {

        console.error(
            "Leaflet no está cargado."
        );

        mostrarMensajeMapa(
            "No fue posible cargar la librería del mapa."
        );

        return;

    }


    /*==================================================
        CONFIGURACIÓN
    ==================================================*/

    const CONFIGURACION = {

        centroPredeterminado: [
            32.460963,
            -116.824371
        ],

        zoomPredeterminado: 13,

        osrmUrl:
            "https://router.project-osrm.org/route/v1/driving",

        colorRuta:
            "#98ec63",

        colorRutaAproximada:
            "#98ec63"

    };


    /*==================================================
        ESTADO
    ==================================================*/

    let mapa = null;

    let capaRuta = null;

    let marcadorOrigen = null;

    let marcadorDestino = null;

    let temporizadorResize = null;


    /*==================================================
        CONVERTIR COORDENADA
    ==================================================*/

    function convertirCoordenada(valor) {

        if (
            valor === undefined ||
            valor === null ||
            String(valor).trim() === ""
        ) {
            return null;
        }

        const valorLimpio =
            String(valor)
                .trim()
                .replace(",", ".");

        const numero =
            Number(valorLimpio);

        return Number.isFinite(numero)
            ? numero
            : null;

    }


    /*==================================================
        DATOS DEL VIAJE
    ==================================================*/

    const datos = {

        origen:
            rutaMain.dataset.origen ||
            "Origen",

        destino:
            rutaMain.dataset.destino ||
            "Destino",

        origenLatitud:
            convertirCoordenada(
                rutaMain.dataset.origenLatitud
            ),

        origenLongitud:
            convertirCoordenada(
                rutaMain.dataset.origenLongitud
            ),

        destinoLatitud:
            convertirCoordenada(
                rutaMain.dataset.destinoLatitud
            ),

        destinoLongitud:
            convertirCoordenada(
                rutaMain.dataset.destinoLongitud
            )

    };


    console.log(
        "Datos recibidos para mostrar la ruta:",
        datos
    );


    /*==================================================
        VALIDAR COORDENADAS
    ==================================================*/

    const coordenadasValidas = [
        datos.origenLatitud,
        datos.origenLongitud,
        datos.destinoLatitud,
        datos.destinoLongitud
    ].every(function (coordenada) {

        return (
            coordenada !== null &&
            Number.isFinite(coordenada)
        );

    });


    if (!coordenadasValidas) {

        console.error(
            "El viaje contiene coordenadas inválidas:",
            datos
        );

        mostrarMensajeMapa(
            "El viaje no tiene coordenadas válidas para mostrar la ruta."
        );

        return;

    }


    const origen = [
        datos.origenLatitud,
        datos.origenLongitud
    ];

    const destino = [
        datos.destinoLatitud,
        datos.destinoLongitud
    ];


    /*==================================================
        INICIALIZAR MAPA
    ==================================================*/

    try {

        mapa = L.map(
            mapaElemento,
            {
                zoomControl: false
            }
        ).setView(
            CONFIGURACION.centroPredeterminado,
            CONFIGURACION.zoomPredeterminado
        );

    } catch (error) {

        console.error(
            "Error al inicializar Leaflet:",
            error
        );

        mostrarMensajeMapa(
            "No fue posible inicializar el mapa."
        );

        return;

    }


    /*==================================================
        CONTROL DE ZOOM
    ==================================================*/

    L.control.zoom({
        position: "bottomright"
    }).addTo(mapa);


    /*==================================================
        CAPA BASE
    ==================================================*/

    const mapTilerKey = 'JS0B3dwVkIVaAJNtu5s2';

        L.tileLayer(`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${maptilerKey}`, {
            maxZoom: 19,
            attribution: "&copy; MapTiler"
        }).addTo(mapa);



    /*==================================================
        ICONOS PERSONALIZADOS
    ==================================================*/

    const iconoOrigen =
        L.divIcon({

            className:
                "marcador-personalizado",

            html: `
                <div class="pin-mapa pin-origen">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
            `,

            iconSize: [42, 52],

            iconAnchor: [21, 48],

            popupAnchor: [0, -44]

        });


    const iconoDestino =
        L.divIcon({

            className:
                "marcador-personalizado",

            html: `
                <div class="pin-mapa pin-destino">
                    <i class="fa-solid fa-flag-checkered"></i>
                </div>
            `,

            iconSize: [42, 52],

            iconAnchor: [21, 48],

            popupAnchor: [0, -44]

        });


    /*==================================================
        MARCADORES
    ==================================================*/

    marcadorOrigen =
        L.marker(
            origen,
            {
                icon: iconoOrigen,

                /*
                 * Un pane con z-index alto mantiene el marcador
                 * sobre la ruta sin usar bringToFront().
                 */
                pane: "markerPane"
            }
        )
        .addTo(mapa)
        .bindPopup(
            `
                <strong>Origen</strong>
                <br>
                ${escaparHtml(datos.origen)}
            `
        );


    marcadorDestino =
        L.marker(
            destino,
            {
                icon: iconoDestino,
                pane: "markerPane"
            }
        )
        .addTo(mapa)
        .bindPopup(
            `
                <strong>Destino</strong>
                <br>
                ${escaparHtml(datos.destino)}
            `
        );


    /*==================================================
        ENCUADRAR PUNTOS
    ==================================================*/

    const limitesIniciales =
        L.latLngBounds(
            origen,
            destino
        );


    if (limitesIniciales.isValid()) {

        mapa.fitBounds(
            limitesIniciales,
            {
                padding: [55, 55]
            }
        );

    }


    /*
     * Corrige el tamaño cuando Leaflet se inicializa
     * dentro de un grid o tras la carga del sidebar.
     */

    window.setTimeout(
        function () {

            mapa.invalidateSize();

            if (limitesIniciales.isValid()) {

                mapa.fitBounds(
                    limitesIniciales,
                    {
                        padding: [55, 55]
                    }
                );

            }

        },
        250
    );


    /*==================================================
        CARGAR RUTA
    ==================================================*/

    cargarRuta();


    /*==================================================
        SOLICITAR RUTA A OSRM
    ==================================================*/

    async function cargarRuta() {

        establecerEstadoCarga(true);
        ocultarMensajeMapa();

        const coordenadas =
            `${datos.origenLongitud},${datos.origenLatitud};` +
            `${datos.destinoLongitud},${datos.destinoLatitud}`;

        const url =
            `${CONFIGURACION.osrmUrl}/` +
            `${coordenadas}` +
            "?overview=full" +
            "&geometries=geojson" +
            "&steps=false";


        console.log(
            "Solicitando ruta a OSRM:",
            url
        );


        try {

            const respuesta =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!respuesta.ok) {

                throw new Error(
                    `OSRM respondió con estado ${respuesta.status}.`
                );

            }


            const resultado =
                await respuesta.json();


            console.log(
                "Respuesta recibida de OSRM:",
                resultado
            );


            if (
                resultado.code !== "Ok" ||
                !Array.isArray(resultado.routes) ||
                resultado.routes.length === 0
            ) {

                throw new Error(
                    "OSRM no encontró una ruta entre los puntos."
                );

            }


            const ruta =
                resultado.routes[0];


            if (
                !ruta.geometry ||
                ruta.geometry.type !== "LineString" ||
                !Array.isArray(
                    ruta.geometry.coordinates
                )
            ) {

                throw new Error(
                    "La respuesta no contiene una geometría válida."
                );

            }


            limpiarCapaRuta();


            capaRuta =
                L.geoJSON(
                    ruta.geometry,
                    {
                        pane: "overlayPane",

                        style: {
                            color:
                                CONFIGURACION.colorRuta,

                            weight: 6,

                            opacity: 0.88,

                            lineCap: "round",

                            lineJoin: "round"
                        }
                    }
                ).addTo(mapa);


            const limitesRuta =
                capaRuta.getBounds();


            if (limitesRuta.isValid()) {

                mapa.fitBounds(
                    limitesRuta,
                    {
                        padding: [50, 50]
                    }
                );

            }


        } catch (error) {

            console.error(
                "Error al calcular la ruta:",
                error
            );


            limpiarCapaRuta();

            dibujarRutaAproximada();


            mostrarMensajeMapa(
                "No fue posible calcular el recorrido exacto. " +
                "Se muestra una conexión aproximada."
            );


        } finally {

            establecerEstadoCarga(false);

        }

    }


    /*==================================================
        DIBUJAR RUTA APROXIMADA
    ==================================================*/

    function dibujarRutaAproximada() {

        capaRuta =
            L.polyline(
                [
                    origen,
                    destino
                ],
                {
                    pane: "overlayPane",

                    color:
                        CONFIGURACION.colorRutaAproximada,

                    weight: 4,

                    opacity: 0.74,

                    dashArray: "10 9",

                    lineCap: "round",

                    lineJoin: "round"
                }
            ).addTo(mapa);


        const limitesRuta =
            capaRuta.getBounds();


        if (limitesRuta.isValid()) {

            mapa.fitBounds(
                limitesRuta,
                {
                    padding: [55, 55]
                }
            );

        }

    }


    /*==================================================
        LIMPIAR RUTA ANTERIOR
    ==================================================*/

    function limpiarCapaRuta() {

        if (
            mapa &&
            capaRuta &&
            mapa.hasLayer(capaRuta)
        ) {

            mapa.removeLayer(
                capaRuta
            );

        }

        capaRuta = null;

    }


    /*==================================================
        ESTADO DE CARGA
    ==================================================*/

    function establecerEstadoCarga(cargando) {

        mapaElemento.classList.toggle(
            "cargando-viaje",
            cargando
        );

        mapaElemento.setAttribute(
            "aria-busy",
            cargando
                ? "true"
                : "false"
        );

    }


    /*==================================================
        MOSTRAR MENSAJE DEL MAPA
    ==================================================*/

    function mostrarMensajeMapa(mensaje) {

        if (!mensajeMapa) {

            console.error(
                mensaje
            );

            return;

        }


        const texto =
            mensajeMapa.querySelector(
                "span"
            );


        if (texto) {

            texto.textContent =
                mensaje;

        }


        mensajeMapa.hidden =
            false;

    }


    /*==================================================
        OCULTAR MENSAJE DEL MAPA
    ==================================================*/

    function ocultarMensajeMapa() {

        if (!mensajeMapa) {
            return;
        }


        mensajeMapa.hidden =
            true;


        const texto =
            mensajeMapa.querySelector(
                "span"
            );


        if (texto) {

            texto.textContent =
                "";

        }

    }


    /*==================================================
        ESCAPAR TEXTO PARA LOS POPUPS
    ==================================================*/

    function escaparHtml(valor) {

        const elemento =
            document.createElement(
                "div"
            );


        elemento.textContent =
            valor === undefined ||
            valor === null
                ? ""
                : String(valor);


        return elemento.innerHTML;

    }


    /*==================================================
        AJUSTAR AL CAMBIAR EL TAMAÑO
    ==================================================*/

    window.addEventListener(
        "resize",
        function () {

            window.clearTimeout(
                temporizadorResize
            );


            temporizadorResize =
                window.setTimeout(
                    function () {

                        if (mapa) {

                            mapa.invalidateSize();

                        }

                    },
                    180
                );

        }
    );


    /*==================================================
        AJUSTAR AL ABRIR/CERRAR EL SIDEBAR
    ==================================================*/

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (
        sidebar &&
        typeof MutationObserver !== "undefined"
    ) {

        const observadorSidebar =
            new MutationObserver(
                function () {

                    window.setTimeout(
                        function () {

                            if (mapa) {

                                mapa.invalidateSize();

                                if (
                                    capaRuta &&
                                    capaRuta.getBounds &&
                                    capaRuta
                                        .getBounds()
                                        .isValid()
                                ) {

                                    mapa.fitBounds(
                                        capaRuta.getBounds(),
                                        {
                                            padding: [50, 50]
                                        }
                                    );

                                }

                            }

                        },
                        380
                    );

                }
            );


        observadorSidebar.observe(
            sidebar,
            {
                attributes: true,

                attributeFilter: [
                    "class"
                ]
            }
        );

    }

});