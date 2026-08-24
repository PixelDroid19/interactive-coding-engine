---
titulo: "Lección 8: Arrays"
modulo: Agrupar datos
tipo: scrim
archivo: fundamentos-08.mp3
estado: audio_generado
---

Hasta ahora guardamos valores individuales. Sin embargo, muchos problemas incluyen colecciones: una lista de tareas, los puntos de varias partidas o los nombres de un grupo. Para eso existen los arrays.

Un array es una lista ordenada. Cada posición tiene un índice que nos permite encontrar su valor. JavaScript comienza a contar los índices desde cero, así que el primer elemento ocupa la posición cero.

Aquí creamos un array llamado frutas. Los corchetes marcan el comienzo y el final de la lista, y las comas separan sus tres elementos.

Para leer el primer elemento usamos frutas y el índice cero entre corchetes. La propiedad length indica cuántos elementos hay. Como los índices empiezan en cero, el último se encuentra en length menos uno.

El método push agrega un elemento al final y pop elimina el último. Si queremos visitar toda la lista, usamos el for que ya conoces: empezamos en cero y continuamos mientras el índice sea menor que length.

Existen muchos más métodos, pero no los necesitamos todavía. Primero asegúrate de comprender cómo crear una lista, leer posiciones, modificar su final y recorrerla paso a paso.

Ahora recibirás un array de números y deberás devolver su suma. Crea un acumulador, recorre la lista desde el índice cero y añade el valor de cada posición.
