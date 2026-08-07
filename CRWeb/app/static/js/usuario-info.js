/*==================================================
        USUARIO INFO + VERIFICACIÓN + EXPEDIENTE
==================================================*/

function iniciarUsuarioInfo(usuarioIdParam = null) {

    console.log("Vista unificada de usuario cargada");


    /*==================================================
                    OBTENER ID
    ==================================================*/

    const usuarioId = (
        usuarioIdParam
        || sessionStorage.getItem("usuarioId")
        || window.ADMIN_STATE?.usuarioId
    );


    if (!usuarioId) {

        alert(
            "No se encontró información del usuario."
        );

        cargarVista("usuarios");

        return;

    }


    sessionStorage.setItem(
        "usuarioId",
        usuarioId
    );


    /*==================================================
                    ELEMENTOS GENERALES
    ==================================================*/

    const fotoUsuario =
        document.getElementById(
            "fotoUsuario"
        );

    const nombreTitulo =
        document.getElementById(
            "nombreTitulo"
        );


    const btnGeneral =
        document.getElementById(
            "btnGeneral"
        );

    const btnVerificacion =
        document.getElementById(
            "btnVerificacion"
        );

    const btnMedico =
        document.getElementById(
            "btnMedico"
        );


    const panelGeneral =
        document.getElementById(
            "panelGeneral"
        );

    const panelVerificacion =
        document.getElementById(
            "panelVerificacion"
        );

    const panelMedico =
        document.getElementById(
            "panelMedico"
        );


    const verificacionContenido =
        document.getElementById(
            "verificacionContenido"
        );


    const formGeneral =
        document.getElementById(
            "formGeneral"
        );

    const formMedico =
        document.getElementById(
            "formMedico"
        );


    const btnGuardarGeneral =
        document.getElementById(
            "guardar"
        );

    const btnGuardarExpediente =
        document.getElementById(
            "guardarExpediente"
        );


    const btnMostrarPassword =
        document.getElementById(
            "btnMostrarPassword"
        );


    let usuarioActual = null;

    let expedienteCargado = false;


    /*==================================================
            OCULTAR VERIFICACIÓN INICIALMENTE
    ==================================================*/

    if (btnVerificacion) {

        btnVerificacion.hidden = true;

        btnVerificacion.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    /*==================================================
            ASIGNAR VALOR A UN CAMPO
    ==================================================*/

    function asignarValor(
        id,
        valor = ""
    ) {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            elemento.value =
                valor ?? "";

        }

    }


    /*==================================================
                    ESCAPAR HTML
    ==================================================*/

    function escaparHtml(valor) {

        return String(
            valor ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /*==================================================
                NORMALIZAR ERRORES
    ==================================================*/

    function normalizarError(error) {

        if (!error) {

            return (
                "Ocurrió un error desconocido."
            );

        }


        if (
            typeof error === "string"
        ) {

            return error;

        }


        if (
            error instanceof Error
        ) {

            return error.message;

        }


        try {

            return JSON.stringify(
                error
            );

        } catch {

            return (
                "Ocurrió un error desconocido."
            );

        }

    }


    /*==================================================
                LEER RESPUESTA JSON
    ==================================================*/

    async function leerJson(
        respuesta
    ) {

        let datos = {};


        try {

            datos =
                await respuesta.json();

        } catch {

            datos = {};

        }


        if (!respuesta.ok) {

            throw new Error(

                normalizarError(

                    datos.error
                    || (
                        "Ocurrió un error "
                        + "en el servidor."
                    )

                )

            );

        }


        return datos;

    }


    /*==================================================
                NORMALIZAR ROL
    ==================================================*/

    function obtenerRolNormalizado(
        usuario
    ) {

        return String(
            usuario?.rol || ""
        )
            .trim()
            .toLowerCase();

    }


    function esUsuarioConductor(
        usuario
    ) {

        return (
            obtenerRolNormalizado(
                usuario
            )
            === "conductor"
        );

    }


    /*==================================================
                    CAMBIAR PANEL
    ==================================================*/

    function mostrarPanel(
        nombrePanel
    ) {

        if (panelGeneral) {

            panelGeneral.hidden = (
                nombrePanel !== "general"
            );

        }


        if (panelVerificacion) {

            panelVerificacion.hidden = (
                nombrePanel
                !== "verificacion"
            );

        }


        if (panelMedico) {

            panelMedico.hidden = (
                nombrePanel !== "medico"
            );

        }


        btnGeneral?.classList.toggle(

            "active",

            nombrePanel === "general"

        );


        btnVerificacion?.classList.toggle(

            "active",

            nombrePanel
            === "verificacion"

        );


        btnMedico?.classList.toggle(

            "active",

            nombrePanel === "medico"

        );


        btnGeneral?.toggleAttribute(

            "aria-current",

            nombrePanel === "general"

        );


        btnVerificacion?.toggleAttribute(

            "aria-current",

            nombrePanel
            === "verificacion"

        );


        btnMedico?.toggleAttribute(

            "aria-current",

            nombrePanel === "medico"

        );

    }

        /*==================================================
            DOCUMENTOS DE VERIFICACIÓN
    ==================================================*/

    function crearDocumento(
        url,
        titulo
    ) {

        if (!url) {

            return `
                <article
                    class="
                        documento-card
                        documento-vacio
                    "
                >

                    <div
                        class="
                            documento-card-contenido
                        "
                    >

                        <i
                            class="
                                fa-regular
                                fa-file-circle-xmark
                            "
                        ></i>

                        <strong>
                            ${escaparHtml(titulo)}
                        </strong>

                        <span>
                            Documento no registrado
                        </span>

                    </div>

                </article>
            `;

        }


        return `
            <article
                class="documento-card"
            >

                <a
                    href="${escaparHtml(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="documento-enlace"
                >

                    <img
                        src="${escaparHtml(url)}"
                        alt="${escaparHtml(titulo)}"
                    >

                    <div
                        class="
                            documento-card-contenido
                        "
                    >

                        <strong>
                            ${escaparHtml(titulo)}
                        </strong>

                        <span>
                            Haz clic para ampliar
                        </span>

                    </div>

                </a>

            </article>
        `;

    }


    /*==================================================
                CREAR DATOS DEL VEHÍCULO
    ==================================================*/

    function crearVehiculo(
        vehiculo
    ) {

        if (!vehiculo) {

            return `
                <section
                    class="verificacion-seccion"
                >

                    <h3>
                        Información del vehículo
                    </h3>

                    <div
                        class="
                            usuario-panel-cargando
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-car
                            "
                        ></i>

                        <strong>
                            Sin vehículo activo
                        </strong>

                        <span>
                            El conductor no tiene
                            un vehículo activo
                            registrado.
                        </span>

                    </div>

                </section>
            `;

        }


        const marcaModelo = (

            `${vehiculo.marca || ""} ` +
            `${vehiculo.modelo || ""}`

        ).trim() || "No registrado";


        return `
            <section
                class="verificacion-seccion"
            >

                <h3>
                    Información del vehículo
                </h3>


                <div
                    class="verificacion-grid"
                >

                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Marca y modelo
                        </span>

                        <strong>
                            ${escaparHtml(
                                marcaModelo
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Año
                        </span>

                        <strong>
                            ${escaparHtml(
                                vehiculo.anio
                                || "No registrado"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Color
                        </span>

                        <strong>
                            ${escaparHtml(
                                vehiculo.color
                                || "No registrado"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Placas
                        </span>

                        <strong>
                            ${escaparHtml(
                                vehiculo.placas
                                || "No registradas"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Capacidad
                        </span>

                        <strong>
                            ${escaparHtml(
                                vehiculo.capacidad
                                || "No registrada"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Estado
                        </span>

                        <strong>
                            ${escaparHtml(
                                vehiculo.estado_display
                                || vehiculo.estado
                                || "Pendiente"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Motivo de rechazo
                        </span>

                        <strong>
                            ${escaparHtml(
                                vehiculo.motivo_rechazo
                                || "Sin observaciones"
                            )}
                        </strong>

                    </div>

                </div>


                <div
                    class="verificacion-documentos"
                >

                    ${crearDocumento(
                        vehiculo.foto,
                        "Fotografía del vehículo"
                    )}


                    ${crearDocumento(
                        vehiculo.tarjeta_circulacion,
                        "Tarjeta de circulación"
                    )}


                    ${crearDocumento(
                        vehiculo.documento_seguro,
                        "Documento de seguro"
                    )}

                </div>

            </section>
        `;

    }


    /*==================================================
                PINTAR VERIFICACIÓN
    ==================================================*/

    function pintarVerificacion(
        usuario
    ) {

        if (!verificacionContenido) {

            return;

        }


        const conductor =
            usuario?.conductor || null;

        const vehiculo =
            usuario?.vehiculo || null;


        /*==================================================
            CONDUCTOR SIN INFORMACIÓN REGISTRADA
        ==================================================*/

        if (!conductor) {

            verificacionContenido.innerHTML = `
                <div
                    class="
                        usuario-panel-cargando
                    "
                >

                    <i
                        class="
                            fa-solid
                            fa-circle-info
                        "
                    ></i>

                    <strong>
                        Sin información de conductor
                    </strong>

                    <span>
                        Este usuario tiene rol
                        de conductor, pero todavía
                        no ha registrado su licencia
                        o documentación.
                    </span>

                </div>
            `;

            return;

        }


        /*==================================================
                    LICENCIA + VEHÍCULO
        ==================================================*/

        verificacionContenido.innerHTML = `

            <section
                class="verificacion-seccion"
            >

                <h3>
                    Información de la licencia
                </h3>


                <div
                    class="verificacion-grid"
                >

                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Número de licencia
                        </span>

                        <strong>
                            ${escaparHtml(
                                conductor.numero_licencia
                                || "No registrado"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Fecha de vencimiento
                        </span>

                        <strong>
                            ${escaparHtml(
                                conductor.fecha_vencimiento
                                || "No registrada"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Estado
                        </span>

                        <strong>
                            ${escaparHtml(
                                conductor.estado_verificacion_display
                                || conductor.estado_verificacion
                                || "Pendiente"
                            )}
                        </strong>

                    </div>


                    <div
                        class="verificacion-dato"
                    >

                        <span>
                            Motivo de rechazo
                        </span>

                        <strong>
                            ${escaparHtml(
                                conductor.motivo_rechazo
                                || "Sin observaciones"
                            )}
                        </strong>

                    </div>

                </div>


                <div
                    class="verificacion-documentos"
                >

                    ${crearDocumento(
                        conductor.foto_licencia_frontal,
                        "Licencia frontal"
                    )}


                    ${crearDocumento(
                        conductor.foto_licencia_reverso,
                        "Licencia reverso"
                    )}

                </div>

            </section>


            ${crearVehiculo(
                vehiculo
            )}

        `;

    }
        /*==================================================
                    PINTAR USUARIO
    ==================================================*/

    function pintarUsuario(
        usuario
    ) {

        usuarioActual =
            usuario;


        /*==================================================
                        FOTO
        ==================================================*/

        if (fotoUsuario) {

            fotoUsuario.src = (
                usuario.foto
                || "/static/img/admin.png"
            );

        }


        /*==================================================
                        NOMBRE
        ==================================================*/

        if (nombreTitulo) {

            nombreTitulo.textContent = (
                usuario.nombre
                || "Usuario"
            );

        }


        /*==================================================
                LLENAR FORMULARIO GENERAL
        ==================================================*/

        asignarValor(
            "usuarioId",
            usuario.id
        );

        asignarValor(
            "nombre",
            usuario.nombre
        );

        asignarValor(
            "correo",
            usuario.correo
        );

        asignarValor(
            "matricula",
            usuario.matricula
        );

        asignarValor(
            "cuatrimestre",
            usuario.cuatrimestre
        );

        asignarValor(
            "carrera",
            usuario.carrera
        );

        asignarValor(
            "rol",
            usuario.rol
        );

        asignarValor(
            "estado",
            usuario.estado
        );

        asignarValor(
            "telefono",
            usuario.telefono
        );

        asignarValor(
            "password",
            ""
        );


        /*==================================================
                MOSTRAR VERIFICACIÓN SOLO
                    PARA CONDUCTORES
        ==================================================*/

        const esConductor =
            esUsuarioConductor(
                usuario
            );


        if (btnVerificacion) {

            btnVerificacion.hidden =
                !esConductor;


            btnVerificacion.setAttribute(

                "aria-hidden",

                esConductor
                    ? "false"
                    : "true"

            );

        }


        /*==================================================
                    GUARDAR ESTADO
        ==================================================*/

        window.ADMIN_STATE = {

            ...(window.ADMIN_STATE || {}),

            usuarioId:
                usuario.id,

            usuarioRol:
                obtenerRolNormalizado(
                    usuario
                ),

            usuario:
                usuario,

        };


        sessionStorage.setItem(

            "usuarioId",

            usuario.id

        );


        sessionStorage.setItem(

            "usuario",

            JSON.stringify(
                usuario
            )

        );

    }


    /*==================================================
                    CARGAR USUARIO
    ==================================================*/

    async function cargarUsuario() {

        const respuesta = await fetch(

            `/api/admin/usuarios/${usuarioId}/`,

            {

                credentials:
                    "same-origin",

            }

        );


        const datos =
            await leerJson(
                respuesta
            );


        if (!datos.ok) {

            throw new Error(

                datos.error
                || (
                    "No se pudo cargar "
                    + "el usuario."
                )

            );

        }


        pintarUsuario(
            datos.usuario
        );


        return datos.usuario;

    }


    /*==================================================
                CARGAR DATOS MÉDICOS
    ==================================================*/

    async function cargarDatosMedicos(
        forzarRecarga = false
    ) {

        /*
        Evitamos consultar la API cada vez que
        el usuario cambia de pestaña.
        */

        if (

            expedienteCargado
            && !forzarRecarga

        ) {

            return;

        }


        const respuesta = await fetch(

            `/api/admin/usuarios/${usuarioId}/expediente-medico/`,

            {

                credentials:
                    "same-origin",

            }

        );


        const datos =
            await leerJson(
                respuesta
            );


        if (!datos.ok) {

            throw new Error(

                datos.error
                || (
                    "No se pudo cargar "
                    + "el expediente médico."
                )

            );

        }


        const expediente =
            datos.expediente || {};


        /*==================================================
                LLENAR FORMULARIO MÉDICO
        ==================================================*/

        asignarValor(

            "tipoSangre",

            expediente.tipo_sangre

        );


        asignarValor(

            "alergias",

            expediente.alergias

        );


        asignarValor(

            "enfermedades",

            expediente.condiciones_medicas

        );


        asignarValor(

            "medicamentos",

            expediente.medicamentos

        );


        asignarValor(

            "contacto",

            expediente.nombre_contacto

        );


        asignarValor(

            "telefonoEmergencia",

            expediente.telefono_contacto

        );


        asignarValor(

            "observaciones",

            expediente.observaciones

        );


        expedienteCargado =
            true;

    }


    /*==================================================
            ABRIR PESTAÑA SOLICITADA
    ==================================================*/

    async function abrirPestanaInicial() {

        let pestana = (

            sessionStorage.getItem(
                "pestanaUsuarioAdmin"
            )

            || "general"

        );


        /*
        Si quedó guardada la pestaña de verificación
        pero ahora el usuario no es conductor,
        regresamos a Información general.
        */

        if (

            pestana === "verificacion"
            && !esUsuarioConductor(
                usuarioActual
            )

        ) {

            pestana =
                "general";

        }


        /*==================================================
                    VERIFICACIÓN
        ==================================================*/

        if (
            pestana === "verificacion"
        ) {

            pintarVerificacion(
                usuarioActual
            );


            mostrarPanel(
                "verificacion"
            );


            return;

        }


        /*==================================================
                EXPEDIENTE MÉDICO
        ==================================================*/

        if (
            pestana === "medico"
        ) {

            mostrarPanel(
                "medico"
            );


            try {

                await cargarDatosMedicos();

            } catch (error) {

                console.error(

                    "Error al cargar expediente médico:",

                    error

                );


                alert(

                    normalizarError(
                        error
                    )

                );

            }


            return;

        }


        /*==================================================
                INFORMACIÓN GENERAL
        ==================================================*/

        sessionStorage.setItem(

            "pestanaUsuarioAdmin",

            "general"

        );


        mostrarPanel(
            "general"
        );

    }
        /*==================================================
                    NAVEGACIÓN
    ==================================================*/

    btnGeneral?.addEventListener(
        "click",
        function () {

            sessionStorage.setItem(
                "pestanaUsuarioAdmin",
                "general"
            );

            mostrarPanel(
                "general"
            );

        }
    );


    btnVerificacion?.addEventListener(
        "click",
        function () {

            if (
                !usuarioActual
                || !esUsuarioConductor(
                    usuarioActual
                )
            ) {

                return;

            }


            sessionStorage.setItem(
                "pestanaUsuarioAdmin",
                "verificacion"
            );


            pintarVerificacion(
                usuarioActual
            );


            mostrarPanel(
                "verificacion"
            );

        }
    );


    btnMedico?.addEventListener(
        "click",
        async function () {

            sessionStorage.setItem(
                "pestanaUsuarioAdmin",
                "medico"
            );


            mostrarPanel(
                "medico"
            );


            try {

                await cargarDatosMedicos();

            } catch (error) {

                console.error(
                    "Error al cargar expediente médico:",
                    error
                );


                alert(
                    normalizarError(
                        error
                    )
                );

            }

        }
    );


    /*==================================================
                    BOTÓN REGRESAR
    ==================================================*/

    document
        .getElementById(
            "volver"
        )
        ?.addEventListener(
            "click",
            function () {

                sessionStorage.removeItem(
                    "pestanaUsuarioAdmin"
                );


                cargarVista(
                    "usuarios"
                );

            }
        );


    /*==================================================
                MOSTRAR CONTRASEÑA
    ==================================================*/

    btnMostrarPassword?.addEventListener(
        "click",
        function () {

            const inputPassword =
                document.getElementById(
                    "password"
                );


            const icono =
                btnMostrarPassword.querySelector(
                    "i"
                );


            if (!inputPassword) {

                return;

            }


            const mostrar = (
                inputPassword.type
                === "password"
            );


            inputPassword.type = (
                mostrar
                    ? "text"
                    : "password"
            );


            icono?.classList.toggle(
                "fa-eye",
                !mostrar
            );


            icono?.classList.toggle(
                "fa-eye-slash",
                mostrar
            );

        }
    );


    /*==================================================
        CAMBIAR ESTADO DE BOTÓN DE GUARDADO
    ==================================================*/

    function cambiarEstadoBoton(
        boton,
        guardando,
        textoNormal,
        textoGuardando
    ) {

        if (!boton) {

            return;

        }


        boton.disabled =
            guardando;


        if (guardando) {

            boton.innerHTML = `
                <i
                    class="
                        fa-solid
                        fa-spinner
                        fa-spin
                    "
                ></i>

                ${escaparHtml(
                    textoGuardando
                )}
            `;

        } else {

            boton.innerHTML = `
                <i
                    class="
                        fa-solid
                        fa-floppy-disk
                    "
                ></i>

                ${escaparHtml(
                    textoNormal
                )}
            `;

        }

    }


    /*==================================================
                GUARDAR USUARIO
    ==================================================*/

    formGeneral?.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            const payload = {

                nombre:
                    document
                        .getElementById(
                            "nombre"
                        )
                        ?.value
                        .trim()
                    || "",


                correo:
                    document
                        .getElementById(
                            "correo"
                        )
                        ?.value
                        .trim()
                    || "",


                matricula:
                    document
                        .getElementById(
                            "matricula"
                        )
                        ?.value
                        .trim()
                    || "",


                cuatrimestre:
                    document
                        .getElementById(
                            "cuatrimestre"
                        )
                        ?.value
                    || "",


                carrera:
                    document
                        .getElementById(
                            "carrera"
                        )
                        ?.value
                    || "",


                rol:
                    document
                        .getElementById(
                            "rol"
                        )
                        ?.value
                    || "",


                estado:
                    document
                        .getElementById(
                            "estado"
                        )
                        ?.value
                    || "",


                telefono:
                    document
                        .getElementById(
                            "telefono"
                        )
                        ?.value
                        .trim()
                    || "",


                password:
                    document
                        .getElementById(
                            "password"
                        )
                        ?.value
                    || "",

            };


            cambiarEstadoBoton(
                btnGuardarGeneral,
                true,
                "Guardar cambios",
                "Guardando cambios..."
            );


            try {

                const respuesta =
                    await fetch(

                        `/api/admin/usuarios/${usuarioId}/actualizar/`,

                        {

                            method:
                                "POST",


                            headers: {

                                "Content-Type":
                                    "application/json",

                                "X-CSRFToken":
                                    obtenerCSRFToken(),

                                "X-Requested-With":
                                    "XMLHttpRequest",

                            },


                            credentials:
                                "same-origin",


                            body:
                                JSON.stringify(
                                    payload
                                ),

                        }

                    );


                const datos =
                    await leerJson(
                        respuesta
                    );


                if (!datos.ok) {

                    throw new Error(

                        datos.error
                        || (
                            "No se pudo actualizar "
                            + "el usuario."
                        )

                    );

                }


                alert(

                    datos.mensaje
                    || (
                        "Usuario actualizado "
                        + "correctamente."
                    )

                );


                await cargarUsuario();


                /*
                Si el rol cambió de conductor a otro,
                evitamos dejar abierta la pestaña
                de verificación.
                */

                if (
                    !esUsuarioConductor(
                        usuarioActual
                    )
                    && sessionStorage.getItem(
                        "pestanaUsuarioAdmin"
                    ) === "verificacion"
                ) {

                    sessionStorage.setItem(
                        "pestanaUsuarioAdmin",
                        "general"
                    );


                    mostrarPanel(
                        "general"
                    );

                }


            } catch (error) {

                console.error(

                    "Error al actualizar usuario:",

                    error

                );


                alert(

                    normalizarError(
                        error
                    )

                );


            } finally {

                cambiarEstadoBoton(
                    btnGuardarGeneral,
                    false,
                    "Guardar cambios",
                    "Guardando cambios..."
                );

            }

        }
    );
        /*==================================================
            GUARDAR EXPEDIENTE MÉDICO
    ==================================================*/

    formMedico?.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            const payload = {

                tipo_sangre:
                    document
                        .getElementById(
                            "tipoSangre"
                        )
                        ?.value
                    || "",


                alergias:
                    document
                        .getElementById(
                            "alergias"
                        )
                        ?.value
                        .trim()
                    || "",


                condiciones_medicas:
                    document
                        .getElementById(
                            "enfermedades"
                        )
                        ?.value
                        .trim()
                    || "",


                medicamentos:
                    document
                        .getElementById(
                            "medicamentos"
                        )
                        ?.value
                        .trim()
                    || "",


                contacto:
                    document
                        .getElementById(
                            "contacto"
                        )
                        ?.value
                        .trim()
                    || "",


                telefonoEmergencia:
                    document
                        .getElementById(
                            "telefonoEmergencia"
                        )
                        ?.value
                        .trim()
                    || "",


                observaciones:
                    document
                        .getElementById(
                            "observaciones"
                        )
                        ?.value
                        .trim()
                    || "",

            };


            cambiarEstadoBoton(
                btnGuardarExpediente,
                true,
                "Guardar expediente",
                "Guardando expediente..."
            );


            try {

                const respuesta =
                    await fetch(

                        `/api/admin/usuarios/${usuarioId}/expediente-medico/actualizar/`,

                        {

                            method:
                                "POST",


                            headers: {

                                "Content-Type":
                                    "application/json",

                                "X-CSRFToken":
                                    obtenerCSRFToken(),

                                "X-Requested-With":
                                    "XMLHttpRequest",

                            },


                            credentials:
                                "same-origin",


                            body:
                                JSON.stringify(
                                    payload
                                ),

                        }

                    );


                const datos =
                    await leerJson(
                        respuesta
                    );


                if (!datos.ok) {

                    throw new Error(

                        datos.error
                        || (
                            "No se pudo guardar "
                            + "el expediente médico."
                        )

                    );

                }


                expedienteCargado =
                    true;


                alert(

                    datos.mensaje
                    || (
                        "Expediente médico "
                        + "guardado correctamente."
                    )

                );


            } catch (error) {

                console.error(

                    "Error al guardar expediente médico:",

                    error

                );


                alert(

                    normalizarError(
                        error
                    )

                );


            } finally {

                cambiarEstadoBoton(
                    btnGuardarExpediente,
                    false,
                    "Guardar expediente",
                    "Guardando expediente..."
                );

            }

        }
    );


    /*==================================================
                    INICIAR VISTA
    ==================================================*/

    (
        async function iniciar() {

            try {

                await cargarUsuario();

                await abrirPestanaInicial();


            } catch (error) {

                console.error(

                    "Error al inicializar "
                    + "la vista del usuario:",

                    error

                );


                alert(

                    normalizarError(
                        error
                    )

                );


                cargarVista(
                    "usuarios"
                );

            }

        }
    )();

}