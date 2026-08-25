# Laboratorios interactivos de IA local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir prácticas reales de prompts, resumen y escritura con un modelo local Transformers.js y WebGPU.

**Architecture:** La generación usa Transformers.js v4 en un Worker WebGPU bajo demanda y expone tamaño/caché mediante `ModelRegistry`. Una interfaz React consume el motor local y se inserta desde metadatos de las lecturas. Las APIs integradas de Chrome se estudian como contratos alternativos, pero no son requisito ni fallback de esta entrega.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Transformers.js 4.2, ONNX Runtime WebGPU, Chrome Built-in AI APIs.

**Spec:** `docs/superpowers/specs/2026-08-25-laboratorios-ia-local-design.md`

## Global Constraints

- No descargar modelos al montar la página; toda descarga requiere un clic del estudiante.
- No enviar prompts o resultados a un servidor.
- Usar español en interfaz y diagnósticos.
- Etiquetar Writer como prueba de origen y detectar cada API por separado.
- No ofrecer una respuesta determinista como si fuera una generación real.
- Mantener las prácticas de código existentes y añadir interacción, no reemplazar la progresión.

---

### Task 1: Generación local en Worker

**Files:**
- Create: `src/engine/ai/localGenerationProtocol.ts`
- Create: `src/engine/ai/localGeneration.worker.ts`
- Create: `src/engine/ai/localGenerationService.ts`
- Test: `src/engine/ai/localGenerationService.test.ts`

**Interfaces:**
- Consumes: `@huggingface/transformers`.
- Produces: `LocalGenerationService.generate(request, options)` y `dispose()`.

- [x] Escribir pruebas con un Worker controlado para resultado, progreso, aborto, timeout y terminación.
- [x] Confirmar que fallan porque el servicio no existe.
- [x] Implementar protocolo y servicio sin fallback simulado.
- [x] Implementar el Worker con `pipeline("text-generation", "onnx-community/LFM2.5-350M-ONNX", { device: "webgpu", dtype: "q4" })`, chat template, `ModelRegistry`, progreso total y máximo de salida acotado.
- [x] Validar la salida y rechazar corrupción numérica silenciosa del dispositivo.
- [x] Ejecutar las pruebas y `npm run lint`.

### Task 2: Laboratorio React

**Files:**
- Create: `src/components/runtime/AIInteractivePractice.tsx`
- Test: `src/components/runtime/AIInteractivePractice.test.tsx`
- Modify: `src/components/curriculum/ReadingView.tsx`
- Modify: `src/types/curriculum.ts`

**Interfaces:**
- Consumes: `InteractiveAILab`, `LocalGenerationService`.
- Produces: tres flujos accesibles `prompt`, `summarizer` y `writer`.

- [x] Escribir pruebas de que montar no crea un Worker ni descarga, que un clic ejecuta, que se comparan dos prompts y que se muestra motor/tiempo/error.
- [x] Confirmar el fallo por componente inexistente.
- [x] Implementar controles, progreso, cancelación, resultado y pregunta de observación.
- [x] Renderizar el laboratorio desde `reading.interactiveLab` y repetir las pruebas.

### Task 3: Currículo y fuentes

**Files:**
- Modify: `src/curriculum/ai-engineer/types.ts`
- Modify: `src/curriculum/ai-engineer/sources.ts`
- Modify: `src/curriculum/ai-engineer/authoring.ts`
- Modify: `src/curriculum/ai-engineer/factory.ts`
- Modify: `src/curriculum/ai-engineer/modules/module02.ts`
- Modify: `src/curriculum/ai-engineer/modules/module04.ts`
- Test: `src/curriculum/ai-engineer/interactiveLabs.integration.test.ts`

**Interfaces:**
- Produces: laboratorios en lecturas 12, 14, 24, 26 y 27.

- [x] Escribir una prueba que exige los cinco laboratorios, sus tipos y las fuentes oficiales de Chrome/Hugging Face.
- [x] Confirmar el fallo por metadatos ausentes.
- [x] Añadir fuentes, texto pedagógico y configuraciones iniciales distintas por lección.
- [x] Ejecutar la prueba focalizada del currículo.

### Task 4: Verificación real

**Files:**
- Modify: `docs/ai-engineer-browser-qa.md`

- [x] Ejecutar `git diff --check && npm run lint && npm test && npm run build`.
- [x] En Chrome, abrir el laboratorio, inspeccionar el modelo y ejecutar dos prompts sobre la misma entrada.
- [x] Probar los controles de resumen y escritura sobre el motor local.
- [x] Repetir a 900 × 700 y revisar consola, composición y diagnóstico de inferencia.
- [x] Documentar evidencia exacta y revisar el diff.
- [x] Crear un commit de Damien Monasterios y subir `main`.
