---
titulo: "Lección 17: Pseudocódigo y diagramas"
modulo: Pensar como desarrollador
tipo: scrim
archivo: fundamentos-17.mp3
estado: audio_generado
---

Ya escribiste condiciones y funciones. Ahora separarás la lógica de la sintaxis para revisar todos los caminos antes de programarlos.

Aquí aparece una dificultad muy común. Una regla con varios caminos se vuelve confusa si empiezas por llaves y paréntesis sin decidir primero qué preguntas debe responder.

Antes de mirar la sintaxis, piensa así: el pseudocódigo nombra pasos; el diagrama muestra caminos. Ambos permiten revisar la lógica antes de comprometerse con sintaxis.

Dibujemos el recorrido completo con palabras: inicio; si solicitados es cero o menos, rechazar; si supera cupos, rechazar; en caso contrario, aceptar; fin.

Probemos la idea con datos pequeños. Las dos primeras condiciones son guardas: cada una rechaza un caso inválido y termina con return false. Solo si ambas se superan, la última línea devuelve true.

Sigamos una reserva concreta desde la primera pregunta. Para cinco cupos y dos solicitados, la primera pregunta es no, la segunda también es no y el flujo llega a aceptar.

Si el resultado no coincide, revisa esto primero. Un diagrama con una rama sin salida está incompleto. En código, devolver true al principio oculta las demás decisiones aunque la sintaxis sea válida.

Convierte el recorrido en código en “Traduce el flujo a código”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Antes de avanzar, recorre un caso aceptado y dos rechazados. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Lleva ahora el diagrama a una regla cotidiana. Dibuja primero el flujo para retirar dinero: rechaza cantidades no positivas, rechaza las que superan el saldo y acepta las demás. Luego tradúcelo a if.

Si puedes explicar cada camino antes de escribir llaves y paréntesis, el código deja de ser una adivinanza y pasa a ser la traducción de un plan.
