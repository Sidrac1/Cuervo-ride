/*=====================================
        ALERTAS
=====================================*/

function iniciarAlertas(){

    console.log("Vista Alertas cargada");

    const btnFiltrar = document.getElementById("btnFiltrar");

    if(btnFiltrar){

        btnFiltrar.addEventListener("click", filtrarAlertas);

    }

    const buscador = document.getElementById("buscarAlerta");

    if(buscador){

        buscador.addEventListener("input", filtrarAlertas);

    }

    const tipo = document.getElementById("filtroTipo");

    if(tipo){

        tipo.addEventListener("change", filtrarAlertas);

    }

    const estado = document.getElementById("filtroEstado");

    if(estado){

        estado.addEventListener("change", filtrarAlertas);

    }

}

/*=====================================
        FILTRAR ALERTAS
=====================================*/

function filtrarAlertas(){

    const texto = document
        .getElementById("buscarAlerta")
        .value
        .toLowerCase()
        .trim();

    const tipo = document
        .getElementById("filtroTipo")
        .value;

    const estado = document
        .getElementById("filtroEstado")
        .value;

    const filas = document.querySelectorAll("#tablaAlertas tr");

    let visibles = 0;

    filas.forEach(fila=>{

        const nombre =
            fila.children[1].textContent
            .toLowerCase()
            .trim();

        const alerta =
            fila.children[2].textContent
            .toLowerCase()
            .trim();

        const tipoAlerta =
            fila.querySelector(".tipo")
            .textContent
            .trim();

        const estadoAlerta =
            fila.querySelector(".estado")
            .textContent
            .trim();


        const coincideBusqueda =

            nombre.includes(texto) ||

            alerta.includes(texto);


        const coincideTipo =

            tipo === "Todos" ||

            tipoAlerta === tipo;


        const coincideEstado =

            estado === "Todos" ||

            estadoAlerta === estado;


        if(

            coincideBusqueda &&

            coincideTipo &&

            coincideEstado

        ){

            fila.style.display = "";

            visibles++;

        }

        else{

            fila.style.display = "none";

        }

    });

    actualizarContadorAlertas(visibles);

    if(visibles===0){

        mostrarSinResultadosAlertas();

    }

    else{

        ocultarSinResultadosAlertas();

    }

}

/*=====================================
    ACTUALIZAR CONTADOR ALERTAS
=====================================*/

function actualizarContadorAlertas(visibles){

    const contador = document.querySelector(".footer-tabla p");

    if(!contador) return;

    const total = document.querySelectorAll("#tablaAlertas tr").length;

    contador.textContent =

        `Mostrando ${visibles} de ${total} alertas`;

}

/*=====================================
    OCULTAR MENSAJE ALERTAS
=====================================*/

function ocultarSinResultadosAlertas(){

    const mensaje = document.getElementById("sinResultadosAlertas");

    if(mensaje){

        mensaje.style.display = "none";

    }

}
