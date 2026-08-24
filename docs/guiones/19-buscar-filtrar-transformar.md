---
titulo: "Lección 19: Buscar, filtrar y transformar"
modulo: Algoritmos y pruebas
tipo: scrim
archivo: fundamentos-19.mp3
estado: audio_generado
---

Ya sabes arrays, funciones y contratos de métodos. Ahora elegirás una operación según la forma del resultado que necesitas.

Imagina que estás construyendo algo real. Una colección puede responder preguntas distintas. Confundir encontrar uno, seleccionar varios y transformar todos produce estructuras equivocadas.

La forma más útil de pensarlo es esta: buscar responde si existe o entrega un elemento; filtrar conserva varios; transformar produce un valor nuevo por cada elemento.

La forma del resultado nos ayuda a escoger: intención existe: booleano. Intención selecciona: lista posiblemente más corta. Intención transforma: lista de igual longitud.

Mira qué ocurre en un caso concreto. includes recibe el valor buscado y devuelve un booleano. filter recibe una función y conserva los elementos para los que esa función devuelve true. map recibe otra función y produce un resultado por cada elemento.

Veamos una búsqueda completa con dos nombres distintos. includes compara el buscado con cada elemento hasta encontrarlo. Para Luis devuelve true; para Marta llega al final y devuelve false.

Este es el fallo que más se repite. map no elimina elementos y filter no los transforma. Cuando entregas una función a uno de estos métodos, escribes su nombre sin paréntesis para que el método la llame con cada dato.

En “Elige la operación por su resultado”, empieza por decidir qué forma debe tener la salida. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Prueba después una búsqueda que falle y otra que tenga éxito. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Cambia de dominio sin cambiar la pregunta por la forma del resultado. En una lista de precios, usa includes para preguntar por un valor exacto, filter para conservar los menores de cien y map para crear etiquetas de texto.

Antes de elegir un método, describe la salida: un sí o no, un elemento, varios elementos o una lista transformada. Esa decisión suele revelar la herramienta correcta.
