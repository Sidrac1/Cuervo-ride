document.addEventListener("DOMContentLoaded", () => {


    // ==============================
    // ELEMENTOS DEL MODAL
    // ==============================

    const modal = document.getElementById("modalViaje");

    const cerrarModal = document.getElementById("cerrarModal");


    // ==============================
    // TARJETAS DE VIAJES
    // ==============================

    const tarjetas = document.querySelectorAll(".viaje-card");



    tarjetas.forEach(tarjeta => {


        tarjeta.addEventListener("click", () => {



            // Obtener datos del viaje

            const conductor =
                tarjeta.dataset.conductor;


            const vehiculo =
                tarjeta.dataset.vehiculo;


            const placas =
                tarjeta.dataset.placas;


            const fecha =
                tarjeta.dataset.fecha;


            const hora =
                tarjeta.dataset.hora;


            const duracion =
                tarjeta.dataset.duracion;


            const origen =
                tarjeta.dataset.origen;


            const destino =
                tarjeta.dataset.destino;


            const distancia =
                tarjeta.dataset.distancia;


            const costo =
                tarjeta.dataset.costo;


            const calificacion =
                tarjeta.dataset.calificacion;



            // ==============================
            // LLENAR MODAL
            // ==============================


            document.getElementById("detalleConductor").textContent =
                conductor;


            document.getElementById("detalleVehiculo").textContent =
                vehiculo;


            document.getElementById("detallePlacas").textContent =
                placas;


            document.getElementById("detalleFecha").textContent =
                fecha;


            document.getElementById("detalleHora").textContent =
                hora;


            document.getElementById("detalleDuracion").textContent =
                duracion;


            document.getElementById("detalleOrigen").textContent =
                origen;


            document.getElementById("detalleDestino").textContent =
                destino;


            document.getElementById("detalleDistancia").textContent =
                distancia;


            document.getElementById("detalleCosto").textContent =
                costo;


            document.getElementById("detalleCalificacion").textContent =
                calificacion;



            // Mostrar modal

            modal.classList.add("mostrar");


        });


    });



    // ==============================
    // CERRAR MODAL
    // ==============================


    cerrarModal.addEventListener("click", () => {


        modal.classList.remove("mostrar");


    });



    // Cerrar al hacer click fuera

    modal.addEventListener("click", (e) => {


        if(e.target === modal){

            modal.classList.remove("mostrar");

        }


    });


});