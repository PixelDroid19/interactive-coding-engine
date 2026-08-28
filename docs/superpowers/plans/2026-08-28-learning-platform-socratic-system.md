# Learning Platform Socratic System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir la plataforma en un sistema local-first que registra dominio por capacidades, programa repasos y ofrece un tutor socrático WebLLM contextual en Fundamentos, JavaScript y Lit.

**Architecture:** Un dominio de aprendizaje sin dependencias de React se persiste detrás de `LearningRepository`. Una capa React suministra contexto, temas y experiencias flotantes. WebLLM sigue siendo el único adaptador de inferencia y se carga únicamente por gesto del estudiante.

**Tech Stack:** React 19, TypeScript, Vite, CodeMirror 6, WebLLM/WebGPU, Vitest, localStorage versionado, Diagram Design.

**Spec:** `docs/superpowers/specs/2026-08-28-learning-platform-socratic-system-design.md`

## Global Constraints

- No API remota, clave, respuesta simulada ni ruta CPU.
- No descargar un modelo sin gesto explícito.
- No mostrar soluciones completas antes de dos intentos.
- No activar el tutor transversal dentro del curso de IA.
- Mantener UI en español y accesible por teclado.
- Toda persistencia nueva atraviesa `LearningRepository`.
- Los temas se seleccionan por identificador y tokens semánticos.
- No subir cambios al remoto.

---

### Task 1: Dominio de aprendizaje y repositorio local

**Files:**
- Create: `src/learning/types.ts`
- Create: `src/learning/mastery.ts`
- Create: `src/learning/reviewScheduler.ts`
- Create: `src/learning/repository.ts`
- Create: `src/learning/localLearningRepository.ts`
- Test: `src/learning/learningDomain.test.ts`

**Interfaces:**
- Produces: `LearningProfile`, `LearningEvidence`, `LearningRepository`, `recordEvidence`, `scheduleReview`.

- [ ] Escribir pruebas de puntuación separada por capacidad, migración, recuperación y calendario 1/3/7/14/30.
- [ ] Ejecutar las pruebas y confirmar el fallo por módulos inexistentes.
- [ ] Implementar tipos, funciones puras y adaptador versionado.
- [ ] Ejecutar las pruebas hasta que pasen.

### Task 2: Integración con acciones existentes y puerta de dominio

**Files:**
- Modify: `src/engine/persistence.ts`
- Create: `src/learning/curriculumSkills.ts`
- Create: `src/learning/unlockPolicy.ts`
- Modify: `src/components/curriculum/RoadmapHome.tsx`
- Test: `src/learning/curriculumSkills.test.ts`
- Test: `src/components/curriculum/RoadmapHome.mastery.test.tsx`

**Interfaces:**
- Consumes: `LearningRepository.recordEvidence()`.
- Produces: `getItemReadiness(course, itemId, profile)` con huecos y recuperación concreta.

- [ ] Probar que lectura, razonamiento, reto, depuración y proyecto producen capacidades diferentes.
- [ ] Probar que una unidad bloqueada muestra la habilidad faltante y una acción de recuperación.
- [ ] Integrar eventos sin romper el registro histórico `UserProgressRecord`.
- [ ] Verificar migración de progreso completado existente.

### Task 3: Catálogo de modelos y sesión WebLLM compartida

**Files:**
- Modify: `src/engine/ai/localGenerationProtocol.ts`
- Modify: `src/engine/ai/localGenerationService.ts`
- Create: `src/engine/ai/localModelCatalog.ts`
- Create: `src/engine/ai/localGenerationSession.ts`
- Test: `src/engine/ai/localModelCatalog.test.ts`
- Modify: `src/engine/ai/localGenerationService.test.ts`

**Interfaces:**
- Produces: `listTutorModels(): Promise<LocalModelOption[]>`, `getLocalGenerationSession()`.

- [ ] Probar perfiles ligero/recomendado/profundo derivados de `prebuiltAppConfig` y límite de 2300 MB.
- [ ] Probar que inspeccionar no descarga y cambiar modelo descarga solo tras solicitud.
- [ ] Implementar catálogo, caché y sesión compartida cancelable.
- [ ] Confirmar que un equipo sin WebGPU recibe un diagnóstico explícito.

### Task 4: Contexto pedagógico y tutor socrático flotante

