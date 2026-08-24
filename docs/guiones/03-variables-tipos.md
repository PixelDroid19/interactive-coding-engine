---
titulo: "Lección 3: Variables y tipos"
modulo: Primeros pasos
tipo: scrim
archivo: fundamentos-03.mp3
estado: audio_generado
---

Los programas necesitan recordar información: el nombre de una persona, una edad o si una opción está activa. Para darle un nombre a cada valor usamos variables.

Puedes imaginar una variable como una etiqueta asociada a un valor. La etiqueta nos permite encontrarlo después. Si el valor cambia, podemos seguir usando el mismo nombre para acceder al nuevo dato.

En JavaScript comenzaremos con dos formas de crear variables. Usamos let cuando necesitaremos cambiar el valor y const cuando queremos mantener la misma asociación.

En la primera línea guardamos el número veinticinco con el nombre edad. En la segunda guardamos el texto Lima con el nombre ciudad. El signo igual asocia cada nombre con su valor.

Después cambiamos edad de veinticinco a veintiséis. Eso se llama reasignar: el nombre sigue siendo edad, pero ahora apunta a otro valor. JavaScript no permite hacer lo mismo con ciudad porque la declaramos con const.

Ahora fijémonos en los valores. No toda la información se comporta de la misma manera porque existen distintos tipos de datos.

Un texto se escribe entre comillas y su tipo se llama string. Los números se escriben sin comillas. true y false representan dos posibilidades y pertenecen al tipo booleano.

El operador typeof nos permite preguntar por el tipo de un valor. Con un texto responde string, con veinticinco responde number y con true responde boolean.

Las comillas cambian el significado. Veinticinco sin comillas es un número, pero entre comillas es texto. Aunque se vean parecidos, JavaScript los trata de forma diferente.

Ahora crea tres variables desde cero. Guarda tu nombre como texto con const, tu edad como número con let y en listo un valor booleano. Después muestra las tres variables en la consola para comprobarlas.

Si la consola muestra los tres valores, ya sabes nombrar información y elegir su tipo. En la próxima lección aprenderás a calcular y comparar usando esos datos.
