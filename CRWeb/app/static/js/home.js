document.addEventListener("DOMContentLoaded", () => {

    const profileButton =
        document.getElementById("profileMenuButton");

    const profileMenu =
        document.getElementById("profileMenu");

    if (!profileButton || !profileMenu) {
        return;
    }

    function abrirMenu() {

        profileMenu.hidden = false;

        profileButton.setAttribute(
            "aria-expanded",
            "true"
        );

        profileButton.classList.add("active");

    }

    function cerrarMenu() {

        profileMenu.hidden = true;

        profileButton.setAttribute(
            "aria-expanded",
            "false"
        );

        profileButton.classList.remove("active");

    }

    function alternarMenu() {

        if (profileMenu.hidden) {
            abrirMenu();
        } else {
            cerrarMenu();
        }

    }

    profileButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            alternarMenu();

        }
    );

    profileMenu.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

        }
    );

    document.addEventListener(
        "click",
        () => {

            cerrarMenu();

        }
    );

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                cerrarMenu();

                profileButton.focus();

            }

        }
    );

});
