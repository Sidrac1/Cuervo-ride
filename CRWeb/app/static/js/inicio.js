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
}