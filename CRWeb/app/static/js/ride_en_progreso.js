/*==================================================
    CUERVO-RIDE
    RIDE EN PROGRESO
==================================================*/

"use strict";


document.addEventListener(
    "DOMContentLoaded",
    function () {

        iniciarRideEnProgreso();

    }
);


/*==================================================
    ESTADO DEL MAPA
==================================================*/

let mapaRide = null;

let grupoRutaRide = null;

let capaRutaReal = null;

let marcadorOrigen = null;

let marcadorDestino = null;

let marcadorUsuario = null;


/*==================================================
    INICIAR MÓDULO
==================================================*/

function iniciarRideEnProgreso() {

    iniciarMapaRide();
    iniciarModalFinalizarRide();
    iniciarMensajesRide();

}


/*==================================================
    INICIAR MAPA
==================================================*/

async function iniciarMapaRide() {

    const rideMain =
        document.getElementById(
            "rideMain"
        );

    const mapaContenedor =
        document.getElementById(
            "mapaRide"
        );


    if (
        !rideMain ||
        !mapaContenedor
    ) {

        console.warn(
            "No se encontraron los elementos del mapa."
        );

        return;

    }


    if (typeof L === "undefined") {

        mostrarErrorMapa(
            "Leaflet no está disponible. Verifica que la librería se haya cargado."
        );

        return;

    }


    const coordenadas =
        obtenerCoordenadasRide(
            rideMain
        );


    if (!coordenadas) {

        mostrarErrorMapa(
            "Este viaje todavía no tiene coordenadas completas."
        );

        return;

    }


    const {
        origenLatitud,
        origenLongitud,
        destinoLatitud,
        destinoLongitud,
    } = coordenadas;


    mapaRide = L.map(
        mapaContenedor,
        {
            zoomControl: true,
            preferCanvas: true,
        }
    );


    const maptilerKey = 'JS0B3dwVkIVaAJNtu5s2';

    L.tileLayer(`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${maptilerKey}`, {
        maxZoom: 19,
        attribution: "&copy; MapTiler"
    }).addTo(mapaRide);
    


    grupoRutaRide =
        L.featureGroup().addTo(
            mapaRide
        );


    crearMarcadoresExtremos(
        origenLatitud,
        origenLongitud,
        destinoLatitud,
        destinoLongitud,
        rideMain.dataset.origen || "Origen",
        rideMain.dataset.destino || "Destino"
    );


    configurarEventosMapa();


    try {

        await dibujarRutaRealOSRM(
            origenLatitud,
            origenLongitud,
            destinoLatitud,
            destinoLongitud
        );

    } catch (error) {

        console.error(
            "No fue posible obtener la ruta real:",
            error
        );


        dibujarRutaAlternativa(
            origenLatitud,
            origenLongitud,
            destinoLatitud,
            destinoLongitud
        );


        mostrarAvisoRutaAlternativa();

    }


    ajustarMapaARuta();

    ocultarCargaMapa();


    window.setTimeout(
        function () {

            mapaRide?.invalidateSize();

        },
        200
    );

}


/*==================================================
    LEER COORDENADAS
==================================================*/

function obtenerCoordenadasRide(
    contenedor
) {

    const origenLatitud =
        Number.parseFloat(
            contenedor.dataset.origenLatitud
        );

    const origenLongitud =
        Number.parseFloat(
            contenedor.dataset.origenLongitud
        );

    const destinoLatitud =
        Number.parseFloat(
            contenedor.dataset.destinoLatitud
        );

    const destinoLongitud =
        Number.parseFloat(
            contenedor.dataset.destinoLongitud
        );


    const coordenadasValidas = [

        origenLatitud,
        origenLongitud,
        destinoLatitud,
        destinoLongitud,

    ].every(
        function (valor) {

            return Number.isFinite(valor);

        }
    );


    if (!coordenadasValidas) {

        return null;

    }


    if (
        origenLatitud < -90 ||
        origenLatitud > 90 ||
        destinoLatitud < -90 ||
        destinoLatitud > 90 ||
        origenLongitud < -180 ||
        origenLongitud > 180 ||
        destinoLongitud < -180 ||
        destinoLongitud > 180
    ) {

        return null;

    }


    return {
        origenLatitud,
        origenLongitud,
        destinoLatitud,
        destinoLongitud,
    };

}


