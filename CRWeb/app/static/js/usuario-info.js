/*==================================================
            OBTENER TOKEN CSRF
==================================================*/

function obtenerCSRFToken() {

    const inputToken =
        document.querySelector(
            "[name=csrfmiddlewaretoken]"
        );

    if (inputToken) {

        return inputToken.value;

    }


    const cookies =
        document.cookie.split(";");


    for (const cookie of cookies) {

        const cookieLimpia =
            cookie.trim();

        if (
            cookieLimpia.startsWith(
                "csrftoken="
            )
        ) {

            return decodeURIComponent(

                cookieLimpia.substring(
                    "csrftoken=".length
                )

            );

        }

    }


    return "";

}


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


    /*==================================================
            VERIFICACIÓN MÉDICA
    ==================================================*/

    const estadoVerificacionMedica =
        document.getElementById(
            "estadoVerificacionMedica"
        );

    const estadoExpedienteTexto =
        document.getElementById(
            "estadoExpedienteTexto"
        );

    const estadoExpedienteDescripcion =
        document.getElementById(
            "estadoExpedienteDescripcion"
        );

    const badgeExpediente =
        document.getElementById(
            "badgeExpediente"
        );

    const badgeExpedienteTexto =
        document.getElementById(
            "badgeExpedienteTexto"
        );

    const btnAprobarExpediente =
        document.getElementById(
            "btnAprobarExpediente"
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
            ASIGNAR VALOR A CAMPO
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
            ASIGNAR RADIO
    ==================================================*/

    function asignarRadio(
        nombre,
        valor
    ) {

        const valorNormalizado = (
            valor === true
            || valor === "true"
            || valor === "si"
            || valor === "sí"
            || valor === 1
            || valor === "1"
        )
            ? "si"
            : "no";


        const radio =
            document.querySelector(

                `input[name="${nombre}"][value="${valorNormalizado}"]`

            );


        if (radio) {

            radio.checked = true;

        }

    }


    /*==================================================
            ASIGNAR CHECKBOX
    ==================================================*/

    function asignarCheckbox(
        id,
        valor
    ) {

        const checkbox =
            document.getElementById(id);


        if (!checkbox) {

            return;

        }


        checkbox.checked = (
            valor === true
            || valor === "true"
            || valor === "si"
            || valor === "sí"
            || valor === 1
            || valor === "1"
        );

    }


    /*==================================================
            OBTENER RADIO BOOLEANO
    ==================================================*/

    function obtenerRadioBooleano(
        nombre
    ) {

        const seleccionado =
            document.querySelector(

                `input[name="${nombre}"]:checked`

            );


        return (
            seleccionado?.value === "si"
        );

    }


    /*==================================================
            OBTENER CHECKBOX
    ==================================================*/

    function obtenerCheckbox(
        id
    ) {

        return Boolean(

            document
                .getElementById(id)
                ?.checked

        );

    }


    /*==================================================
        CONTROLES DEL EXPEDIENTE MÉDICO
    ==================================================*/

    const discapacidadSi =
        document.getElementById(
            "discapacidadSi"
        );

    const discapacidadNo =
        document.getElementById(
            "discapacidadNo"
        );

    const datosDiscapacidad =
        document.getElementById(
            "datosDiscapacidad"
        );

    const apoyosDiscapacidad =
        document.getElementById(
            "apoyosDiscapacidad"
        );

    const usaOtroApoyo =
        document.getElementById(
            "usaOtroApoyo"
        );

    const campoOtroApoyo =
        document.getElementById(
            "campoOtroApoyo"
        );

    const otroApoyo =
        document.getElementById(
            "otroApoyo"
        );


    /*==================================================
        ACTUALIZAR SECCIONES DE DISCAPACIDAD
    ==================================================*/

    function actualizarSeccionesDiscapacidad() {

        const tieneDiscapacidad =
            discapacidadSi?.checked === true;


        datosDiscapacidad?.classList.toggle(
            "seccion-inactiva",
            !tieneDiscapacidad
        );


        apoyosDiscapacidad?.classList.toggle(
            "seccion-inactiva",
            !tieneDiscapacidad
        );


        const controles = [

            document.getElementById(
                "tipoDiscapacidad"
            ),

            document.getElementById(
                "vehiculoAdaptadoSi"
            ),

            document.getElementById(
                "vehiculoAdaptadoNo"
            ),

            document.getElementById(
                "cuidadosEspecialesSi"
            ),

            document.getElementById(
                "cuidadosEspecialesNo"
            ),

            document.getElementById(
                "usaBaston"
            ),

            document.getElementById(
                "usaPerroGuia"
            ),

            document.getElementById(
                "usaSillaRuedas"
            ),

            document.getElementById(
                "usaAndadera"
            ),

            document.getElementById(
                "usaMuletas"
            ),

            document.getElementById(
                "usaProtesis"
            ),

            usaOtroApoyo,

            otroApoyo,

        ];


        controles.forEach(
            function (control) {

                if (!control) {

                    return;

                }


                if (
                    control === otroApoyo
                ) {

                    control.disabled = (
                        !tieneDiscapacidad
                        || !usaOtroApoyo?.checked
                    );

                } else {

                    control.disabled =
                        !tieneDiscapacidad;

                }

            }
        );


        if (!tieneDiscapacidad) {

            if (usaOtroApoyo) {

                usaOtroApoyo.checked =
                    false;

            }


            actualizarCampoOtroApoyo();

        }

    }


    /*==================================================
            MOSTRAR CAMPO OTRO APOYO
    ==================================================*/

    function actualizarCampoOtroApoyo() {

        const mostrar = Boolean(

            discapacidadSi?.checked
            && usaOtroApoyo?.checked

        );


        if (campoOtroApoyo) {

            campoOtroApoyo.hidden =
                !mostrar;

        }


        if (otroApoyo) {

            otroApoyo.disabled =
                !mostrar;


            if (!mostrar) {

                otroApoyo.value = "";

            }

        }

    }


    discapacidadSi?.addEventListener(
        "change",
        actualizarSeccionesDiscapacidad
    );


    discapacidadNo?.addEventListener(
        "change",
        actualizarSeccionesDiscapacidad
    );


    usaOtroApoyo?.addEventListener(
        "change",
        actualizarCampoOtroApoyo
    );


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
                nombrePanel !== "verificacion"
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
            nombrePanel === "verificacion"
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
            nombrePanel === "verificacion"
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
                <div
                    class="
                        verificacion-documento
                        sin-documento
                    "
                >

                    <div
                        class="
                            verificacion-documento-icono
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-file-circle-xmark
                            "
                        ></i>

                    </div>


                    <div
                        class="
                            verificacion-documento-info
                        "
                    >

                        <span>
                            ${escaparHtml(titulo)}
                        </span>

                        <strong>
                            No disponible
                        </strong>

                    </div>

                </div>
            `;

        }


        return `
            <a
                href="${escaparHtml(url)}"
                target="_blank"
                rel="noopener noreferrer"
                class="
                    verificacion-documento
                    documento-disponible
                "
            >

                <div
                    class="
                        verificacion-documento-icono
                    "
                >

                    <i
                        class="
                            fa-solid
                            fa-file-image
                        "
                    ></i>

                </div>


                <div
                    class="
                        verificacion-documento-info
                    "
                >

                    <span>
                        ${escaparHtml(titulo)}
                    </span>

                    <strong>
                        Ver documento
                    </strong>

                </div>


                <i
                    class="
                        fa-solid
                        fa-arrow-up-right-from-square
                        verificacion-documento-abrir
                    "
                ></i>

            </a>
        `;

    }


    /*==================================================
        NORMALIZAR ESTADO DE VERIFICACIÓN
    ==================================================*/

    function normalizarEstadoVerificacion(
        estado
    ) {

        return String(
            estado || ""
        )
            .trim()
            .toLowerCase();

    }


    /*==================================================
            CREAR BADGE DE VERIFICACIÓN
    ==================================================*/

    function crearBadgeVerificacion(
        estado,
        estadoDisplay = ""
    ) {

        const estadoNormalizado =
            normalizarEstadoVerificacion(
                estado
            );


        let clase =
            "pendiente";

        let icono =
            "fa-clock";

        let texto =
            estadoDisplay
            || "Pendiente";


        /*==================================================
                        APROBADO
        ==================================================*/

        if (
            estadoNormalizado === "aprobado"
        ) {

            clase =
                "aprobado";

            icono =
                "fa-circle-check";

            texto =
                estadoDisplay
                || "Aprobado";

        }


        /*==================================================
                        RECHAZADO
        ==================================================*/

        else if (
            estadoNormalizado === "rechazado"
        ) {

            clase =
                "rechazado";

            icono =
                "fa-circle-xmark";

            texto =
                estadoDisplay
                || "Rechazado";

        }


        /*==================================================
                    EN REVISIÓN
        ==================================================*/

        else if (

            estadoNormalizado === "en_revision"
            || estadoNormalizado === "en revisión"
            || estadoNormalizado === "revision"

        ) {

            clase =
                "pendiente";

            icono =
                "fa-clock";

            texto =
                estadoDisplay
                || "En revisión";

        }


        return `
            <span
                class="
                    badge-verificacion-documento
                    ${clase}
                "
            >

                <i
                    class="
                        fa-solid
                        ${icono}
                    "
                ></i>

                ${escaparHtml(texto)}

            </span>
        `;

    }


    /*==================================================
                CREAR VEHÍCULO
    ==================================================*/

    function crearVehiculo(
        vehiculo
    ) {

        /*==================================================
                    SIN VEHÍCULO
        ==================================================*/

        if (!vehiculo) {

            return `
                <section
                    class="
                        verificacion-seccion
                        verificacion-vehiculo
                    "
                >

                    <div
                        class="
                            verificacion-seccion-header
                        "
                    >

                        <div>

                            <span>
                                Validación vehicular
                            </span>

                            <h3>
                                Información del vehículo
                            </h3>

                        </div>


                        <i
                            class="
                                fa-solid
                                fa-car-side
                            "
                        ></i>

                    </div>


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


        /*==================================================
                    MARCA Y MODELO
        ==================================================*/

        const marcaModelo = (

            `${vehiculo.marca || ""} `
            + `${vehiculo.modelo || ""}`

        )
            .trim()

            || "No registrado";


        /*==================================================
                    ESTADO VEHÍCULO
        ==================================================*/

        const estadoVehiculo =
            normalizarEstadoVerificacion(
                vehiculo.estado
            );


        const estaAprobado = (
            estadoVehiculo === "aprobado"
        );


        /*==================================================
                    GENERAR TARJETA
        ==================================================*/

        return `
            <section
                class="
                    verificacion-seccion
                    verificacion-vehiculo
                "
            >

                <!--==========================================
                        CABECERA DEL VEHÍCULO
                ===========================================-->

                <div
                    class="
                        verificacion-seccion-header
                    "
                >

                    <div>

                        <span>
                            Validación vehicular
                        </span>

                        <h3>
                            Información del vehículo
                        </h3>

                    </div>


                    <div
                        class="
                            verificacion-header-estado
                        "
                    >

                        ${crearBadgeVerificacion(
                            vehiculo.estado,
                            vehiculo.estado_display
                        )}

                    </div>

                </div>


                <!--==========================================
                        DATOS DEL VEHÍCULO
                ===========================================-->

                <div
                    class="
                        verificacion-grid
                    "
                >

                    <!-- DUEÑO -->

                    <div
                        class="
                            verificacion-dato
                        "
                    >

                        <span>
                            Dueño
                        </span>

                        <strong>

                            ${escaparHtml(
                                vehiculo.dueno
                                || "No registrado"
                            )}

                        </strong>

                    </div>


                    <!-- MARCA / MODELO -->

                    <div
                        class="
                            verificacion-dato
                        "
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


                    <!-- AÑO -->

                    <div
                        class="
                            verificacion-dato
                        "
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


                    <!-- COLOR -->

                    <div
                        class="
                            verificacion-dato
                        "
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


                    <!-- PLACAS -->

                    <div
                        class="
                            verificacion-dato
                        "
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


                    <!-- CAPACIDAD -->

                    <div
                        class="
                            verificacion-dato
                        "
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

                </div>


                <!--==========================================
                        MOTIVO DE RECHAZO
                ===========================================-->

                ${
                    estadoVehiculo === "rechazado"

                        ? `
                            <div
                                class="
                                    verificacion-motivo-rechazo
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-triangle-exclamation
                                    "
                                ></i>


                                <div>

                                    <span>
                                        Motivo del rechazo
                                    </span>

                                    <strong>

                                        ${escaparHtml(
                                            vehiculo.motivo_rechazo
                                            || "Sin motivo registrado"
                                        )}

                                    </strong>

                                </div>

                            </div>
                        `

                        : ""
                }


                <!--==========================================
                        DOCUMENTOS DEL VEHÍCULO
                ===========================================-->

                <div
                    class="
                        verificacion-documentos
                    "
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
                        "Documento del seguro"
                    )}

                </div>


                <!--==========================================
                        ACCIONES DEL VEHÍCULO
                ===========================================-->

                <div
                    class="
                        verificacion-acciones
                        verificacion-acciones-vehiculo
                    "
                >

                    <div
                        class="
                            verificacion-acciones-info
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-shield-halved
                            "
                        ></i>


                        <span>

                            ${
                                estaAprobado

                                    ? (
                                        "Este vehículo ya está "
                                        + "autorizado."
                                    )

                                    : (
                                        "Revisa la fotografía, "
                                        + "la tarjeta de circulación "
                                        + "y el seguro antes de aprobar."
                                    )
                            }

                        </span>

                    </div>


                    <div
                        class="
                            verificacion-acciones-botones
                        "
                    >

                        <!-- RECHAZAR -->

                        <button
                            type="button"
                            class="
                                btn-rechazar-verificacion
                                btn-rechazar-vehiculo
                            "
                            data-vehiculo-id="${escaparHtml(
                                vehiculo.id || ""
                            )}"
                            ${estaAprobado ? "disabled" : ""}
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-circle-xmark
                                "
                            ></i>

                            Rechazar vehículo

                        </button>


                        <!-- APROBAR -->

                        <button
                            type="button"
                            class="
                                btn-aprobar-verificacion
                                btn-aprobar-vehiculo
                            "
                            data-vehiculo-id="${escaparHtml(
                                vehiculo.id || ""
                            )}"
                            ${estaAprobado ? "disabled" : ""}
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-circle-check
                                "
                            ></i>


                            ${
                                estaAprobado
                                    ? "Vehículo aprobado"
                                    : "Aprobar vehículo"
                            }

                        </button>

                    </div>

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

                        Este usuario tiene rol de conductor,
                        pero todavía no ha registrado su
                        licencia o documentación.

                    </span>

                </div>

            `;


            return;

        }


        /*==================================================
                ESTADO DEL CONDUCTOR
        ==================================================*/

        const estadoConductor =
            normalizarEstadoVerificacion(
                conductor.estado_verificacion
            );


        const conductorAprobado = (
            estadoConductor === "aprobado"
        );


        /*==================================================
                CONSTRUIR CONTENIDO
        ==================================================*/

        verificacionContenido.innerHTML = `


            <!--==============================================
                    VERIFICACIÓN DE LICENCIA
            ===============================================-->

            <section
                class="
                    verificacion-seccion
                    verificacion-licencia
                "
            >

                <!--==========================================
                        CABECERA LICENCIA
                ===========================================-->

                <div
                    class="
                        verificacion-seccion-header
                    "
                >

                    <div>

                        <span>
                            Identificación del conductor
                        </span>

                        <h3>
                            Información de la licencia
                        </h3>

                    </div>


                    <div
                        class="
                            verificacion-header-estado
                        "
                    >

                        ${crearBadgeVerificacion(
                            conductor.estado_verificacion,
                            conductor.estado_verificacion_display
                        )}

                    </div>

                </div>


                <!--==========================================
                        DATOS DE LICENCIA
                ===========================================-->

                <div
                    class="
                        verificacion-grid
                    "
                >

                    <!-- NÚMERO DE LICENCIA -->

                    <div
                        class="
                            verificacion-dato
                        "
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


                    <!-- FECHA DE VENCIMIENTO -->

                    <div
                        class="
                            verificacion-dato
                        "
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


                    <!-- ESTADO -->

                    <div
                        class="
                            verificacion-dato
                        "
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

                </div>


                <!--==========================================
                        MOTIVO DE RECHAZO
                ===========================================-->

                ${
                    estadoConductor === "rechazado"

                        ? `
                            <div
                                class="
                                    verificacion-motivo-rechazo
                                "
                            >

                                <i
                                    class="
                                        fa-solid
                                        fa-triangle-exclamation
                                    "
                                ></i>


                                <div>

                                    <span>
                                        Motivo del rechazo
                                    </span>

                                    <strong>

                                        ${escaparHtml(
                                            conductor.motivo_rechazo
                                            || "Sin motivo registrado"
                                        )}

                                    </strong>

                                </div>

                            </div>
                        `

                        : ""
                }


                <!--==========================================
                        DOCUMENTOS DE LICENCIA
                ===========================================-->

                <div
                    class="
                        verificacion-documentos
                    "
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


                <!--==========================================
                        ACCIONES DE LICENCIA
                ===========================================-->

                <div
                    class="
                        verificacion-acciones
                        verificacion-acciones-conductor
                    "
                >

                    <div
                        class="
                            verificacion-acciones-info
                        "
                    >

                        <i
                            class="
                                fa-solid
                                fa-id-card
                            "
                        ></i>


                        <span>

                            ${
                                conductorAprobado

                                    ? (
                                        "La documentación del conductor "
                                        + "ya fue aprobada."
                                    )

                                    : (
                                        "Comprueba ambas caras de la "
                                        + "licencia antes de aprobar."
                                    )
                            }

                        </span>

                    </div>


                    <div
                        class="
                            verificacion-acciones-botones
                        "
                    >

                        <!-- RECHAZAR LICENCIA -->

                        <button
                            type="button"
                            class="
                                btn-rechazar-verificacion
                                btn-rechazar-conductor
                            "
                            data-usuario-id="${escaparHtml(
                                usuario.id
                            )}"
                            ${conductorAprobado ? "disabled" : ""}
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-circle-xmark
                                "
                            ></i>

                            Rechazar licencia

                        </button>


                        <!-- APROBAR LICENCIA -->

                        <button
                            type="button"
                            class="
                                btn-aprobar-verificacion
                                btn-aprobar-conductor
                            "
                            data-usuario-id="${escaparHtml(
                                usuario.id
                            )}"
                            ${conductorAprobado ? "disabled" : ""}
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-circle-check
                                "
                            ></i>


                            ${
                                conductorAprobado
                                    ? "Licencia aprobada"
                                    : "Aprobar licencia"
                            }

                        </button>

                    </div>

                </div>

            </section>


            <!--==============================================
                        VEHÍCULO
            ===============================================-->

            ${crearVehiculo(
                vehiculo
            )}

        `;

    }


    /*==================================================
        ACTUALIZAR VERIFICACIÓN DE CONDUCTOR
    ==================================================*/

    async function actualizarVerificacionConductor(
        estado,
        motivo = ""
    ) {

        const respuesta =
            await fetch(

                `/api/admin/conductores/${usuarioId}/verificar/`,

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
                        JSON.stringify({

                            estado:
                                estado,

                            motivo:
                                motivo,

                        }),

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
                    + "la verificación del conductor."
                )

            );

        }


        return datos;

    }


    /*==================================================
        ACTUALIZAR VERIFICACIÓN DE VEHÍCULO
    ==================================================*/

    async function actualizarVerificacionVehiculo(
        vehiculoId,
        estado,
        motivo = ""
    ) {

        const respuesta =
            await fetch(

                `/api/admin/vehiculos/${vehiculoId}/verificar/`,

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
                        JSON.stringify({

                            estado:
                                estado,

                            motivo:
                                motivo,

                        }),

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
                    + "la verificación del vehículo."
                )

            );

        }


        return datos;

    }


    /*==================================================
        RECARGAR PANEL DE VERIFICACIÓN
    ==================================================*/

    async function recargarVerificacion() {

        const usuario =
            await cargarUsuario();


        pintarVerificacion(
            usuario
        );


        mostrarPanel(
            "verificacion"
        );

    }

        /*==================================================
        CLICK EN BOTONES DINÁMICOS DE VERIFICACIÓN
    ==================================================*/

    verificacionContenido?.addEventListener(
        "click",
        async function (evento) {

            const boton =
                evento.target.closest(
                    "button"
                );


            if (
                !boton
                || boton.disabled
            ) {

                return;

            }


            /*==================================================
                    APROBAR LICENCIA
            ==================================================*/

            if (
                boton.classList.contains(
                    "btn-aprobar-conductor"
                )
            ) {

                const confirmar =
                    window.confirm(

                        "¿Deseas aprobar la licencia "
                        + "y documentación de este conductor?"

                    );


                if (!confirmar) {

                    return;

                }


                const textoOriginal =
                    boton.innerHTML;


                boton.disabled =
                    true;


                boton.innerHTML = `
                    <i
                        class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "
                    ></i>

                    Aprobando...
                `;


                try {

                    const datos =
                        await actualizarVerificacionConductor(
                            "aprobado"
                        );


                    alert(

                        datos.mensaje
                        || (
                            "Licencia aprobada "
                            + "correctamente."
                        )

                    );


                    await recargarVerificacion();


                } catch (error) {

                    console.error(

                        "Error al aprobar conductor:",

                        error

                    );


                    alert(

                        normalizarError(
                            error
                        )

                    );


                    boton.disabled =
                        false;


                    boton.innerHTML =
                        textoOriginal;

                }


                return;

            }


            /*==================================================
                    RECHAZAR LICENCIA
            ==================================================*/

            if (
                boton.classList.contains(
                    "btn-rechazar-conductor"
                )
            ) {

                const motivo =
                    window.prompt(

                        "Escribe el motivo por el que "
                        + "se rechaza la licencia:"

                    );


                if (
                    motivo === null
                ) {

                    return;

                }


                const motivoLimpio =
                    motivo.trim();


                if (!motivoLimpio) {

                    alert(
                        "Debes indicar un motivo de rechazo."
                    );

                    return;

                }


                const textoOriginal =
                    boton.innerHTML;


                boton.disabled =
                    true;


                boton.innerHTML = `
                    <i
                        class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "
                    ></i>

                    Rechazando...
                `;


                try {

                    const datos =
                        await actualizarVerificacionConductor(
                            "rechazado",
                            motivoLimpio
                        );


                    alert(

                        datos.mensaje
                        || (
                            "Licencia rechazada "
                            + "correctamente."
                        )

                    );


                    await recargarVerificacion();


                } catch (error) {

                    console.error(

                        "Error al rechazar conductor:",

                        error

                    );


                    alert(

                        normalizarError(
                            error
                        )

                    );


                    boton.disabled =
                        false;


                    boton.innerHTML =
                        textoOriginal;

                }


                return;

            }


            /*==================================================
                    APROBAR VEHÍCULO
            ==================================================*/

            if (
                boton.classList.contains(
                    "btn-aprobar-vehiculo"
                )
            ) {

                const vehiculoId =
                    boton.dataset.vehiculoId;


                if (!vehiculoId) {

                    alert(

                        "No se encontró el identificador "
                        + "del vehículo."

                    );

                    return;

                }


                const confirmar =
                    window.confirm(

                        "¿Deseas aprobar este vehículo "
                        + "y sus documentos?"

                    );


                if (!confirmar) {

                    return;

                }


                const textoOriginal =
                    boton.innerHTML;


                boton.disabled =
                    true;


                boton.innerHTML = `
                    <i
                        class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "
                    ></i>

                    Aprobando...
                `;


                try {

                    const datos =
                        await actualizarVerificacionVehiculo(

                            vehiculoId,

                            "aprobado"

                        );


                    alert(

                        datos.mensaje
                        || (
                            "Vehículo aprobado "
                            + "correctamente."
                        )

                    );


                    await recargarVerificacion();


                } catch (error) {

                    console.error(

                        "Error al aprobar vehículo:",

                        error

                    );


                    alert(

                        normalizarError(
                            error
                        )

                    );


                    boton.disabled =
                        false;


                    boton.innerHTML =
                        textoOriginal;

                }


                return;

            }


            /*==================================================
                    RECHAZAR VEHÍCULO
            ==================================================*/

            if (
                boton.classList.contains(
                    "btn-rechazar-vehiculo"
                )
            ) {

                const vehiculoId =
                    boton.dataset.vehiculoId;


                if (!vehiculoId) {

                    alert(

                        "No se encontró el identificador "
                        + "del vehículo."

                    );

                    return;

                }


                const motivo =
                    window.prompt(

                        "Escribe el motivo por el que "
                        + "se rechaza el vehículo:"

                    );


                if (
                    motivo === null
                ) {

                    return;

                }


                const motivoLimpio =
                    motivo.trim();


                if (!motivoLimpio) {

                    alert(
                        "Debes indicar un motivo de rechazo."
                    );

                    return;

                }


                const textoOriginal =
                    boton.innerHTML;


                boton.disabled =
                    true;


                boton.innerHTML = `
                    <i
                        class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "
                    ></i>

                    Rechazando...
                `;


                try {

                    const datos =
                        await actualizarVerificacionVehiculo(

                            vehiculoId,

                            "rechazado",

                            motivoLimpio

                        );


                    alert(

                        datos.mensaje
                        || (
                            "Vehículo rechazado "
                            + "correctamente."
                        )

                    );


                    await recargarVerificacion();


                } catch (error) {

                    console.error(

                        "Error al rechazar vehículo:",

                        error

                    );


                    alert(

                        normalizarError(
                            error
                        )

                    );


                    boton.disabled =
                        false;


                    boton.innerHTML =
                        textoOriginal;

                }


                return;

            }

        }
    );

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

        const respuesta =
            await fetch(

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
        PINTAR ESTADO DEL EXPEDIENTE MÉDICO
    ==================================================*/

    function pintarEstadoExpediente(
        verificado
    ) {

        const estaVerificado =
            verificado === true
            || verificado === "true"
            || verificado === 1
            || verificado === "1";


        estadoVerificacionMedica?.classList.toggle(
            "verificado",
            estaVerificado
        );


        /*==================================================
                    TEXTO PRINCIPAL
        ==================================================*/

        if (estadoExpedienteTexto) {

            estadoExpedienteTexto.textContent =
                estaVerificado
                    ? "Expediente verificado"
                    : "Pendiente de verificación";

        }


        /*==================================================
                    DESCRIPCIÓN
        ==================================================*/

        if (estadoExpedienteDescripcion) {

            estadoExpedienteDescripcion.textContent =
                estaVerificado
                    ? (
                        "La información médica ya fue revisada "
                        + "y aprobada por un administrador."
                    )
                    : (
                        "La información médica todavía no ha sido "
                        + "revisada por un administrador."
                    );

        }


        /*==================================================
                    BADGE
        ==================================================*/

        if (badgeExpediente) {

            badgeExpediente.classList.toggle(
                "pendiente",
                !estaVerificado
            );


            badgeExpediente.classList.toggle(
                "verificado",
                estaVerificado
            );

        }


        if (badgeExpedienteTexto) {

            badgeExpedienteTexto.textContent =
                estaVerificado
                    ? "Verificado"
                    : "Pendiente";

        }


        /*==================================================
                    ICONO DEL BADGE
        ==================================================*/

        const iconoBadge =
            badgeExpediente?.querySelector(
                "i"
            );


        if (iconoBadge) {

            iconoBadge.className =
                estaVerificado
                    ? "fa-solid fa-circle-check"
                    : "fa-solid fa-clock";

        }


        /*==================================================
                BOTÓN APROBAR EXPEDIENTE
        ==================================================*/

        if (btnAprobarExpediente) {

            btnAprobarExpediente.disabled =
                estaVerificado;


            btnAprobarExpediente.innerHTML =
                estaVerificado
                    ? `
                        <i class="fa-solid fa-circle-check"></i>
                        Expediente aprobado
                    `
                    : `
                        <i class="fa-solid fa-circle-check"></i>
                        Aprobar expediente
                    `;

        }

    }


    /*==================================================
                CARGAR DATOS MÉDICOS
    ==================================================*/

    async function cargarDatosMedicos(
        forzarRecarga = false
    ) {

        if (
            expedienteCargado
            && !forzarRecarga
        ) {

            return;

        }


        const respuesta =
            await fetch(

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
                    INFORMACIÓN GENERAL
        ==================================================*/

        asignarRadio(
            "discapacidad",
            expediente.discapacidad
        );


        asignarValor(
            "tipoSangre",
            expediente.tipo_sangre
        );


        /*==================================================
                INFORMACIÓN DE DISCAPACIDAD
        ==================================================*/

        asignarValor(
            "tipoDiscapacidad",
            expediente.tipo_discapacidad
        );


        asignarRadio(
            "vehiculo_adaptado",
            expediente.vehiculo_adaptado
        );


        asignarRadio(
            "cuidados_especiales",
            expediente.cuidados_especiales
        );


        /*==================================================
                    APOYOS UTILIZADOS
        ==================================================*/

        asignarCheckbox(
            "usaBaston",
            expediente.usa_baston
        );


        asignarCheckbox(
            "usaPerroGuia",
            expediente.usa_perro_guia
        );


        asignarCheckbox(
            "usaSillaRuedas",
            expediente.usa_silla_ruedas
        );


        asignarCheckbox(
            "usaAndadera",
            expediente.usa_andadera
        );


        asignarCheckbox(
            "usaMuletas",
            expediente.usa_muletas
        );


        asignarCheckbox(
            "usaProtesis",
            expediente.usa_protesis
        );


        const tieneOtroApoyo =
            Boolean(

                String(
                    expediente.otro_apoyo || ""
                ).trim()

            );


        if (usaOtroApoyo) {

            usaOtroApoyo.checked =
                tieneOtroApoyo;

        }


        asignarValor(
            "otroApoyo",
            expediente.otro_apoyo
        );


        /*==================================================
                CONTACTO DE EMERGENCIA
        ==================================================*/

        asignarValor(
            "nombreContacto",
            expediente.nombre_contacto
        );


        asignarValor(
            "telefonoContacto",
            expediente.telefono_contacto
        );


        /*==================================================
                    OBSERVACIONES
        ==================================================*/

        asignarValor(
            "observaciones",
            expediente.observaciones
        );


        /*==================================================
            ESTADO DE VERIFICACIÓN MÉDICA
        ==================================================*/

        pintarEstadoExpediente(
            expediente.verificado
        );


        /*==================================================
                ACTUALIZAR ESTADO VISUAL
        ==================================================*/

        actualizarSeccionesDiscapacidad();

        actualizarCampoOtroApoyo();


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


                /*==================================================
                    SI DEJÓ DE SER CONDUCTOR
                ==================================================*/

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
            APROBAR EXPEDIENTE MÉDICO
    ==================================================*/

    btnAprobarExpediente?.addEventListener(
        "click",
        async function () {

            const confirmar =
                window.confirm(
                    "¿Deseas aprobar este expediente médico?"
                );


            if (!confirmar) {

                return;

            }


            /*==================================================
                    ESTADO VISUAL DEL BOTÓN
            ==================================================*/

            btnAprobarExpediente.disabled =
                true;


            btnAprobarExpediente.innerHTML = `
                <i
                    class="
                        fa-solid
                        fa-spinner
                        fa-spin
                    "
                ></i>

                Aprobando expediente...
            `;


            try {

                /*==================================================
                        PETICIÓN AL BACKEND
                ==================================================*/

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
                                JSON.stringify({

                                    verificado:
                                        true

                                }),

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
                            "No se pudo aprobar "
                            + "el expediente médico."
                        )

                    );

                }


                /*==================================================
                        ACTUALIZAR INTERFAZ
                ==================================================*/

                pintarEstadoExpediente(
                    true
                );


                expedienteCargado =
                    false;


                alert(

                    datos.mensaje
                    || (
                        "Expediente médico "
                        + "aprobado correctamente."
                    )

                );


            } catch (error) {

                console.error(

                    "Error al aprobar expediente médico:",

                    error

                );


                alert(

                    normalizarError(
                        error
                    )

                );


                btnAprobarExpediente.disabled =
                    false;


                btnAprobarExpediente.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    Aprobar expediente
                `;

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


            /*==================================================
                    COMPROBAR DISCAPACIDAD
            ==================================================*/

            const tieneDiscapacidad =
                obtenerRadioBooleano(
                    "discapacidad"
                );


            /*==================================================
                    CONSTRUIR PAYLOAD
            ==================================================*/

            const payload = {


                /*==============================================
                        DISCAPACIDAD
                ==============================================*/

                discapacidad:
                    tieneDiscapacidad,


                /*==============================================
                    INFORMACIÓN GENERAL
                ==============================================*/

                tipo_sangre:
                    document
                        .getElementById(
                            "tipoSangre"
                        )
                        ?.value
                    || "",


                /*==============================================
                    TIPO DE DISCAPACIDAD
                ==============================================*/

                tipo_discapacidad:
                    tieneDiscapacidad
                        ? (
                            document
                                .getElementById(
                                    "tipoDiscapacidad"
                                )
                                ?.value
                            || ""
                        )
                        : "",


                /*==============================================
                    VEHÍCULO ADAPTADO
                ==============================================*/

                vehiculo_adaptado:
                    tieneDiscapacidad
                        ? obtenerRadioBooleano(
                            "vehiculo_adaptado"
                        )
                        : false,


                /*==============================================
                    CUIDADOS ESPECIALES
                ==============================================*/

                cuidados_especiales:
                    tieneDiscapacidad
                        ? obtenerRadioBooleano(
                            "cuidados_especiales"
                        )
                        : false,


                /*==============================================
                            BASTÓN
                ==============================================*/

                usa_baston:
                    tieneDiscapacidad
                        ? obtenerCheckbox(
                            "usaBaston"
                        )
                        : false,


                /*==============================================
                        PERRO GUÍA
                ==============================================*/

                usa_perro_guia:
                    tieneDiscapacidad
                        ? obtenerCheckbox(
                            "usaPerroGuia"
                        )
                        : false,


                /*==============================================
                    SILLA DE RUEDAS
                ==============================================*/

                usa_silla_ruedas:
                    tieneDiscapacidad
                        ? obtenerCheckbox(
                            "usaSillaRuedas"
                        )
                        : false,


                /*==============================================
                        ANDADERA
                ==============================================*/

                usa_andadera:
                    tieneDiscapacidad
                        ? obtenerCheckbox(
                            "usaAndadera"
                        )
                        : false,


                /*==============================================
                        MULETAS
                ==============================================*/

                usa_muletas:
                    tieneDiscapacidad
                        ? obtenerCheckbox(
                            "usaMuletas"
                        )
                        : false,


                /*==============================================
                        PRÓTESIS
                ==============================================*/

                usa_protesis:
                    tieneDiscapacidad
                        ? obtenerCheckbox(
                            "usaProtesis"
                        )
                        : false,


                /*==============================================
                        OTRO APOYO
                ==============================================*/

                otro_apoyo:
                    (
                        tieneDiscapacidad
                        && usaOtroApoyo?.checked
                    )
                        ? (
                            otroApoyo
                                ?.value
                                .trim()
                            || ""
                        )
                        : "",


                /*==============================================
                CONTACTO DE EMERGENCIA
                ==============================================*/

                nombre_contacto:
                    document
                        .getElementById(
                            "nombreContacto"
                        )
                        ?.value
                        .trim()
                    || "",


                telefono_contacto:
                    document
                        .getElementById(
                            "telefonoContacto"
                        )
                        ?.value
                        .trim()
                    || "",


                /*==============================================
                        OBSERVACIONES
                ==============================================*/

                observaciones:
                    document
                        .getElementById(
                            "observaciones"
                        )
                        ?.value
                        .trim()
                    || "",

            };


            /*==================================================
                    CAMBIAR ESTADO DEL BOTÓN
            ==================================================*/

            cambiarEstadoBoton(
                btnGuardarExpediente,
                true,
                "Guardar expediente",
                "Guardando expediente..."
            );


            try {

                /*==================================================
                        ENVIAR DATOS AL BACKEND
                ==================================================*/

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


                /*==================================================
                        DATOS GUARDADOS
                ==================================================*/

                expedienteCargado =
                    true;


                alert(

                    datos.mensaje
                    || (
                        "Expediente médico "
                        + "guardado correctamente."
                    )

                );


                /*==================================================
                        RECARGAR DESDE LA BD
                ==================================================*/

                await cargarDatosMedicos(
                    true
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

                /*==================================================
                        RESTAURAR BOTÓN
                ==================================================*/

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

                /*==================================================
                        CARGAR INFORMACIÓN
                ==================================================*/

                await cargarUsuario();


                /*==================================================
                    ABRIR PESTAÑA CORRESPONDIENTE
                ==================================================*/

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