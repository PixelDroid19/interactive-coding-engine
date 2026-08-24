# Diseño curricular ampliado: Fundamentos para desarrollar

## Propósito

Convertir el curso actual en una ruta de 24 lecciones para personas que nunca han programado. Al terminar, el estudiante no solo debe reconocer sintaxis de JavaScript: debe poder representar un problema, dividirlo, construir una solución pequeña, comprobarla, depurarla y explicar cómo circulan los datos entre sus partes.

La ruta seguirá usando JavaScript y desarrollo frontend como contexto concreto. Los hábitos mentales —descomposición, contratos, seguimiento de estado, casos límite, pruebas y separación de responsabilidades— deben ser transferibles a otros lenguajes y áreas.

## Resultado observable

Una persona que complete la ruta podrá:

1. Leer código pequeño y seguir su ejecución sin adivinar.
2. Representar un proceso mediante pseudocódigo, diagramas de flujo, tablas de seguimiento y diagramas de dependencias sencillos.
3. Elegir entre una condición, un bucle, una función, una colección o un método según el problema.
4. Usar métodos comunes de strings y arrays entendiendo receptor, argumentos, retorno y efectos.
5. Diseñar algoritmos de recorrido, conteo, acumulación, búsqueda, filtrado, transformación y validación.
6. Identificar entradas, reglas, estado, salidas, eventos y casos límite.
7. Depurar mediante reproducción, hipótesis, aislamiento, cambio y verificación.
8. Diseñar casos de prueba normales, límite e inválidos.
9. Separar datos, lógica e interfaz y reconocer dependencias entre módulos.
10. Construir un proyecto frontend pequeño a partir de un problema, un diagrama, un plan de pruebas y una arquitectura elemental.

## Límites pedagógicos

- No se enseñan frameworks, asincronía, backend, bases de datos, autenticación ni despliegue en esta ruta.
- No se usan closures, recursión, búsqueda binaria, estructuras especializadas, patrones de diseño formales o notación Big O como prerrequisitos.
- Puede explicarse la intuición de costo —una pasada, varias pasadas, bucles anidados— sin exigir notación matemática.
- Ningún ejemplo puede usar una capacidad que no haya sido introducida previamente.
- Los diagramas representan código que el estudiante ya puede leer o código que se explicará inmediatamente en esa misma lección.
- Las soluciones se validan por comportamiento o por decisiones semánticas; no por una única línea textual cuando existen varias soluciones correctas.

## Arquitectura de la ruta

### Nivel 1: Escribir y comprender programas pequeños

Conserva y enriquece las 14 lecciones existentes.

| # | Lección | Capacidades principales | Representación mental |
|---|---|---|---|
| 1 | Tu primer programa | instrucciones, strings, llamadas, consola | secuencia vertical |
| 2 | Pensar en pasos | descomposición, comentarios, entrada–proceso–salida | pseudocódigo cotidiano |
| 3 | Variables y tipos | `const`, `let`, string, number, boolean | tabla de estado |
| 4 | Operadores y expresiones | cálculo, comparación, lógica booleana | árbol simple de expresión |
| 5 | Condicionales | `if`, `else if`, `else`, orden de decisiones | diagrama de flujo y tabla de decisión |
| 6 | Bucles | inicio, condición, paso, límites | tabla de iteraciones |
| 7 | Funciones y contratos | parámetros, retorno, llamada, responsabilidad | caja entrada–salida |
| 8 | Arrays | índices, longitud, recorrido, cambios | fila indexada |
| 9 | Objetos | propiedades, acceso y agrupación | ficha con campos |
| 10 | La página y el DOM | elementos, ids, propiedades | árbol HTML simplificado |
| 11 | Eventos y botones | espera, callback, clic | flechas evento → función → cambio |
| 12 | Inputs y formularios | lectura, transformación, salida | flujo entrada–proceso–salida |
| 13 | Listas en la página | render, recorrido y creación de elementos | datos → filas visibles |
| 14 | Proyecto 1: lista de tareas | estado y renderizado | arquitectura datos–lógica–interfaz |

### Nivel 2: Pensar como desarrollador

Añade 10 lecciones nuevas después del primer proyecto.

