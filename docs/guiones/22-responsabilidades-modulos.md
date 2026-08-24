---
titulo: "Lección 22: Responsabilidades y módulos"
modulo: Estado, módulos y arquitectura
tipo: scrim
archivo: fundamentos-22.mp3
estado: audio_generado
---

Ya separaste reglas puras, estado e interfaz. Ahora aprenderás a agrupar responsabilidades y a reconocer qué parte puede depender de cuál.

Imagina que estás construyendo algo real. Un archivo que conoce botones, cálculos, datos y render se vuelve difícil de entender y probar sin romper algo cercano.

La forma más útil de pensarlo es esta: un módulo es una caja de responsabilidades relacionadas con una puerta pequeña. export abre una capacidad; import la solicita desde otro archivo.

El dibujo de dependencias queda así: interfaz.js depende de reglas.js; reglas.js calcula sin conocer el DOM. La flecha apunta hacia la capacidad usada y no vuelve en círculo.

Mira qué ocurre en un caso concreto. precioConImpuesto recibe dos números y devuelve otro número. Por eso puede vivir en un archivo de reglas. La interfaz usa el resultado, pero la regla no necesita conocer la página ni sus botones.

Fíjate en los datos que entran y salen de la regla. precioConImpuesto recibe solo datos y devuelve un número. Por eso puede probarse sin página y reutilizarse desde la interfaz.

Este es el fallo que más se repite. Separar código en archivos no crea módulos útiles si todos importan a todos. Una dependencia circular hace que ninguna parte tenga una frontera clara.

Separa el cálculo en “Aísla una regla pura”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Cambia precio e impuesto para confirmar que la regla usa ambos parámetros. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Haz el mismo reparto en una calculadora de gastos. Divide una calculadora de gastos en datos, reglas e interfaz. Escribe qué exporta cada módulo y dibuja las flechas de importación antes de crear archivos.

Separar módulos no consiste en crear muchos archivos. Consiste en dar a cada parte una responsabilidad clara y reducir lo que necesita conocer de las demás.
