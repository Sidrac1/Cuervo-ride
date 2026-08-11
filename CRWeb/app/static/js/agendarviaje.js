"use strict";


document.addEventListener("DOMContentLoaded", function () {

    /*==================================================
        ELEMENTOS PRINCIPALES
    ==================================================*/

    const tarjetasViaje =
        document.querySelectorAll(".card-viaje");

    const mapaElemento =
        document.getElementById("mapa");

    const campoBusqueda =
        document.getElementById("buscarViaje");

    const viajeSeleccionadoInput =
        document.getElementById("viajeSeleccionadoId");

    const urlSolicitudInput =
        document.getElementById("urlSolicitudSeleccionada");

    const botonApartar =
        document.getElementById("btnApartarLugar");


    /*==================================================
        ELEMENTOS DEL PANEL DERECHO
    ==================================================*/

    const tituloDestino =
        document.getElementById("tituloDestino");

    const subtituloRuta =
        document.getElementById("subtituloRuta");

    const estadoDisponibilidad =
        document.getElementById("estadoDisponibilidad");

    const fotoConductor =
        document.getElementById("fotoConductorSeleccionado");

    const nombreConductor =
        document.getElementById("nombreConductor");

    const fechaSalida =
        document.getElementById("fechaSalida");

    const horaSalida =
        document.getElementById("horaSalida");

    const horaLlegada =
        document.getElementById("horaLlegada");

    const lugaresDisponibles =
        document.getElementById("lugaresDisponibles");

    const vehiculoSeleccionado =
        document.getElementById("vehiculoSeleccionado");

    const costoViaje =
        document.getElementById("costoViaje");

    const preferenciasViaje =
        document.getElementById("preferenciasViaje");

    const contenedorIndicaciones =
        document.getElementById("contenedorIndicaciones");

    const indicacionesViaje =
        document.getElementById("indicacionesViaje");

    const detalleViaje =
        document.getElementById("detalleViaje");


    /*==================================================
        ESTADO
    ==================================================*/

    let mapa = null;

    let marcadorOrigen = null;

    let marcadorDestino = null;

    let capaRuta = null;

    let viajeActualId = "";

    let urlSolicitudActual = "";

    let solicitudRutaActual = 0;


    const CONFIGURACION = {

        centroPredeterminado: [
            32.460963,
            -116.824371
        ],

        zoomPredeterminado: 13,

        osrmUrl:
            "https://router.project-osrm.org/route/v1/driving",

        imagenPredeterminada:
            "/static/img/profileIcon.png"

    };


    /*==================================================
        INICIALIZAR MAPA
    ==================================================*/

    function inicializarMapa() {

        if (
            !mapaElemento ||
            typeof L === "undefined"
        ) {

            console.warn(
                "No se encontró Leaflet o el elemento del mapa."
            );

            return;

        }


        mapa = L.map(
            mapaElemento,
            {
                zoomControl: false
            }
        ).setView(
            CONFIGURACION.centroPredeterminado,
            CONFIGURACION.zoomPredeterminado
        );


        L.control.zoom({
            position: "bottomright"
        }).addTo(mapa);



        const mapTilerKey = 'JS0B3dwVkIVaAJNtu5s2';

        L.tileLayer(`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${maptilerKey}`, {
            maxZoom: 19,
            attribution: "&copy; MapTiler"
        }).addTo(mapa);



        window.setTimeout(
            function () {

                mapa.invalidateSize();

            },
            150
        );

    }


    /*==================================================
        ICONOS DEL MAPA
    ==================================================*/

    function crearIconoOrigen() {

        return L.divIcon({

            className:
                "marcador-personalizado",

            html: `
                <div class="pin-mapa pin-origen">

                    <i class="fa-solid fa-graduation-cap"></i>

                </div>
            `,

            iconSize: [42, 52],

            iconAnchor: [21, 48],

            popupAnchor: [0, -45]

        });

    }


    function crearIconoDestino() {

        return L.divIcon({

            className:
                "marcador-personalizado",

            html: `
                <div class="pin-mapa pin-destino">

                    <i class="fa-solid fa-flag-checkered"></i>

                </div>
            `,

            iconSize: [42, 52],

            iconAnchor: [21, 48],

            popupAnchor: [0, -45]

        });

    }


    /*==================================================
        CONVERSIÓN DE DATOS
    ==================================================*/

    function convertirNumero(valor) {

        if (
            valor === undefined ||
            valor === null ||
            valor === ""
        ) {

            return null;

        }


        const numero =
            Number(valor);


        return Number.isFinite(numero)
            ? numero
            : null;

    }


    function convertirEntero(valor) {

        const numero =
            Number.parseInt(
                valor,
                10
            );


        return Number.isFinite(numero)
            ? numero
            : 0;

    }


    /*==================================================
        OBTENER DATOS DE LA TARJETA
    ==================================================*/

    function obtenerDatosTarjeta(tarjeta) {

        if (!tarjeta) {
            return null;
        }


        const imagen =
            tarjeta.querySelector(
                ".card-conductor-foto img"
            );


        return {

            id:
                tarjeta.dataset.viajeId || "",

            solicitarUrl:
                tarjeta.dataset.solicitarUrl || "",

            origen:
                tarjeta.dataset.origen || "",

            destino:
                tarjeta.dataset.destino || "",

            origenLatitud:
                convertirNumero(
                    tarjeta.dataset.origenLatitud
                ),

            origenLongitud:
                convertirNumero(
                    tarjeta.dataset.origenLongitud
                ),

            destinoLatitud:
                convertirNumero(
                    tarjeta.dataset.destinoLatitud
                ),

            destinoLongitud:
                convertirNumero(
                    tarjeta.dataset.destinoLongitud
                ),

            fecha:
                tarjeta.dataset.fecha || "--/--/----",

            hora:
                tarjeta.dataset.hora || "--:--",

            llegada:
                (
                    tarjeta.dataset.llegada ||
                    "Por confirmar"
                ).trim(),

            asientos:
                convertirEntero(
                    tarjeta.dataset.asientos
                ),

            asientosTotales:
                convertirEntero(
                    tarjeta.dataset.asientosTotales
                ),

            costo:
                tarjeta.dataset.costo || "0.00",

            conductor:
                tarjeta.dataset.conductor || "Sin conductor",

            vehiculo:
                tarjeta.dataset.vehiculo || "Sin vehículo",

            color:
                tarjeta.dataset.color || "",

            placas:
                tarjeta.dataset.placas || "",

            indicaciones:
                tarjeta.dataset.indicaciones || "",

            permiteMascota:
                tarjeta.dataset.permiteMascota === "true",

            aceptaSillaRuedas:
                tarjeta.dataset.aceptaSillaRuedas === "true",

            foto:
                imagen
                    ? imagen.src
                    : CONFIGURACION.imagenPredeterminada

        };

    }


    /*==================================================
        SELECCIONAR VIAJE
    ==================================================*/

    async function seleccionarViaje(tarjeta) {

        if (!tarjeta) {
            return;
        }


        const datos =
            obtenerDatosTarjeta(tarjeta);


        if (!datos) {
            return;
        }


        tarjetasViaje.forEach(
            function (elemento) {

                elemento.classList.remove(
                    "active"
                );

                elemento.setAttribute(
                    "aria-pressed",
                    "false"
                );

            }
        );


        tarjeta.classList.add(
            "active"
        );

        tarjeta.setAttribute(
            "aria-pressed",
            "true"
        );


        viajeActualId =
            datos.id;


        urlSolicitudActual =
            datos.solicitarUrl;


        if (viajeSeleccionadoInput) {

            viajeSeleccionadoInput.value =
                viajeActualId;

        }


        if (urlSolicitudInput) {

            urlSolicitudInput.value =
                urlSolicitudActual;

        }


        actualizarPanelDerecho(
            datos
        );


        await mostrarRutaViaje(
            datos
        );

    }


    /*==================================================
        ACTUALIZAR PANEL DERECHO
    ==================================================*/

    function actualizarPanelDerecho(datos) {

        if (tituloDestino) {

            tituloDestino.textContent =
                datos.destino ||
                "Destino sin definir";

        }


        if (subtituloRuta) {

            subtituloRuta.textContent =
                datos.origen
                    ? `Desde ${datos.origen}`
                    : "Origen sin definir";

        }


        if (fotoConductor) {

            fotoConductor.src =
                datos.foto ||
                CONFIGURACION.imagenPredeterminada;

            fotoConductor.alt =
                `Foto de ${datos.conductor}`;

        }


        if (nombreConductor) {

            nombreConductor.textContent =
                datos.conductor;

        }


        if (fechaSalida) {

            fechaSalida.textContent =
                datos.fecha;

        }


        if (horaSalida) {

            horaSalida.textContent =
                datos.hora
                    ? `${datos.hora} h`
                    : "--:--";

        }


        if (horaLlegada) {

            horaLlegada.textContent =
                datos.llegada === "Por confirmar"
                    ? "Por confirmar"
                    : `${datos.llegada} h`;

        }


        if (lugaresDisponibles) {

            lugaresDisponibles.textContent =
                `${datos.asientos} de ${datos.asientosTotales}`;

        }


        if (vehiculoSeleccionado) {

            const datosVehiculo = [
                datos.vehiculo,
                datos.color,
                datos.placas
            ].filter(Boolean);


            vehiculoSeleccionado.textContent =
                datosVehiculo.join(" · ");

        }


        if (costoViaje) {

            costoViaje.textContent =
                `$${datos.costo} MXN`;

        }


        actualizarPreferencias(
            datos
        );


        actualizarIndicaciones(
            datos.indicaciones
        );


        actualizarDisponibilidad(
            datos.asientos
        );

    }


    /*==================================================
        PREFERENCIAS
    ==================================================*/

    function actualizarPreferencias(datos) {

        if (!preferenciasViaje) {
            return;
        }


        preferenciasViaje.innerHTML =
            "";


        if (datos.permiteMascota) {

            const mascota =
                document.createElement("span");


            mascota.innerHTML = `
                <i class="fa-solid fa-paw"></i>
                Mascotas permitidas
            `;


            preferenciasViaje.appendChild(
                mascota
            );

        }


        if (datos.aceptaSillaRuedas) {

            const accesibilidad =
                document.createElement("span");


            accesibilidad.innerHTML = `
                <i class="fa-solid fa-wheelchair"></i>
                Accesible
            `;


            preferenciasViaje.appendChild(
                accesibilidad
            );

        }

    }


    /*==================================================
        INDICACIONES
    ==================================================*/

    function actualizarIndicaciones(indicaciones) {

        if (
            !contenedorIndicaciones ||
            !indicacionesViaje
        ) {

            return;

        }


        const texto =
            String(
                indicaciones || ""
            ).trim();


        if (!texto) {

            contenedorIndicaciones.hidden =
                true;

            indicacionesViaje.textContent =
                "";

            return;

        }


        indicacionesViaje.textContent =
            texto;

        contenedorIndicaciones.hidden =
            false;

    }


    /*==================================================
        DISPONIBILIDAD
    ==================================================*/

    function actualizarDisponibilidad(asientos) {

        const disponible =
            asientos > 0;


        if (botonApartar) {

            botonApartar.disabled =
                !disponible;

        }


        if (detalleViaje) {

            detalleViaje.classList.toggle(
                "sin-disponibilidad",
                !disponible
            );

        }


        if (!estadoDisponibilidad) {
            return;
        }


        if (disponible) {

            estadoDisponibilidad.innerHTML = `
                <i class="fa-solid fa-circle"></i>

                ${asientos}

                lugar${asientos === 1 ? "" : "es"}

                disponible${asientos === 1 ? "" : "s"}
            `;


            estadoDisponibilidad.removeAttribute(
                "style"
            );

        } else {

            estadoDisponibilidad.innerHTML = `
                <i class="fa-solid fa-circle-xmark"></i>

                Sin lugares
            `;


            estadoDisponibilidad.style.color =
                "var(--rojo)";

            estadoDisponibilidad.style.background =
                "var(--rojo-suave)";

            estadoDisponibilidad.style.borderColor =
                "rgba(255, 93, 108, 0.35)";

        }

    }


    /*==================================================
        MOSTRAR RUTA
    ==================================================*/

    async function mostrarRutaViaje(datos) {

        if (!mapa) {
            return;
        }


        limpiarRutaAnterior();


        const tieneOrigen =
            datos.origenLatitud !== null &&
            datos.origenLongitud !== null;


        const tieneDestino =
            datos.destinoLatitud !== null &&
            datos.destinoLongitud !== null;


        if (
            !tieneOrigen ||
            !tieneDestino
        ) {

            mapa.setView(
                CONFIGURACION.centroPredeterminado,
                CONFIGURACION.zoomPredeterminado
            );


            mostrarMensajeTemporalMapa(
                "Este viaje todavía no cuenta con coordenadas completas."
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


        marcadorOrigen =
            L.marker(
                origen,
                {
                    icon: crearIconoOrigen()
                }
            )
            .addTo(mapa)
            .bindPopup(
                `<strong>Origen</strong><br>${escaparHtml(datos.origen)}`
            );


        marcadorDestino =
            L.marker(
                destino,
                {
                    icon: crearIconoDestino()
                }
            )
            .addTo(mapa)
            .bindPopup(
                `<strong>Destino</strong><br>${escaparHtml(datos.destino)}`
            );


        mapa.fitBounds(
            L.latLngBounds(
                origen,
                destino
            ),
            {
                padding: [55, 55]
            }
        );


        const idSolicitud =
            ++solicitudRutaActual;


        establecerEstadoCargaMapa(
            true
        );


        try {

            const ruta =
                await solicitarRutaOSRM(
                    datos.origenLongitud,
                    datos.origenLatitud,
                    datos.destinoLongitud,
                    datos.destinoLatitud
                );


            if (
                idSolicitud !==
                solicitudRutaActual
            ) {

                return;

            }


            if (!ruta) {

                dibujarLineaDirecta(
                    origen,
                    destino
                );

                return;

            }


            capaRuta =
                L.geoJSON(
                    ruta.geometry,
                    {
                        style: {
                            color: "#98ec63",
                            weight: 5,
                            opacity: 0.85,
                            lineCap: "round",
                            lineJoin: "round"
                        }
                    }
                ).addTo(mapa);


            mapa.fitBounds(
                capaRuta.getBounds(),
                {
                    padding: [45, 45]
                }
            );


        } catch (error) {

            console.error(
                "No fue posible calcular la ruta:",
                error
            );


            dibujarLineaDirecta(
                origen,
                destino
            );


        } finally {

            if (
                idSolicitud ===
                solicitudRutaActual
            ) {

                establecerEstadoCargaMapa(
                    false
                );

            }

        }

    }


    /*==================================================
        SOLICITAR RUTA A OSRM
    ==================================================*/

    async function solicitarRutaOSRM(
        origenLongitud,
        origenLatitud,
        destinoLongitud,
        destinoLatitud
    ) {

        const coordenadas =
            `${origenLongitud},${origenLatitud};` +
            `${destinoLongitud},${destinoLatitud}`;


        const url =
            `${CONFIGURACION.osrmUrl}/` +
            `${coordenadas}` +
            "?overview=full&geometries=geojson";


        const respuesta =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                `OSRM respondió con estado ${respuesta.status}.`
            );

        }


        const datos =
            await respuesta.json();


        if (
            datos.code !== "Ok" ||
            !Array.isArray(datos.routes) ||
            datos.routes.length === 0
        ) {

            return null;

        }


        return datos.routes[0];

    }


    /*==================================================
        LÍNEA DIRECTA
    ==================================================*/

    function dibujarLineaDirecta(
        origen,
        destino
    ) {

        capaRuta =
            L.polyline(
                [
                    origen,
                    destino
                ],
                {
                    color: "#98ec63",
                    weight: 4,
                    opacity: 0.72,
                    dashArray: "9 9",
                    lineCap: "round"
                }
            ).addTo(mapa);


        mapa.fitBounds(
            capaRuta.getBounds(),
            {
                padding: [55, 55]
            }
        );

    }


    /*==================================================
        LIMPIAR RUTA
    ==================================================*/

    function limpiarRutaAnterior() {

        if (!mapa) {
            return;
        }


        if (marcadorOrigen) {

            mapa.removeLayer(
                marcadorOrigen
            );

            marcadorOrigen = null;

        }


        if (marcadorDestino) {

            mapa.removeLayer(
                marcadorDestino
            );

            marcadorDestino = null;

        }


        if (capaRuta) {

            mapa.removeLayer(
                capaRuta
            );

            capaRuta = null;

        }

    }


    /*==================================================
        CARGA DEL MAPA
    ==================================================*/

    function establecerEstadoCargaMapa(cargando) {

        if (!mapaElemento) {
            return;
        }


        mapaElemento.classList.toggle(
            "cargando-viaje",
            cargando
        );

    }


    /*==================================================
        MENSAJE TEMPORAL DEL MAPA
    ==================================================*/

    function mostrarMensajeTemporalMapa(mensaje) {

        if (!mapaElemento) {
            return;
        }


        const anterior =
            mapaElemento.querySelector(
                ".mensaje-mapa-temporal"
            );


        if (anterior) {

            anterior.remove();

        }


        const elemento =
            document.createElement("div");


        elemento.className =
            "mensaje-mapa-temporal";


        elemento.innerHTML = `

            <i class="fa-solid fa-location-dot"></i>

            <span></span>

        `;


        const texto =
            elemento.querySelector("span");


        if (texto) {

            texto.textContent =
                mensaje;

        }


        mapaElemento.appendChild(
            elemento
        );


        window.setTimeout(
            function () {

                elemento.remove();

            },
            3500
        );

    }


    /*==================================================
        EVENTOS DE LAS TARJETAS
    ==================================================*/

    tarjetasViaje.forEach(
        function (tarjeta) {

            tarjeta.addEventListener(
                "click",
                function () {

                    seleccionarViaje(
                        tarjeta
                    );

                }
            );


            tarjeta.addEventListener(
                "keydown",
                function (evento) {

                    if (
                        evento.key === "Enter" ||
                        evento.key === " "
                    ) {

                        evento.preventDefault();

                        seleccionarViaje(
                            tarjeta
                        );

                    }

                }
            );

        }
    );


    /*==================================================
        BOTÓN APARTAR
    ==================================================*/

    if (botonApartar) {

        botonApartar.addEventListener(
            "click",
            function () {

                if (!viajeActualId) {

                    mostrarNotificacion(
                        "Selecciona un viaje antes de apartar un lugar.",
                        "error"
                    );

                    return;

                }


                if (!urlSolicitudActual) {

                    mostrarNotificacion(
                        "No fue posible abrir la solicitud del viaje.",
                        "error"
                    );

                    return;

                }


                window.location.href =
                    urlSolicitudActual;

            }
        );

    }


    /*==================================================
        BÚSQUEDA LOCAL
    ==================================================*/

    if (campoBusqueda) {

        campoBusqueda.addEventListener(
            "input",
            function () {

                const termino =
                    normalizarTexto(
                        campoBusqueda.value
                    );


                tarjetasViaje.forEach(
                    function (tarjeta) {

                        const datos =
                            obtenerDatosTarjeta(
                                tarjeta
                            );


                        const contenido =
                            normalizarTexto(
                                [
                                    datos.conductor,
                                    datos.origen,
                                    datos.destino,
                                    datos.vehiculo,
                                    datos.color,
                                    datos.placas
                                ].join(" ")
                            );


                        tarjeta.hidden =
                            termino.length > 0 &&
                            !contenido.includes(
                                termino
                            );

                    }
                );

            }
        );

    }


    /*==================================================
        NORMALIZAR TEXTO
    ==================================================*/

    function normalizarTexto(valor) {

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
        NOTIFICACIÓN
    ==================================================*/

    function mostrarNotificacion(
        mensaje,
        tipo = "info"
    ) {

        const anterior =
            document.querySelector(
                ".notificacion-agendar"
            );


        if (anterior) {

            anterior.remove();

        }


        const notificacion =
            document.createElement("div");


        notificacion.className =
            `notificacion-agendar ${tipo}`;


        const icono =
            tipo === "error"
                ? "fa-circle-exclamation"
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
        ESCAPAR HTML
    ==================================================*/

    function escaparHtml(valor) {

        const elemento =
            document.createElement("div");


        elemento.textContent =
            String(valor || "");


        return elemento.innerHTML;

    }


    /*==================================================
        RESIZE
    ==================================================*/

    window.addEventListener(
        "resize",
        function () {

            if (!mapa) {
                return;
            }


            window.setTimeout(
                function () {

                    mapa.invalidateSize();

                },
                180
            );

        }
    );


    /*==================================================
        INICIALIZACIÓN
    ==================================================*/

    inicializarMapa();


    const primeraTarjeta =
        document.querySelector(
            ".card-viaje.active"
        ) ||
        document.querySelector(
            ".card-viaje"
        );


    if (primeraTarjeta) {

        seleccionarViaje(
            primeraTarjeta
        );

    } else if (botonApartar) {

        botonApartar.disabled =
            true;

    }

});