| # | Lección | Requiere | Introduce | Evidencia de dominio |
|---|---|---|---|---|
| 15 | Depurar sin adivinar | lecciones 1–14 | reproducción, hipótesis, aislamiento, verificación | localiza y corrige un fallo sin cambiar piezas irrelevantes |
| 16 | Métodos y documentación | strings, arrays, funciones | receptor, método, argumento, retorno, mutación, consulta de API | elige y usa un método por su contrato, no por ensayo y error |
| 17 | Pseudocódigo y diagramas | control de flujo y funciones | símbolos de flujo, decisiones, bucles y trazado | convierte una necesidad en pseudocódigo y diagrama coherentes |
| 18 | Patrones de algoritmos | arrays, bucles, funciones | contar, acumular, mínimo, máximo | implementa un recorrido de una pasada y explica su estado |
| 19 | Buscar, filtrar y transformar | métodos y patrones | búsqueda lineal, selección y transformación | elige entre bucle y método y justifica la decisión |
| 20 | Casos límite y pruebas | funciones, condicionales, algoritmos | particiones, límites, inválidos, regresión, costo intuitivo | diseña pruebas que descubren fallos reales |
| 21 | Estado y flujo de datos | DOM, eventos, render | estado, transiciones, fuente de verdad, flujo unidireccional | dibuja y corrige el flujo de una interacción |
| 22 | Responsabilidades y módulos | funciones, objetos, estado | cohesión, dependencia, `export`/`import`, interfaz pública | divide un programa sin crear dependencias circulares |
| 23 | Arquitectura para una app pequeña | módulos y flujo | capas datos–reglas–interfaz, fronteras y decisiones | propone una arquitectura y explica cada flecha |
| 24 | Proyecto final guiado | toda la ruta | diseño, implementación, pruebas, depuración y retrospectiva | construye una app desde requisitos y diagramas sin sintaxis nueva |

## Anatomía obligatoria de cada lección

Cada lección debe incluir, en este orden:

1. **Problema real:** una situación concreta y por qué el concepto ayuda.
2. **Modelo mental:** explicación en lenguaje cotidiano antes de mostrar sintaxis.
3. **Representación:** diagrama, pseudocódigo, tabla o flujo correspondiente.
4. **Ejemplo trabajado:** el instructor predice, escribe, ejecuta y compara.
5. **Seguimiento:** el estudiante observa cómo cambian datos, condiciones o llamadas.
6. **Práctica guiada:** cambia una sola decisión con ayuda progresiva.
7. **Lectura complementaria:** definición, segundo ejemplo, errores comunes y preguntas frecuentes.
8. **Práctica independiente:** programa distinto al ejemplo, sin solución visible.
9. **Depuración:** programa roto diferente que exige localizar la causa.
10. **Transferencia:** pregunta breve sobre cómo usar la idea en otro contexto.

Las pistas deben progresar desde orientación conceptual hasta una indicación concreta. La última pista puede señalar la operación necesaria, pero no debe entregar el programa final completo. “Ver cómo se resuelve” aparece solamente después de consumir las pistas y muestra explicación causal antes que código.

## Nuevas prácticas de razonamiento

El curso necesita un tipo de actividad no limitado al editor. Se añadirá `ReasoningExerciseItem` con estas variantes:

- `sequence`: ordenar pasos o instrucciones.
- `trace-table`: completar valores por línea o iteración.
- `flowchart`: conectar inicio, proceso, decisión y salida.
- `decision-table`: relacionar condiciones con resultados.
- `dependency-map`: conectar módulos y señalar la dirección permitida.

La vista `ReasoningPracticeView` mostrará una actividad a la vez, feedback inmediato en español, pistas escalonadas y una explicación final. Las respuestas se validarán con datos estructurados, no comparando posiciones visuales absolutas.

En el roadmap, estas prácticas usan una acción propia llamada **Piensa**, distinta de **Abre la clase**, **Lee** y **Depura**.

## Diagramas

Los diagramas serán componentes SVG/HTML accesibles con textos visibles; no imágenes rasterizadas con texto incrustado. Deben:

- funcionar en modo oscuro;
- tener versión lineal para lectores de pantalla;
- usar flechas con etiquetas como “sí”, “no”, “dato” o “evento”;
- permitir resaltar el nodo relacionado con el momento de la cinta;
- evitar notación profesional no explicada;
- conservar el lenguaje visual CodeSilk.

Se crearán cinco componentes reutilizables: `SequenceDiagram`, `FlowchartDiagram`, `TraceTable`, `DataFlowDiagram` y `ModuleDependencyDiagram`.

## Métodos y documentación

La lección 16 distingue explícitamente:

- función independiente: `saludar(nombre)`;
- método: `nombre.toUpperCase()`;
- propiedad: `nombre.length`;
- método que devuelve un valor nuevo;
- método que modifica el array, como `push`;
- callback entregado a un método, sin introducir funciones flecha hasta explicar su forma.

El LSP en español debe describir receptor, parámetros, retorno, si existe mutación, un ejemplo mínimo y un error común. La lectura enseña a consultar una firma y a no memorizar catálogos de métodos.

## Algoritmos y lógica

Los algoritmos se enseñan como una secuencia finita con entrada, estado y salida. Cada patrón tiene:

- pseudocódigo;
- tabla de seguimiento;
- implementación con `for`;
- pruebas con lista vacía, un elemento y varios elementos;
- explicación del costo como cantidad de revisiones.

No se enseña “el algoritmo correcto” como receta única. Se compara cuándo conviene recorrer, buscar, filtrar o transformar y se exige justificar la elección con el resultado buscado y los datos disponibles.

## Arquitectura elemental

La arquitectura se presenta como decisiones sobre responsabilidades y dependencias, no como nombres de patrones. Para una app pequeña:

