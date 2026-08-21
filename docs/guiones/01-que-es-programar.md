---
titulo: "Lección 1: Qué es programar"
modulo: Primeros pasos
tipo: scrim
archivo: fundamentos-01.mp3
estado: pendiente_grabar
---

Hola. Bienvenido. Hoy vas a escribir tu primer programa. Y antes de tocar nada, te voy a dar una sola idea. La más importante.

Un programa es una lista de instrucciones que la computadora sigue en orden, de arriba abajo. Una tras otra. Como una receta de cocina: primero un paso, luego el siguiente. Si cambias el orden, cambia el resultado.

Eso es todo lo que necesitas saber para empezar. Lo demás lo vas a ver haciendo.

A la derecha tienes una página de verdad. Un título, un espacio vacío y un botón. El botón todavía no hace nada. Eso lo vamos a arreglar nosotros hoy.

A la izquierda hay tres archivos. HTML es la página: qué hay dentro. CSS es el aspecto: cómo se ve. Y JavaScript es lo que hace que ocurra algo. Nosotros vamos a trabajar solo en app.js. Los otros dos ya están listos.

Mira app.js. Está casi vacío. Las líneas que empiezan con dos barras son notas para ti. JavaScript las ignora, no las ejecuta.

Vamos con lo primero: guardar un dato.

Se escribe así: let, un espacio, el nombre del dato, un signo igual, y el valor entre comillas.

let significa guarda esto con este nombre. Las comillas dicen esto es texto. Sin comillas, JavaScript buscaría otra cosa.

Escribamos un nombre.

let nombre = "Alex";

Esta línea crea una caja llamada nombre, y dentro está el texto Alex. A esa caja se le llama variable. Ya la puedes usar cuando quieras.

Ahora, segundo paso: mostrar ese dato en la página.

La página tiene un recuadro con id saludo. Para escribir dentro usamos tres piezas.

document.getElementById("saludo") busca el recuadro. textContent pone texto dentro. Y el signo más junta textos.

Vamos a juntar Hola coma, espacio, el nombre, y punto.

document.getElementById("saludo").textContent = "Hola, " + nombre + ".";

Fíjate en algo. nombre va sin comillas, porque ya existe. Es la caja que guardamos hace un momento. Si lo pusieras entre comillas, escribiría la palabra nombre literalmente.

JavaScript lee de arriba abajo. Primero guarda Alex. Después arma el saludo. Vamos a ejecutarlo.

Mira. Dice Hola, Alex. Eso salió de las dos líneas que escribimos. Nada más.

Ahora te toca a ti. Cambia Alex por tu nombre. Deja las comillas donde están. Pulsa Ejecutar.

El saludo tiene que aparecer con tu nombre. Si sale bien, acabas de modificar un programa de verdad.

Bien. Guardaste un dato y lo mostraste. Si cambias el dato, cambia lo que se ve. Eso es un programa.

Última pieza. Vamos a combinar lo que ya sabes con algo nuevo: hacer que el programa reaccione a ti.

El botón todavía no hace nada. Le vamos a decir: cuando alguien te pulse, cambia el saludo otra vez.

addEventListener significa quédate escuchando. click es el toque. Y las líneas de adentro corren cuando eso pasa.

Ejecutamos.

Pulsa el botón de la derecha. El programa te está esperando.

Y con esto ya sabes tres cosas: guardar datos, mostrarlos en la página, y reaccionar cuando el usuario hace algo. Eso es programar. Nos vemos en la siguiente.
