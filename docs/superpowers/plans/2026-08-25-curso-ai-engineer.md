# Curso AI Engineer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un curso de AI Engineer con 67 clases, prácticas equivalentes en JavaScript y Python, embeddings locales, proyectos y material con fuentes.

**Architecture:** El motor obtiene una interfaz común para ejecutar JavaScript o Python. Pyodide y Transformers.js viven en Workers cargados bajo demanda. El currículo se genera desde especificaciones pequeñas y ofrece una variante por lenguaje sin duplicar la explicación.

**Tech Stack:** React 19, TypeScript, Vite, CodeMirror 6, Vitest, Pyodide 314.0.6, Transformers.js 4.2.0, Web Workers.

**Spec:** `docs/superpowers/specs/2026-08-25-curso-ai-engineer-design.md`

## Global Constraints

- No crear audio ni usar Gemini TTS.
- Todo texto de producto está en español.
- Cada práctica de código tiene JavaScript y Python.
- Las claves de API opcionales viven solo en memoria.
- No se guarda una clave en localStorage, IndexedDB, URL, logs ni archivos.
- Las soluciones se validan por comportamiento.
- Un concepto aparece en una práctica solo después de enseñarlo.
- Las fuentes son documentación oficial o artículos originales.
- Los otros tres cursos conservan su contenido y progreso.
- Los commits usan Damien Monasterios.

---

### Task 1: Contratos de lenguaje y runtime

**Files:**
- Modify: `src/types/scrim.ts`
- Modify: `src/types/curriculum.ts`
- Create: `src/engine/runtime/courseRuntime.ts`
- Test: `src/engine/runtime/courseRuntime.test.ts`

**Interfaces:**
- Produces: `CourseLanguage`, `PracticeVariant`, `LanguageVariants`, `CourseRuntime`, `RuntimeOptions`.

- [ ] **Step 1: Write the failing contract test**

```ts
it('selecciona una variante completa por lenguaje', () => {
  expect(selectPracticeVariant(variants, 'python').workspace.activeFilePath).toBe('main.py');
  expect(selectPracticeVariant(variants, 'javascript').workspace.activeFilePath).toBe('app.js');
});
```

- [ ] **Step 2: Run the test and confirm the missing module failure**

Run: `npx vitest run src/engine/runtime/courseRuntime.test.ts`

- [ ] **Step 3: Add the types and selector**

```ts
export type CourseLanguage = 'javascript' | 'python';
export interface CourseRuntime {
  run(workspace: WorkspaceSnapshot, options?: RuntimeOptions): Promise<RuntimeExecutionResult>;
  dispose(): void;
}
```

Add `python` and `markdown` to `WorkspaceFile.language`. Add optional `languageVariants` to scrim, challenge, debugging and project data.

- [ ] **Step 4: Run focused tests and lint**

Run: `npx vitest run src/engine/runtime/courseRuntime.test.ts && npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/types src/engine/runtime
git commit -m "feat: add dual-language course contracts"
```

### Task 2: Python syntax and Pyodide Worker

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/editor/CodeEditor.tsx`
- Create: `src/engine/python/pythonRuntime.worker.ts`
- Create: `src/engine/python/pythonRuntimeClient.ts`
- Create: `src/engine/python/pythonWorkerProtocol.ts`
- Test: `src/engine/python/pythonRuntimeClient.test.ts`

**Interfaces:**
- Consumes: `CourseRuntime`.
- Produces: `PythonRuntimeClient`.

- [ ] **Step 1: Install pinned browser dependencies**

Run: `npm install pyodide@314.0.6 @codemirror/lang-python@6.2.1`

- [ ] **Step 2: Write a fake-Worker client test**

Cover stdout, exceptions, timeout, package progress, restart after timeout and disposal.

```ts
await expect(client.run(workspaceOfPython('print(2 + 3)'))).resolves.toMatchObject({
  success: true,
  consoleLogs: [expect.objectContaining({ args: ['5'] })],
});
```

- [ ] **Step 3: Implement the Worker protocol**

Messages: `runtime/init`, `runtime/run`, `runtime/cancel`, `runtime/stdout`, `runtime/stderr`, `runtime/result`, `runtime/progress`.

Load Pyodide once. Redirect `sys.stdout` and `sys.stderr`. Run source with `runPythonAsync`. On timeout, terminate the Worker and create another for the next run.

- [ ] **Step 4: Add CodeMirror Python mode**

Use `python()` when `file.language === 'python'` or the name ends in `.py`. Semantic TypeScript extensions stay disabled for Python.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/engine/python/pythonRuntimeClient.test.ts src/components/editor/CodeEditor.test.tsx && npm run lint`

