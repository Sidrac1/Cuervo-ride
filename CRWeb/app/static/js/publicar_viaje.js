"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("formPublicarViaje");
    if (!formulario) return;

    const botonPublicar = document.getElementById("btnPublicarViaje");
    const textoBoton = botonPublicar?.querySelector(".btn-texto");
    const cargandoBoton = botonPublicar?.querySelector(".btn-cargando");
    const indicaciones = document.getElementById("id_indicaciones");
    const contadorIndicaciones = document.getElementById("contadorIndicaciones");
    const fechaSalida = document.getElementById("id_fecha_hora_salida");
    const vehiculo = document.getElementById("id_vehiculo");
    const selectColonia = document.getElementById("selectColoniaRapida");
    const campoDestino = document.getElementById("id_destino");

    let enviando = false;

    // Contador de texto
    function actualizarContador() {
        if (indicaciones && contadorIndicaciones) {
            contadorIndicaciones.textContent = indicaciones.value.length;
        }
    }
    indicaciones?.addEventListener("input", actualizarContador);
    actualizarContador();

    // Configurar fecha mínima de salida (ahora mismo en adelante)
    function configurarFechaMinima() {
        if (!fechaSalida) return;
        const ahora = new Date();
        const compensacion = ahora.getTimezoneOffset() * 60000;
        fechaSalida.min = new Date(ahora.getTime() - compensacion).toISOString().slice(0, 16);
    }
    configurarFechaMinima();

    // Eliminar / Mostrar errores del cliente
    function eliminarErrorCliente(campo) {
        const contenedor = campo.closest(".campo-formulario");
        campo.classList.remove("campo-invalido");
        contenedor?.querySelector(".error-cliente")?.remove();
    }

    function mostrarErrorCliente(campo, mensaje) {
        eliminarErrorCliente(campo);
        campo.classList.add("campo-invalido");
        const error = document.createElement("span");
        error.className = "error-campo error-cliente";
        error.textContent = mensaje;
        campo.closest(".campo-formulario")?.appendChild(error);
    }

    // Validación general simplificada
    function validarFormulario() {
        let valido = true;
        let primerCampoInvalido = null;

        formulario.querySelectorAll(".error-cliente").forEach((e) => e.remove());
        formulario.querySelectorAll(".campo-invalido").forEach((c) => c.classList.remove("campo-invalido"));

        // Verificar Vehículo
        if (!vehiculo?.value.trim()) {
            mostrarErrorCliente(vehiculo, "Selecciona un vehículo.");
            valido = false;
            primerCampoInvalido = primerCampoInvalido || vehiculo;
        }

        // Verificar Destino
        if (!campoDestino?.value.trim()) {
            mostrarErrorCliente(selectColonia, "Debes seleccionar una colonia de la lista o marcar un punto en el mapa.");
            valido = false;
            primerCampoInvalido = primerCampoInvalido || selectColonia;
        }

        // Verificar Fecha de Salida
        if (!fechaSalida?.value.trim()) {
            mostrarErrorCliente(fechaSalida, "Selecciona la fecha y hora de salida.");
            valido = false;
            primerCampoInvalido = primerCampoInvalido || fechaSalida;
        }

        if (primerCampoInvalido) {
            primerCampoInvalido.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        return valido;
    }

formulario.addEventListener("submit", (e) => {
    if (enviando) {
        e.preventDefault();
        return;
    }

    // 🔒 ASEGURAR REDONDEO A 6 DECIMALES JUSTO ANTES DE ENVIAR
    const latInput = document.getElementById("id_destino_latitud");
    const lonInput = document.getElementById("id_destino_longitud");

    if (latInput && latInput.value) {
        latInput.value = parseFloat(latInput.value).toFixed(6);
    }
    if (lonInput && lonInput.value) {
        lonInput.value = parseFloat(lonInput.value).toFixed(6);
    }

    if (!validarFormulario()) {
        e.preventDefault();
        return;
    }

    enviando = true;
    if (botonPublicar) botonPublicar.disabled = true;
    if (textoBoton) textoBoton.hidden = true;
    if (cargandoBoton) cargandoBoton.hidden = false;
});

    formulario.querySelectorAll("input, select, textarea").forEach((campo) => {
        campo.addEventListener("input", () => eliminarErrorCliente(campo));
        campo.addEventListener("change", () => eliminarErrorCliente(campo));
    });
});