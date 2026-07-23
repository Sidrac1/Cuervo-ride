/*=====================================
        CUERVO RIDE - ADMIN PANEL
=====================================*/

document.addEventListener("DOMContentLoaded", () => {

    iniciarMenu();

    const logo = document.getElementById("btnInicio");

    if (logo) {

        logo.addEventListener("click", () => {

            cargarVista("inicio");

        });

    }

    cargarVista("inicio");

});


/*=====================================
        INICIAR MENÚ
=====================================*/

function iniciarMenu() {

    const botones =
        document.querySelectorAll(".menu-btn");


    botones.forEach((boton) => {

        boton.addEventListener("click", () => {

            botones.forEach((btn) => {

                btn.classList.remove("active");

            });


            boton.classList.add("active");


            const vista =
                boton.dataset.view;


            if (vista) {

                cargarVista(vista);

            }

        });

    });

}


/*=====================================
        CARGAR CSS DE LA VISTA
=====================================*/

function cargarCSS(nombreVista) {

    const enlaceCSS =
        document.getElementById("vista-css");

    if (!enlaceCSS) {

        console.error(
            "No existe el elemento <link id='vista-css'>"
        );

        return;

    }

    const staticURL =
        APP_CONFIG.STATIC_URL.endsWith("/")

            ? APP_CONFIG.STATIC_URL

            : `${APP_CONFIG.STATIC_URL}/`;


    enlaceCSS.href =

        `${staticURL}css/adminCSS/${nombreVista}.css?v=${Date.now()}`;


    enlaceCSS.onload = () => {

        console.log(
            `CSS cargado: ${enlaceCSS.href}`
        );

    };


    enlaceCSS.onerror = () => {

        console.error(
            `No se pudo cargar el CSS: ${enlaceCSS.href}`
        );

    };

}


/*=====================================
        CARGAR VISTA
=====================================*/

async function cargarVista(vista) {

    const contenido =
        document.getElementById("contenido");


    if (!contenido) {

        console.error(

            'No se encontró el contenedor con id="contenido".'

        );

        return;

    }


    if (typeof APP_CONFIG === "undefined") {

        console.error(

            "APP_CONFIG no está definido."

        );

        return;

    }


    try {

        contenido.style.opacity = "0";


        cargarCSS(vista);


        const url =

            `${APP_CONFIG.PANEL_URL}${vista}/`;


        const response = await fetch(url, {

            method: "GET",

            headers: {

                "X-Requested-With":
                    "XMLHttpRequest"

            }

        });


        if (!response.ok) {

            throw new Error(

                `Error HTTP ${response.status}`

            );

        }


        const html =
            await response.text();


        contenido.innerHTML = html;


        iniciarEventosVista(vista);


        requestAnimationFrame(() => {

            contenido.style.opacity = "1";

        });

    }

    catch (error) {

        console.error(

            "No se pudo cargar la vista:",

            error

        );


        contenido.innerHTML = `

            <div class="mensaje error">

                No fue posible cargar esta sección.

            </div>

        `;


        contenido.style.opacity = "1";

    }

}


/*=====================================
        EVENTOS DE CADA VISTA
=====================================*/

function iniciarEventosVista(vista) {

    switch (vista) {

        case "inicio":

            iniciarInicio();

            break;


        case "usuarios":

            iniciarUsuarios();

            break;


        case "usuario-info":

            iniciarUsuarioInfo();

            break;


        case "expediente":

            iniciarExpediente();

            break;


        case "rides":

            iniciarRides();

            break;


        case "alertas":

            iniciarAlertas();

            break;


        case "puntuacion":

            iniciarPuntuacion();

            break;


        default:

            console.warn(

                `No existen eventos configurados para: ${vista}`

            );

    }

}


/*=====================================
        FUNCIONES AUXILIARES
=====================================*/

function obtenerUsuarioSeleccionado() {

    try {

        return JSON.parse(

            sessionStorage.getItem("usuario")

        );

    }

    catch (error) {

        console.error(

            "No se pudo leer el usuario seleccionado:",

            error

        );

        return null;

    }

}


function guardarUsuarioSeleccionado(usuario) {

    sessionStorage.setItem(

        "usuario",

        JSON.stringify(usuario)

    );

}


function obtenerElemento(id) {

    return document.getElementById(id);

}


function asignarValor(id, valor = "") {

    const elemento =
        obtenerElemento(id);


    if (elemento) {

        elemento.value =
            valor ?? "";

    }

}


function asignarTexto(id, texto = "") {

    const elemento =
        obtenerElemento(id);


    if (elemento) {

        elemento.textContent =
            texto ?? "";

    }

}


function asignarCheckbox(selector, valor) {

    const checkbox =
        document.querySelector(selector);


    if (checkbox) {

        checkbox.checked =
            Boolean(valor);

    }

}


function marcarRadio(nombre, valor) {

    const radio =
        document.querySelector(

            `input[name="${nombre}"][value="${valor}"]`

        );


    if (radio) {

        radio.checked = true;

    }

}