```bash
git add package.json package-lock.json src/components/editor/CodeEditor.tsx src/engine/python
git commit -m "feat: run Python exercises with Pyodide"
```

### Task 3: Runtime panel and language preference

**Files:**
- Create: `src/components/runtime/LanguageSelector.tsx`
- Create: `src/components/runtime/RuntimeOutputPanel.tsx`
- Modify: `src/components/preview/LogicRunnerPanel.tsx`
- Modify: `src/components/player/ScrimPlayer.tsx`
- Modify: `src/components/challenges/DebuggingView.tsx`
- Modify: `src/components/challenges/SoloProjectView.tsx`
- Modify: `src/engine/persistence.ts`
- Test: `src/components/runtime/LanguageSelector.test.tsx`
- Test: `src/engine/persistence.test.ts`

**Interfaces:**
- Consumes: `LanguageVariants`, `PythonRuntimeClient`, JavaScript runtime.
- Produces: stored key `aula_course_language_v1` indexed by course id.

- [ ] **Step 1: Add persistence tests**

```ts
saveCourseLanguage('course-ai-engineer', 'python');
expect(loadCourseLanguage('course-ai-engineer')).toBe('python');
```

- [ ] **Step 2: Add selector interaction test**

The test switches from JavaScript to Python and proves each variant keeps its own draft.

- [ ] **Step 3: Implement selector and common output panel**

The selector displays `JavaScript` and `Python`. It includes `aria-pressed`. The output panel labels its runtime and shows initialization progress for Python.

- [ ] **Step 4: Integrate every editor surface**

Scrim, debug and project views receive the course id and language variants. Switching language never copies source between files.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/components/runtime src/components/challenges/DebuggingView.integration.test.tsx src/engine/persistence.test.ts && npm run lint`

```bash
git add src/components/runtime src/components/preview/LogicRunnerPanel.tsx src/components/player/ScrimPlayer.tsx src/components/challenges src/engine/persistence.ts
git commit -m "feat: add course language selection"
```

### Task 4: Narración silenciosa

**Files:**
- Modify: `src/types/scrim.ts`
- Modify: `src/engine/audioNarrator.ts`
- Modify: `src/components/player/ScrimPlayer.tsx`
- Test: `src/engine/audioNarrator.test.ts`
- Test: `src/components/player/ScrimPlayer.test.tsx`

**Interfaces:**
- Produces: `narrationMode: 'audio' | 'speech' | 'silent'`.

- [ ] **Step 1: Write a failing silent-mode test**

Assert that `Audio`, `speechSynthesis.speak` and network audio are never used while the synthetic lesson clock still advances.

- [ ] **Step 2: Implement silent clock selection**

`silent` uses the synthetic clock, emits subtitle cues and keeps playback controls. It does not produce sound.

- [ ] **Step 3: Adjust player labels**

Hide volume and mute controls for a silent lesson. Keep CC visible.

- [ ] **Step 4: Verify**

Run: `npx vitest run src/engine/audioNarrator.test.ts src/components/player/ScrimPlayer.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/types/scrim.ts src/engine/audioNarrator.ts src/components/player/ScrimPlayer.tsx
git commit -m "feat: add silent animated lessons"
```

### Task 5: Embeddings locales

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/engine/ai/localEmbedding.worker.ts`
- Create: `src/engine/ai/localEmbeddingService.ts`
- Create: `src/engine/ai/deterministicEmbedding.ts`
- Create: `src/engine/ai/embeddingProtocol.ts`
- Test: `src/engine/ai/localEmbeddingService.test.ts`

**Interfaces:**
- Produces: `LocalEmbeddingService.embed()` and `modelInfo()`.

