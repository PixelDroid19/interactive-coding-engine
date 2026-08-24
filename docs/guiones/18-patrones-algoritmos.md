---
titulo: "Lección 18: Patrones de algoritmos"
modulo: Algoritmos y pruebas
tipo: scrim
archivo: fundamentos-18.mp3
estado: audio_generado
---

Ya sabes recorrer arrays con un for y conservar valores en variables. Ahora convertirás ese recorrido en un patrón que puedas reconocer y explicar.

Veamos por qué esto importa. Muchos problemas parecen distintos, pero todos recorren una colección y recuerdan un resultado parcial.

Quédate con esta idea: en una pasada, el acumulador resume lo visto hasta ahora. Su valor inicial debe representar “todavía no he procesado ningún elemento”.

Una tabla sencilla nos deja ver cómo avanza el cálculo: tabla: antes total cero; lee dos y total dos; lee tres y total cinco; lee cinco y total diez.

Vamos a recorrer un ejemplo. total empieza en cero antes del bucle. En cada vuelta leemos el número que ocupa la posición i y guardamos la suma nueva. return aparece después del bucle porque necesitamos recorrer la lista completa.

Detengámonos en cada vuelta del bucle. Al inicio de cada vuelta, total contiene exactamente la suma de los elementos anteriores. Esa frase permite detectar una actualización ausente.

Hay una trampa habitual. Si declaras total dentro del bucle, cada vuelta borra lo acumulado. Y si sumas i en lugar del elemento que está en esa posición, acumulas índices, no los números de la lista.

Completa el patrón de “Completa el acumulador”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Compruébalo con una lista vacía y con otra lista de números. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

El acumulador también puede contar en vez de sumar. Para contar aprobados, conserva cantidad en vez de total y aumenta solo cuando una nota supera el límite. El recorrido es el mismo; cambia el estado parcial.

Un acumulador no es una receta para copiar. Es un valor que resume lo visto hasta ese momento. Si puedes decir qué resume, puedes construirlo.
