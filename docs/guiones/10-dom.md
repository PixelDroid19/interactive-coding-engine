---
titulo: "Lección 10: La página y el DOM"
modulo: Construir una página interactiva
tipo: scrim
archivo: fundamentos-10.mp3
estado: audio_generado
enfoque: principiantes
---

Hasta ahora trabajaste con valores, variables, funciones y objetos. Con esa base ya podemos conectar JavaScript con una página. El navegador representa las etiquetas del HTML como elementos de una estructura llamada DOM.

En el HTML, el título y el mensaje tienen un id. Un id funciona como un nombre único dentro de la página. JavaScript puede usarlo para encontrar el elemento correcto.

Esta línea puede leerse por partes. document representa la página y getElementById busca un elemento por su id. Entre paréntesis indicamos cuál queremos y guardamos el resultado en una variable.

Una vez encontrado el elemento, su propiedad textContent contiene el texto visible. Al asignarle un valor nuevo, la página cambia. Estamos combinando ideas conocidas: objetos, propiedades, funciones y asignación.

Ahora cambia el título y el mensaje. Busca cada elemento usando su propio id, modifica su textContent y ejecuta el programa. Comprueba visualmente que cambien los dos textos, no solo uno.

Ya sabes encontrar un elemento de la página y cambiar su contenido desde JavaScript. En la siguiente lección haremos que ese cambio espere hasta que alguien pulse un botón.
