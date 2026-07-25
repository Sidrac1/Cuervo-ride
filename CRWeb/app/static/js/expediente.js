
                                /*=====================================
                                        EXPEDIENTE MÉDICO
                                =====================================*/

                                function iniciarExpediente(){

                                    console.log("Vista Expediente Médico");

                                    const usuario = JSON.parse(

                                        sessionStorage.getItem("usuario")

                                    );

                                    if(!usuario){

                                        cargarVista("usuarios");

                                        return;

                                    }


                                    /*==============================
                                            FOTO Y NOMBRE
                                    ==============================*/

                                    document.getElementById("fotoUsuario").src = "img/admin.png";

                                    document.getElementById("nombreTitulo").textContent = usuario.nombre;


                                    /*==============================
                                            DATOS MÉDICOS
                                    ==============================*/

                                    document.getElementById("tipoSangre").value =
                                        usuario.tipoSangre || "";

                                    document.getElementById("alergias").value =
                                        usuario.alergias || "";

                                    document.getElementById("enfermedades").value =
                                        usuario.enfermedades || "";

                                    document.getElementById("medicamentos").value =
                                        usuario.medicamentos || "";

                                    document.getElementById("contacto").value =
                                        usuario.contacto || "";

                                    document.getElementById("telefonoEmergencia").value =
                                        usuario.telefonoEmergencia || "";

                                    document.getElementById("observaciones").value =
                                        usuario.observaciones || "";


                                    /*==============================
                                            BOTÓN GENERAL
                                    ==============================*/

                                    document.getElementById("btnGeneral")
                                        .addEventListener("click",()=>{

                                        cargarVista("usuario-info");

                                    });


                                    /*==============================
                                            REGRESAR
                                    ==============================*/

                                    document.getElementById("volver")
                                        .addEventListener("click",()=>{

                                        cargarVista("usuarios");

                                    });


                                    /*==============================
                                            GUARDAR
                                    ==============================*/

                                    document.getElementById("formMedico")
                                        .addEventListener("submit",function(e){

                                        e.preventDefault();

                                        usuario.tipoSangre =
                                            document.getElementById("tipoSangre").value;

                                        usuario.alergias =
                                            document.getElementById("alergias").value;

                                        usuario.enfermedades =
                                            document.getElementById("enfermedades").value;

                                        usuario.medicamentos =
                                            document.getElementById("medicamentos").value;

                                        usuario.contacto =
                                            document.getElementById("contacto").value;

                                        usuario.telefonoEmergencia =
                                            document.getElementById("telefonoEmergencia").value;

                                        usuario.observaciones =
                                            document.getElementById("observaciones").value;


                                        sessionStorage.setItem(

                                            "usuario",

                                            JSON.stringify(usuario)

                                        );

                                        alert("Expediente médico guardado correctamente.");

                                    });

                                }