/*=====================================
        USUARIOS
=====================================*/

function iniciarUsuarios() {
    console.log("Vista Usuarios cargada");

    // BOTONES EDITAR
    const botonesEditar = document.querySelectorAll(".editar-btn");

    botonesEditar.forEach((boton) => {
        boton.addEventListener("click", () => {
            const id = boton.dataset.id;
            sessionStorage.setItem("usuarioId", id);
            cargarVista("usuario-info", id);
        });
    });

    // FILTROS
    const btnFiltrar = document.getElementById("btnFiltrar");
    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", filtrarUsuarios);
    }

    // BUSCADOR EN TIEMPO REAL
    const buscador = document.getElementById("buscarUsuario");
    if (buscador) {
        buscador.addEventListener("input", filtrarUsuarios);
    }

    // SELECT ROL
    const filtroRol = document.getElementById("filtroRol");
    if (filtroRol) {
        filtroRol.addEventListener("change", filtrarUsuarios);
    }

    // SELECT ESTADO
    const filtroEstado = document.getElementById("filtroEstado");
    if (filtroEstado) {
        filtroEstado.addEventListener("change", filtrarUsuarios);
    }
}

/*=====================================
        FILTRAR USUARIOS
=====================================*/

function filtrarUsuarios() {
    const texto = document.getElementById("buscarUsuario")?.value.toLowerCase().trim() || "";
    const rol = document.getElementById("filtroRol")?.value || "Todos";
    const estado = document.getElementById("filtroEstado")?.value || "Todos";

    const filas = document.querySelectorAll("#tablaUsuarios tr");
    let visibles = 0;

    filas.forEach((fila) => {
        if (fila.id === "sinResultados") return;

        const nombre = fila.children[1]?.textContent.toLowerCase() || "";
        const correo = fila.children[2]?.textContent.toLowerCase() || "";
        const rolUsuario = fila.querySelector(".badge")?.textContent.trim() || "";
        const estadoUsuario = fila.querySelector(".estado")?.textContent.trim() || "";

        const coincideBusqueda = nombre.includes(texto) || correo.includes(texto);
        const coincideRol = rol === "Todos" || rolUsuario.toLowerCase() === rol.toLowerCase();
        const coincideEstado = estado === "Todos" || estadoUsuario.toLowerCase() === estado.toLowerCase();

        if (coincideBusqueda && coincideRol && coincideEstado) {
            fila.style.display = "";
            visibles++;
        } else {
            fila.style.display = "none";
        }
    });

    if (visibles === 0) {
        mostrarSinResultados();
    } else {
        ocultarSinResultados();
    }

    actualizarContador(visibles);
}

function actualizarContador(visibles) {
    const contador = document.querySelector(".footer-tabla p");
    if (!contador) return;

    const total = document.querySelectorAll("#tablaUsuarios tr:not(#sinResultados)").length;
    contador.textContent = `Mostrando ${visibles} de ${total} usuarios`;
}

function mostrarSinResultados() {
    const tbody = document.getElementById("tablaUsuarios");
    if (!tbody) return;

    let mensaje = document.getElementById("sinResultados");

    if (!mensaje) {
        mensaje = document.createElement("tr");
        mensaje.id = "sinResultados";
        mensaje.innerHTML = `
            <td colspan="6" style="text-align:center; padding:40px; color:#9aa8b8; font-size:16px;">
                No se encontraron usuarios.
            </td>
        `;
        tbody.appendChild(mensaje);
    }

    mensaje.style.display = "";
}

function ocultarSinResultados() {
    const mensaje = document.getElementById("sinResultados");
    if (mensaje) {
        mensaje.style.display = "none";
    }
}