/*==================================================
    MARCADORES DE ORIGEN Y DESTINO
==================================================*/

function crearMarcadoresExtremos(
    origenLatitud,
    origenLongitud,
    destinoLatitud,
    destinoLongitud,
    textoOrigen,
    textoDestino
) {

    if (
        !mapaRide ||
        !grupoRutaRide
    ) {

        return;

    }


    const iconoOrigen =
        L.divIcon(
            {
                className:
                    "marcador-personalizado-contenedor",

                html: `
                    <span class="marcador-personalizado origen">
                        <i class="fa-solid fa-location-dot"></i>
                    </span>
                `,

                iconSize:
                    [38, 38],

                iconAnchor:
                    [19, 34],

                popupAnchor:
                    [0, -31],
            }
        );


    const iconoDestino =
        L.divIcon(
            {
                className:
                    "marcador-personalizado-contenedor",

                html: `
                    <span class="marcador-personalizado destino">
                        <i class="fa-solid fa-flag-checkered"></i>
                    </span>
                `,

                iconSize:
                    [38, 38],

                iconAnchor:
                    [19, 34],

                popupAnchor:
                    [0, -31],
            }
        );


    marcadorOrigen =
        L.marker(
            [
                origenLatitud,
                origenLongitud,
            ],
            {
                icon:
                    iconoOrigen,
            }
        )
        .bindPopup(
            crearPopupRuta(
                "Origen",
                textoOrigen
            )
        )
        .addTo(
            grupoRutaRide
        );


    marcadorDestino =
        L.marker(
            [
                destinoLatitud,
                destinoLongitud,
            ],
            {
                icon:
                    iconoDestino,
            }
        )
        .bindPopup(
            crearPopupRuta(
                "Destino",
                textoDestino
            )
        )
        .addTo(
            grupoRutaRide
        );

}


/*==================================================
    OBTENER RUTA REAL DESDE OSRM
==================================================*/

async function dibujarRutaRealOSRM(
    origenLatitud,
    origenLongitud,
    destinoLatitud,
    destinoLongitud
) {

    /*
     * OSRM requiere cada punto como:
     *
     * longitud,latitud
     *
     * No latitud,longitud.
     */

    const coordenadasURL = [

        `${origenLongitud},${origenLatitud}`,

        `${destinoLongitud},${destinoLatitud}`,

    ].join(
        ";"
    );


    const parametros =
        new URLSearchParams(
            {
                overview:
                    "full",

                geometries:
                    "geojson",

                steps:
                    "false",

                alternatives:
                    "false",
            }
        );


    const urlOSRM =
        `https://router.project-osrm.org/route/v1/driving/${coordenadasURL}?${parametros.toString()}`;


    const controlador =
        new AbortController();


    const temporizador =
        window.setTimeout(
            function () {

                controlador.abort();

            },
            12000
        );


    let respuesta;


    try {

        respuesta =
            await fetch(
                urlOSRM,
                {
                    method:
                        "GET",

                    headers: {
                        "Accept":
                            "application/json",
                    },

                    signal:
                        controlador.signal,
                }
            );

    } finally {

        window.clearTimeout(
            temporizador
        );

    }


    if (!respuesta.ok) {

        throw new Error(
            `OSRM respondió con HTTP ${respuesta.status}.`
        );

    }


    const datos =
        await respuesta.json();


    if (
        datos.code !== "Ok" ||
        !Array.isArray(datos.routes) ||
        datos.routes.length === 0
    ) {

        throw new Error(
            datos.message ||
            "OSRM no encontró una ruta disponible."
        );

    }


    const ruta =
        datos.routes[0];


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


    if (capaRutaReal) {

        capaRutaReal.remove();

        capaRutaReal = null;

    }


    capaRutaReal =
        L.geoJSON(
            ruta.geometry,
            {
                style: {
                    color:
                        "#98ec63",

                    weight:
                        6,

                    opacity:
                        0.92,

                    lineCap:
                        "round",

                    lineJoin:
                        "round",
                },
            }
        )
        .bindPopup(
            crearPopupResumenRuta(
                ruta.distance,
                ruta.duration
            )
        )
        .addTo(
            grupoRutaRide
        );


    actualizarResumenRuta(
        ruta.distance,
        ruta.duration
    );

}


