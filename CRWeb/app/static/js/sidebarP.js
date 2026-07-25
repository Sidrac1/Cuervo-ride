// =========================
// SIDEBAR
// =========================

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");


// Abrir / cerrar con botón menú

menuBtn.addEventListener("click", (e) => {

    e.stopPropagation();

    sidebar.classList.toggle("active");

});



// Cerrar al hacer click fuera del sidebar

document.addEventListener("click", (e) => {


    const clickDentroSidebar = sidebar.contains(e.target);

    const clickEnBoton = menuBtn.contains(e.target);



    if(!clickDentroSidebar && !clickEnBoton){

        sidebar.classList.remove("active");

    }


});