- [ ] **Step 1: Install Transformers.js**

Run: `npm install @huggingface/transformers@4.2.0`

- [ ] **Step 2: Write service tests with a fake Worker**

Cover model progress, normalized vectors, batch order, failure fallback and cancellation.

- [ ] **Step 3: Implement deterministic fallback**

Use token hashing into 64 dimensions followed by L2 normalization. This fallback is labeled as a teaching vector, not a semantic model.

- [ ] **Step 4: Implement the model Worker**

Lazy-load a small feature-extraction model. Use mean pooling and normalization. Never load on application startup.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/engine/ai/localEmbeddingService.test.ts && npm run lint && npm run build`

```bash
git add package.json package-lock.json src/engine/ai
git commit -m "feat: add local embedding service"
```

### Task 6: Servicios didácticos y APIs opcionales

**Files:**
- Create: `src/engine/ai/learningProvider.ts`
- Create: `src/engine/ai/deterministicChatProvider.ts`
- Create: `src/engine/ai/browserApiProvider.ts`
- Create: `src/components/runtime/ProviderSettings.tsx`
- Test: `src/engine/ai/browserApiProvider.test.ts`
- Test: `src/components/runtime/ProviderSettings.test.tsx`

**Interfaces:**
- Produces: `LearningModelProvider`, `ProviderSessionStore`.

- [ ] **Step 1: Write security tests**

Spy on localStorage, sessionStorage, IndexedDB, URL construction and console. Assert the key appears only in the Authorization or provider header of the current fetch call.

- [ ] **Step 2: Implement deterministic chat fixtures**

Support text, structured output, tool call, streaming chunks and injected error cases. Match requests by fixture id, not by hidden solution source.

- [ ] **Step 3: Implement in-memory provider settings**

The module-level store clears on reload. The UI includes the approved warning and a `Borrar clave` action.

- [ ] **Step 4: Implement browser provider adapter**

Support OpenAI-compatible, Gemini and Anthropic request shapes behind one interface. Reject non-HTTPS endpoints outside localhost.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/engine/ai src/components/runtime/ProviderSettings.test.tsx && npm run lint`

```bash
git add src/engine/ai src/components/runtime/ProviderSettings.tsx
git commit -m "feat: add safe optional browser providers"
```

### Task 7: Currículo, fuente común y fábrica

**Files:**
- Create: `src/curriculum/ai-engineer/types.ts`
- Create: `src/curriculum/ai-engineer/sources.ts`
- Create: `src/curriculum/ai-engineer/factory.ts`
- Create: `src/curriculum/ai-engineer/course.ts`
- Test: `src/curriculum/ai-engineer/factory.test.ts`

**Interfaces:**
- Produces: `AI_ENGINEER_COURSE`, `AI_ENGINEER_SCRIMS`, `AIEngineerLessonSpec`.

- [ ] **Step 1: Write factory tests**

Assert silent narration, dual variants, reading sources, reasoning item, debug item, skills and challenge order.

- [ ] **Step 2: Create the source registry**

Use stable ids such as `roadmap-ai-engineer`, `pyodide-usage`, `hf-llm-course`, `rag-paper`, `mcp-architecture`, `owasp-genai-top10` and `qdrant-vector-search`.

- [ ] **Step 3: Implement lesson factory**

Generate scrim, reading, reasoning and debug items. Build write/gesture/run events from authored beats. Do not generate prose from templates at runtime.

- [ ] **Step 4: Create the empty course registry with 13 module ids**