/*==================================================
    RUTA ALTERNATIVA EN LÍNEA RECTA
==================================================*/

function dibujarRutaAlternativa(
    origenLatitud,
    origenLongitud,
    destinoLatitud,
    destinoLongitud
) {

    if (!grupoRutaRide) {

        return;

    }


    if (capaRutaReal) {

        capaRutaReal.remove();

    }


    capaRutaReal =
        L.polyline(
            [
                [
                    origenLatitud,
                    origenLongitud,
                ],
                [
                    destinoLatitud,
                    destinoLongitud,
                ],
            ],
            {
                color:
                    "#98ec63",

                weight:
                    5,

                opacity:
                    0.8,

                dashArray:
                    "10 10",

                lineCap:
                    "round",
            }
        )
        .bindPopup(
            "Ruta aproximada entre origen y destino."
        )
        .addTo(
            grupoRutaRide
        );

}


/*==================================================
    AJUSTAR VISTA A LA RUTA
==================================================*/

function ajustarMapaARuta() {

    if (
        !mapaRide ||
        !grupoRutaRide
    ) {

        return;

    }


    const limites =
        grupoRutaRide.getBounds();


    if (!limites.isValid()) {

        return;

    }


    mapaRide.fitBounds(
        limites,
        {
            padding:
                [48, 48],

            maxZoom:
                16,
        }
    );

}


/*==================================================
    EVENTOS DEL MAPA
==================================================*/

function configurarEventosMapa() {

    const botonRutaCompleta =
        document.getElementById(
            "btnVerRutaCompleta"
        );

    const botonUbicacion =
        document.getElementById(
            "btnMiUbicacion"
        );


    botonRutaCompleta?.addEventListener(
        "click",
        function () {

            ajustarMapaARuta();

        }
    );


    botonUbicacion?.addEventListener(
        "click",
        obtenerUbicacionActual
    );

}


/*==================================================
    UBICACIÓN ACTUAL
==================================================*/

function obtenerUbicacionActual() {

    if (!mapaRide) {

        return;

    }


    if (!navigator.geolocation) {

        window.alert(
            "Tu navegador no permite utilizar la geolocalización."
        );

        return;

    }


    const botonUbicacion =
        document.getElementById(
            "btnMiUbicacion"
        );


    cambiarEstadoBotonUbicacion(
        botonUbicacion,
        true
    );


    navigator.geolocation.getCurrentPosition(

        function (posicion) {

            const latitud =
                posicion.coords.latitude;

            const longitud =
                posicion.coords.longitude;


            if (marcadorUsuario) {

                marcadorUsuario.remove();

            }


            const iconoUsuario =
                L.divIcon(
                    {
                        className:
                            "marcador-personalizado-contenedor",

                        html: `
                            <span class="marcador-personalizado usuario">
                                <i class="fa-solid fa-location-crosshairs"></i>
                            </span>
                        `,

                        iconSize:
                            [38, 38],

                        iconAnchor:
                            [19, 19],

                        popupAnchor:
                            [0, -20],
                    }
                );


            marcadorUsuario =
                L.marker(
                    [
                        latitud,
                        longitud,
                    ],
                    {
                        icon:
                            iconoUsuario,
                    }
                )
                .bindPopup(
                    crearPopupRuta(
                        "Tu ubicación",
                        "Ubicación aproximada del dispositivo."
                    )
                )
                .addTo(
                    mapaRide
                );


            marcadorUsuario.openPopup();


            mapaRide.setView(
                [
                    latitud,
                    longitud,
                ],
                16
            );


            cambiarEstadoBotonUbicacion(
                botonUbicacion,
                false
            );

        },

        function (error) {

            cambiarEstadoBotonUbicacion(
                botonUbicacion,
                false
            );


            let mensaje =
                "No fue posible obtener tu ubicación.";


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                mensaje =
                    "Debes permitir el acceso a tu ubicación en el navegador.";

            } else if (
                error.code ===
                error.POSITION_UNAVAILABLE
            ) {

                mensaje =
                    "La ubicación del dispositivo no está disponible.";

            } else if (
                error.code ===
                error.TIMEOUT
            ) {

                mensaje =
                    "La solicitud de ubicación tardó demasiado.";

            }


            window.alert(
                mensaje
            );

        },

        {
            enableHighAccuracy:
                true,

            timeout:
                12000,

            maximumAge:
                15000,
        }

    );

}


