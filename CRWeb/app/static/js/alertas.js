/*==================================================
                ALERTAS.JS
        Panel administrativo de alertas
==================================================*/

(function () {

    "use strict";


    /*==================================================
            ESTADO INTERNO DEL MÓDULO
    ==================================================*/

    let controladorEventosAlertas = null;

    let botonAlertaActivo = null;

    let estadoOriginalAlerta = "";

    let alertaActualId = null;


    /*==================================================
            ICONOS DE LOS ESTADOS
    ==================================================*/

    const iconosEstadoAlerta = {

        activa:
            "fa-circle-exclamation",

        en_atencion:
            "fa-user-shield",

        resuelta:
            "fa-circle-check",

        falsa_alarma:
            "fa-circle-minus",

    };


    /*==================================================
            ETIQUETAS DE LOS ESTADOS
    ==================================================*/

    const etiquetasEstadoAlerta = {

        activa:
            "Activa",

        en_atencion:
            "En atención",

        resuelta:
            "Resuelta",

        falsa_alarma:
            "Falsa alarma",

    };


    /*==================================================
            FUNCIÓN AUXILIAR: OBTENER ELEMENTO
    ==================================================*/

    function obtenerElemento(id) {

        return document.getElementById(id);

    }


    /*==================================================
            FUNCIÓN AUXILIAR: TEXTO SEGURO
    ==================================================*/

    function textoSeguro(valor, reemplazo = "—") {

        if (
            valor === undefined
            || valor === null
            || String(valor).trim() === ""
        ) {

            return reemplazo;

        }

        return String(valor).trim();

    }


    /*==================================================
            FUNCIÓN AUXILIAR: ACTUALIZAR TEXTO
    ==================================================*/

    function actualizarTexto(
        elemento,
        valor,
        reemplazo = "—"
    ) {

        if (!elemento) {

            return;

        }

        elemento.textContent = textoSeguro(
            valor,
            reemplazo
        );

    }


    /*==================================================
            FUNCIÓN AUXILIAR: ENTERO
    ==================================================*/

    function obtenerEntero(elemento) {

        if (!elemento) {

            return 0;

        }

        const valor = Number.parseInt(
            elemento.textContent,
            10
        );

        return Number.isNaN(valor)
            ? 0
            : valor;

    }


    /*==================================================
            FUNCIÓN AUXILIAR: ASIGNAR ENTERO
    ==================================================*/

    function asignarEntero(
        elemento,
        valor
    ) {

        if (!elemento) {

            return;

        }

        elemento.textContent = Math.max(
            0,
            Number(valor) || 0
        );

    }


    /*==================================================
            OBTENER TOKEN CSRF
    ==================================================*/

    function obtenerCsrfToken(formulario) {

        if (!formulario) {

            return "";

        }

        const inputCsrf = formulario.querySelector(
            'input[name="csrfmiddlewaretoken"]'
        );

        return inputCsrf
            ? inputCsrf.value
            : "";

    }


    /*==================================================
            MOSTRAR ERROR EN EL MODAL
    ==================================================*/

    function mostrarErrorModal(mensaje) {

        const contenedorError = obtenerElemento(
            "errorAdministrarAlerta"
        );

        if (!contenedorError) {

            return;

        }

        const textoError = contenedorError.querySelector(
            "span"
        );

        if (textoError) {

            textoError.textContent = textoSeguro(
                mensaje,
                "No fue posible actualizar la alerta."
            );

        }

        contenedorError.hidden = false;

    }


    /*==================================================
            OCULTAR ERROR DEL MODAL
    ==================================================*/

    function ocultarErrorModal() {

        const contenedorError = obtenerElemento(
            "errorAdministrarAlerta"
        );

        if (!contenedorError) {

            return;

        }

        contenedorError.hidden = true;

    }


    /*==================================================
            CREAR TOAST
    ==================================================*/

    function mostrarToast(
        mensaje,
        tipo = "exito"
    ) {

        const contenedor = obtenerElemento(
            "alertasToastContenedor"
        );

        if (!contenedor) {

            console.log(mensaje);

            return;

        }

        const configuracion = {

            exito: {
                icono: "fa-circle-check",
                titulo: "Cambios guardados",
            },

            error: {
                icono: "fa-circle-exclamation",
                titulo: "Ocurrió un error",
            },

            advertencia: {
                icono: "fa-triangle-exclamation",
                titulo: "Atención",
            },

        };

        const datos = (
            configuracion[tipo]
            || configuracion.exito
        );

        const toast = document.createElement(
            "article"
        );

        toast.className = (
            `alerta-toast ${tipo}`
        );

        const icono = document.createElement(
            "i"
        );

        icono.className = (
            `fa-solid ${datos.icono}`
        );

        const contenido = document.createElement(
            "div"
        );

        const titulo = document.createElement(
            "strong"
        );

        titulo.textContent = datos.titulo;

        const descripcion = document.createElement(
            "p"
        );

        descripcion.textContent = textoSeguro(
            mensaje,
            "Operación completada."
        );

        contenido.appendChild(titulo);
        contenido.appendChild(descripcion);

        toast.appendChild(icono);
        toast.appendChild(contenido);

        contenedor.appendChild(toast);

        window.setTimeout(function () {

            toast.remove();

        }, 5200);

    }


    /*==================================================
            FILAS REALES DE ALERTAS
    ==================================================*/

    function obtenerFilasAlertas() {

        return Array.from(
            document.querySelectorAll(
                "#tablaAlertas .alerta-admin-fila"
            )
        );

    }


    /*==================================================
            NORMALIZAR TEXTO
    ==================================================*/

    function normalizarTexto(valor) {

        return String(valor || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .trim();

    }


    /*==================================================
            FILTRAR ALERTAS
    ==================================================*/

    function filtrarAlertas() {

        const buscador = obtenerElemento(
            "buscarAlerta"
        );

        const filtroTipo = obtenerElemento(
            "filtroTipo"
        );

        const filtroEstado = obtenerElemento(
            "filtroEstado"
        );

        const textoBusqueda = normalizarTexto(
            buscador
                ? buscador.value
                : ""
        );

        const tipoSeleccionado = (
            filtroTipo
                ? filtroTipo.value
                : "todos"
        );

        const estadoSeleccionado = (
            filtroEstado
                ? filtroEstado.value
                : "todos"
        );

        const filas = obtenerFilasAlertas();

        let cantidadVisibles = 0;

        filas.forEach(function (fila) {

            const textoFila = normalizarTexto(
                fila.textContent
            );

            const tipoFila = (
                fila.dataset.tipo
                || ""
            );

            const estadoFila = (
                fila.dataset.estado
                || ""
            );

            const coincideBusqueda = (
                textoBusqueda === ""
                || textoFila.includes(
                    textoBusqueda
                )
            );

            const coincideTipo = (
                tipoSeleccionado === "todos"
                || tipoFila === tipoSeleccionado
            );

            const coincideEstado = (
                estadoSeleccionado === "todos"
                || estadoFila === estadoSeleccionado
            );

            const visible = (
                coincideBusqueda
                && coincideTipo
                && coincideEstado
            );

            fila.hidden = !visible;

            if (visible) {

                cantidadVisibles += 1;

            }

        });

        actualizarContadorAlertas(
            cantidadVisibles,
            filas.length
        );

        actualizarMensajeSinResultados(
            cantidadVisibles,
            filas.length
        );

    }


    /*==================================================
            ACTUALIZAR CONTADOR DE LA TABLA
    ==================================================*/

    function actualizarContadorAlertas(
        visibles,
        total
    ) {

        const cantidadVisibles = obtenerElemento(
            "cantidadAlertasVisibles"
        );

        const cantidadTotal = obtenerElemento(
            "cantidadAlertasTotal"
        );

        asignarEntero(
            cantidadVisibles,
            visibles
        );

        asignarEntero(
            cantidadTotal,
            total
        );

    }


    /*==================================================
            MOSTRAR MENSAJE SIN RESULTADOS
    ==================================================*/

    function actualizarMensajeSinResultados(
        visibles,
        total
    ) {

        const mensaje = obtenerElemento(
            "sinResultadosAlertas"
        );

        const tablaScroll = document.querySelector(
            ".alertas-admin-tabla-scroll"
        );

        if (!mensaje) {

            return;

        }

        /*
        Si no hay registros en la base de datos,
        dejamos que Django muestre el estado vacío.
        */

        if (total === 0) {

            mensaje.hidden = true;

            return;

        }

        const sinCoincidencias = (
            visibles === 0
        );

        mensaje.hidden = !sinCoincidencias;

        if (tablaScroll) {

            tablaScroll.hidden = sinCoincidencias;

        }

    }


    /*==================================================
            LIMPIAR FILTROS
    ==================================================*/

    function limpiarFiltrosAlertas() {

        const buscador = obtenerElemento(
            "buscarAlerta"
        );

        const filtroTipo = obtenerElemento(
            "filtroTipo"
        );

        const filtroEstado = obtenerElemento(
            "filtroEstado"
        );

        if (buscador) {

            buscador.value = "";

        }

        if (filtroTipo) {

            filtroTipo.value = "todos";

        }

        if (filtroEstado) {

            filtroEstado.value = "todos";

        }

        const tablaScroll = document.querySelector(
            ".alertas-admin-tabla-scroll"
        );

        if (tablaScroll) {

            tablaScroll.hidden = false;

        }

        filtrarAlertas();

        if (buscador) {

            buscador.focus();

        }

    }


    /*==================================================
            ACTUALIZAR BADGE DEL MODAL
    ==================================================*/

    function actualizarEstadoModal(
        estado,
        etiqueta
    ) {

        const badge = obtenerElemento(
            "modalAlertaEstadoActual"
        );

        if (!badge) {

            return;

        }

        badge.classList.remove(
            "estado-activa",
            "estado-en_atencion",
            "estado-resuelta",
            "estado-falsa_alarma"
        );

        if (estado) {

            badge.classList.add(
                `estado-${estado}`
            );

        }

        badge.textContent = textoSeguro(
            etiqueta,
            etiquetasEstadoAlerta[estado]
            || "Sin estado"
        );

    }


    /*==================================================
            PREPARAR UBICACIÓN
    ==================================================*/

    function prepararUbicacion(
        latitud,
        longitud
    ) {

        const ubicacionDisponible = obtenerElemento(
            "modalAlertaUbicacionDisponible"
        );

        const sinUbicacion = obtenerElemento(
            "modalAlertaSinUbicacion"
        );

        const textoLatitud = obtenerElemento(
            "modalAlertaLatitud"
        );

        const textoLongitud = obtenerElemento(
            "modalAlertaLongitud"
        );

        const botonMapa = obtenerElemento(
            "btnAbrirMapaAlerta"
        );

        const tieneUbicacion = Boolean(
            latitud
            && longitud
        );

        if (ubicacionDisponible) {

            ubicacionDisponible.hidden = (
                !tieneUbicacion
            );

        }

        if (sinUbicacion) {

            sinUbicacion.hidden = (
                tieneUbicacion
            );

        }

        if (!tieneUbicacion) {

            actualizarTexto(
                textoLatitud,
                "",
                "—"
            );

            actualizarTexto(
                textoLongitud,
                "",
                "—"
            );

            if (botonMapa) {

                botonMapa.href = "#";

            }

            return;

        }

        actualizarTexto(
            textoLatitud,
            latitud
        );

        actualizarTexto(
            textoLongitud,
            longitud
        );

        if (botonMapa) {

            const coordenadas = (
                `${encodeURIComponent(latitud)},`
                + `${encodeURIComponent(longitud)}`
            );

            botonMapa.href = (
                "https://www.google.com/maps/search/"
                + `?api=1&query=${coordenadas}`
            );

        }

    }


    /*==================================================
            PREPARAR VIAJE RELACIONADO
    ==================================================*/

    function prepararViaje(datos) {

        const bloqueViaje = obtenerElemento(
            "modalBloqueViaje"
        );

        const tieneViaje = Boolean(
            datos.viajeId
        );

        if (bloqueViaje) {

            bloqueViaje.hidden = !tieneViaje;

        }

        if (!tieneViaje) {

            return;

        }

        actualizarTexto(
            obtenerElemento(
                "modalAlertaViajeId"
            ),
            `Ride #${datos.viajeId}`
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaOrigen"
            ),
            datos.origen
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaDestino"
            ),
            datos.destino
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaConductor"
            ),
            datos.conductor
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaVehiculo"
            ),
            datos.vehiculo
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaPlacas"
            ),
            datos.placas,
            "No registradas"
        );

    }


    /*==================================================
            ABRIR MODAL DE ALERTA
    ==================================================*/

    function abrirModalAlerta(boton) {

        const overlay = obtenerElemento(
            "modalAdministrarAlerta"
        );

        const modal = overlay
            ? overlay.querySelector(
                ".modal-alerta"
            )
            : null;

        const formulario = obtenerElemento(
            "formAdministrarAlerta"
        );

        const selectorEstado = obtenerElemento(
            "nuevoEstadoAlerta"
        );

        if (
            !overlay
            || !formulario
        ) {

            return;

        }

        botonAlertaActivo = boton;

        alertaActualId = (
            boton.dataset.alertaId
            || null
        );

        estadoOriginalAlerta = (
            boton.dataset.estado
            || "activa"
        );

        const datos = {

            id:
                boton.dataset.alertaId,

            url:
                boton.dataset.url,

            usuario:
                boton.dataset.usuario,

            email:
                boton.dataset.email,

            telefono:
                boton.dataset.telefono,

            tipo:
                boton.dataset.tipo,

            tipoLabel:
                boton.dataset.tipoLabel,

            descripcion:
                boton.dataset.descripcion,

            estado:
                boton.dataset.estado,

            estadoLabel:
                boton.dataset.estadoLabel,

            fechaActivacion:
                boton.dataset.fechaActivacion,

            fechaAtencion:
                boton.dataset.fechaAtencion,

            fechaResolucion:
                boton.dataset.fechaResolucion,

            atendidaPor:
                boton.dataset.atendidaPor,

            viajeId:
                boton.dataset.viajeId,

            origen:
                boton.dataset.origen,

            destino:
                boton.dataset.destino,

            conductor:
                boton.dataset.conductor,

            vehiculo:
                boton.dataset.vehiculo,

            placas:
                boton.dataset.placas,

            latitud:
                boton.dataset.latitud,

            longitud:
                boton.dataset.longitud,

        };

        formulario.action = textoSeguro(
            datos.url,
            ""
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaId"
            ),
            datos.id
                ? `#${datos.id}`
                : "—"
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaTipo"
            ),
            datos.tipoLabel
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaFecha"
            ),
            datos.fechaActivacion
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaAdministrador"
            ),
            datos.atendidaPor,
            "Sin asignar"
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaUsuario"
            ),
            datos.usuario
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaEmail"
            ),
            datos.email
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaTelefono"
            ),
            datos.telefono,
            "No registrado"
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaDescripcion"
            ),
            datos.descripcion,
            "Sin descripción registrada."
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaFechaAtencion"
            ),
            datos.fechaAtencion,
            "Sin registrar"
        );

        actualizarTexto(
            obtenerElemento(
                "modalAlertaFechaResolucion"
            ),
            datos.fechaResolucion,
            "Sin registrar"
        );

        actualizarEstadoModal(
            datos.estado,
            datos.estadoLabel
        );

        prepararViaje(datos);

        prepararUbicacion(
            datos.latitud,
            datos.longitud
        );

        if (selectorEstado) {

            selectorEstado.value = (
                datos.estado
                || "activa"
            );

        }

        ocultarErrorModal();

        boton.setAttribute(
            "aria-expanded",
            "true"
        );

        overlay.classList.add(
            "activo"
        );

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-alerta-abierto"
        );

        window.setTimeout(function () {

            if (modal) {

                modal.focus();

            }

        }, 80);

    }


    /*==================================================
            CERRAR MODAL
    ==================================================*/

    function cerrarModalAlerta() {

        const overlay = obtenerElemento(
            "modalAdministrarAlerta"
        );

        if (!overlay) {

            return;

        }

        overlay.classList.remove(
            "activo"
        );

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-alerta-abierto"
        );

        ocultarErrorModal();

        if (botonAlertaActivo) {

            botonAlertaActivo.setAttribute(
                "aria-expanded",
                "false"
            );

            botonAlertaActivo.focus();

        }

        botonAlertaActivo = null;
        alertaActualId = null;
        estadoOriginalAlerta = "";

    }


    /*==================================================
            OBTENER ICONO DEL ESTADO
    ==================================================*/

    function crearIconoEstado(estado) {

        const icono = document.createElement(
            "i"
        );

        icono.className = (
            "fa-solid "
            + (
                iconosEstadoAlerta[estado]
                || "fa-circle-info"
            )
        );

        return icono;

    }


    /*==================================================
            ACTUALIZAR BADGE DE LA TABLA
    ==================================================*/

    function actualizarBadgeTabla(
        alertaId,
        estado,
        estadoDisplay
    ) {

        const badge = document.querySelector(
            `[data-estado-badge="${alertaId}"]`
        );

        if (!badge) {

            return;

        }

        badge.classList.remove(
            "estado-activa",
            "estado-en_atencion",
            "estado-resuelta",
            "estado-falsa_alarma"
        );

        badge.classList.add(
            `estado-${estado}`
        );

        badge.replaceChildren();

        const icono = crearIconoEstado(
            estado
        );

        const texto = document.createElement(
            "span"
        );

        texto.textContent = textoSeguro(
            estadoDisplay,
            etiquetasEstadoAlerta[estado]
            || estado
        );

        badge.appendChild(icono);
        badge.appendChild(texto);

    }


    /*==================================================
            ACTUALIZAR ESTADÍSTICAS
    ==================================================*/

    function actualizarEstadisticas(
        estadoAnterior,
        estadoNuevo
    ) {

        if (
            !estadoAnterior
            || !estadoNuevo
            || estadoAnterior === estadoNuevo
        ) {

            return;

        }

        const elementos = {

            activa:
                obtenerElemento(
                    "estadisticaAlertasActivas"
                ),

            en_atencion:
                obtenerElemento(
                    "estadisticaAlertasAtencion"
                ),

            resuelta:
                obtenerElemento(
                    "estadisticaAlertasResueltas"
                ),

        };

        if (elementos[estadoAnterior]) {

            asignarEntero(
                elementos[estadoAnterior],
                obtenerEntero(
                    elementos[estadoAnterior]
                ) - 1
            );

        }

        if (elementos[estadoNuevo]) {

            asignarEntero(
                elementos[estadoNuevo],
                obtenerEntero(
                    elementos[estadoNuevo]
                ) + 1
            );

        }

    }


    /*==================================================
            ACTUALIZAR FILA DESPUÉS DEL POST
    ==================================================*/

    function actualizarFilaAlerta(datos) {

        const alerta = datos.alerta;

        if (!alerta) {

            return;

        }

        const fila = document.querySelector(
            `.alerta-admin-fila`
            + `[data-alerta-id="${alerta.id}"]`
        );

        const boton = fila
            ? fila.querySelector(
                '[data-action="administrar-alerta"]'
            )
            : null;

        if (!fila || !boton) {

            return;

        }

        actualizarEstadisticas(
            estadoOriginalAlerta,
            alerta.estado
        );

        fila.dataset.estado = (
            alerta.estado
        );

        boton.dataset.estado = (
            alerta.estado
        );

        boton.dataset.estadoLabel = (
            alerta.estado_display
        );

        boton.dataset.atendidaPor = (
            alerta.atendida_por
            || "Sin asignar"
        );

        boton.dataset.fechaAtencion = (
            alerta.fecha_atencion
            || ""
        );

        boton.dataset.fechaResolucion = (
            alerta.fecha_resolucion
            || ""
        );

        actualizarBadgeTabla(
            alerta.id,
            alerta.estado,
            alerta.estado_display
        );

        fila.classList.remove(
            "actualizada"
        );

        void fila.offsetWidth;

        fila.classList.add(
            "actualizada"
        );

        window.setTimeout(function () {

            fila.classList.remove(
                "actualizada"
            );

        }, 800);

        estadoOriginalAlerta = alerta.estado;

        filtrarAlertas();

    }


    /*==================================================
            ESTADO DE CARGA DEL BOTÓN
    ==================================================*/

    function cambiarCargaBoton(
        cargando
    ) {

        const botonGuardar = obtenerElemento(
            "btnGuardarAlerta"
        );

        if (!botonGuardar) {

            return;

        }

        botonGuardar.disabled = cargando;

        botonGuardar.classList.toggle(
            "cargando",
            cargando
        );

    }


    /*==================================================
            ENVIAR FORMULARIO
    ==================================================*/

    async function enviarFormularioAlerta(
        evento
    ) {

        evento.preventDefault();

        const formulario = evento.currentTarget;

        const selectorEstado = obtenerElemento(
            "nuevoEstadoAlerta"
        );

        if (
            !formulario
            || !selectorEstado
        ) {

            return;

        }

        const url = formulario.action;

        const nuevoEstado = (
            selectorEstado.value
        );

        if (!url) {

            mostrarErrorModal(
                "No se encontró la dirección para actualizar la alerta."
            );

            return;

        }

        if (!nuevoEstado) {

            mostrarErrorModal(
                "Selecciona un estado válido."
            );

            return;

        }

        ocultarErrorModal();

        cambiarCargaBoton(true);

        const datosFormulario = new FormData(
            formulario
        );

        datosFormulario.set(
            "estado",
            nuevoEstado
        );

        try {

            const respuesta = await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "X-CSRFToken":
                            obtenerCsrfToken(
                                formulario
                            ),

                        "X-Requested-With":
                            "XMLHttpRequest",
                    },

                    body:
                        datosFormulario,

                    credentials:
                        "same-origin",
                }
            );

            let datos = {};

            try {

                datos = await respuesta.json();

            } catch (errorJson) {

                datos = {};

            }

            if (
                !respuesta.ok
                || datos.ok === false
            ) {

                throw new Error(
                    datos.error
                    || (
                        "No fue posible actualizar "
                        + "la alerta."
                    )
                );

            }

            actualizarFilaAlerta(
                datos
            );

            mostrarToast(
                datos.mensaje
                || (
                    "La alerta fue actualizada "
                    + "correctamente."
                ),
                "exito"
            );

            cerrarModalAlerta();

        } catch (error) {

            console.error(
                "Error al actualizar alerta:",
                error
            );

            const mensaje = (
                error.message
                || (
                    "No fue posible conectar "
                    + "con el servidor."
                )
            );

            mostrarErrorModal(
                mensaje
            );

            mostrarToast(
                mensaje,
                "error"
            );

        } finally {

            cambiarCargaBoton(false);

        }

    }


    /*==================================================
            MANEJAR CLICS DEL MÓDULO
    ==================================================*/

    function manejarClickAlertas(evento) {

        const botonAdministrar = evento.target.closest(
            '[data-action="administrar-alerta"]'
        );

        if (botonAdministrar) {

            abrirModalAlerta(
                botonAdministrar
            );

            return;

        }

        const botonCerrar = evento.target.closest(
            "#btnCerrarModalAlerta"
        );

        const botonCancelar = evento.target.closest(
            "#btnCancelarModalAlerta"
        );

        if (
            botonCerrar
            || botonCancelar
        ) {

            cerrarModalAlerta();

            return;

        }

        const botonFiltrar = evento.target.closest(
            "#btnFiltrar"
        );

        if (botonFiltrar) {

            filtrarAlertas();

            return;

        }

        const botonLimpiar = evento.target.closest(
            "#btnLimpiarFiltrosAlertas"
        );

        if (botonLimpiar) {

            limpiarFiltrosAlertas();

        }

    }


    /*==================================================
            CERRAR AL PULSAR EL OVERLAY
    ==================================================*/

    function manejarClickOverlay(evento) {

        const overlay = obtenerElemento(
            "modalAdministrarAlerta"
        );

        if (
            overlay
            && evento.target === overlay
        ) {

            cerrarModalAlerta();

        }

    }


    /*==================================================
            MANEJAR TECLADO
    ==================================================*/

    function manejarTecladoAlertas(evento) {

        const overlay = obtenerElemento(
            "modalAdministrarAlerta"
        );

        const modalAbierto = (
            overlay
            && overlay.classList.contains(
                "activo"
            )
        );

        if (
            evento.key === "Escape"
            && modalAbierto
        ) {

            cerrarModalAlerta();

            return;

        }

        const buscador = obtenerElemento(
            "buscarAlerta"
        );

        if (
            evento.key === "Enter"
            && document.activeElement === buscador
        ) {

            evento.preventDefault();

            filtrarAlertas();

        }

    }


    /*==================================================
            MANEJAR CAMBIOS DE FILTROS
    ==================================================*/

    function manejarCambioAlertas(evento) {

        if (
            evento.target.matches(
                "#filtroTipo, #filtroEstado"
            )
        ) {

            filtrarAlertas();

        }

    }


    /*==================================================
            MANEJAR ENTRADA DEL BUSCADOR
    ==================================================*/

    function manejarInputAlertas(evento) {

        if (
            evento.target.matches(
                "#buscarAlerta"
            )
        ) {

            filtrarAlertas();

        }

    }


    /*==================================================
            INICIAR MÓDULO DE ALERTAS
    ==================================================*/

    function iniciarAlertas() {

        const modulo = obtenerElemento(
            "moduloAlertasAdmin"
        );

        if (!modulo) {

            return;

        }

        /*
        Al cargar dinámicamente varias veces la vista,
        eliminamos todos los listeners anteriores.
        */

        if (controladorEventosAlertas) {

            controladorEventosAlertas.abort();

        }

        controladorEventosAlertas = (
            new AbortController()
        );

        const signal = (
            controladorEventosAlertas.signal
        );

        modulo.addEventListener(
            "click",
            manejarClickAlertas,
            { signal }
        );

        modulo.addEventListener(
            "change",
            manejarCambioAlertas,
            { signal }
        );

        modulo.addEventListener(
            "input",
            manejarInputAlertas,
            { signal }
        );

        const overlay = obtenerElemento(
            "modalAdministrarAlerta"
        );

        if (overlay) {

            overlay.addEventListener(
                "click",
                manejarClickOverlay,
                { signal }
            );

        }

        document.addEventListener(
            "keydown",
            manejarTecladoAlertas,
            { signal }
        );

        const formulario = obtenerElemento(
            "formAdministrarAlerta"
        );

        if (formulario) {

            formulario.addEventListener(
                "submit",
                enviarFormularioAlerta,
                { signal }
            );

        }

        const filas = obtenerFilasAlertas();

        actualizarContadorAlertas(
            filas.length,
            filas.length
        );

        actualizarMensajeSinResultados(
            filas.length,
            filas.length
        );

        console.log(
            "Módulo administrativo de alertas iniciado."
        );

    }


    /*==================================================
            HACER LA FUNCIÓN GLOBAL
    ==================================================*/

    window.iniciarAlertas = iniciarAlertas;


    /*==================================================
            INICIAR SI EL HTML YA ESTÁ DISPONIBLE
    ==================================================*/

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            if (
                obtenerElemento(
                    "moduloAlertasAdmin"
                )
            ) {

                iniciarAlertas();

            }

        }
    );

})();