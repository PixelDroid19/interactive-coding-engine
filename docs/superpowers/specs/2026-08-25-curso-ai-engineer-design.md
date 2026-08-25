# Curso AI Engineer: diseño

## Objetivo

Crear un cuarto curso integrado en la plataforma. El curso enseña a construir funciones de IA con modelos existentes. Cubre el roadmap de AI Engineer de roadmap.sh, pero ordena los temas por dependencia. Una persona no verá RAG antes de entender embeddings, búsqueda y contexto.

El curso no enseña a entrenar un LLM desde cero. Sí explica qué ocurre durante entrenamiento, ajuste e inferencia para que el estudiante pueda elegir una técnica con criterio.

## Decisiones aprobadas

- El curso funciona sin una cuenta externa y sin claves.
- Cada práctica de programación tiene una versión JavaScript y otra Python.
- Python corre con Pyodide 314.0.6 dentro de un Web Worker.
- JavaScript sigue usando el Worker aislado del motor actual.
- Los embeddings locales se calculan en el navegador con Transformers.js.
- Las respuestas de chat usadas en pruebas son deterministas. No dependen de una API ni cambian entre ejecuciones.
- El estudiante puede conectar una API desde el navegador como opción. La clave vive solo en memoria y se borra al recargar.
- La interfaz explicará que una clave en el navegador puede verse con las herramientas de desarrollo. Esta opción sirve para aprender, no para publicar una aplicación.
- Los proyectos exportados usan `.env` y una capa de proveedor. Esa capa podrá moverse a un backend en una fase futura.
- No se generan audios. Las clases usan subtítulos, código, puntero, diagramas y vista previa sin TTS.

## Perfil de entrada

El curso parte de estas habilidades:

- Variables, funciones, arrays o listas y objetos o diccionarios.
- Condicionales y bucles.
- JSON.
- Funciones asíncronas básicas.
- Uso básico de una terminal.

El módulo cero repasa lo necesario. Si una persona nunca ha programado, la plataforma le recomienda terminar Fundamentos y el primer bloque de JavaScript.

## Método de enseñanza

Cada concepto sigue el mismo orden:

1. Problema concreto.
2. Modelo mental.
3. Diagrama.
4. Ejemplo trabajado.
5. Lectura con fuentes.
6. Práctica en el lenguaje elegido.
7. Laboratorio con otro programa roto.
8. Actividad de razonamiento.
9. Transferencia a otro caso.

La clase no entrega el programa de la práctica. El ejemplo y el ejercicio usan dominios distintos. Las pistas reducen el problema una vez cada una. La última pista explica el próximo paso, pero no contiene el archivo terminado.

## Estructura del curso

El curso tiene 79 clases, 14 módulos y 9 proyectos.

### Módulo 0: Preparar el trabajo

1. Qué hace un AI Engineer.
2. Del problema de producto a una función de IA.
3. Entorno JavaScript y Python.
4. HTTP, JSON, variables de entorno y claves.

Proyecto: comparar una regla determinista con una función que usa un modelo simulado.

### Módulo 1: Cómo funciona un LLM

5. Texto, tokens y tokenización.
6. Ventana de contexto y presupuesto de tokens.
7. Inferencia: predecir el siguiente token.
8. Temperatura, top-k y top-p.
9. Penalizaciones y repetición.
10. Entrenamiento, ajuste e inferencia.
11. Alucinaciones, límites y términos comunes.

Proyecto: simulador visual de sampling con una distribución pequeña y reproducible.

### Módulo 2: Prompt engineering

12. Anatomía de un prompt.
13. Rol, contexto y restricciones.
14. Zero-shot y few-shot.
15. Salidas estructuradas y JSON Schema.
16. Function calling, streaming y caché.

Proyecto: extractor de incidencias que devuelve JSON validado.

### Módulo 3: Context engineering

