---
titulo: "Lección 13: Listas en la página"
modulo: Construir una página interactiva
tipo: scrim
archivo: fundamentos-13.mp3
estado: audio_generado
enfoque: principiantes
---

Ya sabes guardar varios datos en un array y recorrerlos con un bucle. Ahora usaremos cada vuelta para crear un elemento visible en la página.

Comenzamos con tres tareas y una lista vacía. La función mostrarTareas recibe el array, limpia lo que había en pantalla y lo recorre con el mismo for de la lección de arrays.

En cada vuelta, createElement crea un elemento de lista. Luego textContent coloca la tarea actual y appendChild añade esa fila a la lista visible. Una vuelta produce una fila.

Al terminar usamos length para mostrar la cantidad total. No apareció una estructura de datos nueva: acabamos de combinar arrays, bucles y operaciones del DOM que ya habías aprendido por separado.

Ahora completa resumenLista. La función recibe un array y debe devolver un texto con la cantidad de elementos y el primero de ellos. Usa length y recuerda que el primer índice es cero.

Ya sabes convertir los datos de un array en elementos visibles. En la siguiente lección reuniremos entradas, eventos, funciones, arrays y DOM en un proyecto guiado.