function obtenerRadio(
    nombre,
    valorPredeterminado = "no"
) {

    const seleccionado =
        document.querySelector(

            `input[name="${nombre}"]:checked`

        );


    return seleccionado

        ? seleccionado.value

        : valorPredeterminado;

}


/*=====================================
        CONVERTIR VALOR A BOOLEANO
=====================================*/

function convertirBooleano(valor) {

    return (

        valor === true ||

        valor === "true" ||

        valor === "1" ||

        valor === 1

    );

}


/*=====================================
        VALOR DE DATASET
=====================================*/

function obtenerDatoFila(
    fila,
    nombre,
    valorPredeterminado = ""
) {

    if (!fila) {

        return valorPredeterminado;

    }


    const valor =
        fila.dataset[nombre];


    return valor !== undefined

        ? valor

        : valorPredeterminado;

}

/*=====================================
                INICIO
=====================================*/

function iniciarInicio() {

    document
        .querySelectorAll(".menu-btn")
        .forEach((btn) => {

            btn.classList.remove("active");

        });


    asignarTexto(
        "totalUsuarios",
        "5"
    );


    asignarTexto(
        "totalRides",
        "1"
    );


    asignarTexto(
        "totalAlertas",
        "4"
    );


    asignarTexto(
        "promedio",
        "4.7"
    );

}


/*=====================================
                USUARIOS
=====================================*/

function iniciarUsuarios() {

    const botonesEditar =
        document.querySelectorAll(".editar-btn");


    botonesEditar.forEach((boton) => {

        boton.addEventListener("click", () => {

            const fila =
                boton.closest("tr");


            if (!fila) {

                return;

            }


            const celdas =
                fila.children;


            const badge =
                fila.querySelector(".badge");


            const estado =
                fila.querySelector(".estado");


            const usuario = {

                id:
                    obtenerDatoFila(
                        fila,
                        "usuarioId",
                        celdas[0]?.textContent.trim() || ""
                    ),

                foto:
                    obtenerDatoFila(
                        fila,
                        "foto",
                        `${APP_CONFIG.STATIC_URL}img/profileIcon.png`
                    ),

                nombre:
                    obtenerDatoFila(
                        fila,
                        "nombre",
                        celdas[1]?.textContent.trim() || ""
                    ),

                email:
                    obtenerDatoFila(
                        fila,
                        "email",
                        celdas[2]?.textContent.trim() || ""
                    ),

                matricula:
                    obtenerDatoFila(
                        fila,
                        "matricula",
                        ""
                    ),

                carrera:
                    obtenerDatoFila(
                        fila,
                        "carrera",
                        ""
                    ),

                telefono:
                    obtenerDatoFila(
                        fila,
                        "telefono",
                        ""
                    ),

                rol:
                    obtenerDatoFila(
                        fila,
                        "rol",
                        badge?.textContent.trim().toLowerCase() || ""
                    ),

                estado:
                    obtenerDatoFila(
                        fila,
                        "estado",
                        estado?.textContent.trim().toLowerCase() || "activo"
                    ),

                is_staff:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "isStaff",
                            "false"
                        )
                    ),


                /*=================================
                    INFORMACIÓN MÉDICA
                =================================*/

                tipo_sangre:
                    obtenerDatoFila(
                        fila,
                        "tipoSangre",
                        ""
                    ),

                discapacidad:
                    obtenerDatoFila(
                        fila,
                        "discapacidad",
                        "no"
                    ),

                tipo_discapacidad:
                    obtenerDatoFila(
                        fila,
                        "tipoDiscapacidad",
                        ""
                    ),

                vehiculo_adaptado:
                    obtenerDatoFila(
                        fila,
                        "vehiculoAdaptado",
                        "no"
                    ),

                cuidados_especiales:
                    obtenerDatoFila(
                        fila,
                        "cuidadosEspeciales",
                        "no"
                    ),

                usa_baston:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "usaBaston",
                            "false"
                        )
                    ),

                usa_perro_guia:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "usaPerroGuia",
                            "false"
                        )
                    ),

                usa_silla_ruedas:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "usaSillaRuedas",
                            "false"
                        )
                    ),

                usa_andadera:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "usaAndadera",
                            "false"
                        )
                    ),

                usa_muletas:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "usaMuletas",
                            "false"
                        )
                    ),

                usa_protesis:
                    convertirBooleano(
                        obtenerDatoFila(
                            fila,
                            "usaProtesis",
                            "false"
                        )
                    ),

                otro_apoyo:
                    obtenerDatoFila(
                        fila,
                        "otroApoyo",
                        ""
                    ),

                nombre_contacto:
                    obtenerDatoFila(
                        fila,
                        "nombreContacto",
                        ""
                    ),

                telefono_contacto:
                    obtenerDatoFila(
                        fila,
                        "telefonoContacto",
                        ""
                    ),

                observaciones:
                    obtenerDatoFila(
                        fila,
                        "observaciones",
                        ""
                    ),

                verificado:
                    obtenerDatoFila(
                        fila,
                        "verificado",
                        "no"
                    )

            };


            guardarUsuarioSeleccionado(usuario);


            cargarVista("usuario-info");

        });

    });


    const btnFiltrar =
        obtenerElemento("btnFiltrar");


    const buscador =
        obtenerElemento("buscarUsuario");


    const filtroRol =
        obtenerElemento("filtroRol");


    const filtroEstado =
        obtenerElemento("filtroEstado");


    btnFiltrar?.addEventListener(
        "click",
        filtrarUsuarios
    );


    buscador?.addEventListener(
        "input",
        filtrarUsuarios
    );


    filtroRol?.addEventListener(
        "change",
        filtrarUsuarios
    );


    filtroEstado?.addEventListener(
        "change",
        filtrarUsuarios
    );

}


