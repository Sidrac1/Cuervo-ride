"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const mapaElemento = document.getElementById("mapa");
    if (!mapaElemento || typeof L === "undefined") return;

    const elementos = {
        origenInput: document.getElementById("id_origen"),
        destinoInput: document.getElementById("id_destino"), // Input oculto

        origenLatitud: document.getElementById("id_origen_latitud"),
        origenLongitud: document.getElementById("id_origen_longitud"),

        destinoLatitud: document.getElementById("id_destino_latitud"),
        destinoLongitud: document.getElementById("id_destino_longitud"),

        destinoSeleccionado: document.getElementById("destinoSeleccionado"),
        selectColoniaRapida: document.getElementById("selectColoniaRapida"),

        centrarMapa: document.getElementById("centrarMapa"),
    };

    // Coordenadas por defecto de la UTT (Universidad Tecnológica de Tijuana)
    const UTT_COORDS = [32.460963, -116.824371];

    const CONFIG = {
        centroInicial: UTT_COORDS,
        zoomInicial: 13,
        reverseNominatimUrl: "https://nominatim.openstreetmap.org/reverse",
        osrmUrl: "https://router.project-osrm.org/route/v1/driving"
    };

    const estado = {
        origen: {
            nombre: "Universidad Tecnológica de Tijuana",
            latitud: UTT_COORDS[0],
            longitud: UTT_COORDS[1]
        },
        destino: null,
        marcadorOrigen: null,
        marcadorDestino: null,
        capaRuta: null,
        ultimaRuta: null
    };

    /* Inicialización del Mapa */
    const mapa = L.map("mapa", { zoomControl: false }).setView(CONFIG.centroInicial, CONFIG.zoomInicial);
    L.control.zoom({ position: "bottomright" }).addTo(mapa);
    const maptilerKey = "JS0B3dwVkIVaAJNtu5s2"
    L.tileLayer(`https://api.maptiler.com/maps/streets-v4-dark/{z}/{x}/{y}.png?key=${maptilerKey}`, {
        maxZoom: 19,
        attribution: "&copy; MapTiler"
    }).addTo(mapa);

    /* Marcadores */
    const iconoOrigen = L.divIcon({
        className: "marcador-personalizado",
        html: `<div class="pin-mapa pin-origen"><i class="fa-solid fa-graduation-cap"></i></div>`,
        iconSize: [42, 52],
        iconAnchor: [21, 50]
    });

    const iconoDestino = L.divIcon({
        className: "marcador-personalizado",
        html: `<div class="pin-mapa pin-destino"><i class="fa-solid fa-flag-checkered"></i></div>`,
        iconSize: [42, 52],
        iconAnchor: [21, 50]
    });

    // Fijar marcador de la UTT desde el inicio
    estado.marcadorOrigen = L.marker(UTT_COORDS, { icon: iconoOrigen })
        .addTo(mapa)
        .bindPopup("Origen: UTT (Universidad Tecnológica de Tijuana)")
        .openPopup();

    /* Asignar Destino y Trazar Ruta */
    async function establecerDestino(lat, lon, nombre) {
        estado.destino = { latitud: lat, longitud: lon, nombre: nombre };
        const latFixed = Number(lat).toFixed(6);
        const lonFixed = Number(lon).toFixed(6);
        // Actualizar inputs ocultos del DOM
        if (elementos.destinoInput) elementos.destinoInput.value = nombre;
        if (elementos.destinoLatitud) elementos.destinoLatitud.value = latFixed;
        if (elementos.destinoLongitud) elementos.destinoLongitud.value = lonFixed;        // Feedback visual
        if (elementos.destinoSeleccionado) {
            elementos.destinoSeleccionado.hidden = false;
            elementos.destinoSeleccionado.querySelector("span").textContent = `Destino: ${nombre}`;
        }

        // Colocar o mover el marcador
        if (estado.marcadorDestino) {
            estado.marcadorDestino.setLatLng([lat, lon]).setPopupContent(nombre);
        } else {
            estado.marcadorDestino = L.marker([lat, lon], { icon: iconoDestino, draggable: true }).addTo(mapa);
            estado.marcadorDestino.on("dragend", async (e) => {
                const pos = e.target.getLatLng();
                const nuevoNombre = await obtenerNombreGeocodificado(pos.lat, pos.lng);
                establecerDestino(pos.lat, pos.lng, nuevoNombre);
            });
        }

        // Trazar la ruta de OSRM
        await calcularRutaOSRM();
    }

    /* Reverse Geocoding: Obtener nombre de colonia al dar Clic en el Mapa */
    async function obtenerNombreGeocodificado(lat, lon) {
        try {
            const res = await fetch(`${CONFIG.reverseNominatimUrl}?lat=${lat}&lon=${lon}&format=jsonv2`);
            const data = await res.json();
            const addr = data.address || {};
            return addr.neighbourhood || addr.suburb || addr.road || data.display_name || `Ubicación (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        } catch (e) {
            return `Punto seleccionado (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        }
    }

    /* Selección haciendo Clic en el Mapa */
    mapa.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        const nombreLugar = await obtenerNombreGeocodificado(lat, lng);
        establecerDestino(lat, lng, nombreLugar);
    });

    /* Trazar Ruta usando OSRM */
    async function calcularRutaOSRM() {
        if (!estado.origen || !estado.destino) return;

        const origenCoords = `${estado.origen.longitud},${estado.origen.latitud}`;
        const destinoCoords = `${estado.destino.longitud},${estado.destino.latitud}`;

        try {
            const res = await fetch(`${CONFIG.osrmUrl}/${origenCoords};${destinoCoords}?overview=full&geometries=geojson`);
            const data = await res.json();

            if (data.code === "Ok" && data.routes.length > 0) {
                const ruta = data.routes[0];
                
                if (estado.capaRuta) mapa.removeLayer(estado.capaRuta);

                estado.capaRuta = L.geoJSON(ruta.geometry, {
                    style: { color: "#0066ff", weight: 5, opacity: 0.8 }
                }).addTo(mapa);

                mapa.fitBounds(estado.capaRuta.getBounds(), { padding: [50, 50] });
                estado.ultimaRuta = ruta;
            }
        } catch (err) {
            console.error("Error al trazar la ruta:", err);
        }
    }

    // Evento para lista desplegable de colonias
    elementos.selectColoniaRapida?.addEventListener("change", (e) => {
        if (!e.target.value) return;
        const [lat, lon] = e.target.value.split(",").map(Number);
        const nombreColonia = e.target.options[e.target.selectedIndex].text;
        establecerDestino(lat, lon, nombreColonia);
    });

    elementos.centrarMapa?.addEventListener("click", () => {
        if (estado.capaRuta) {
            mapa.fitBounds(estado.capaRuta.getBounds(), { padding: [50, 50] });
        } else {
            mapa.setView(CONFIG.centroInicial, CONFIG.zoomInicial);
        }
    });
});