**Files:**
- Create: `src/learning/tutor/tutorContext.ts`
- Create: `src/learning/tutor/tutorPrompt.ts`
- Create: `src/learning/tutor/TutorProvider.tsx`
- Create: `src/components/tutor/SocraticTutor.tsx`
- Create: `src/components/tutor/TutorModelSetup.tsx`
- Create: `src/components/tutor/SocraticTutor.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/editor/CodeEditor.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: `TutorProvider`, `useTutorContext()`, `publishTutorCodeContext()`, UI de chat.

- [ ] Probar que no aparece en el curso de IA y sí en los otros tres cursos objetivo.
- [ ] Probar configuración sin descarga automática, selector, progreso, streaming, cancelar y error.
- [ ] Probar que el prompt contiene metadatos y código actual, limita historial y aplica diálogo socrático.
- [ ] Integrar el editor mediante un bus tipado, sin leer almacenamiento global desde la UI.
- [ ] Añadir estilos responsive normal/cyber y control de foco.

### Task 5: Variaciones, explicación evaluada y repaso

**Files:**
- Create: `src/learning/variation.ts`
- Create: `src/components/learning/TransferVariation.tsx`
- Create: `src/components/learning/MentalCodeReading.tsx`
- Create: `src/components/learning/ReviewQueue.tsx`
- Test: `src/learning/variation.test.ts`
- Test: `src/components/learning/ReviewQueue.test.tsx`
- Modify: challenge/debug/reasoning/project completion surfaces.

**Interfaces:**
- Produces: variación determinista por ejercicio, evidencia de explicación y cola de repaso.

- [ ] Probar que la variación cambia datos/requisito sin revelar solución.
- [ ] Probar autoevaluación de repaso y reprogramación.
- [ ] Mostrar la variación después del éxito y registrar modificar/transferir.
- [ ] Añadir panel de repasos al roadmap.

### Task 6: Modos Líder, Examen y Cuaderno

**Files:**
- Create: `src/components/learning/LeaderMode.tsx`
- Create: `src/components/learning/ExamMode.tsx`
- Create: `src/components/learning/LearningNotebook.tsx`
- Create: `src/learning/exam.ts`
- Test: `src/learning/exam.test.ts`
- Test: `src/components/learning/LearningNotebook.test.tsx`
- Modify: `src/components/curriculum/RoadmapHome.tsx`

**Interfaces:**
- Produces: entrevista técnica, examen mixto verde/amarillo/rojo y ficha editable por concepto.

- [ ] Probar clasificación por capacidad con evidencia mixta.
- [ ] Probar persistencia de cuaderno y entrevista.
- [ ] Integrar accesos desde el roadmap sin sobrecargar cada lección.

### Task 7: Registro de temas extensible

**Files:**
- Create: `src/themes/themeRegistry.ts`
- Create: `src/themes/ThemeProvider.tsx`
- Modify: `src/components/ThemeToggle.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `src/themes/hud.css`
- Test: `src/themes/themeRegistry.test.ts`
- Test: `src/components/ThemeToggle.test.tsx`

**Interfaces:**
- Produces: `ThemeId`, `THEMES`, `useTheme()`.

- [ ] Probar migración de `theme=hud/default` y selección por URL.
- [ ] Eliminar el observador global que reescribe atributos del DOM.
- [ ] Aplicar atributos aumentados mediante componentes/clases estables.
- [ ] Revisar contraste, capas y tamaño de fuente en ambos temas.

### Task 8: Diagramas Diagram Design y soporte de lectura

**Files:**
- Modify: `src/types/curriculum.ts`
- Modify: `src/components/curriculum/ReadingView.tsx`
- Create: `src/components/curriculum/LearningDiagram.tsx`
- Create: `public/diagrams/*.html`
- Test: `src/components/curriculum/LearningDiagram.test.tsx`

**Interfaces:**
- Produces: `ReadingDiagram` con URL normal/cyber y descripción accesible.

- [ ] Configurar perfil CodeSilk de Diagram Design.
- [ ] Crear solo los siete diagramas aprobados por utilidad pedagógica.
- [ ] Ejecutar `self_check.py` y verificador geométrico para cada archivo.
- [ ] Probar selección de variante y fallback textual accesible.

### Task 9: Pulido humano de Fundamentos, JavaScript y Lit

**Files:**
- Modify: `src/curriculum/fundamentos/**`
- Modify: `src/curriculum/javascript/**`
- Modify: `src/curriculum/web-components-lit/**`
- Modify: `docs/guiones/fundamentos/**`, `docs/guiones/javascript/**`, `docs/guiones/component-course/**`
- Create/modify: suites `writingQuality.integration.test.ts` por curso.

**Interfaces:**
- Consumes: `ReadingSection.diagram`, requisitos de calidad y progresión.

- [ ] Auditar términos usados antes de enseñar, repetición de fórmulas y soluciones expuestas.
- [ ] Añadir pruebas de calidad que detecten copy robótico, fragmentos sin puntuación y ejemplos adelantados.
- [ ] Reescribir por curso conservando sincronización de audio existente.
- [ ] Asociar diagramas únicamente a las lecturas correspondientes.

### Task 10: Validación integral

**Files:**
- Modify: pruebas de integración cuando revelen contratos obsoletos.

- [ ] Ejecutar flujos reales en Browser: tutor, modelo, código, recuperación, repaso, Líder, Examen y Cuaderno.
- [ ] Repetir en normal/cyber y escritorio/móvil.
- [ ] Entrar, reproducir, pausar, editar, ejecutar, regresar y abrir depuración en los tres cursos.
- [ ] Ejecutar `npm test`, `npm run lint`, `npm run build` y `git diff --check`.
- [ ] Revisar que `git status` contenga solo cambios de este objetivo y no ejecutar `git push`.
