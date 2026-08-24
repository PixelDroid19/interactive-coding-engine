---
titulo: "Lección 12: Inputs y formularios"
modulo: Construir una página interactiva
tipo: scrim
archivo: fundamentos-12.mp3
estado: audio_generado
enfoque: principiantes
---

Una interfaz se vuelve más útil cuando puede responder a lo que alguien escribe. Seguiremos un flujo sencillo: leer la entrada, transformar ese dato y mostrar una salida.

Este campo de texto tiene el id nombre. Es un elemento del DOM como los anteriores, pero su propiedad value contiene lo que la persona haya escrito en ese momento.

crearSaludo recibe un nombre y devuelve el mensaje terminado. Cuando ocurre el clic, mostrarSaludo lee el value del campo, llama a crearSaludo y coloca el resultado en la página.

Observa que crearSaludo no necesita conocer la página. Recibe texto y devuelve texto. Separar el cálculo de la parte visual facilita comprobar la función y reutilizarla más adelante.

Ahora completa crearSaludo. Usa el parámetro que recibe para construir la respuesta, en lugar de escribir un nombre fijo. El evento y la lectura del campo ya están preparados.

Ya puedes leer un dato escrito por una persona, transformarlo y mostrar una respuesta. En la siguiente lección haremos lo mismo con todos los elementos de un array.
