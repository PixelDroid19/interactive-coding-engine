---
titulo: "Lección 20: Casos límite y pruebas"
modulo: Algoritmos y pruebas
tipo: scrim
archivo: fundamentos-20.mp3
estado: audio_generado
---

Ya sabes comparar, combinar condiciones y depurar con evidencia. Ahora aprenderás a elegir datos que puedan revelar una regla incompleta.

Aquí aparece una dificultad muy común. Una función puede pasar el ejemplo habitual y fallar exactamente en la frontera que define la regla.

Antes de mirar la sintaxis, piensa así: una prueba es una pregunta deliberada al programa. Combina caso normal, límites, vacío o inválido y un caso distinto al usado al implementar.

Partamos el dominio en grupos y fronteras: particiones: menor de dieciocho rechaza; de dieciocho a ciento veinte acepta; mayor de ciento veinte rechaza. Prueba junto a cada frontera.

Probemos la idea con datos pequeños. La primera comparación incluye dieciocho con mayor o igual. La segunda incluye ciento veinte con menor o igual. El operador y exige que ambas fronteras se cumplan.

Los valores de la frontera dejan visible la diferencia. Dieciocho debe entrar por igualdad; ciento veinte también. Diecisiete y ciento veintiuno deben caer fuera.

Si el resultado no coincide, revisa esto primero. Probar solo una edad intermedia no distingue mayor de mayor o igual. Cambiar el resultado esperado para hacerlo coincidir con el código elimina la utilidad de la prueba.

Diseña la corrección de “Haz visibles los límites” desde los casos de frontera. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Ejecuta los cuatro grupos: debajo, en cada límite y por encima. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Aplica la misma estrategia a una condición comercial. Para un envío gratis desde cincuenta, prueba cuarenta y nueve, cincuenta y cincuenta y uno. Explica qué error detecta cada caso.

Una buena prueba no intenta demostrar que el programa funciona; intenta encontrar dónde deja de cumplir la regla. Por eso los límites son tan valiosos.
