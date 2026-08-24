# Currículo Fundamentos Ampliado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la ruta actual en 24 lecciones que enseñen sintaxis, razonamiento, diagramas, métodos, algoritmos, pruebas, módulos y arquitectura elemental mediante clases, lecturas y prácticas verificables.

**Architecture:** Mantener el motor Scrim como reloj de las clases y ampliar el modelo curricular con metadatos pedagógicos y un nuevo tipo de práctica estructurada `reasoning`. Las lecciones 1–14 conservan ids y se enriquecen; las 15–24 se agregan como un segundo nivel. El roadmap, navegación y persistencia continúan derivados del `Course`.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind v4, CodeMirror 6, Vitest, SVG/HTML accesible.

**Spec:** `docs/superpowers/specs/2026-08-23-curriculo-fundamentos-ampliado-design.md`

## Global Constraints

- UI, guiones, feedback, documentación LSP y accesibilidad en español.
- No autoplay; el gesto de inicio sigue siendo obligatorio.
- Modo oscuro y lenguaje visual CodeSilk existentes.
- Ninguna capacidad puede utilizarse antes de ser introducida.
- Las prácticas de código validan comportamiento cuando sea posible.
- Las prácticas de razonamiento validan datos estructurados, no coordenadas.
- No revelar soluciones completas antes de la acción explícita correspondiente.
- Preservar el worktree sucio; no limpiar, descartar, resetear, commitear ni hacer push.
- Los audios 15–24 quedan pendientes; guiones y tiempos provisionales deben coincidir con `narrationScript`.

---

### Task 1: Modelo curricular y validador de razonamiento

**Files:**
- Modify: `src/types/curriculum.ts`
- Modify: `src/types/scrim.ts`
- Create: `src/engine/reasoningRunner.ts`
- Create: `src/engine/reasoningRunner.test.ts`

**Interfaces:**
- Produces: `ReasoningExerciseItem`, `ReasoningActivity`, `ReasoningAttempt`, `validateReasoningAttempt(activity, attempt)`.
- Consumes: ids de lección y progreso existentes.

- [ ] Definir variantes `sequence`, `trace-table`, `flowchart`, `decision-table` y `dependency-map` con contratos discriminados.
- [ ] Escribir pruebas que demuestren starter fallido, respuesta correcta, orden equivalente permitido y errores de configuración.
- [ ] Implementar validación determinista con feedback por paso y sin posiciones visuales.
- [ ] Ejecutar `npx vitest run src/engine/reasoningRunner.test.ts` y `npm run lint`.

### Task 2: Vista Piensa, diagramas y navegación