The test requires the exact module order from the spec.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/curriculum/ai-engineer/factory.test.ts && npm run lint`

```bash
git add src/curriculum/ai-engineer
git commit -m "feat: scaffold AI engineer curriculum"
```

### Task 8: Modules 0 to 4

**Files:**
- Create: `src/curriculum/ai-engineer/modules/module00.ts`
- Create: `src/curriculum/ai-engineer/modules/module01.ts`
- Create: `src/curriculum/ai-engineer/modules/module02.ts`
- Create: `src/curriculum/ai-engineer/modules/module03.ts`
- Create: `src/curriculum/ai-engineer/modules/module04.ts`
- Create: `docs/guiones/ai-engineer/01.md` through `27.md`
- Test: `src/curriculum/ai-engineer/progression01to27.test.ts`

**Interfaces:**
- Produces: lesson specs 1 through 27.

- [ ] **Step 1: Write progression tests**

The test maps each introduced skill and rejects a required skill that has not appeared earlier.

- [ ] **Step 2: Author modules 0 and 1**

Include environment setup, token diagrams, context budget, sampling simulator and training/inference comparison.

- [ ] **Step 3: Author modules 2 and 3**

Include prompt anatomy, schema validation, function calling, context selection, memory, compaction and isolation.

- [ ] **Step 4: Author module 4**

Include model selection, Hugging Face, local tools and provider contracts.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/curriculum/ai-engineer/progression01to27.test.ts src/curriculum/ai-engineer/factory.test.ts`

```bash
git add src/curriculum/ai-engineer/modules docs/guiones/ai-engineer
git commit -m "feat: add AI foundations and context modules"
```

### Task 9: Modules 5 to 8

**Files:**
- Create: `src/curriculum/ai-engineer/modules/module05.ts`
- Create: `src/curriculum/ai-engineer/modules/module06.ts`
- Create: `src/curriculum/ai-engineer/modules/module07.ts`
- Create: `src/curriculum/ai-engineer/modules/module08.ts`
- Create: `docs/guiones/ai-engineer/28.md` through `51.md`
- Test: `src/curriculum/ai-engineer/progression28to51.test.ts`

**Interfaces:**
- Produces: lesson specs 28 through 51.

- [ ] **Step 1: Write embedding and RAG contract tests**

Require different inputs, no hard-coded expected vector and cited retrieval results.

- [ ] **Step 2: Author embeddings and vector database modules**

Include vector diagrams, cosine calculations, local embedding lab, metadata and filtering.

- [ ] **Step 3: Author RAG module**

Build ingestion, chunking, indexing, retrieval, reranking, generation, citations and evaluation in order.

- [ ] **Step 4: Author agents and MCP module**

Teach fixed workflows first. Require user confirmation in the final agent project.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/curriculum/ai-engineer/progression28to51.test.ts src/engine/testRunner.test.ts`

```bash
git add src/curriculum/ai-engineer/modules docs/guiones/ai-engineer
git commit -m "feat: add embeddings RAG and agent modules"
```

### Task 10: Modules 9 to 12 and projects

**Files:**
- Create: `src/curriculum/ai-engineer/modules/module09.ts`
- Create: `src/curriculum/ai-engineer/modules/module10.ts`
- Create: `src/curriculum/ai-engineer/modules/module11.ts`
- Create: `src/curriculum/ai-engineer/modules/module12.ts`
- Create: `src/curriculum/ai-engineer/projects.ts`
- Create: `docs/guiones/ai-engineer/52.md` through `67.md`
- Test: `src/curriculum/ai-engineer/projects.test.ts`

**Interfaces:**
- Produces: lesson specs 52 through 67 and nine `SoloProjectItem` entries.

- [ ] **Step 1: Write project completeness tests**

Require both language variants, at least five observable requirements, evaluation data, security checklist and export instructions.

- [ ] **Step 2: Author security and evaluation modules**

Use malicious documents and tool responses as untrusted fixtures. Require least privilege and output validation.

- [ ] **Step 3: Author multimodal and capstone modules**

Use image/audio metadata fixtures. Do not create course narration audio.

- [ ] **Step 4: Add nine projects**

Each project includes starter, milestones, tests and a definition of done.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/curriculum/ai-engineer/projects.test.ts src/curriculum/ai-engineer`

```bash
git add src/curriculum/ai-engineer docs/guiones/ai-engineer
git commit -m "feat: complete AI engineer curriculum"
```

### Task 11: Vector and context diagrams

**Files:**
- Modify: `src/types/curriculum.ts`
- Modify: `src/components/reasoning/ReasoningPracticeView.tsx`
- Modify: `src/engine/reasoningRunner.ts`
- Create: `src/components/reasoning/diagrams/VectorRankingDiagram.tsx`
- Create: `src/components/reasoning/diagrams/ContextBudgetDiagram.tsx`
- Test: `src/engine/reasoningRunner.test.ts`
- Test: `src/components/reasoning/ReasoningPracticeView.integration.test.tsx`

