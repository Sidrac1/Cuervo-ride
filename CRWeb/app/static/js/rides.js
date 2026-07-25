/*=====================================
        RIDES
=====================================*/
function iniciarRides(){

    console.log("Vista Rides cargada");

    /*==============================
            CALENDARIO
    ==============================*/

        flatpickr("#filtroFecha",{

            locale:"es",

            dateFormat:"Y-m-d",

            allowInput:false

        });

    const btnFiltrar = document.getElementById("btnFiltrar");

    if(btnFiltrar){

        btnFiltrar.addEventListener("click", filtrarRides);

    }

    const buscador = document.getElementById("buscarRide");

    if(buscador){

        buscador.addEventListener("input", filtrarRides);

    }

    const fecha = document.getElementById("filtroFecha");

    if(fecha){

        fecha.addEventListener("change", filtrarRides);

    }

    const estado = document.getElementById("filtroEstado");

    if(estado){

        estado.addEventListener("change", filtrarRides);

    }

}

            /*=====================================
                    FILTRAR RIDES
            =====================================*/

            function filtrarRides(){

                const texto = document
                    .getElementById("buscarRide")
                    .value
                    .toLowerCase()
                    .trim();


                const fecha = document
                    .getElementById("filtroFecha")
                    .value;


                const estado = document
                    .getElementById("filtroEstado")
                    .value;


                const filas = document.querySelectorAll("#tablaRides tr");


                let visibles = 0;


                filas.forEach(fila=>{

                    const id =
                        fila.children[0].textContent.toLowerCase();

                    const conductor =
                        fila.children[1].textContent.toLowerCase();

                    const ruta =
                        fila.children[2].textContent.toLowerCase();

                    const fechaRide =
                        fila.children[5].textContent.trim();

                    const estadoRide =
                        fila.querySelector(".estado").textContent.trim();


                    const coincideBusqueda =

                        id.includes(texto) ||

                        conductor.includes(texto) ||

                        ruta.includes(texto);


                    const coincideFecha =

                        fecha === "" ||

                        fechaRide === fecha;


                    const coincideEstado =

                        estado === "Todos" ||

                        estadoRide === estado;


                    if(

                        coincideBusqueda &&

                        coincideFecha &&

                        coincideEstado

                    ){

                        fila.style.display = "";

                        visibles++;

                    }

                    else{

                        fila.style.display = "none";

                    }

                });


                if(visibles === 0){

                    mostrarSinResultadosRides();

                }

                else{

                    ocultarSinResultadosRides();

                }

                actualizarContadorRides(visibles);

            }


/*=====================================
CONTADOR RIDES
=====================================*/

function actualizarContadorRides(visibles){

const contador = document.querySelector(".footer-tabla p");

if(!contador) return;

const total = document.querySelectorAll("#tablaRides tr").length;

contador.textContent =
`Mostrando ${visibles} de ${total} rides`;

}



/*=====================================
SIN RESULTADOS
=====================================*/

function mostrarSinResultadosRides(){

const tbody = document.getElementById("tablaRides");

if(!tbody) return;

let mensaje = document.getElementById("sinResultadosRides");

if(!mensaje){

mensaje = document.createElement("tr");

mensaje.id = "sinResultadosRides";

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

tbody.appendChild(mensaje);

}

mensaje.style.display = "";

}



/*=====================================
OCULTAR MENSAJE
=====================================*/

function ocultarSinResultadosRides(){

const mensaje = document.getElementById("sinResultadosRides");

if(mensaje){

mensaje.style.display = "none";

}

}
