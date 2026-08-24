---
titulo: "Lección 11: Eventos y botones"
modulo: Construir una página interactiva
tipo: scrim
archivo: fundamentos-11.mp3
estado: audio_generado
enfoque: principiantes
---

En la lección anterior la página cambió en cuanto ejecutamos el programa. Las interfaces reales también necesitan esperar acciones. Un evento es el aviso que envía el navegador cuando ocurre algo, como un clic o una tecla.

Primero encontramos el botón y el párrafo con sus ids. Después definimos responderAlClick. Recuerda que definir una función solo prepara sus instrucciones; todavía no las ejecuta.

El método addEventListener permite escuchar eventos. Primero indicamos el evento click y después entregamos el nombre de la función sin paréntesis. Así el navegador sabe qué función debe llamar cuando ocurra el clic.

El mensaje cambia solamente al pulsar el botón. Si escribiéramos responderAlClick con paréntesis al conectar el evento, la función se ejecutaría en ese momento en vez de quedar preparada para el clic.

Ahora modifica la respuesta de la función. El evento ya está conectado. Ejecuta el programa y comprueba dos momentos: antes del clic debe verse el mensaje inicial y después debe aparecer tu nuevo texto.

Ya puedes hacer que una página espere una acción y responda cuando ocurra. En la siguiente lección leeremos el texto que una persona escribe antes de construir la respuesta.