17. Prompt frente a contexto.
18. Fuentes y capas de contexto.
19. Selección, filtros y presupuesto.
20. Estado, historial y memoria.
21. Compactación y contexto largo.
22. Aislamiento, seguridad y fallos de contexto.

Proyecto: constructor de contexto que explica qué incluyó, qué descartó y por qué.

### Módulo 4: Modelos y proveedores

23. Modelos preentrenados, cerrados y abiertos.
24. Modelos locales y modelos alojados.
25. Elegir por calidad, coste, latencia y privacidad.
26. Hugging Face Hub, tareas y Transformers.js.
27. APIs, SDKs y contratos compatibles.

Proyecto: enrutador que elige un proveedor según requisitos observables.

### Módulo 5: Embeddings

28. Qué representa un embedding.
29. Crear embeddings locales.
30. Distancia, producto punto y similitud coseno.
31. Búsqueda semántica y clasificación.
32. Elegir y evaluar un modelo de embeddings.

Proyecto: buscador semántico local con ejemplos en español.

### Módulo 6: Bases vectoriales

33. Vector, documento, id y metadatos.
34. Indexar y consultar.
35. Filtros y búsqueda híbrida.
36. Elegir una base vectorial.

El curso compara Chroma, Pinecone, Weaviate, FAISS, LanceDB, Qdrant, Supabase y MongoDB Atlas. La práctica usa un índice local pequeño. El proyecto exportado incluye un adaptador de Qdrant.

### Módulo 7: RAG

37. Qué es RAG y cuándo usarlo.
38. RAG frente a fine-tuning.
39. Cargar, limpiar y dividir documentos.
40. Embedding e indexación.
41. Recuperación, filtros y reranking.
42. Generación con contexto y citas.
43. Evaluar y depurar un sistema RAG.

Proyecto: asistente de manuales con citas, casos sin respuesta y un conjunto de evaluación.

### Módulo 8: Agentes y MCP

44. Flujo fijo frente a agente.
45. Herramientas y esquemas.
46. Bucle manual de un agente.
47. ReAct y trazas de decisión.
48. Estado, memoria y límites.
49. Sistemas con varios agentes.
50. Host, cliente y servidor MCP.
51. Recursos, prompts, tools y transportes MCP.

Proyecto: agente de soporte que consulta recursos, propone una acción y pide confirmación antes de ejecutarla.

### Módulo 9: Seguridad, privacidad y uso responsable

52. Prompt injection directa e indirecta.
53. Salidas no confiables y permisos mínimos.
54. Claves, datos personales y retención.
55. Sesgos, pruebas adversarias y moderación.
56. Controles humanos, límites y registros.

Proyecto: laboratorio de ataques contra un RAG y un agente con herramientas.

### Módulo 10: Evaluación y observabilidad

57. Evaluaciones deterministas, humanas y con modelos.
58. Casos, métricas y conjuntos de referencia.
59. Evaluar recuperación y generación.
60. Trazas, coste y latencia.
61. Regresiones y seguimiento en producción.

Proyecto: tablero local que compara dos versiones de una función de IA.

### Módulo 11: IA multimodal y herramientas

62. Entender y generar imágenes.
63. Audio, voz y transcripción.
64. Aplicaciones multimodales.
65. Herramientas de desarrollo asistido.

Las clases explican APIs y modelos locales. No generan audio para la narración del curso.

### Módulo 12: Ecosistema y operación

66. AI Engineer, ML Engineer y AGI.
67. Casos de uso de embeddings: recomendación, clasificación y anomalías.
68. Ollama, LM Studio y OpenRouter.
69. Modelos y APIs de embeddings.
70. SDK directo y frameworks RAG.
71. SDKs y plataformas para agentes.
72. Construir y conectar MCP local o remoto.
73. Catálogos y fuentes de contexto.
74. Plataformas de observabilidad para LLM.
75. Identidad, moderación y límites de producción.
76. Video y APIs multimodales.
77. Comparar asistentes de desarrollo.

