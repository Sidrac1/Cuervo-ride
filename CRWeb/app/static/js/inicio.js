/*=====================================
            INICIO
=====================================*/

function iniciarInicio(){

    console.log("Vista Inicio cargada");
    
    /*==============================
        QUITAR BOTÓN ACTIVO
    ==============================*/

    document.querySelectorAll(".menu-btn").forEach(btn => {

    btn.classList.remove("active");

    });

    //==============================
    // Datos simulados
    //==============================

    document.getElementById("totalUsuarios").textContent = "5";

    document.getElementById("totalRides").textContent = "1";

    document.getElementById("totalAlertas").textContent = "4";

    document.getElementById("promedio").textContent = "4.7";

}