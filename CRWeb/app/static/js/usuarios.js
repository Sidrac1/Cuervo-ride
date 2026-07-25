/*=====================================
        USUARIOS
=====================================*/

function iniciarUsuarios() {

    console.log("Vista Usuarios cargada");

        //==========================
        // BOTÓN EDITAR
        //==========================
        const botonesEditar = document.querySelectorAll(".editar-btn");

        botonesEditar.forEach(boton => {
        
            boton.addEventListener("click", () => {
        
                const fila = boton.closest("tr");
        
                const usuario = {

                    id: fila.children[0].textContent.trim(),
                
                    foto:"img/admin.png",
                
                    nombre: fila.children[1].textContent.trim(),
                
                    correo: fila.children[2].textContent.trim(),
                
                    rol: fila.querySelector(".badge").textContent.trim(),
                
                    estado: fila.querySelector(".estado").textContent.trim(),
                
                    matricula:"03231601",
                
                    cuatrimestre:"8",
                
                    carrera:"Ingeniería en Desarrollo y Gestión de Software",
                
                    password:"123456",
                
                    telefono:"6641234567"
                
                };
        
                sessionStorage.setItem(
        
                    "usuario",
        
                    JSON.stringify(usuario)
        
                );
        
                cargarVista("usuario-info");
        
            });
        
        });

    //==========================
    // FILTROS
    //==========================

    const btnFiltrar = document.getElementById("btnFiltrar");

    if (btnFiltrar) {

        btnFiltrar.addEventListener("click", filtrarUsuarios);

    }


    //==========================
    // BUSCADOR EN TIEMPO REAL
    //==========================

    const buscador = document.getElementById("buscarUsuario");

    if (buscador) {

        buscador.addEventListener("input", filtrarUsuarios);

    }


    //==========================
    // SELECT ROL
    //==========================

    const filtroRol = document.getElementById("filtroRol");

    if (filtroRol) {

        filtroRol.addEventListener("change", filtrarUsuarios);

    }


    //==========================
    // SELECT ESTADO
    //==========================

    const filtroEstado = document.getElementById("filtroEstado");

    if (filtroEstado) {

        filtroEstado.addEventListener("change", filtrarUsuarios);

    }

}

                /*=====================================
                        FILTRAR USUARIOS
                =====================================*/

                function filtrarUsuarios() {

                    const texto = document
                        .getElementById("buscarUsuario")
                        .value
                        .toLowerCase()
                        .trim();


                    const rol = document
                        .getElementById("filtroRol")
                        .value;


                    const estado = document
                        .getElementById("filtroEstado")
                        .value;


                    const filas = document.querySelectorAll("#tablaUsuarios tr");


                    let visibles = 0;


                    filas.forEach(fila => {

                        const nombre =
                            fila.children[1].textContent.toLowerCase();

                        const correo =
                            fila.children[2].textContent.toLowerCase();

                        const rolUsuario =
                            fila.querySelector(".badge").textContent.trim();

                        const estadoUsuario =
                            fila.querySelector(".estado").textContent.trim();


                        let coincideBusqueda =

                            nombre.includes(texto) ||

                            correo.includes(texto);


                        let coincideRol =

                            rol === "Todos" ||

                            rolUsuario === rol;


                        let coincideEstado =

                            estado === "Todos" ||

                            estadoUsuario === estado;


                        if (

                            coincideBusqueda &&

                            coincideRol &&

                            coincideEstado

                        ) {

                            fila.style.display = "";

                            visibles++;

                        }

                        else {

                            fila.style.display = "none";

                        }

                    });


                    if (visibles === 0) {

                        mostrarSinResultados();
                    
                    }
                    else {
                    
                        ocultarSinResultados();
                    
                    }
                    
                    actualizarContador(visibles);

                }



                /*=====================================
                        ACTUALIZAR CONTADOR
                =====================================*/

                function actualizarContador(visibles) {

                    const contador = document.querySelector(".footer-tabla p");

                    if (!contador) return;

                    const total = document.querySelectorAll("#tablaUsuarios tr").length;

                    contador.textContent = `Mostrando ${visibles} de ${total} usuarios`;

                }


                /*=====================================
                        MENSAJE SIN RESULTADOS
                =====================================*/

                function mostrarSinResultados() {

                    const tbody = document.getElementById("tablaUsuarios");

                    if (!tbody) return;

                    let mensaje = document.getElementById("sinResultados");

                    if (!mensaje) {

                        mensaje = document.createElement("tr");

                        mensaje.id = "sinResultados";

                        mensaje.innerHTML = `

                            <td colspan="6" style="

                                text-align:center;
                                padding:40px;
                                color:#9aa8b8;
                                font-size:16px;

                            ">

                                No se encontraron usuarios.

                            </td>

                        `;

                        tbody.appendChild(mensaje);

                    }

                    mensaje.style.display = "";

                }


                /*=====================================
                        OCULTAR MENSAJE
                =====================================*/

                function ocultarSinResultados() {

                    const mensaje = document.getElementById("sinResultados");

                    if (mensaje) {

                        mensaje.style.display = "none";

                    }

                }