```text
Interfaz ──evento──> Coordinación ──llama──> Reglas
    ↑                    │                    │
    └────render──────────┴────nuevo estado────┘
                         │
                         └────lee/escribe──> Datos
```

El estudiante debe reconocer:

- qué parte conoce el DOM;
- qué función contiene una regla independiente;
- dónde vive el estado;
- quién coordina el evento;
- qué dependencia sería incorrecta;
- cómo probar las reglas sin abrir la página.

No se presentan MVC, Clean Architecture o DDD como vocabulario obligatorio.

## Proyecto final

El proyecto será un planificador personal con tareas, prioridad y filtro. No introduce sintaxis nueva. El recorrido obligatorio es:

1. Requisitos y casos fuera de alcance.
2. Historias de uso pequeñas.
3. Modelo de datos.
4. Diagrama de flujo para agregar y filtrar.
5. Tabla de casos de prueba.
6. Diseño de módulos y dependencias.
7. Workspace inicial con archivos separados.
8. Implementación por cortes verticales.
9. Fallo sembrado que debe depurarse.
10. Revisión final: qué cambiaría y por qué.

El proyecto se considera aprobado cuando las reglas puras y el flujo DOM pasan pruebas de comportamiento y el estudiante completa una explicación de su arquitectura.

## Preguntas frecuentes y prevención de sufrimiento innecesario

Cada lectura incluye entre tres y cinco preguntas reales de principiante, por ejemplo:

- “¿Por qué esto es `undefined`?”
- “¿Cuándo uso `let` y cuándo `const`?”
- “¿Por qué mi `if` no llega al segundo caso?”
- “¿Qué diferencia hay entre una función y un método?”
- “¿Cómo sé qué archivo debe contener esta función?”
- “¿Qué pruebo cuando el programa funciona con un ejemplo?”

Las respuestas deben explicar causa, señal observable, comprobación mínima y forma de prevenir el problema. No deben limitarse a dar una corrección.

## Modelo de datos curricular

`ScrimLessonData` se ampliará con:

- `mentalModel`: resumen de una frase;
- `frequentQuestions`: pregunta y respuesta;
- `representations`: ids de diagramas o tablas;
- `transferPrompt`: pregunta de aplicación;
- `masteryChecks`: capacidades observables.

`ReadingItem` añadirá preguntas frecuentes y un bloque de transferencia. `Course` aceptará `ReasoningExerciseItem` entre lectura y depuración cuando la lección lo necesite.

## Compatibilidad y migración

- Se mantienen los ids `fundamentos-01` a `fundamentos-14`.
- Las nuevas lecciones usan `fundamentos-15` a `fundamentos-24`.
- Los borradores de depuración siguen versionados por workspace y contrato de pruebas.
- El progreso existente se conserva por id.
- Las nuevas actividades usan claves de progreso propias y no marcan una lección como aprobada por solo ver la solución.
- Los audios existentes no se regeneran; todos los guiones nuevos quedan con `estado: pendiente_grabar` y los tiempos se consideran provisionales hasta recibir MP3.

## Organización técnica

- Cada lección nueva vive en `src/curriculum/fundamentos/lessonNN.ts`.
- Los workspaces 15–24 se agrupan por propósito en archivos pequeños, no en un único archivo monolítico.
- Lecturas y prácticas nuevas se dividen en módulos por nivel para evitar que `readings.ts` y `debugExercises.ts` sigan creciendo.
- Los diagramas viven en `src/components/reasoning/diagrams/`.
- La actividad de razonamiento vive en `src/components/reasoning/ReasoningPracticeView.tsx`.
- Los validadores estructurados viven en `src/engine/reasoningRunner.ts`.
- El roadmap continúa derivándose del curso y cada acción mantiene un destino distinto.

## Validación y aceptación

La ampliación se considera completa únicamente cuando:

1. Una prueba de integración demuestra que ningún requisito aparece antes de ser introducido.
2. Las 24 lecciones tienen objetivos, errores comunes, modelo mental, lectura, práctica y depuración.
3. Los guiones coinciden palabra por palabra con `narrationScript`.
4. Las actividades de razonamiento fallan inicialmente y aceptan respuestas estructuralmente equivalentes.
5. Ninguna práctica revela su solución antes de la acción explícita correspondiente.
6. El LSP en español cubre todos los métodos usados en las lecciones.
7. El proyecto final puede completarse utilizando únicamente capacidades introducidas.
8. `npm run lint`, `npm test`, `npm run build` y `git diff --check` terminan correctamente.
9. En navegador real se verifican escritorio y móvil: roadmap, clase, lectura, actividad Piensa, depuración y proyecto.
10. Se resuelven manualmente al menos una práctica de métodos, una de algoritmos, una de arquitectura y el flujo principal del proyecto final.

## Fuera de alcance

- Generar o reemplazar los MP3.
- Enseñar Git, terminal, HTTP, asincronía, backend, bases de datos o frameworks.
- Certificados, calificaciones competitivas o ranking.
- Evaluar creatividad con coincidencias textuales rígidas.
