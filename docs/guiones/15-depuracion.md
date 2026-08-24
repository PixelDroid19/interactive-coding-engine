---
titulo: "Lección 15: Depurar sin adivinar"
modulo: Pensar como desarrollador
tipo: scrim
archivo: fundamentos-15.mp3
estado: audio_generado
---

Ya sabes seguir funciones, parámetros y operadores. Ahora usarás esas piezas para encontrar la primera diferencia entre lo esperado y lo observado.

Veamos por qué esto importa. Un total funciona con algunos números por casualidad y falla con otros. Cambiar líneas al azar puede esconder la causa.

Quédate con esta idea: depurar es un ciclo: reproduce el fallo, escribe qué esperabas, aísla la primera diferencia, formula una hipótesis, cambia una cosa y vuelve a comprobar.

Antes de tocar el código, anotemos la evidencia: esperado doce; observado siete. Los parámetros están bien y la primera diferencia aparece en la operación de la función.

Vamos a recorrer un ejemplo. calcularTotal recibe precio y cantidad. El contrato pide un total, por eso ambos parámetros participan en una multiplicación y return entrega el número calculado.

Comparemos las dos operaciones con los mismos datos. Con precio cuatro y cantidad tres, la multiplicación produce doce. La suma produce siete; esa observación distingue las dos hipótesis.

Hay una trampa habitual. Cambiar el console.log o devolver doce directamente puede hacer pasar un ejemplo, pero no corrige la regla. La causa está dentro de la operación y debe funcionar con otros datos.

Ahora investiga tú el fallo de “Corrige con evidencia”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

No cierres el fallo con un solo ejemplo. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

El mismo método sirve para otro fallo. Usa el mismo ciclo para una función de descuento: escribe esperado y observado, localiza la primera diferencia y prueba un segundo precio antes de cerrar el fallo.

Quédate con el hábito: observa, formula una hipótesis, cambia una cosa y vuelve a comprobar. Esa secuencia vale más que acertar por casualidad.
