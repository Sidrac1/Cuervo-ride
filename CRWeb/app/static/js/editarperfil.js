// =========================
// EDICIÓN DE CAMPOS
// =========================


document.addEventListener("DOMContentLoaded", () => {



    const formularios = document.querySelectorAll(".formulario");



    formularios.forEach(formulario => {



        const editar = formulario.querySelectorAll(".editar");

        const inputs = formulario.querySelectorAll(".input-box input");

        const botones = formulario.querySelector(".botones");

        const cancelar = formulario.querySelector(".cancelar");

        const guardar = formulario.querySelector(".guardar");



        // Guardar valores originales

        inputs.forEach(input => {

            input.dataset.original = input.value;

        });





        // Activar edición

        editar.forEach(icono => {



            icono.addEventListener("click", () => {



                // bloquear inputs del mismo formulario

                inputs.forEach(input => {

                    input.readOnly = true;

                    input.parentElement.classList.remove("editando");

                });




                const caja = icono.closest(".input-box");

                const input = caja.querySelector("input");



                input.readOnly = false;

                input.focus();



                caja.classList.add("editando");




                // mostrar botones del formulario actual

                if(botones){

                    botones.classList.remove("oculto");

                }



            });



        });







        // Cancelar

        if(cancelar){


            cancelar.addEventListener("click", () => {



                inputs.forEach(input => {



                    input.readOnly = true;

                    input.value = input.dataset.original;

                    input.parentElement.classList.remove("editando");



                });



                if(botones){

                    botones.classList.add("oculto");

                }



            });


        }







        // Guardar

        if(guardar){



            guardar.addEventListener("click", () => {



                inputs.forEach(input => {



                    input.readOnly = true;

                    input.dataset.original = input.value;

                    input.parentElement.classList.remove("editando");



                });




                if(botones){

                    botones.classList.add("oculto");

                }



                console.log("Cambios guardados");



            });



        }



    });



});