---
titulo: "Lección 16: Métodos y documentación"
modulo: Pensar como desarrollador
tipo: scrim
archivo: fundamentos-16.mp3
estado: audio_generado
---

Ya conoces strings, objetos, propiedades y llamadas de función. Un método combina esas ideas: es una función disponible a través de un valor.

Imagina que estás construyendo algo real. Necesitas limpiar y comparar textos, pero memorizar una lista de métodos no explica qué reciben, qué devuelven ni qué modifican.

La forma más útil de pensarlo es esta: en receptor.metodo(argumento), el receptor ofrece una operación. La documentación es su contrato: parámetros, retorno, efecto y ejemplos.

Podemos leer la cadena de llamadas como una pequeña ruta: nombre es el receptor; trim no recibe argumentos y devuelve otro string; toUpperCase devuelve otro string en mayúsculas. Ninguno modifica el string original.

Mira qué ocurre en un caso concreto. nombre es el receptor. trim abre y cierra paréntesis sin argumentos y devuelve otro texto sin espacios exteriores. Sobre ese resultado, toUpperCase devuelve una versión en mayúsculas.

Mira cómo cambia el texto después de cada llamada. El valor pasa de dos espacios, ana y un espacio, a ana; después pasa a ANA. Cada llamada entrega el receptor de la siguiente.

Este es el fallo que más se repite. Escribir length con paréntesis confunde una propiedad con un método. También es un error asumir que trim cambia nombre: los strings no se modifican; cada método devuelve otro valor.

Es momento de aplicar el contrato en “Lee el contrato y normaliza”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Después cambia el nombre y también los espacios. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Puedes practicar la lectura de contratos con otro método. Consulta el contrato de endsWith y úsalo para decidir si un nombre termina en punto js. Identifica receptor, argumento, retorno y si existe mutación.

Cuando consultes documentación, busca siempre receptor, argumentos, retorno y efectos. Con esas cuatro preguntas puedes aprender métodos nuevos sin memorizarlos todos.
