// =========================
// SIDEBAR
// =========================

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");


// Abrir / cerrar con botón menú

if (menuBtn && sidebar) {

    menuBtn.addEventListener("click", (e) => {

        e.stopPropagation();

        sidebar.classList.toggle("active");

    });

}


// Cerrar al hacer clic fuera del sidebar

document.addEventListener("click", (e) => {

    if (!sidebar || !menuBtn) {
        return;
    }

    const clickDentroSidebar = sidebar.contains(e.target);
    const clickEnBoton = menuBtn.contains(e.target);

    if (!clickDentroSidebar && !clickEnBoton) {

        sidebar.classList.remove("active");

    }

});


// =========================
// MODAL DE LOGOUT
// =========================

const openLogoutModal = document.getElementById("openLogoutModal");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const logoutForm = document.getElementById("logoutForm");


// Abrir modal

if (openLogoutModal && logoutModal) {

    openLogoutModal.addEventListener("click", (e) => {

        e.preventDefault();
        e.stopPropagation();

        logoutModal.classList.add("active");
        logoutModal.setAttribute("aria-hidden", "false");

    });

}


// Cerrar modal

function cerrarModalLogout() {

    if (!logoutModal) {
        return;
    }

    logoutModal.classList.remove("active");
    logoutModal.setAttribute("aria-hidden", "true");

}


// Botón cancelar

if (cancelLogout) {

    cancelLogout.addEventListener("click", (e) => {

        e.preventDefault();

        cerrarModalLogout();

    });

}


// Confirmar cierre de sesión

if (confirmLogout && logoutForm) {

    confirmLogout.addEventListener("click", (e) => {

        e.preventDefault();

        logoutForm.submit();

    });

}


// Cerrar al hacer clic fuera de la ventana del modal

if (logoutModal) {

    logoutModal.addEventListener("click", (e) => {

        if (e.target === logoutModal) {

            cerrarModalLogout();

        }

    });

}


// Cerrar con la tecla Escape

document.addEventListener("keydown", (e) => {

    if (
        e.key === "Escape" &&
        logoutModal &&
        logoutModal.classList.contains("active")
    ) {

        cerrarModalLogout();

    }

});