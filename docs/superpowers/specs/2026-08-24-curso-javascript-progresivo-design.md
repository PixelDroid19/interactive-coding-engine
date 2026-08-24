# Diseño: curso de JavaScript progresivo y plataforma multicurso

## Objetivo

Añadir un curso de JavaScript independiente sin modificar el contenido de Fundamentos. La plataforma debe permitir elegir curso, conservar el contexto del curso activo y guardar progreso sin colisiones.

## Principios pedagógicos

Cada tema sigue la misma secuencia:

1. Recuperar un conocimiento previo concreto.
2. Explicar el concepto nuevo con lenguaje cotidiano y un modelo mental.
3. Mostrar un ejemplo pequeño y recorrerlo paso a paso.
4. Leer una ampliación con errores comunes y documentación oficial.
5. Resolver una práctica distinta al ejemplo, validada por comportamiento.
6. Transferir la idea a otro problema.

Ningún ejemplo, reto, pista o prueba puede exigir una API o sintaxis que aún no se haya enseñado. Las pistas orientan hacia el contrato y la evidencia; no contienen la solución final.

## Progresión

El curso tendrá 24 clases agrupadas en ocho módulos:

1. Sintaxis y valores: ejecución, variables, tipos, operadores.
2. Control y funciones: decisiones, repetición, funciones y alcance.
3. Colecciones: strings, arrays, métodos de arrays, objetos y referencias.
4. Interfaz web: DOM, eventos y renderizado de colecciones.
5. Código resistente: errores, depuración, JSON y almacenamiento.
6. Asincronía: modelo asíncrono, promesas, `async/await`, HTTP y `fetch`.
7. Organización: módulos, clases, Web Components y Shadow DOM.
8. Calidad y proyecto: pruebas y una aplicación final construida por cortes verificables.

## Investigación guiada

Las lecturas enseñan a consultar documentación, no solo enlazan páginas. Para cada método se pide identificar:

- receptor;
- parámetros;
- valor de retorno;
- si modifica el dato original;
- caso mínimo reproducible.

Las fuentes principales son MDN y, como ampliación técnica, la especificación ECMAScript de TC39.

## Multicurso

Se añadirá un catálogo de cursos como entrada de la aplicación. Cada curso proporciona sus propios módulos, scrims, términos y prácticas. La ruta persistida conserva `courseId`; volver al roadmap mantiene el curso activo y “Cursos” vuelve al catálogo. Los identificadores del nuevo curso usarán el prefijo `javascript-` para evitar colisiones con `fundamentos-`.

## Contenido de una clase

Cada clase de JavaScript incluye:

- guion hablado natural y subtítulos idénticos;
- ejemplo trabajado que no coincide con la respuesta de la práctica;
- lectura complementaria;
- bloque “Cómo investigarlo” con fuente oficial;
- práctica de razonamiento con tabla, secuencia, diagrama o mapa de dependencias;
- dudas frecuentes y errores comunes;
- reto dentro de la clase;
- laboratorio de depuración independiente con al menos dos casos.

## Validación

Se comprobará por integración que:

- los dos cursos aparecen y se abren de forma independiente;
- Fundamentos conserva sus 24 clases y datos actuales;
- cada lección JavaScript tiene lectura y práctica posteriores;
- los requisitos de cada lección son subconjunto de lo enseñado antes;
- ningún laboratorio incluye `solutionFiles`;
- los starters fallan y las soluciones válidas pasan varios casos;
- navegación anterior, siguiente, roadmap y catálogo conserva el curso correcto;
- las vistas visibles funcionan en navegador y en modo oscuro.
