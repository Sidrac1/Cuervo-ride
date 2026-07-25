 /*=====================================
                                    USUARIO INFO
                            =====================================*/

                            function iniciarUsuarioInfo() {

                                console.log("Vista Información Usuario cargada");

                                //==========================
                                // OBTENER USUARIO
                                //==========================

                                const usuario = JSON.parse(sessionStorage.getItem("usuario"));

                                if (!usuario) {

                                    alert("No se encontró información del usuario.");

                                    cargarVista("usuarios");

                                    return;

                                }

                                //==========================
                                // FOTO Y NOMBRE
                                //==========================

                                document.getElementById("fotoUsuario").src = "img/admin.png";

                                document.getElementById("nombreTitulo").textContent = usuario.nombre;


                                //==========================
                                // LLENAR FORMULARIO
                                //==========================

                                document.getElementById("nombre").value = usuario.nombre || "";

                                document.getElementById("correo").value = usuario.correo || "";

                                document.getElementById("matricula").value = usuario.matricula || "";

                                document.getElementById("cuatrimestre").value = usuario.cuatrimestre || "";

                                document.getElementById("carrera").value = usuario.carrera || "";

                                document.getElementById("rol").value = usuario.rol || "";

                                document.getElementById("estado").value = usuario.estado || "";

                                document.getElementById("password").value = usuario.password || "";

                                document.getElementById("telefono").value = usuario.telefono || "";


                                //==========================
                                // BOTÓN REGRESAR
                                //==========================

                                document.getElementById("volver").addEventListener("click", () => {

                                    cargarVista("usuarios");

                                });


                                //==========================
                                // GUARDAR
                                //==========================

                                document.getElementById("formGeneral").addEventListener("submit", function(e){

                                    e.preventDefault();

                                    usuario.nombre = document.getElementById("nombre").value;

                                    usuario.correo = document.getElementById("correo").value;

                                    usuario.matricula = document.getElementById("matricula").value;

                                    usuario.cuatrimestre = document.getElementById("cuatrimestre").value;

                                    usuario.carrera = document.getElementById("carrera").value;

                                    usuario.rol = document.getElementById("rol").value;

                                    usuario.estado = document.getElementById("estado").value;

                                    usuario.password = document.getElementById("password").value;

                                    usuario.telefono = document.getElementById("telefono").value;

                                    sessionStorage.setItem(

                                        "usuario",

                                        JSON.stringify(usuario)

                                    );

                                    alert("Información guardada correctamente.");

                                });


                                //==========================
                                // BOTONES LATERALES
                                //==========================

                                const btnGeneral = document.getElementById("btnGeneral");

                                const btnMedico = document.getElementById("btnMedico");

                                btnGeneral.addEventListener("click", () => {

                                    btnGeneral.classList.add("activa");

                                    btnMedico.classList.remove("activa");

                                });

                                btnMedico.addEventListener("click", () => {

                                    cargarVista("expediente");

                                });

                            }

