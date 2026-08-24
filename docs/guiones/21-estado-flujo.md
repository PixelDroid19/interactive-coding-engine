---
titulo: "Lección 21: Estado y flujo de datos"
modulo: Estado, módulos y arquitectura
tipo: scrim
archivo: fundamentos-21.mp3
estado: audio_generado
---

En la lista de tareas ya separaste el array de su representación. Ahora nombrarás ese dato como estado y seguirás cada cambio desde la acción hasta la vista.

Veamos por qué esto importa. Cuando un evento cambia el texto de la página y otra parte cambia los datos, ambos pueden dejar de representar la misma realidad.

Quédate con esta idea: el estado es la fuente de verdad. Una acción describe qué ocurrió, una regla produce el estado siguiente y render muestra ese estado.

Sigue la flecha desde la acción hasta la pantalla: evento clic; coordinación lee estado y acción; regla devuelve estado nuevo; render recibe ese valor y actualiza la vista.

Vamos a recorrer un ejemplo. actualizarCantidad recibe el estado anterior y una acción. No toca la página: devuelve el siguiente número. sumar aumenta, restar protege el cero y una acción desconocida conserva el valor.

Sigamos dos acciones para comprobar que la regla se mantiene. Si actual vale dos y la acción es sumar, la función devuelve tres. Si actual vale cero y pedimos restar, devuelve cero porque la regla impide una cantidad negativa.

Hay una trampa habitual. Leer el número desde el texto del DOM crea una segunda fuente de verdad. Otra parte puede cambiarlo y dejar la pantalla en desacuerdo con el estado real.

Aplica la transición pedida en “Produce el siguiente estado”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Ensaya sumar, restar desde cero y una acción desconocida. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Imagina ahora otra interfaz con estados pequeños. Modela un reproductor con estado pausado o reproduciendo. Cada botón solicita una transición y la interfaz solo muestra el estado recibido.

Cuando exista estado, deja una sola fuente de verdad y haz que cada cambio siga un recorrido visible. Así la pantalla no termina contando una historia distinta.
