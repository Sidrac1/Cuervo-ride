document.addEventListener("DOMContentLoaded", function () {

    const campoHora = document.getElementById("hora");
    const botonHora = document.getElementById("abrirHora");

    if (!campoHora) {
        console.error("No se encontró el campo de hora.");
        return;
    }

    if (typeof flatpickr === "undefined") {
        console.error("Flatpickr no se cargó correctamente.");
        return;
    }

    const selectorHora = flatpickr(campoHora, {

        // Mostrar únicamente hora
        enableTime: true,
        noCalendar: true,

        // Formato de 24 horas
        time_24hr: true,

        // Valor mostrado y enviado
        dateFormat: "H:i",

        // Intervalos de cinco minutos
        minuteIncrement: 5,

        // No permitir escribir manualmente
        allowInput: false,

        // Abrir al presionar el input
        clickOpens: true,

        // Posición del cuadro
        position: "below right",

        // Clase personalizada
        onReady: function (
            selectedDates,
            dateStr,
            instance
        ) {

            instance.calendarContainer.classList.add(
                "cuervo-time-picker"
            );

        }

    });


    if (botonHora) {

        botonHora.addEventListener("click", function () {

            selectorHora.open();

        });

    }

});