/*==================================================
    ESTADO DEL BOTÓN DE UBICACIÓN
==================================================*/

function cambiarEstadoBotonUbicacion(
    boton,
    cargando
) {

    if (!boton) {

        return;

    }


    boton.disabled =
        cargando;


    if (cargando) {

        boton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Obteniendo ubicación...
        `;

    } else {

        boton.innerHTML = `
            <i class="fa-solid fa-location-crosshairs"></i>
            Mi ubicación
        `;

    }

}


/*==================================================
    RESUMEN DE DISTANCIA Y DURACIÓN
==================================================*/

function actualizarResumenRuta(
    distanciaMetros,
    duracionSegundos
) {

    const distancia =
        formatearDistancia(
            distanciaMetros
        );

    const duracion =
        formatearDuracion(
            duracionSegundos
        );


    const contenedor =
        document.querySelector(
            ".trayecto-resumen"
        );


    if (!contenedor) {

        return;

    }


    let resumen =
        document.getElementById(
            "resumenRutaOSRM"
        );


    if (!resumen) {

        resumen =
            document.createElement(
                "article"
            );


        resumen.id =
            "resumenRutaOSRM";


        resumen.className =
            "resumen-ruta-osrm";


        contenedor.insertAdjacentElement(
            "afterend",
            resumen
        );

    }


    resumen.innerHTML = `

        <div>

            <i class="fa-solid fa-road"></i>

            <span>
                Distancia
            </span>

            <strong>
                ${distancia}
            </strong>

        </div>

        <div>

            <i class="fa-regular fa-clock"></i>

            <span>
                Tiempo estimado
            </span>

            <strong>
                ${duracion}
            </strong>

        </div>

    `;

}


/*==================================================
    FORMATEADORES
==================================================*/

function formatearDistancia(
    distanciaMetros
) {

    const metros =
        Number(
            distanciaMetros
        );


    if (!Number.isFinite(metros)) {

        return "Sin calcular";

    }


    if (metros < 1000) {

        return `${Math.round(metros)} m`;

    }


    return `${(
        metros / 1000
    ).toFixed(1)} km`;

}


function formatearDuracion(
    duracionSegundos
) {

    const segundos =
        Number(
            duracionSegundos
        );


    if (!Number.isFinite(segundos)) {

        return "Sin calcular";

    }


    const minutos =
        Math.max(
            1,
            Math.round(
                segundos / 60
            )
        );


    if (minutos < 60) {

        return `${minutos} min`;

    }


    const horas =
        Math.floor(
            minutos / 60
        );

    const minutosRestantes =
        minutos % 60;


    if (minutosRestantes === 0) {

        return `${horas} h`;

    }


    return `${horas} h ${minutosRestantes} min`;

}


/*==================================================
    POPUPS
==================================================*/

function crearPopupRuta(
    titulo,
    descripcion
) {

    return `
        <div class="popup-ruta-ride">

            <strong>
                ${escaparHTML(titulo)}
            </strong>

            <span>
                ${escaparHTML(descripcion)}
            </span>

        </div>
    `;

}


function crearPopupResumenRuta(
    distancia,
    duracion
) {

    return `
        <div class="popup-ruta-ride">

            <strong>
                Resumen del recorrido
            </strong>

            <span>
                ${escaparHTML(
                    formatearDistancia(
                        distancia
                    )
                )}
                ·
                ${escaparHTML(
                    formatearDuracion(
                        duracion
                    )
                )}
            </span>

        </div>
    `;

}


function escaparHTML(
    valor
) {

    const elemento =
        document.createElement(
            "div"
        );


    elemento.textContent =
        String(
            valor || ""
        );


    return elemento.innerHTML;

}


/*==================================================
    AVISO DE RUTA APROXIMADA
==================================================*/

function mostrarAvisoRutaAlternativa() {

    const mapaWrapper =
        document.querySelector(
            ".mapa-wrapper"
        );


    if (!mapaWrapper) {

        return;

    }


    const aviso =
        document.createElement(
            "div"
        );


    aviso.className =
        "aviso-ruta-alternativa";


    aviso.innerHTML = `

        <i class="fa-solid fa-circle-info"></i>

        <span>
            No fue posible consultar la ruta por calles.
            Se muestra un recorrido aproximado.
        </span>

    `;


    mapaWrapper.appendChild(
        aviso
    );


    window.setTimeout(
        function () {

            aviso.classList.add(
                "visible"
            );

        },
        50
    );

}


/*==================================================
    CARGA Y ERROR DEL MAPA
==================================================*/

function ocultarCargaMapa() {

    const carga =
        document.getElementById(
            "mapaCargando"
        );


    if (carga) {

        carga.style.display =
            "none";

    }

}


function mostrarErrorMapa(
    mensaje
) {

    const error =
        document.getElementById(
            "mapaError"
        );

    const carga =
        document.getElementById(
            "mapaCargando"
        );


    if (carga) {

        carga.style.display =
            "none";

    }


    if (!error) {

        return;

    }


    error.hidden =
        false;


    const texto =
        error.querySelector(
            "p"
        );


    if (texto) {

        texto.textContent =
            mensaje;

    }

}


/*==================================================
    MODAL PARA FINALIZAR
==================================================*/

function iniciarModalFinalizarRide() {

    const botonAbrir =
        document.getElementById(
            "btnAbrirFinalizar"
        );

    const modal =
        document.getElementById(
            "modalFinalizarRide"
        );

    const botonCancelar =
        document.getElementById(
            "btnCancelarFinalizar"
        );

    const formulario =
        document.getElementById(
            "formFinalizarRide"
        );

    const botonConfirmar =
        document.getElementById(
            "btnConfirmarFinalizar"
        );


    if (!modal) {

        return;

    }


    function abrirModal() {

        modal.classList.add(
            "activo"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-ride-abierto"
        );


        botonCancelar?.focus();

    }


    function cerrarModal() {

        modal.classList.remove(
            "activo"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-ride-abierto"
        );


        botonAbrir?.focus();

    }


    botonAbrir?.addEventListener(
        "click",
        abrirModal
    );


    botonCancelar?.addEventListener(
        "click",
        cerrarModal
    );


    modal.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target === modal
            ) {

                cerrarModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                modal.classList.contains(
                    "activo"
                )
            ) {

                cerrarModal();

            }

        }
    );


    formulario?.addEventListener(
        "submit",
        function () {

            if (!botonConfirmar) {

                return;

            }


            botonConfirmar.disabled =
                true;


            botonConfirmar.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>

                Finalizando...

            `;

        }
    );

}


/*==================================================
    MENSAJES DE DJANGO
==================================================*/

function iniciarMensajesRide() {

    const mensajes =
        document.querySelectorAll(
            ".ride-mensaje"
        );


    mensajes.forEach(
        function (mensaje) {

            window.setTimeout(
                function () {

                    mensaje.style.opacity =
                        "0";

                    mensaje.style.transform =
                        "translateY(-8px)";


                    window.setTimeout(
                        function () {

                            mensaje.remove();

                        },
                        400
                    );

                },
                5000
            );

        }
    );

}