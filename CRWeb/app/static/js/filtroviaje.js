document.addEventListener("DOMContentLoaded", () => {
    const inputBusqueda = document.getElementById("buscarColoniaDestino");
    const contenedorResultados = document.getElementById("listaViajes");

    let timeoutBusqueda = null;

    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", (e) => {
            clearTimeout(timeoutBusqueda);
            const query = e.target.value.trim();

            // Esperar 300ms después de que el usuario deje de escribir
            timeoutBusqueda = setTimeout(() => {
                obtenerViajes(query);
            }, 300);
        });
    }

    async function obtenerViajes(colonia) {
        try {
            const respuesta = await fetch(`/api/viajes/buscar/?q=${encodeURIComponent(colonia)}`);
            const data = await respuesta.json();

            if (data.ok) {
                renderizarViajes(data.viajes);
            }
        } catch (error) {
            console.error("Error al buscar viajes:", error);
        }
    }

    function renderizarViajes(viajes) {
        if (!contenedorResultados) return;
        contenedorResultados.innerHTML = "";

        if (viajes.length === 0) {
            contenedorResultados.innerHTML = `<p class="sin-resultados">No se encontraron viajes hacia o cerca de esa ubicación.</p>`;
            return;
        }

        viajes.forEach((v) => {
            const tarjeta = document.createElement("div");
            tarjeta.className = "tarjeta-viaje";
            tarjeta.innerHTML = `
                <div class="cabecera-viaje">
                    <strong>${v.conductor}</strong>
                    <span>${v.vehiculo}</span>
                </div>
                <div class="detalles-ruta">
                    <p><strong>Origen:</strong> ${v.origen}</p>
                    <p><strong>Destino:</strong> ${v.destino}</p>
                    <p><strong>Salida:</strong> ${v.salida}</p>
                    <p><strong>Asientos disponibles:</strong> ${v.asientos_disponibles}</p>
                </div>
                <button onclick="solicitarUnirse(${v.id})" class="btn-solicitar">Solicitar viaje</button>
            `;
            contenedorResultados.appendChild(tarjeta);
        });
    }

    // Carga inicial de viajes disponibles
    obtenerViajes("");
});