Este módulo completa los nombres y decisiones operativas del roadmap. Los presenta después de los fundamentos para que el estudiante compare herramientas por sus contratos, límites y evidencia, en vez de memorizar marcas.

### Módulo 13: Proyecto final

78. Diseñar un corte vertical y su evaluación.
79. Construir, atacar, medir y presentar.

El estudiante elige uno de estos productos:

- Asistente RAG para documentación.
- Buscador semántico con filtros.
- Agente con herramientas de solo lectura.
- Analizador multimodal con revisión humana.

La entrega incluye arquitectura, código, pruebas, conjunto de evaluación, informe de riesgos, medición de coste y guía de ejecución local.

## Runtime dual

### Contratos de datos

`WorkspaceFile.language` añade `python` y `markdown`.

Cada clase con código declara:

```ts
type CourseLanguage = 'javascript' | 'python';

interface PracticeVariant {
  workspace: WorkspaceSnapshot;
  tests: ChallengeTest[];
  packages?: string[];
}

interface LanguageVariants {
  javascript: PracticeVariant;
  python: PracticeVariant;
}
```

La preferencia se guarda por curso. Cambiar de lenguaje no convierte el código. Cada variante conserva su propio borrador.

### Python

Pyodide se carga una sola vez en un Worker dedicado. El runtime:

- Captura `stdout` y `stderr`.
- Convierte errores a mensajes con línea y columna.
- Interrumpe una ejecución que exceda el tiempo.
- Reinicia el Worker después de un timeout.
- Carga solo paquetes declarados por la práctica.
- No permite sockets ni acceso al sistema de archivos del equipo.
- Explica las limitaciones de CORS y red del navegador.

### JavaScript

El Worker actual se conserva. El contrato de ejecución se mueve detrás de una interfaz común:

```ts
interface CourseRuntime {
  run(workspace: WorkspaceSnapshot, options?: RuntimeOptions): Promise<RuntimeExecutionResult>;
  dispose(): void;
}
```

### Embeddings locales

Un Worker separado usa Transformers.js. La primera práctica descarga un modelo pequeño de feature extraction. La interfaz muestra progreso, tamaño, estado de caché y una alternativa determinista si el dispositivo no soporta el modelo.

La función compartida es:

```ts
interface LocalEmbeddingService {
  embed(texts: string[]): Promise<number[][]>;
  modelInfo(): Promise<{ id: string; dimensions: number; cached: boolean }>;
}
```

JavaScript llama el servicio directamente. Python recibe un módulo `aula_ai` que envía la petición al coordinador del navegador y devuelve una lista de listas.

### Modelo didáctico

`aula_ai.chat` usa respuestas guardadas y reglas simples. Las pruebas controlan salida estructurada, selección de herramientas y manejo de errores. No intentan medir creatividad.

El adaptador conserva el contrato que usará un proveedor real:

```ts
interface LearningModelProvider {
  complete(request: ModelRequest): Promise<ModelResponse>;
  embed?(texts: string[]): Promise<number[][]>;
}
```

### APIs desde el navegador

La conexión es opcional. El estudiante pega una clave en un campo de tipo password. La clave:

- Se guarda solo en memoria.
- No entra en `localStorage`, IndexedDB, logs ni archivos exportados.
- Se borra al cambiar de proveedor o recargar.
- Nunca se añade a una URL.

La interfaz muestra esta advertencia: "Una clave usada en el navegador puede verse con las herramientas de desarrollo. Úsala solo para aprender y limita su saldo y permisos. Para publicar, mueve esta llamada a un servidor."

## Narración silenciosa

`ScrimLessonData` añade `narrationMode?: 'audio' | 'speech' | 'silent'`.

Las clases de AI Engineer usan `silent`. El reloj sigue moviendo el puntero, los cambios de código, los capítulos, los diagramas y los subtítulos. `AudioNarrator` no crea un elemento de audio ni llama `speechSynthesis` en este modo.

