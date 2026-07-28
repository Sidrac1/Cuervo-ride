"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /*==================================================
                    ELEMENTOS DEL DOM
    ==================================================*/

    const mapaElemento = document.getElementById("mapa");

    if (!mapaElemento || typeof L === "undefined") {
        console.error(
            "No fue posible iniciar el mapa de publicación."
        );
        return;
    }

    const elementos = {
        origenInput: document.getElementById("id_origen"),
        destinoInput: document.getElementById("id_destino"),

        origenLatitud: document.getElementById(
            "id_origen_latitud"
        ),
        origenLongitud: document.getElementById(
            "id_origen_longitud"
        ),

        destinoLatitud: document.getElementById(
            "id_destino_latitud"
        ),
        destinoLongitud: document.getElementById(
            "id_destino_longitud"
        ),

        buscarOrigen: document.getElementById(
            "buscarOrigen"
        ),
        buscarDestino: document.getElementById(
            "buscarDestino"
        ),

        resultadosOrigen: document.getElementById(
            "resultadosOrigen"
        ),
        resultadosDestino: document.getElementById(
            "resultadosDestino"
        ),

        origenSeleccionado: document.getElementById(
            "origenSeleccionado"
        ),
        destinoSeleccionado: document.getElementById(
            "destinoSeleccionado"
        ),

        mapaMensaje: document.getElementById(
            "mapaMensaje"
        ),

        centrarMapa: document.getElementById(
            "centrarMapa"
        ),

        resumenRutaMapa: document.getElementById(
            "resumenRutaMapa"
        ),

        resumenRutaMovil: document.getElementById(
            "resumenRutaMovil"
        ),
    };

    /*==================================================
                        CONFIGURACIÓN
    ==================================================*/

    const CONFIG = {
        centroInicial: [32.5149, -117.0382],
        zoomInicial: 12,

        nominatimUrl:
            "https://nominatim.openstreetmap.org/search",

        osrmUrl:
            "https://router.project-osrm.org/route/v1/driving",

        paisesPermitidos: "mx",
        limiteResultados: 5,
    };

    /*==================================================
                        ESTADO
    ==================================================*/

    const estado = {
        origen: null,
        destino: null,

        marcadorOrigen: null,
        marcadorDestino: null,

        capaRuta: null,
        ultimaRuta: null,

        busquedaActiva: {
            origen: null,
            destino: null,
        },

        cacheBusquedas: new Map(),
    };

    /*==================================================
                            MAPA
    ==================================================*/

    const mapa = L.map("mapa", {
        zoomControl: false,
    }).setView(
        CONFIG.centroInicial,
        CONFIG.zoomInicial
    );

    L.control.zoom({
        position: "bottomright",
    }).addTo(mapa);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors",
        }
    ).addTo(mapa);

    /*==================================================
                        ICONOS DEL MAPA
    ==================================================*/

    const iconoOrigen = L.divIcon({
        className: "marcador-personalizado",
        html: `
            <div class="pin-mapa pin-origen">
                <i class="fa-solid fa-location-dot"></i>
            </div>
        `,
        iconSize: [42, 52],
        iconAnchor: [21, 50],
        popupAnchor: [0, -48],
    });

    const iconoDestino = L.divIcon({
        className: "marcador-personalizado",
        html: `
            <div class="pin-mapa pin-destino">
                <i class="fa-solid fa-flag-checkered"></i>
            </div>
        `,
        iconSize: [42, 52],
        iconAnchor: [21, 50],
        popupAnchor: [0, -48],
    });

    /*==================================================
                    UTILIDADES GENERALES
    ==================================================*/

    function normalizarTexto(texto) {
        return String(texto || "")
            .trim()
            .replace(/\s+/g, " ");
    }

    function escaparHtml(texto) {
        const elemento = document.createElement("div");
        elemento.textContent = texto;
        return elemento.innerHTML;
    }

    function convertirNumero(valor) {
        const numero = Number.parseFloat(valor);

        return Number.isFinite(numero)
            ? numero
            : null;
    }

    function construirClaveCache(texto) {
        return normalizarTexto(texto).toLowerCase();
    }

    function establecerCargandoBoton(
        boton,
        cargando
    ) {
        if (!boton) {
            return;
        }

        boton.disabled = cargando;

        boton.innerHTML = cargando
            ? `
                <i class="fa-solid fa-spinner fa-spin"></i>
            `
            : `
                <i class="fa-solid fa-magnifying-glass"></i>
            `;
    }

    function mostrarMensajeMapa(
        mensaje,
        tipo = "normal"
    ) {
        if (!elementos.mapaMensaje) {
            return;
        }

        elementos.mapaMensaje.classList.remove(
            "exito",
            "error",
            "cargando"
        );

        if (tipo !== "normal") {
            elementos.mapaMensaje.classList.add(tipo);
        }

        const iconos = {
            normal: "fa-location-dot",
            cargando: "fa-spinner fa-spin",
            exito: "fa-route",
            error: "fa-circle-exclamation",
        };

        elementos.mapaMensaje.innerHTML = `
            <i class="fa-solid ${iconos[tipo]}"></i>
            <span>${escaparHtml(mensaje)}</span>
        `;
    }

    /*==================================================
                        BÚSQUEDA
    ==================================================*/

    async function buscarUbicaciones(
        tipo,
        texto
    ) {
        const termino = normalizarTexto(texto);

        if (termino.length < 3) {
            mostrarErrorResultados(
                tipo,
                "Escribe al menos tres caracteres."
            );
            return;
        }

        const claveCache = construirClaveCache(
            termino
        );

        if (estado.cacheBusquedas.has(claveCache)) {
            renderizarResultados(
                tipo,
                estado.cacheBusquedas.get(claveCache)
            );
            return;
        }

        cancelarBusquedaAnterior(tipo);

        const controlador = new AbortController();

        estado.busquedaActiva[tipo] = controlador;

        const boton = tipo === "origen"
            ? elementos.buscarOrigen
            : elementos.buscarDestino;

        establecerCargandoBoton(
            boton,
            true
        );

        mostrarCargandoResultados(tipo);

        try {
            const parametros = new URLSearchParams({
                q: `${termino}, México`,
                format: "jsonv2",
                addressdetails: "1",
                limit: String(
                    CONFIG.limiteResultados
                ),
                countrycodes:
                    CONFIG.paisesPermitidos,
                dedupe: "1",
            });

            const respuesta = await fetch(
                `${CONFIG.nominatimUrl}?${parametros.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                    signal: controlador.signal,
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    `Error HTTP ${respuesta.status}`
                );
            }

            const resultados = await respuesta.json();

            estado.cacheBusquedas.set(
                claveCache,
                resultados
            );

            renderizarResultados(
                tipo,
                resultados
            );

        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            console.error(
                "Error buscando ubicación:",
                error
            );

            mostrarErrorResultados(
                tipo,
                "No fue posible buscar la ubicación."
            );

        } finally {
            if (
                estado.busquedaActiva[tipo]
                === controlador
            ) {
                estado.busquedaActiva[tipo] = null;
            }

            establecerCargandoBoton(
                boton,
                false
            );
        }
    }

    function cancelarBusquedaAnterior(tipo) {
        const busqueda = estado.busquedaActiva[tipo];

        if (busqueda) {
            busqueda.abort();
            estado.busquedaActiva[tipo] = null;
        }
    }

    function obtenerContenedorResultados(tipo) {
        return tipo === "origen"
            ? elementos.resultadosOrigen
            : elementos.resultadosDestino;
    }

    function mostrarCargandoResultados(tipo) {
        const contenedor = obtenerContenedorResultados(
            tipo
        );

        if (!contenedor) {
            return;
        }

        contenedor.hidden = false;

        contenedor.innerHTML = `
            <div class="estado-resultados">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Buscando ubicaciones...
            </div>
        `;
    }

    function mostrarErrorResultados(
        tipo,
        mensaje
    ) {
        const contenedor = obtenerContenedorResultados(
            tipo
        );

        if (!contenedor) {
            return;
        }

        contenedor.hidden = false;

        contenedor.innerHTML = `
            <div class="estado-resultados error">
                <i class="fa-solid fa-circle-exclamation"></i>
                ${escaparHtml(mensaje)}
            </div>
        `;
    }

    function renderizarResultados(
        tipo,
        resultados
    ) {
        const contenedor = obtenerContenedorResultados(
            tipo
        );

        if (!contenedor) {
            return;
        }

        contenedor.innerHTML = "";
        contenedor.hidden = false;

        if (!Array.isArray(resultados)
            || resultados.length === 0) {

            mostrarErrorResultados(
                tipo,
                "No se encontraron resultados."
            );

            return;
        }

        resultados.forEach((resultado) => {

            const latitud = convertirNumero(
                resultado.lat
            );

            const longitud = convertirNumero(
                resultado.lon
            );

            if (
                latitud === null
                || longitud === null
            ) {
                return;
            }

            const boton = document.createElement(
                "button"
            );

            boton.type = "button";
            boton.className = "resultado-ubicacion";

            boton.innerHTML = `
                <span class="resultado-icono">
                    <i class="fa-solid fa-location-dot"></i>
                </span>

                <span class="resultado-texto">
                    <strong>
                        ${escaparHtml(
                            obtenerNombrePrincipal(resultado)
                        )}
                    </strong>

                    <small>
                        ${escaparHtml(
                            resultado.display_name
                        )}
                    </small>
                </span>

                <i class="fa-solid fa-chevron-right"></i>
            `;

            boton.addEventListener(
                "click",
                () => {
                    seleccionarUbicacion(
                        tipo,
                        resultado
                    );
                }
            );

            contenedor.appendChild(boton);
        });
    }

    function obtenerNombrePrincipal(resultado) {
        const direccion = resultado.address || {};

        return (
            resultado.name
            || direccion.road
            || direccion.neighbourhood
            || direccion.suburb
            || direccion.city
            || direccion.town
            || direccion.village
            || "Ubicación seleccionada"
        );
    }

    /*==================================================
                    SELECCIÓN DE UBICACIÓN
    ==================================================*/

    function seleccionarUbicacion(
        tipo,
        resultado
    ) {
        const ubicacion = {
            nombre: resultado.display_name,
            latitud: convertirNumero(resultado.lat),
            longitud: convertirNumero(resultado.lon),
        };

        if (
            ubicacion.latitud === null
            || ubicacion.longitud === null
        ) {
            mostrarErrorResultados(
                tipo,
                "Las coordenadas del resultado no son válidas."
            );
            return;
        }

        estado[tipo] = ubicacion;

        actualizarCamposUbicacion(
            tipo,
            ubicacion
        );

        actualizarMarcador(
            tipo,
            ubicacion
        );

        cerrarResultados(tipo);

        actualizarMapaYCrearRuta();
    }

    function actualizarCamposUbicacion(
        tipo,
        ubicacion
    ) {
        const esOrigen = tipo === "origen";

        const inputTexto = esOrigen
            ? elementos.origenInput
            : elementos.destinoInput;

        const inputLatitud = esOrigen
            ? elementos.origenLatitud
            : elementos.destinoLatitud;

        const inputLongitud = esOrigen
            ? elementos.origenLongitud
            : elementos.destinoLongitud;

        const indicador = esOrigen
            ? elementos.origenSeleccionado
            : elementos.destinoSeleccionado;

        inputTexto.value = ubicacion.nombre;
        inputLatitud.value =
            ubicacion.latitud.toFixed(7);
        inputLongitud.value =
            ubicacion.longitud.toFixed(7);

        if (indicador) {
            indicador.hidden = false;

            const texto = indicador.querySelector(
                "span"
            );

            if (texto) {
                texto.textContent =
                    "Ubicación seleccionada correctamente";
            }
        }

        inputTexto.classList.add(
            "ubicacion-valida"
        );

        inputTexto.dispatchEvent(
            new Event("change", {
                bubbles: true,
            })
        );
    }

    function actualizarMarcador(
        tipo,
        ubicacion
    ) {
        const posicion = [
            ubicacion.latitud,
            ubicacion.longitud,
        ];

        const esOrigen = tipo === "origen";

        const propiedadMarcador = esOrigen
            ? "marcadorOrigen"
            : "marcadorDestino";

        const icono = esOrigen
            ? iconoOrigen
            : iconoDestino;

        if (estado[propiedadMarcador]) {
            estado[propiedadMarcador]
                .setLatLng(posicion);

            estado[propiedadMarcador]
                .setPopupContent(
                    escaparHtml(ubicacion.nombre)
                );
        } else {
            estado[propiedadMarcador] = L.marker(
                posicion,
                {
                    icon: icono,
                    draggable: true,
                }
            )
                .addTo(mapa)
                .bindPopup(
                    escaparHtml(ubicacion.nombre)
                );

            estado[propiedadMarcador].on(
                "dragend",
                (evento) => {
                    actualizarDesdeMarcador(
                        tipo,
                        evento.target.getLatLng()
                    );
                }
            );
        }

        estado[propiedadMarcador].openPopup();
    }

    function actualizarDesdeMarcador(
        tipo,
        coordenadas
    ) {
        const ubicacionActual = estado[tipo];

        if (!ubicacionActual) {
            return;
        }

        const ubicacionActualizada = {
            ...ubicacionActual,
            latitud: coordenadas.lat,
            longitud: coordenadas.lng,
        };

        estado[tipo] = ubicacionActualizada;

        const esOrigen = tipo === "origen";

        const inputLatitud = esOrigen
            ? elementos.origenLatitud
            : elementos.destinoLatitud;

        const inputLongitud = esOrigen
            ? elementos.origenLongitud
            : elementos.destinoLongitud;

        inputLatitud.value =
            coordenadas.lat.toFixed(7);

        inputLongitud.value =
            coordenadas.lng.toFixed(7);

        actualizarMapaYCrearRuta();
    }

    function cerrarResultados(tipo) {
        const contenedor = obtenerContenedorResultados(
            tipo
        );

        if (!contenedor) {
            return;
        }

        contenedor.hidden = true;
        contenedor.innerHTML = "";
    }

    /*==================================================
                        CREACIÓN DE RUTA
    ==================================================*/

    async function actualizarMapaYCrearRuta() {
        if (
            !estado.origen
            && !estado.destino
        ) {
            mapa.setView(
                CONFIG.centroInicial,
                CONFIG.zoomInicial
            );

            return;
        }

        if (
            estado.origen
            && !estado.destino
        ) {
            mapa.setView(
                [
                    estado.origen.latitud,
                    estado.origen.longitud,
                ],
                15
            );

            mostrarMensajeMapa(
                "Ahora selecciona el destino."
            );

            return;
        }

        if (
            !estado.origen
            && estado.destino
        ) {
            mapa.setView(
                [
                    estado.destino.latitud,
                    estado.destino.longitud,
                ],
                15
            );

            mostrarMensajeMapa(
                "Ahora selecciona el punto de origen."
            );

            return;
        }

        await crearRuta();
    }

    async function crearRuta() {
        mostrarMensajeMapa(
            "Calculando la mejor ruta disponible...",
            "cargando"
        );

        ocultarResumenRuta();

        const origen = estado.origen;
        const destino = estado.destino;

        /*
         * OSRM recibe las coordenadas en el orden:
         * longitud,latitud.
         */
        const coordenadas = [
            `${origen.longitud},${origen.latitud}`,
            `${destino.longitud},${destino.latitud}`,
        ].join(";");

        const parametros = new URLSearchParams({
            overview: "full",
            geometries: "geojson",
            steps: "false",
            alternatives: "false",
        });

        try {
            const respuesta = await fetch(
                `${CONFIG.osrmUrl}/${coordenadas}?${parametros.toString()}`,
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!respuesta.ok) {
                throw new Error(
                    `Error HTTP ${respuesta.status}`
                );
            }

            const datos = await respuesta.json();

            if (
                datos.code !== "Ok"
                || !datos.routes
                || datos.routes.length === 0
            ) {
                throw new Error(
                    "No se encontró una ruta válida."
                );
            }

            const ruta = datos.routes[0];

            dibujarRuta(ruta.geometry);

            estado.ultimaRuta = ruta;

            mostrarResumenRuta(
                ruta.distance,
                ruta.duration
            );

            mostrarMensajeMapa(
                "Ruta calculada correctamente.",
                "exito"
            );

        } catch (error) {
            console.error(
                "Error calculando la ruta:",
                error
            );

            eliminarRutaActual();

            ocultarResumenRuta();

            mostrarMensajeMapa(
                "No fue posible calcular una ruta entre estos puntos.",
                "error"
            );

            ajustarMapaAMarcadores();
        }
    }

    function dibujarRuta(geometria) {
        eliminarRutaActual();

        estado.capaRuta = L.geoJSON(
            geometria,
            {
                style: {
                    color: "#1687ff",
                    weight: 6,
                    opacity: 0.9,
                    lineCap: "round",
                    lineJoin: "round",
                },
            }
        ).addTo(mapa);

        mapa.fitBounds(
            estado.capaRuta.getBounds(),
            {
                padding: [60, 60],
            }
        );
    }

    function eliminarRutaActual() {
        if (estado.capaRuta) {
            mapa.removeLayer(estado.capaRuta);
            estado.capaRuta = null;
        }
    }

    function ajustarMapaAMarcadores() {
        const puntos = [];

        if (estado.origen) {
            puntos.push([
                estado.origen.latitud,
                estado.origen.longitud,
            ]);
        }

        if (estado.destino) {
            puntos.push([
                estado.destino.latitud,
                estado.destino.longitud,
            ]);
        }

        if (puntos.length === 1) {
            mapa.setView(puntos[0], 15);
            return;
        }

        if (puntos.length > 1) {
            mapa.fitBounds(
                L.latLngBounds(puntos),
                {
                    padding: [60, 60],
                }
            );
        }
    }

    /*==================================================
                      RESUMEN DE LA RUTA
    ==================================================*/

    function mostrarResumenRuta(
        distanciaMetros,
        duracionSegundos
    ) {
        const distancia = formatearDistancia(
            distanciaMetros
        );

        const duracion = formatearDuracion(
            duracionSegundos
        );

        document.querySelectorAll(
            "[data-ruta-distancia]"
        ).forEach((elemento) => {
            elemento.textContent = distancia;
        });

        document.querySelectorAll(
            "[data-ruta-duracion]"
        ).forEach((elemento) => {
            elemento.textContent = duracion;
        });

        if (elementos.resumenRutaMapa) {
            elementos.resumenRutaMapa.hidden = false;
        }

        if (elementos.resumenRutaMovil) {
            elementos.resumenRutaMovil.hidden = false;
        }
    }

    function ocultarResumenRuta() {
        if (elementos.resumenRutaMapa) {
            elementos.resumenRutaMapa.hidden = true;
        }

        if (elementos.resumenRutaMovil) {
            elementos.resumenRutaMovil.hidden = true;
        }
    }

    function formatearDistancia(metros) {
        if (!Number.isFinite(metros)) {
            return "--";
        }

        if (metros < 1000) {
            return `${Math.round(metros)} m`;
        }

        const kilometros = metros / 1000;

        return `${kilometros.toFixed(1)} km`;
    }

    function formatearDuracion(segundos) {
        if (!Number.isFinite(segundos)) {
            return "--";
        }

        const minutosTotales = Math.max(
            1,
            Math.round(segundos / 60)
        );

        if (minutosTotales < 60) {
            return `${minutosTotales} min`;
        }

        const horas = Math.floor(
            minutosTotales / 60
        );

        const minutos = minutosTotales % 60;

        return minutos > 0
            ? `${horas} h ${minutos} min`
            : `${horas} h`;
    }

    /*==================================================
                    LIMPIEZA DE UBICACIONES
    ==================================================*/

    function invalidarUbicacion(tipo) {
        const esOrigen = tipo === "origen";

        const inputTexto = esOrigen
            ? elementos.origenInput
            : elementos.destinoInput;

        const inputLatitud = esOrigen
            ? elementos.origenLatitud
            : elementos.destinoLatitud;

        const inputLongitud = esOrigen
            ? elementos.origenLongitud
            : elementos.destinoLongitud;

        const indicador = esOrigen
            ? elementos.origenSeleccionado
            : elementos.destinoSeleccionado;

        const propiedadMarcador = esOrigen
            ? "marcadorOrigen"
            : "marcadorDestino";

        estado[tipo] = null;

        inputLatitud.value = "";
        inputLongitud.value = "";

        inputTexto.classList.remove(
            "ubicacion-valida"
        );

        if (indicador) {
            indicador.hidden = true;
        }

        if (estado[propiedadMarcador]) {
            mapa.removeLayer(
                estado[propiedadMarcador]
            );

            estado[propiedadMarcador] = null;
        }

        eliminarRutaActual();
        ocultarResumenRuta();

        actualizarMapaYCrearRuta();
    }

    /*==================================================
                        EVENTOS
    ==================================================*/

    elementos.buscarOrigen?.addEventListener(
        "click",
        () => {
            buscarUbicaciones(
                "origen",
                elementos.origenInput.value
            );
        }
    );

    elementos.buscarDestino?.addEventListener(
        "click",
        () => {
            buscarUbicaciones(
                "destino",
                elementos.destinoInput.value
            );
        }
    );

    elementos.origenInput?.addEventListener(
        "keydown",
        (evento) => {
            if (evento.key === "Enter") {
                evento.preventDefault();

                buscarUbicaciones(
                    "origen",
                    elementos.origenInput.value
                );
            }
        }
    );

    elementos.destinoInput?.addEventListener(
        "keydown",
        (evento) => {
            if (evento.key === "Enter") {
                evento.preventDefault();

                buscarUbicaciones(
                    "destino",
                    elementos.destinoInput.value
                );
            }
        }
    );

    elementos.origenInput?.addEventListener(
        "input",
        () => {
            if (estado.origen) {
                invalidarUbicacion("origen");
            }
        }
    );

    elementos.destinoInput?.addEventListener(
        "input",
        () => {
            if (estado.destino) {
                invalidarUbicacion("destino");
            }
        }
    );

    elementos.centrarMapa?.addEventListener(
        "click",
        () => {
            ajustarMapaAMarcadores();
        }
    );

    document.addEventListener(
        "click",
        (evento) => {
            const origenContenedor =
                elementos.resultadosOrigen
                    ?.closest(".campo-ubicacion");

            const destinoContenedor =
                elementos.resultadosDestino
                    ?.closest(".campo-ubicacion");

            if (
                origenContenedor
                && !origenContenedor.contains(
                    evento.target
                )
            ) {
                cerrarResultados("origen");
            }

            if (
                destinoContenedor
                && !destinoContenedor.contains(
                    evento.target
                )
            ) {
                cerrarResultados("destino");
            }
        }
    );

    /*==================================================
            RECUPERAR COORDENADAS DESPUÉS DE ERROR
    ==================================================*/

    function recuperarValoresExistentes() {
        const origenLatitud = convertirNumero(
            elementos.origenLatitud?.value
        );

        const origenLongitud = convertirNumero(
            elementos.origenLongitud?.value
        );

        const destinoLatitud = convertirNumero(
            elementos.destinoLatitud?.value
        );

        const destinoLongitud = convertirNumero(
            elementos.destinoLongitud?.value
        );

        if (
            origenLatitud !== null
            && origenLongitud !== null
            && elementos.origenInput?.value
        ) {
            seleccionarUbicacion(
                "origen",
                {
                    display_name:
                        elementos.origenInput.value,
                    lat: origenLatitud,
                    lon: origenLongitud,
                }
            );
        }

        if (
            destinoLatitud !== null
            && destinoLongitud !== null
            && elementos.destinoInput?.value
        ) {
            seleccionarUbicacion(
                "destino",
                {
                    display_name:
                        elementos.destinoInput.value,
                    lat: destinoLatitud,
                    lon: destinoLongitud,
                }
            );
        }
    }

    recuperarValoresExistentes();

    /*
     * Permitimos que publicar_viaje.js consulte
     * el estado del mapa antes de enviar.
     */
    window.CUERVO_RIDE_MAPA = {
        tieneOrigen: () => Boolean(estado.origen),
        tieneDestino: () => Boolean(estado.destino),
        tieneRuta: () => Boolean(estado.ultimaRuta),
        centrar: ajustarMapaAMarcadores,
    };

});