**Interfaces:**
- Produces: `vector-ranking`, `context-budget` reasoning activities.

- [ ] **Step 1: Write validation tests for both activity types**

- [ ] **Step 2: Implement pure validation**

Vector ranking compares ids in order. Context budget verifies total tokens and required blocks.

- [ ] **Step 3: Implement accessible diagrams**

Every point/block has a text label and keyboard control. Color is not the only status signal.

- [ ] **Step 4: Add AI curriculum activities using both types**

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/engine/reasoningRunner.test.ts src/components/reasoning/ReasoningPracticeView.integration.test.tsx`

```bash
git add src/types/curriculum.ts src/components/reasoning src/engine/reasoningRunner.ts src/curriculum/ai-engineer
git commit -m "feat: add vector and context reasoning diagrams"
```

### Task 12: Register the course

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/curriculum/CourseCatalog.tsx`
- Modify: `src/components/curriculum/RoadmapHome.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `AI_ENGINEER_COURSE`, `AI_ENGINEER_SCRIMS`.

- [ ] **Step 1: Write catalog and route tests**

Assert four courses, unique progress, restoration to an AI item and no change to existing course ids.

- [ ] **Step 2: Register course and scrims**

Append the course to built-in courses and merge the scrim catalog.

- [ ] **Step 3: Add course metadata and prerequisite message**

Use level `Intermediate`, 67 classes and tags `IA aplicada`, `JavaScript`, `Python`.

- [ ] **Step 4: Verify navigation tests**

Run: `npx vitest run src/App.test.tsx src/engine/navigation.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/curriculum
git commit -m "feat: register AI engineer course"
```

### Task 13: Global curriculum audits

**Files:**
- Create: `src/curriculum/ai-engineer/curriculumFlow.integration.test.ts`
- Create: `src/curriculum/ai-engineer/writingQuality.integration.test.ts`
- Modify: `src/curriculum/allExercises.integration.test.ts`
- Modify: `src/curriculum/allLearningMaterials.integration.test.ts`
- Modify: `src/editor/allCourseWorkspaces.integration.test.ts`

**Interfaces:**
- Validates the complete course against the design.

- [ ] **Step 1: Add inventory and progression audit**

Assert 67 scrims, 67 readings, 67 reasoning items, 67 debug labs, nine projects and complete roadmap topic coverage.

- [ ] **Step 2: Add dual-language audit**

Run JavaScript reference solutions and Python reference solutions through their validators. Require at least two inputs for every function contract.

- [ ] **Step 3: Add source and writing audit**

Check valid HTTPS sources, banned vocabulary, duplicate paragraphs, sentence length outliers and guion/subtitle equality.

- [ ] **Step 4: Add starter and silent-mode audit**

Every starter fails. Every AI lesson is silent and has no audio URL.

- [ ] **Step 5: Run all checks and commit**

Run: `git diff --check && npm run lint && npm test && npm run build`

```bash
git add src/curriculum src/editor/allCourseWorkspaces.integration.test.ts
git commit -m "test: audit complete AI engineer course"
```

### Task 14: Browser validation and handoff

**Files:**
- Create: `docs/ai-engineer-browser-qa.md`

**Interfaces:**
- Produces evidence for the acceptance list in the design.

- [ ] **Step 1: Run the production app**

Run: `npm run dev -- --port=3001`

- [ ] **Step 2: Test representative learning flows**

Open catalog, environment class, Python practice, JavaScript practice, embeddings, RAG, agents, API warning, project and roadmap return.

- [ ] **Step 3: Test failure flows**

Cover Pyodide initialization failure, timeout, unsupported local model, network loss, bad API key and invalid structured output.

- [ ] **Step 4: Check desktop and narrow viewport**

Confirm no overlapping panels, readable diagrams, floating preview, keyboard navigation and visible diagnostics.

- [ ] **Step 5: Record evidence, run final suite and commit**

Run: `git diff --check && npm run lint && npm test && npm run build`

```bash
git add docs/ai-engineer-browser-qa.md
git commit -m "docs: record AI engineer browser validation"
```
