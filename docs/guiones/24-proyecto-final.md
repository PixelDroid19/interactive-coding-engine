---
titulo: "Lección 24: Proyecto final: planificador personal"
modulo: Proyecto final guiado
tipo: scrim
archivo: fundamentos-24.mp3
estado: audio_generado
---

Ya construiste una aplicación pequeña y aprendiste a depurar, probar y separar responsabilidades. Ahora integrarás esas herramientas sin añadir sintaxis sorpresa.

Veamos por qué esto importa. Construir una app completa parece inmanejable si intentas escribir toda la interfaz antes de definir requisitos, datos, reglas y pruebas.

Quédate con esta idea: construye por cortes verticales: una historia pequeña atraviesa dato, regla, evento y vista; se prueba antes de añadir la siguiente.

Este será el orden de construcción: requisito; modelo de tarea; regla de validación; casos de prueba; flujo agregar; render; filtro; revisión de dependencias.

Vamos a recorrer un ejemplo. esPlanValido es la primera regla del corte. trim permite tratar un texto de espacios como vacío. Como value entrega texto, la prioridad válida debe ser exactamente uno, dos o tres entre comillas.

Probemos primero la regla central del proyecto. Con el texto Estudiar y la prioridad dos, ambas comprobaciones se cumplen y el plan se acepta. Si el texto solo contiene espacios, se rechaza antes de modificar el estado.

Hay una trampa habitual. Empezar por colores, filtros o almacenamiento deja la regla principal sin evidencia. También es un error validar solo el texto visible y guardar datos inválidos en el estado.

Construye la primera pieza en “Primera regla del planificador”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Prueba un plan válido, uno vacío y otro con una prioridad fuera del rango. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Por último, reutiliza el proceso con otro producto. Convierte el planificador en un registro de hábitos: conserva el flujo requisito, modelo, regla, casos, evento y vista; cambia únicamente los datos y las reglas del dominio.

Ya tienes un proceso completo: define una historia pequeña, representa sus datos, escribe una regla, pruébala y conéctala a la interfaz. Construye la siguiente pieza solo cuando esa funcione.