## Diagramas y refuerzo

Se conservan secuencias, tablas, flujos y mapas de dependencias. Se añaden dos actividades:

- `vector-ranking`: ordenar documentos por cercanía a una consulta.
- `context-budget`: escoger bloques de contexto sin superar un presupuesto.

Las prácticas de RAG muestran el recorrido documento -> chunk -> embedding -> índice -> consulta -> recuperación -> contexto -> respuesta -> cita.

Los ejercicios de seguridad marcan límites de confianza entre usuario, documentos, modelo, herramientas y sistemas externos.

## Fuentes

Cada lectura incluye entre dos y cuatro fuentes. Se usa documentación oficial o el artículo original cuando existe.

Fuentes base:

- roadmap.sh, AI Engineer Roadmap.
- Hugging Face LLM Course y documentación de Transformers/Transformers.js.
- Pyodide, uso, Workers, paquetes y límites de WebAssembly.
- Documentación de OpenAI, Anthropic y Google para prompts, herramientas, streaming, caché y salidas estructuradas.
- Artículo original de RAG de Lewis et al.
- Sentence Transformers para embeddings y búsqueda semántica.
- Qdrant para vectores, metadatos, filtros e índices.
- Especificación de Model Context Protocol.
- OWASP GenAI Security Project.
- Documentación de Ragas, DeepEval y herramientas de observabilidad para sus conceptos propios.

Una fuente de proveedor se presenta como ejemplo de su API, no como una regla universal.

## Escritura

El contenido usa español directo. Reglas:

- Frases cortas.
- Voz activa.
- Un ejemplo concreto antes de una definición larga.
- Sin tono de venta.
- Sin frases de relleno.
- Sin listas creadas solo para tener tres puntos.
- Sin anglicismos cuando existe una palabra clara en español. El término original aparece entre paréntesis la primera vez.
- Las preguntas frecuentes responden dudas reales, no repiten la lectura.

Una prueba de calidad busca vocabulario prohibido, párrafos duplicados, guiones demasiado parecidos y prácticas que mencionen conceptos aún no enseñados.

## Archivos previstos

```text
src/curriculum/ai-engineer/
  course.ts
  factory.ts
  types.ts
  sources.ts
  modules/
  projects.ts
  reasoning.ts
  curriculumFlow.integration.test.ts
docs/guiones/ai-engineer/
src/engine/python/
src/engine/ai/
src/components/runtime/
```

Los módulos del currículo se dividen en archivos pequeños. No se crea un archivo único con las 79 clases.

## Validación

La entrega se acepta cuando:

- El catálogo muestra el cuarto curso sin alterar los otros tres.
- Las 79 clases abren.
- No hay `audioUrl` en el curso y no se reproduce voz.
- Todas las clases tienen lectura, razonamiento y laboratorio.
- Todos los temas de las capturas del roadmap aparecen en una clase o sección identificable.
- Cada lectura tiene fuentes válidas.
- Cada práctica de código tiene variantes JavaScript y Python con el mismo contrato observable.
- Los starters fallan y las soluciones de referencia pasan con datos distintos.
- Los embeddings locales funcionan en un navegador compatible y el fallback explica su limitación.
- Una API opcional no persiste la clave.
- Pyodide no bloquea la interfaz y se recupera de un timeout.
- Los nueve proyectos tienen requisitos, pasos, pruebas y criterios de entrega.
- Lint, pruebas y build pasan.
- Se recorren en navegador una clase conceptual, embeddings, RAG, agentes, Python, JavaScript, un proyecto y un error de red.

## Trabajo futuro

Un backend podrá implementar `LearningModelProvider` sin cambiar el currículo. Recibirá credenciales del servidor, aplicará límites y ocultará las claves al navegador. No forma parte de esta entrega.
