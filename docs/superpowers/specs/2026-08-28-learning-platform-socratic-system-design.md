# Sistema de aprendizaje adaptativo y tutor socrático local

## Alcance

La plataforma debe enseñar Fundamentos, JavaScript y Web Components con Lit mediante una progresión verificable: explicación, lectura, práctica, variación, transferencia y depuración. El sistema funciona completamente en el navegador, no usa claves ni APIs de pago y deja sus contratos de datos preparados para sustituir el almacenamiento local por un backend.

El tutor es transversal a los cursos de programación. El curso de IA conserva sus laboratorios como contenido de aprendizaje y no recibe el tutor flotante para evitar mezclar producto y objeto de estudio.

## Principios

1. Ninguna respuesta del tutor sustituye el razonamiento del estudiante: primero pregunta, después ofrece una pista y solo explica directamente cuando la persona ya formuló una hipótesis o lo solicita expresamente.
2. El código, la lección, los errores visibles, las pruebas y el historial corto forman el contexto. No se envían datos fuera del navegador.
3. Descargar un modelo requiere un gesto explícito, muestra tamaño estimado y conserva el modelo en la caché de WebLLM.
4. WebGPU es obligatorio. No existe una respuesta simulada, ruta CPU ni API remota oculta.
5. Completar una pantalla no equivale a dominar. El dominio se registra por capacidad: reconocer, explicar, producir, modificar, transferir y depurar.
6. El siguiente bloque se desbloquea cuando las capacidades requeridas alcanzan evidencia suficiente; siempre se ofrece una recuperación concreta para el hueco detectado.
7. Todo estado se escribe mediante un repositorio versionado. La interfaz del repositorio no conoce `localStorage`, de modo que un adaptador HTTP futuro pueda conservar los mismos contratos.
8. Los temas usan tokens semánticos y un registro de temas. Los componentes no consultan clases globales para decidir colores ni inyectan atributos mediante observadores del DOM.

## Arquitectura

### Dominio de aprendizaje

`LearningRepository` persiste un `LearningProfile` versionado. El perfil contiene evidencias por habilidad y capacidad, una cola de repaso, entradas de cuaderno, intentos de examen, preferencias del tutor y conversaciones breves por lección. `LocalLearningRepository` es el adaptador actual. Un futuro `HttpLearningRepository` podrá implementar la misma interfaz.

Las evidencias se producen desde acciones ya existentes:

- lectura completada → reconocer y explicar;
- razonamiento correcto → explicar;
- reto superado → producir y modificar;
- ejercicio de depuración → depurar;
- proyecto → transferir;
- variación posterior → modificar o transferir.

La puntuación se calcula por habilidad y capacidad, no por curso completo. Los repasos usan intervalos deterministas de 1, 3, 7, 14 y 30 días, ajustados por resultado. Una respuesta incorrecta vuelve a un día y genera una recuperación.

### Tutor local

`LocalGenerationService` sigue siendo el único adaptador de inferencia. Se amplía para listar modelos compatibles y compartir una única instancia durante la sesión. El tutor construye un paquete de contexto limitado con:

- objetivo, modelo mental, prerrequisitos y errores frecuentes de la actividad;
- archivo activo y fragmento relevante del workspace del estudiante;
- resultado reciente de pruebas o diagnóstico;
- dominio y huecos conocidos;
- últimos turnos de la conversación.

El prompt exige español sencillo, una pregunta por turno, ausencia de solución completa antes de dos intentos y referencias a líneas o conceptos presentes en el contexto. Los modos disponibles son `Pregunta`, `Pista`, `Revisar mi código` y `Practicar explicación`.

### Experiencias de dominio

- **Variación:** al superar una práctica se presenta un requisito nuevo que conserva el concepto y cambia datos o restricción.
- **Lectura mental:** el estudiante explica qué ocurrirá antes de ejecutar; la respuesta se guarda como evidencia de explicar.
- **Recuperación:** el roadmap señala la habilidad faltante y abre la lectura, práctica o repaso exacto que la entrena.
- **Repaso:** panel corto con tarjetas vencidas, respuesta libre y autoevaluación honesta.
- **Modo Líder:** entrevista sobre decisiones, límites y mantenibilidad del código actual.
- **Modo Examen:** mezcla predicción, explicación, modificación y depuración; devuelve estado verde, amarillo o rojo por capacidad.
- **Cuaderno:** una ficha editable por concepto con modelo mental, patrón, ejemplo propio y error personal.

## UI y temas

El tutor se abre desde un botón flotante discreto en el borde inferior derecho. En escritorio usa una hoja lateral de 380–440 px; en móvil ocupa una hoja inferior que deja visible el encabezado de la actividad. Conserva foco, soporta Escape, anuncia streaming y ofrece cancelar generación.

El tema normal mantiene papel cálido, grafito, sombras duras y amarillo marcador. Cyber conserva la estructura y densidad, sustituyendo tokens por superficies negras, amarillo eléctrico y acentos cian/magenta. Un `ThemeProvider` aplica `data-theme` y expone un registro extensible; `ThemeToggle` solo cambia el identificador. Los bordes aumentados se aplican con clases estables, no con un `MutationObserver` global.

## Diagramas pedagógicos

Solo se añaden cuando una relación espacial o temporal enseña mejor que el texto. Se crean con Diagram Design como HTML autocontenido, perfil CodeSilk y variantes normal/cyber. `ReadingSection.diagram` referencia ambos recursos y `ReadingView` selecciona la variante del tema. El primer conjunto cubre: variable y memoria, flujo condicional, llamada de función, bucle de eventos, DOM/eventos, Shadow DOM y ciclo reactivo de Lit.

## Calidad de escritura

Los guiones y lecturas de Fundamentos, JavaScript y Lit deben:

- sonar como una persona que acompaña, no como documentación generada;
- definir cada término antes de usarlo;
- alternar frases cortas con ejemplos concretos;
- explicar causa, observación y forma de comprobar;
- incluir dudas reales sin repetir plantillas;
- no adelantar la solución de prácticas;
- mantener el texto hablado y los subtítulos sincronizados cuando exista audio.

## Validación

La entrega exige pruebas unitarias del dominio y adaptadores, integración de cada modo, suite curricular de escritura, accesibilidad del tutor, persistencia/migración, selector de modelos y temas. En navegador se validan escritorio y móvil, normal y cyber, con estados sin modelo, descarga, listo, streaming, cancelación, error WebGPU, contexto de código, repaso, bloqueo/recuperación, examen y cuaderno. Finalmente deben pasar `npm test`, `npm run lint`, `npm run build` y `git diff --check`.

## Exclusiones

- No se crea backend ni autenticación.
- No se envían conversaciones, código o documentos a servicios externos.
- No se añade una segunda librería de inferencia.
- No se regeneran audios sin una petición separada; las modificaciones con audio existente conservan la redacción hablada o se marcan explícitamente para nueva grabación.
- No se suben commits ni cambios al remoto.