/*=====================================
            FILTRAR USUARIOS
=====================================*/

function filtrarUsuarios() {

    const buscador =
        obtenerElemento("buscarUsuario");


    const filtroRol =
        obtenerElemento("filtroRol");


    const filtroEstado =
        obtenerElemento("filtroEstado");


    if (
        !buscador ||
        !filtroRol ||
        !filtroEstado
    ) {

        return;

    }


    const texto =
        buscador.value
            .toLowerCase()
            .trim();


    const rol =
        filtroRol.value
            .toLowerCase();


    const estado =
        filtroEstado.value
            .toLowerCase();


    const filas =
        document.querySelectorAll(
            "#tablaUsuarios tr"
        );


    let visibles = 0;


    filas.forEach((fila) => {

        if (fila.id === "sinResultados") {

            return;

        }


        const nombre =
            (
                obtenerDatoFila(
                    fila,
                    "nombre",
                    fila.children[1]?.textContent || ""
                )
            )
            .toLowerCase()
            .trim();


        const email =
            (
                obtenerDatoFila(
                    fila,
                    "email",
                    fila.children[2]?.textContent || ""
                )
            )
            .toLowerCase()
            .trim();


        const matricula =
            (
                obtenerDatoFila(
                    fila,
                    "matricula",
                    ""
                )
            )
            .toLowerCase()
            .trim();


        const rolUsuario =
            (
                obtenerDatoFila(
                    fila,
                    "rol",
                    fila.querySelector(".badge")
                        ?.textContent || ""
                )
            )
            .toLowerCase()
            .trim();


        const estadoUsuario =
            (
                obtenerDatoFila(
                    fila,
                    "estado",
                    fila.querySelector(".estado")
                        ?.textContent || ""
                )
            )
            .toLowerCase()
            .trim();


        const coincideBusqueda =

            nombre.includes(texto) ||

            email.includes(texto) ||

            matricula.includes(texto);


        const coincideRol =

            rol === "todos" ||

            rol === "" ||

            rolUsuario === rol;


        const coincideEstado =

            estado === "todos" ||

            estado === "" ||

            estadoUsuario === estado;


        const coincide =

            coincideBusqueda &&

            coincideRol &&

            coincideEstado;


        fila.style.display =
            coincide ? "" : "none";


        if (coincide) {

            visibles++;

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

    const contador =
        document.querySelector(
            ".footer-tabla p"
        );


    if (!contador) {

        return;

    }


    const total =
        document.querySelectorAll(
            "#tablaUsuarios tr:not(#sinResultados)"
        ).length;


    contador.textContent =

        `Mostrando ${visibles} de ${total} usuarios`;

}


/*=====================================
        MOSTRAR SIN RESULTADOS
=====================================*/

function mostrarSinResultados() {

    const tbody =
        obtenerElemento("tablaUsuarios");


    if (!tbody) {

        return;

    }


    let mensaje =
        obtenerElemento("sinResultados");


    if (!mensaje) {

        mensaje =
            document.createElement("tr");


        mensaje.id =
            "sinResultados";


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
        OCULTAR SIN RESULTADOS
=====================================*/

function ocultarSinResultados() {

    const mensaje =
        obtenerElemento("sinResultados");


    if (mensaje) {

        mensaje.style.display = "none";

    }

}

/*=====================================
        INFORMACIÓN GENERAL
=====================================*/

function iniciarUsuarioInfo() {

    const usuario =
        obtenerUsuarioSeleccionado();


    if (!usuario) {

        alert(

            "No se encontró información del usuario."

        );

        cargarVista("usuarios");

        return;

    }


    /*=====================================
            FOTO DEL USUARIO
    =====================================*/

    const foto =
        obtenerElemento("fotoUsuario");


    if (foto) {

        foto.src =

            usuario.foto ||

            `${APP_CONFIG.STATIC_URL}img/profileIcon.png`;


        foto.onerror = () => {

            foto.src =
                `${APP_CONFIG.STATIC_URL}img/profileIcon.png`;

        };

    }


    /*=====================================
            TÍTULO LATERAL
    =====================================*/

    asignarTexto(

        "nombreTitulo",

        usuario.nombre

    );


    /*=====================================
            LLENAR FORMULARIO
    =====================================*/

    asignarValor(

        "adminNombre",

        usuario.nombre

    );


    asignarValor(

        "adminEmail",

        usuario.email

    );


    asignarValor(

        "adminMatricula",

        usuario.matricula

    );


    asignarValor(

        "adminCarrera",

        usuario.carrera

    );


    asignarValor(

        "adminTelefono",

        usuario.telefono

    );


    asignarValor(

        "adminRol",

        usuario.rol

    );


    asignarValor(

        "adminEstado",

        usuario.estado

    );


    const staff =
        obtenerElemento("adminStaff");


    if (staff) {

        staff.value =

            usuario.is_staff

            ? "true"

            : "false";

    }


    /*=====================================
        CONTRASEÑA VACÍA SIEMPRE
    =====================================*/

    asignarValor(

        "adminPassword",

        ""

    );


    /*=====================================
            BOTÓN REGRESAR
    =====================================*/

    obtenerElemento("volver")
        ?.addEventListener(

            "click",

            () => {

                cargarVista("usuarios");

            }

        );


    /*=====================================
        BOTÓN EXPEDIENTE MÉDICO
    =====================================*/

    obtenerElemento("btnMedico")
        ?.addEventListener(

            "click",

            () => {

                cargarVista("expediente");

            }

        );


    /*=====================================
        BOTÓN GENERAL ACTIVO
    =====================================*/

    obtenerElemento("btnGeneral")
        ?.classList.add("active");


    /*=====================================
            GUARDAR FORMULARIO
    =====================================*/

    const formulario =
        obtenerElemento("formGeneral");


    formulario?.addEventListener(

        "submit",

        (evento) => {

            evento.preventDefault();


            usuario.nombre =

                obtenerElemento(
                    "adminNombre"
                ).value.trim();


            usuario.email =

                obtenerElemento(
                    "adminEmail"
                ).value.trim();


            usuario.matricula =

                obtenerElemento(
                    "adminMatricula"
                ).value.trim();


            usuario.carrera =

                obtenerElemento(
                    "adminCarrera"
                ).value.trim();


            usuario.telefono =

                obtenerElemento(
                    "adminTelefono"
                ).value.trim();


            usuario.rol =

                obtenerElemento(
                    "adminRol"
                ).value;


            usuario.estado =

                obtenerElemento(
                    "adminEstado"
                ).value;


            usuario.is_staff =

                obtenerElemento(
                    "adminStaff"
                ).value === "true";


            const password =

                obtenerElemento(
                    "adminPassword"
                ).value.trim();


            guardarUsuarioSeleccionado(

                usuario

            );


            /*=================================
                ACTUALIZAR NOMBRE
            =================================*/

            asignarTexto(

                "nombreTitulo",

                usuario.nombre

            );


            /*=================================
                PASSWORD
            =================================*/

            if (password !== "") {

                console.log(

                    "Nueva contraseña lista para enviarse."

                );

            }


            alert(

                "Información general guardada correctamente."

            );

        }

    );

}

/*=====================================
        EXPEDIENTE MÉDICO
=====================================*/

function iniciarExpediente() {

    const usuario =
        obtenerUsuarioSeleccionado();


    if (!usuario) {

        alert(
            "No se encontró información del usuario."
        );

        cargarVista("usuarios");

        return;

    }


    /*=====================================
            FOTO DEL USUARIO
    =====================================*/

    const foto =
        obtenerElemento("fotoUsuario");


    if (foto) {

        foto.src =

            usuario.foto ||

            `${APP_CONFIG.STATIC_URL}img/profileIcon.png`;


        foto.onerror = () => {

            foto.src =
                `${APP_CONFIG.STATIC_URL}img/profileIcon.png`;

        };

    }


    /*=====================================
            NOMBRE DEL USUARIO
    =====================================*/

    asignarTexto(

        "nombreTitulo",

        usuario.nombre

    );


    /*=====================================
            MATRÍCULA
    =====================================*/

    const matriculaUsuario =

        document.querySelector(
            ".matricula-usuario"
        );


    if (matriculaUsuario) {

        matriculaUsuario.textContent =

            usuario.matricula ||

            "Sin matrícula";

    }


    /*=====================================
            DATOS MÉDICOS
    =====================================*/

    asignarValor(

        "tipoSangre",

        usuario.tipo_sangre

    );


    asignarValor(

        "tipoDiscapacidad",

        usuario.tipo_discapacidad

    );


    asignarValor(

        "contacto",

        usuario.nombre_contacto

    );


    asignarValor(

        "telefonoEmergencia",

        usuario.telefono_contacto

    );


    asignarValor(

        "observaciones",

        usuario.observaciones

    );


    asignarValor(

        "otroApoyo",

        usuario.otro_apoyo

    );


    /*=====================================
                RADIOS
    =====================================*/

    marcarRadio(

        "discapacidad",

        usuario.discapacidad || "no"

    );


    marcarRadio(

        "vehiculo_adaptado",

        usuario.vehiculo_adaptado || "no"

    );


    marcarRadio(

        "cuidados_especiales",

        usuario.cuidados_especiales || "no"

    );


    marcarRadio(

        "verificado",

        usuario.verificado || "no"

    );


    /*=====================================
            CHECKBOXES DE APOYO
    =====================================*/

    asignarCheckbox(

        'input[name="usa_baston"]',

        usuario.usa_baston

    );


    asignarCheckbox(

        'input[name="usa_perro_guia"]',

        usuario.usa_perro_guia

    );


    asignarCheckbox(

        'input[name="usa_silla_ruedas"]',

        usuario.usa_silla_ruedas

    );


    asignarCheckbox(

        'input[name="usa_andadera"]',

        usuario.usa_andadera

    );


    asignarCheckbox(

        'input[name="usa_muletas"]',

        usuario.usa_muletas

    );


    asignarCheckbox(

        'input[name="usa_protesis"]',

        usuario.usa_protesis

    );


    /*=====================================
            CHECKBOX OTRO APOYO
    =====================================*/

    const checkOtroApoyo =
        obtenerElemento("usaOtroApoyo");


    if (checkOtroApoyo) {

        checkOtroApoyo.checked =

            Boolean(
                usuario.otro_apoyo
            );

    }


    /*=====================================
        EVENTOS DE DISCAPACIDAD
    =====================================*/

    document
        .querySelectorAll(
            'input[name="discapacidad"]'
        )
        .forEach((radio) => {

            radio.addEventListener(

                "change",

                actualizarCamposDiscapacidad

            );

        });


    /*=====================================
        EVENTO OTRO APOYO
    =====================================*/

    checkOtroApoyo?.addEventListener(

        "change",

        actualizarCampoOtroApoyo

    );


    /*=====================================
        EVENTO DE VERIFICACIÓN
    =====================================*/

    document
        .querySelectorAll(
            'input[name="verificado"]'
        )
        .forEach((radio) => {

            radio.addEventListener(

                "change",

                actualizarEstadoVisualExpediente

            );

        });


    /*=====================================
        ESTADO INICIAL DE CAMPOS
    =====================================*/

    actualizarCamposDiscapacidad();

    actualizarCampoOtroApoyo();

    actualizarEstadoVisualExpediente();


    /*=====================================
        BOTÓN INFORMACIÓN GENERAL
    =====================================*/

    obtenerElemento("btnGeneral")
        ?.addEventListener(

            "click",

            () => {

                cargarVista("usuario-info");

            }

        );


    /*=====================================
            BOTÓN MÉDICO ACTIVO
    =====================================*/

    obtenerElemento("btnMedico")
        ?.classList.add("active");


    /*=====================================
            BOTÓN REGRESAR
    =====================================*/

    obtenerElemento("volver")
        ?.addEventListener(

            "click",

            () => {

                cargarVista("usuarios");

            }

        );


    /*=====================================
        GUARDAR EXPEDIENTE MÉDICO
    =====================================*/

    const formulario =
        obtenerElemento("formMedico");


    formulario?.addEventListener(

        "submit",

        (evento) => {

            evento.preventDefault();


            usuario.tipo_sangre =

                obtenerElemento("tipoSangre")
                    ?.value

                || "";


            usuario.discapacidad =

                obtenerRadio(
                    "discapacidad"
                );


            usuario.tipo_discapacidad =

                obtenerElemento("tipoDiscapacidad")
                    ?.value
                    .trim()

                || "";


            usuario.vehiculo_adaptado =

                obtenerRadio(
                    "vehiculo_adaptado"
                );


            usuario.cuidados_especiales =

                obtenerRadio(
                    "cuidados_especiales"
                );


            usuario.usa_baston =

                document.querySelector(
                    'input[name="usa_baston"]'
                )?.checked

                || false;


            usuario.usa_perro_guia =

                document.querySelector(
                    'input[name="usa_perro_guia"]'
                )?.checked

                || false;


            usuario.usa_silla_ruedas =

                document.querySelector(
                    'input[name="usa_silla_ruedas"]'
                )?.checked

                || false;


            usuario.usa_andadera =

                document.querySelector(
                    'input[name="usa_andadera"]'
                )?.checked

                || false;


            usuario.usa_muletas =

                document.querySelector(
                    'input[name="usa_muletas"]'
                )?.checked

                || false;


            usuario.usa_protesis =

                document.querySelector(
                    'input[name="usa_protesis"]'
                )?.checked

                || false;


            usuario.otro_apoyo =

                checkOtroApoyo?.checked

                ? obtenerElemento("otroApoyo")
                    ?.value
                    .trim()

                    || ""

                : "";


            usuario.nombre_contacto =

                obtenerElemento("contacto")
                    ?.value
                    .trim()

                || "";


            usuario.telefono_contacto =

                obtenerElemento("telefonoEmergencia")
                    ?.value
                    .trim()

                || "";


            usuario.observaciones =

                obtenerElemento("observaciones")
                    ?.value
                    .trim()

                || "";


            usuario.verificado =

                obtenerRadio(
                    "verificado"
                );


            /*=================================
                LIMPIAR DATOS SI NO TIENE
                DISCAPACIDAD
            =================================*/

            if (
                usuario.discapacidad === "no"
            ) {

                usuario.tipo_discapacidad = "";

                usuario.vehiculo_adaptado = "no";

                usuario.cuidados_especiales = "no";

                usuario.usa_baston = false;

                usuario.usa_perro_guia = false;

                usuario.usa_silla_ruedas = false;

                usuario.usa_andadera = false;

                usuario.usa_muletas = false;

                usuario.usa_protesis = false;

                usuario.otro_apoyo = "";

            }


            guardarUsuarioSeleccionado(
                usuario
            );


            alert(

                "Información médica guardada correctamente."

            );

        }

    );

}


/*=====================================
    ACTUALIZAR CAMPOS DISCAPACIDAD
=====================================*/

function actualizarCamposDiscapacidad() {

    const tieneDiscapacidad =

        obtenerRadio(
            "discapacidad"
        ) === "si";


    const idsCampos = [

        "tipoDiscapacidad",

        "vehiculoAdaptadoSi",
        "vehiculoAdaptadoNo",

        "cuidadosEspecialesSi",
        "cuidadosEspecialesNo",

        "usaBaston",
        "usaPerroGuia",
        "usaSillaRuedas",
        "usaAndadera",
        "usaMuletas",
        "usaProtesis",
        "usaOtroApoyo"

    ];


    idsCampos.forEach((id) => {

        const elemento =
            obtenerElemento(id);


        if (elemento) {

            elemento.disabled =
                !tieneDiscapacidad;

        }

    });


    const contenedores = [

        "campoTipoDiscapacidad",

        "campoVehiculoAdaptado",

        "campoCuidadosEspeciales",

        "campoApoyos"

    ];


    contenedores.forEach((id) => {

        const contenedor =
            obtenerElemento(id);


        if (contenedor) {

            contenedor.style.opacity =

                tieneDiscapacidad

                ? "1"

                : ".5";

        }

    });


    if (!tieneDiscapacidad) {

        asignarValor(

            "tipoDiscapacidad",

            ""

        );


        marcarRadio(

            "vehiculo_adaptado",

            "no"

        );


        marcarRadio(

            "cuidados_especiales",

            "no"

        );


        document
            .querySelectorAll(
                '#campoApoyos input[type="checkbox"]'
            )
            .forEach((checkbox) => {

                checkbox.checked = false;

            });

    }


    actualizarCampoOtroApoyo();

}


/*=====================================
            OTRO APOYO
=====================================*/

function actualizarCampoOtroApoyo() {

    const checkOtroApoyo =
        obtenerElemento("usaOtroApoyo");


    const campoOtroApoyo =
        obtenerElemento("campoOtroApoyo");


    const inputOtroApoyo =
        obtenerElemento("otroApoyo");


    if (
        !checkOtroApoyo ||
        !campoOtroApoyo ||
        !inputOtroApoyo
    ) {

        return;

    }


    const tieneDiscapacidad =

        obtenerRadio(
            "discapacidad"
        ) === "si";


    const mostrar =

        tieneDiscapacidad &&

        checkOtroApoyo.checked;


    campoOtroApoyo.classList.toggle(

        "oculto",

        !mostrar

    );


    inputOtroApoyo.disabled =
        !mostrar;


    if (!mostrar) {

        inputOtroApoyo.value = "";

    }

}


/*=====================================
        ESTADO DEL EXPEDIENTE
=====================================*/

function actualizarEstadoVisualExpediente() {

    const estado =

        document.querySelector(
            ".estado-expediente"
        );


    if (!estado) {

        return;

    }


    const verificado =

        obtenerRadio(
            "verificado"
        ) === "si";


    estado.classList.toggle(

        "verificado",

        verificado

    );


    estado.classList.toggle(

        "pendiente",

        !verificado

    );


    if (verificado) {

        estado.innerHTML = `

            <i class="fa-solid fa-circle-check"></i>

            Verificado

        `;

    }

    else {

        estado.innerHTML = `

            <i class="fa-solid fa-clock"></i>

            Pendiente

        `;

    }

}

/*=====================================
                RIDES
=====================================*/

function iniciarRides() {

    console.log(
        "Vista Rides cargada"
    );


    if (
        obtenerElemento("filtroFecha") &&
        typeof flatpickr !== "undefined"
    ) {

        flatpickr(

            "#filtroFecha",

            {

                locale: "es",

                dateFormat: "Y-m-d",

                allowInput: false

            }

        );

    }


    obtenerElemento("btnFiltrar")
        ?.addEventListener(

            "click",

            filtrarRides

        );


    obtenerElemento("buscarRide")
        ?.addEventListener(

            "input",

            filtrarRides

        );


    obtenerElemento("filtroFecha")
        ?.addEventListener(

            "change",

            filtrarRides

        );


    obtenerElemento("filtroEstado")
        ?.addEventListener(

            "change",

            filtrarRides

        );

}


/*=====================================
            FILTRAR RIDES
=====================================*/

function filtrarRides() {

    const buscador =
        obtenerElemento("buscarRide");


    const fechaInput =
        obtenerElemento("filtroFecha");


    const estadoInput =
        obtenerElemento("filtroEstado");


    if (
        !buscador ||
        !fechaInput ||
        !estadoInput
    ) {

        return;

    }


    const texto =

        buscador.value
            .toLowerCase()
            .trim();


    const fecha =
        fechaInput.value;


    const estado =
        estadoInput.value
            .toLowerCase();


    const filas =

        document.querySelectorAll(
            "#tablaRides tr"
        );


    let visibles = 0;


    filas.forEach((fila) => {

        if (
            fila.id ===
            "sinResultadosRides"
        ) {

            return;

        }


        const id =

            fila.children[0]
                ?.textContent
                .toLowerCase()
                .trim()

            || "";


        const conductor =

            fila.children[1]
                ?.textContent
                .toLowerCase()
                .trim()

            || "";


        const ruta =

            fila.children[2]
                ?.textContent
                .toLowerCase()
                .trim()

            || "";


        const fechaRide =

            fila.dataset.fecha ||

            fila.children[5]
                ?.textContent
                .trim()

            || "";


        const estadoRide =

            (
                fila.dataset.estado ||

                fila.querySelector(".estado")
                    ?.textContent

                || ""
            )
            .toLowerCase()
            .trim();


        const coincideBusqueda =

            id.includes(texto) ||

            conductor.includes(texto) ||

            ruta.includes(texto);


        const coincideFecha =

            fecha === "" ||

            fechaRide === fecha;


        const coincideEstado =

            estado === "todos" ||

            estado === "" ||

            estadoRide === estado;


        const coincide =

            coincideBusqueda &&

            coincideFecha &&

            coincideEstado;


        fila.style.display =

            coincide

                ? ""

                : "none";


        if (coincide) {

            visibles++;

        }

    });


    if (visibles === 0) {

        mostrarSinResultadosRides();

    }

    else {

        ocultarSinResultadosRides();

    }


    actualizarContadorRides(
        visibles
    );

}


/*=====================================
        ACTUALIZAR CONTADOR RIDES
=====================================*/

function actualizarContadorRides(visibles) {

    const contador =

        document.querySelector(
            ".footer-tabla p"
        );


    if (!contador) {

        return;

    }


    const total =

        document.querySelectorAll(

            "#tablaRides tr:not(#sinResultadosRides)"

        ).length;


    contador.textContent =

        `Mostrando ${visibles} de ${total} rides`;

}


/*=====================================
        MOSTRAR SIN RESULTADOS RIDES
=====================================*/

function mostrarSinResultadosRides() {

    const tbody =
        obtenerElemento("tablaRides");


    if (!tbody) {

        return;

    }


    let mensaje =

        obtenerElemento(
            "sinResultadosRides"
        );


    if (!mensaje) {

        mensaje =
            document.createElement("tr");


        mensaje.id =
            "sinResultadosRides";


        mensaje.innerHTML = `

            <td colspan="7" style="

                text-align:center;

                padding:40px;

                color:#9aa8b8;

                font-size:16px;

            ">

                No se encontraron rides.

            </td>

        `;


        tbody.appendChild(
            mensaje
        );

    }


    mensaje.style.display = "";

}


/*=====================================
        OCULTAR SIN RESULTADOS RIDES
=====================================*/

function ocultarSinResultadosRides() {

    const mensaje =

        obtenerElemento(
            "sinResultadosRides"
        );


    if (mensaje) {

        mensaje.style.display = "none";

    }

}


/*=====================================
                ALERTAS
=====================================*/

function iniciarAlertas() {

    console.log(
        "Vista Alertas cargada"
    );


    obtenerElemento("btnFiltrar")
        ?.addEventListener(

            "click",

            filtrarAlertas

        );


    obtenerElemento("buscarAlerta")
        ?.addEventListener(

            "input",

            filtrarAlertas

        );


    obtenerElemento("filtroTipo")
        ?.addEventListener(

            "change",

            filtrarAlertas

        );


    obtenerElemento("filtroEstado")
        ?.addEventListener(

            "change",

            filtrarAlertas

        );

}


/*=====================================
            FILTRAR ALERTAS
=====================================*/

function filtrarAlertas() {

    const buscador =
        obtenerElemento("buscarAlerta");


    const tipoInput =
        obtenerElemento("filtroTipo");


    const estadoInput =
        obtenerElemento("filtroEstado");


    if (
        !buscador ||
        !tipoInput ||
        !estadoInput
    ) {

        return;

    }


    const texto =

        buscador.value
            .toLowerCase()
            .trim();


    const tipo =

        tipoInput.value
            .toLowerCase();


    const estado =

        estadoInput.value
            .toLowerCase();


    const filas =

        document.querySelectorAll(
            "#tablaAlertas tr"
        );


    let visibles = 0;


    filas.forEach((fila) => {

        if (
            fila.id ===
            "sinResultadosAlertas"
        ) {

            return;

        }


        const nombre =

            fila.children[1]
                ?.textContent
                .toLowerCase()
                .trim()

            || "";


        const alerta =

            fila.children[2]
                ?.textContent
                .toLowerCase()
                .trim()

            || "";


        const tipoAlerta =

            (
                fila.dataset.tipo ||

                fila.querySelector(".tipo")
                    ?.textContent

                || ""
            )
            .toLowerCase()
            .trim();


        const estadoAlerta =

            (
                fila.dataset.estado ||

                fila.querySelector(".estado")
                    ?.textContent

                || ""
            )
            .toLowerCase()
            .trim();


        const coincideBusqueda =

            nombre.includes(texto) ||

            alerta.includes(texto);


        const coincideTipo =

            tipo === "todos" ||

            tipo === "" ||

            tipoAlerta === tipo;


        const coincideEstado =

            estado === "todos" ||

            estado === "" ||

            estadoAlerta === estado;


        const coincide =

            coincideBusqueda &&

            coincideTipo &&

            coincideEstado;


        fila.style.display =

            coincide

                ? ""

                : "none";


        if (coincide) {

            visibles++;

        }

    });


    if (visibles === 0) {

        mostrarSinResultadosAlertas();

    }

    else {

        ocultarSinResultadosAlertas();

    }


    actualizarContadorAlertas(
        visibles
    );

}


/*=====================================
    ACTUALIZAR CONTADOR ALERTAS
=====================================*/

function actualizarContadorAlertas(
    visibles
) {

    const contador =

        document.querySelector(
            ".footer-tabla p"
        );


    if (!contador) {

        return;

    }


    const total =

        document.querySelectorAll(

            "#tablaAlertas tr:not(#sinResultadosAlertas)"

        ).length;


    contador.textContent =

        `Mostrando ${visibles} de ${total} alertas`;

}


/*=====================================
    MOSTRAR SIN RESULTADOS ALERTAS
=====================================*/

function mostrarSinResultadosAlertas() {

    const tbody =
        obtenerElemento("tablaAlertas");


    if (!tbody) {

        return;

    }


    let mensaje =

        obtenerElemento(
            "sinResultadosAlertas"
        );


    if (!mensaje) {

        mensaje =
            document.createElement("tr");


        mensaje.id =
            "sinResultadosAlertas";


        mensaje.innerHTML = `

            <td colspan="6" style="

                text-align:center;

                padding:40px;

                color:#9aa8b8;

                font-size:16px;

            ">

                No se encontraron alertas.

            </td>

        `;


        tbody.appendChild(
            mensaje
        );

    }


    mensaje.style.display = "";

}


/*=====================================
    OCULTAR SIN RESULTADOS ALERTAS
=====================================*/

function ocultarSinResultadosAlertas() {

    const mensaje =

        obtenerElemento(
            "sinResultadosAlertas"
        );


    if (mensaje) {

        mensaje.style.display = "none";

    }

}


/*=====================================
            PUNTUACIÓN
=====================================*/

function iniciarPuntuacion() {

    console.log(
        "Vista Puntuación cargada"
    );


    crearGraficaPuntuacion();

}


/*=====================================
        GRÁFICA PUNTUACIÓN
=====================================*/

function crearGraficaPuntuacion() {

    const canvas =

        obtenerElemento(
            "graficaCalificaciones"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    /*=================================
        EVITAR GRÁFICAS DUPLICADAS
    =================================*/

    if (window.graficaPuntuacion) {

        window.graficaPuntuacion.destroy();

    }


    const contexto =
        canvas.getContext("2d");


    window.graficaPuntuacion =

        new Chart(

            contexto,

            {

                type: "bar",


                data: {

                    labels: [

                        "1.0★",

                        "1.5★",

                        "2.0★",

                        "2.5★",

                        "3.0★",

                        "3.5★",

                        "4.0★",

                        "4.5★",

                        "5.0★"

                    ],


                    datasets: [

                        {

                            label:
                                "Viajes calificados",


                            data: [

                                0,

                                1,

                                1,

                                3,

                                5,

                                10,

                                20,

                                25,

                                35

                            ],


                            backgroundColor:
                                "#00e68a",


                            borderColor:
                                "#00e68a",


                            borderWidth:
                                1,


                            borderRadius:
                                3

                        }

                    ]

                },


                options: {

                    responsive: true,


                    maintainAspectRatio: false,


                    plugins: {

                        legend: {

                            display: false

                        }

                    },


                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#dce5ef",


                                font: {

                                    size: 13

                                }

                            },


                            grid: {

                                display: false

                            }

                        },


                        y: {

                            beginAtZero: true,


                            ticks: {

                                color:
                                    "#dce5ef"

                            },


                            grid: {

                                color:
                                    "rgba(255,255,255,.08)"

                            }

                        }

                    }

                }

            }

        );
}
