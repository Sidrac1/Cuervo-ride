/*=====================================
        EXPEDIENTE MÉDICO
=====================================*/

function iniciarExpediente(usuarioIdParam = null) {
    console.log("Vista Expediente Médico cargada");

    // OBTENER ID (Parámetro o sessionStorage)
    const usuarioId = usuarioIdParam || sessionStorage.getItem("usuarioId") || window.ADMIN_STATE?.usuarioId;

    if (!usuarioId) {
        alert("No se encontró ningún usuario seleccionado.");
        cargarVista("usuarios");
        return;
    }

    sessionStorage.setItem("usuarioId", usuarioId);

    // CONSULTAR DATOS MÉDICOS Y DEL USUARIO DESDE LA API
    fetch(`/api/admin/usuarios/${usuarioId}/`)
        .then((res) => res.json())
        .then((data) => {
            if (!data.ok) {
                alert(data.error || "No se pudo cargar la información del expediente.");
                cargarVista("usuarios");
                return;
            }
            pintarExpediente(data.usuario);
        })
        .catch((err) => {
            console.error("Error al cargar expediente médico:", err);
            alert("Error de conexión al obtener el expediente médico.");
        });

    // PINTAR DATOS EN LA PLANTILLA
    function pintarExpediente(usuario) {
        const foto = document.getElementById("fotoUsuario");
        if (foto) foto.src = usuario.foto || "/static/img/admin.png";

        const titulo = document.getElementById("nombreTitulo");
        if (titulo) titulo.textContent = usuario.nombre || "Usuario";

        const medico = usuario.medico || {};

        if (document.getElementById("tipoSangre")) document.getElementById("tipoSangre").value = medico.tipoSangre || usuario.tipoSangre || "";
        if (document.getElementById("alergias")) document.getElementById("alergias").value = medico.alergias || usuario.alergias || "";
        if (document.getElementById("enfermedades")) document.getElementById("enfermedades").value = medico.enfermedades || usuario.enfermedades || "";
        if (document.getElementById("medicamentos")) document.getElementById("medicamentos").value = medico.medicamentos || usuario.medicamentos || "";
        if (document.getElementById("contacto")) document.getElementById("contacto").value = medico.contacto || usuario.contacto || "";
        if (document.getElementById("telefonoEmergencia")) document.getElementById("telefonoEmergencia").value = medico.telefonoEmergencia || usuario.telefonoEmergencia || "";
        if (document.getElementById("observaciones")) document.getElementById("observaciones").value = medico.observaciones || usuario.observaciones || "";
    }

    // NAVEGACIÓN ENTRE SECCIONES DEL USUARIO
    const btnGeneral = document.getElementById("btnGeneral");
    if (btnGeneral) {
        btnGeneral.addEventListener("click", () => cargarVista("usuario-info", usuarioId));
    }

    const btnVerificacion = document.getElementById("btnVerificacion");
    if (btnVerificacion) {
        btnVerificacion.addEventListener("click", () => {
            // Carga usuario-info y dispara la pestaña de verificación
            cargarVista("usuario-info", usuarioId);
            setTimeout(() => {
                const tabVerificacion = document.getElementById("btnVerificacion");
                if (tabVerificacion) tabVerificacion.click();
            }, 150);
        });
    }

    const btnVolver = document.getElementById("volver");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => cargarVista("usuarios"));
    }

    // GUARDAR EXPEDIENTE MÉDICO VÍA API
    const formMedico = document.getElementById("formMedico");
    if (formMedico) {
        formMedico.addEventListener("submit", function (e) {
            e.preventDefault();

            const payload = {
                tipoSangre: document.getElementById("tipoSangre")?.value || "",
                alergias: document.getElementById("alergias")?.value || "",
                enfermedades: document.getElementById("enfermedades")?.value || "",
                medicamentos: document.getElementById("medicamentos")?.value || "",
                contacto: document.getElementById("contacto")?.value || "",
                telefonoEmergencia: document.getElementById("telefonoEmergencia")?.value || "",
                observaciones: document.getElementById("observaciones")?.value || "",
            };

            fetch(`/api/admin/usuarios/${usuarioId}/actualizar-expediente/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": obtenerCSRFToken(),
                },
                body: JSON.stringify(payload),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.ok) {
                        alert("Expediente médico guardado correctamente.");
                    } else {
                        alert(data.error || "No se pudo guardar el expediente médico.");
                    }
                })
                .catch((err) => {
                    console.error("Error al guardar expediente médico:", err);
                    alert("Error de conexión al guardar el expediente.");
                });
        });
    }
}