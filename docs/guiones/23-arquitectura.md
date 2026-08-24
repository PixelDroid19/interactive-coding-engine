---
titulo: "Lección 23: Arquitectura para una app pequeña"
modulo: Estado, módulos y arquitectura
tipo: scrim
archivo: fundamentos-23.mp3
estado: audio_generado
---

Ya identificas estado, reglas, módulos y dependencias. Arquitectura significa decidir cómo cooperan esas partes sin mezclar sus responsabilidades.

Aquí aparece una dificultad muy común. Al crecer una app, cada cambio duele si no está claro dónde viven los datos, las reglas, la coordinación y la interfaz.

Antes de mirar la sintaxis, piensa así: arquitectura no es memorizar nombres: es asignar una responsabilidad a cada parte y permitir dependencias en una dirección comprensible.

Repartamos el trabajo antes de escribir archivos: datos guardan estado; reglas calculan; coordinación responde a eventos; interfaz renderiza. Las reglas no importan la interfaz.

Probemos la idea con datos pequeños. crearResumen es una regla porque recibe datos y devuelve texto sin consultar la página. Coordinación puede llamarla después de un evento y entregar su resultado a render.

La frontera se entiende mejor siguiendo un único resultado. crearResumen pertenece a reglas porque solo recibe números y devuelve texto. El DOM puede mostrar su retorno sin que la regla conozca la página.

Si el resultado no coincide, revisa esto primero. Crear carpetas llamadas datos y vistas no arregla una dependencia invertida. Si una regla necesita document, ya no puede probarse ni reutilizarse fuera de esa pantalla.

Corrige la dependencia en “Coloca la regla en la frontera correcta”. Lee el contrato, predice un caso y cambia únicamente la regla incompleta.

Usa otros datos para comprobar que la regla no depende del ejemplo visible. Usa datos diferentes al ejemplo para confirmar que resolviste la regla completa.

Prueba la arquitectura con una aplicación diferente. Diseña una app de lecturas con estado, reglas, coordinación e interfaz. Para cada flecha explica qué dato cruza la frontera y por qué la dirección es necesaria.

La arquitectura de una aplicación pequeña debe ayudarte a responder tres preguntas: dónde viven los datos, dónde se aplican las reglas y quién actualiza la interfaz.
