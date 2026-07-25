/*=====================================
        PUNTUACIÓN
=====================================*/
function iniciarPuntuacion(){

    console.log("Vista Puntuación cargada");

    crearGraficaPuntuacion();

}

/*=====================================
        GRÁFICA PUNTUACIÓN
=====================================*/

function crearGraficaPuntuacion(){

    const canvas = document.getElementById("graficaCalificaciones");

    if(!canvas) return;

    // Evita crear varias gráficas al regresar
    if(window.graficaPuntuacion){

        window.graficaPuntuacion.destroy();

    }

    const ctx = canvas.getContext("2d");

    window.graficaPuntuacion = new Chart(ctx,{

        type:"bar",

        data:{

            labels:[

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

            datasets:[{

                label:"Viajes calificados",

                data:[

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

                backgroundColor:"#00e68a",

                borderColor:"#00e68a",

                borderWidth:1,

                borderRadius:3

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{

                    display:false

                }

            },

            scales:{

                x:{

                    ticks:{

                        color:"#dce5ef",

                        font:{

                            size:13

                        }

                    },

                    grid:{

                        display:false

                    }

                },

                y:{

                    beginAtZero:true,

                    ticks:{

                        color:"#dce5ef"

                    },

                    grid:{

                        color:"rgba(255,255,255,.08)"

                    }

                }

            }

        }

    });

}