**Files:**
- Create: `src/components/reasoning/ReasoningPracticeView.tsx`
- Create: `src/components/reasoning/ReasoningPracticeView.integration.test.tsx`
- Create: `src/components/reasoning/diagrams/SequenceDiagram.tsx`
- Create: `src/components/reasoning/diagrams/FlowchartDiagram.tsx`
- Create: `src/components/reasoning/diagrams/TraceTable.tsx`
- Create: `src/components/reasoning/diagrams/DataFlowDiagram.tsx`
- Create: `src/components/reasoning/diagrams/ModuleDependencyDiagram.tsx`
- Modify: `src/App.tsx`
- Modify: `src/engine/persistence.ts`
- Modify: `src/components/curriculum/RoadmapHome.tsx`
- Modify: `src/curriculum/fundamentos/roadmap.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 1 activity and attempt contracts.
- Produces: ruta `reasoning`, acción de roadmap `Piensa`, progreso persistido y diagramas accesibles.

- [ ] Crear una prueba de integración que navegue roadmap → Piensa → responder → feedback → siguiente.
- [ ] Implementar controles por botones y selección; no depender de drag para accesibilidad.
- [ ] Implementar diagramas SVG/HTML con equivalente textual y etiquetas de flecha.
- [ ] Persistir intento y estado sin marcar completado al ver la explicación.
- [ ] Añadir estilos responsive oscuros y acción diferenciada en roadmap.
- [ ] Ejecutar pruebas de App, roadmap, persistencia y vista Piensa.

### Task 3: Metadatos pedagógicos y enriquecimiento 1–14

**Files:**
- Modify: `src/types/scrim.ts`
- Modify: `src/types/curriculum.ts`
- Modify: `src/curriculum/fundamentos/lesson01.ts` … `lesson14.ts`
- Modify: `src/curriculum/fundamentos/reading01.ts`
- Modify: `src/curriculum/fundamentos/readings.ts`
- Create: `src/curriculum/fundamentos/reasoningExercises.ts`
- Modify: `src/curriculum/fundamentos/curriculumFlow.integration.test.ts`

**Interfaces:**
- Produces por lección: `mentalModel`, `frequentQuestions`, `representations`, `transferPrompt`, `masteryChecks`.
- Produce prácticas Piensa para secuencia, tipos, operadores, condicionales, bucles, funciones, DOM, eventos y estado/render.

- [ ] Añadir pruebas de integración que exijan metadatos completos en las 14 lecciones.
- [ ] Enriquecer cada lectura con preguntas frecuentes y transferencia sin introducir sintaxis futura.
- [ ] Crear actividades estructuradas que representen el modelo mental de cada concepto.
- [ ] Insertar Piensa entre lectura y depuración solo cuando la representación aporta evidencia distinta.
- [ ] Verificar que el recorrido original y los ids de progreso se conservan.

### Task 4: Contenido 15–19

**Files:**
- Create: `src/curriculum/fundamentos/lesson15.ts` … `lesson19.ts`
- Create: `src/curriculum/fundamentos/thinkingWorkspaces.ts`
- Create: `src/curriculum/fundamentos/readingsThinking.ts`
- Create: `src/curriculum/fundamentos/debugExercisesThinking.ts`
- Modify: `src/curriculum/fundamentos/reasoningExercises.ts`
- Create: `docs/guiones/15-depuracion.md` … `19-buscar-filtrar-transformar.md`
- Modify: `src/curriculum/fundamentos/course.ts`
- Modify: `src/curriculum/fundamentos/roadmap.ts`

**Interfaces:**
- Produces lecciones 15 depuración, 16 métodos, 17 pseudocódigo/diagramas, 18 patrones algorítmicos y 19 búsqueda/filtrado/transformación.

- [ ] Escribir primero pruebas de progresión y workspaces iniciales que fallen sus retos.
- [ ] Crear clases con beats `speak/write/gesture/challenge` y tiempos provisionales válidos.
- [ ] Crear lecturas con segundo ejemplo, errores, FAQ y transferencia.
- [ ] Crear depuraciones distintas sin soluciones textuales rígidas.
- [ ] Crear al menos una actividad Piensa por lección.
- [ ] Sincronizar cada guion palabra por palabra con sus cues.
- [ ] Ejecutar las pruebas curriculares enfocadas.

### Task 5: Contenido 20–24 y proyecto final

**Files:**
- Create: `src/curriculum/fundamentos/lesson20.ts` … `lesson24.ts`
- Create: `src/curriculum/fundamentos/engineeringWorkspaces.ts`
- Create: `src/curriculum/fundamentos/readingsEngineering.ts`
- Create: `src/curriculum/fundamentos/debugExercisesEngineering.ts`
- Modify: `src/curriculum/fundamentos/reasoningExercises.ts`
- Create: `docs/guiones/20-casos-pruebas.md` … `24-proyecto-final.md`
- Modify: `src/curriculum/fundamentos/course.ts`
- Modify: `src/curriculum/fundamentos/roadmap.ts`

**Interfaces:**
- Produces lecciones 20 pruebas/casos límite, 21 estado/flujo, 22 módulos, 23 arquitectura y 24 proyecto final.
- Produce workspace modular del planificador con reglas puras y flujo DOM.

- [ ] Crear pruebas que demuestren que el proyecto solo requiere skills previamente introducidas.
- [ ] Implementar las cinco clases, lecturas, actividades Piensa y depuraciones.
- [ ] Diseñar proyecto por requisitos, modelo, flujo, casos, módulos e implementación vertical.
- [ ] Validar reglas puras, interacción DOM y explicación arquitectónica.
- [ ] Sincronizar guiones y cues.

### Task 6: LSP en español para métodos y módulos

**Files:**
- Modify: `src/editor/spanishLsp.ts`
- Modify: `src/editor/spanishLsp.test.ts`

**Interfaces:**
- Consume métodos realmente usados en 15–24.
- Produce documentación con receptor, parámetros, retorno, mutación, ejemplo y error común.

- [ ] Añadir pruebas para métodos de strings y arrays, además de `export`/`import`.
- [ ] Implementar entradas comprensibles y evitar catálogo no utilizado.
- [ ] Verificar autocompletado y hover con fragmentos reales del currículo.

### Task 7: Integración, migración y aceptación automática

**Files:**
- Modify: `src/curriculum/fundamentos/curriculumFlow.integration.test.ts`
- Modify: `src/curriculum/fundamentos/lessonChallenges.test.ts`
- Modify: `src/curriculum/fundamentos/debugExercises.test.ts`
- Modify: `src/App.test.tsx`
- Modify: `src/engine/persistence.test.ts`

**Interfaces:**
- Prueba la ruta completa de 24 lecciones y todas las actividades asociadas.

- [ ] Exigir 24 lecciones en orden, requisitos satisfechos y ausencia de temas fuera de alcance.
- [ ] Exigir objetivos, errores, modelos mentales, FAQ, transferencia y mastery checks.
- [ ] Exigir guion/subtítulo exacto, starters fallidos y soluciones equivalentes aceptadas.
- [ ] Probar migración de progreso y borradores versionados.
- [ ] Ejecutar `npm run lint`, `npm test`, `npm run build` y `git diff --check`.

### Task 8: Validación real en navegador

**Files:**
- No code expected; corregir los archivos responsables si aparecen fallos.

**Interfaces:**
- Evidencia final de comportamiento y presentación.

- [ ] Probar escritorio y 390×844 en modo oscuro.
- [ ] Recorrer roadmap → clase → lectura → Piensa → depuración → siguiente.
- [ ] Resolver manualmente métodos, algoritmo, arquitectura y proyecto.
- [ ] Verificar inicio con gesto, edición/fork, consola, preview y regreso al roadmap.
- [ ] Revisar errores del navegador y repetir validación después de cualquier corrección.
