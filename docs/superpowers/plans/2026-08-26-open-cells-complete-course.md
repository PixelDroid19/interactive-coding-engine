# Complete Open Cells Course Implementation Plan

> **For agentic workers:** Execute inline in this session. Do not spawn subagents, create worktrees, commit, or push; the user explicitly prohibited those actions.

**Goal:** Deliver an independent Open Cells course whose guided lessons and standalone playground create, run, test, instrument, persist, export, and validate real Cells-compatible components and applications entirely in the browser.

**Architecture:** Reuse the existing course engine, `ScrimPlayer`, CodeMirror, `WorkspaceSnapshot`, preview surfaces and persistence. A lazy Cells Worker owns the VFS, command grammar, module graph, test instrumentation and ZIP; sandboxed iframes own all learner-code execution. Development-only CLI parity tests materialize browser-generated snapshots outside the product boundary.

**Tech Stack:** React 19, TypeScript, Vite 6, CodeMirror 6, Web Workers, iframe `srcdoc`, IndexedDB, Lit 3.3.3, Open Cells Core 1.2.1 and Page Mixin 1.2.4 contracts.

**Spec:** `/home/monasterios/.codex/attachments/3cb1222c-c9a6-4c47-8a8f-8a6164876098/pasted-text-1.txt`

## Global Constraints

- Product UI and spoken scripts are Spanish; technical API names remain English.
- No backend, Node filesystem, child processes, sockets, ports, fake PIDs or fake package installation in the product.
- Do not modify external reference repositories.
- Do not modify or include unrelated user changes, especially `src/components/challenges/SoloProjectView.tsx`.
- Do not commit or push.
- Every production behavior begins with a causal failing test and completes with focused and regression verification.
- The iframe uses minimum permissions and learner code never executes in the parent thread.
- The CLI gate is development-only and deletes only a validated temporary fixture.

---

### Task 1: CLI contract and browser command grammar

**Files:**
- Create: `src/engine/cells/cellsCliContract.ts`
- Create: `src/engine/cells/cellsCliContract.test.ts`
- Modify: `src/engine/cells/cellsCommandParser.ts`
- Modify: `src/engine/cells/cellsCommandParser.test.ts`

**Interfaces:**
- Produces `CELLS_BROWSER_COMMANDS`, `CELLS_ALLOWED_PACKAGES` and `parseCellsCommand(input)`.
- Browser-safe commands accept `component:create`, component test/locales/docs/build/dev and app create/test/locales/build/dev with real `-c` config syntax.
- Host-only flags such as ports, watch, install and arbitrary scaffold paths fail with Spanish diagnostics.

- [ ] Add tests for the exact supported commands and options from the local CLI registry.
- [ ] Run the parser tests and confirm failures are caused by missing app locales/config handling.
- [ ] Implement immutable command definitions and parser normalization.
- [ ] Run parser, protocol and runtime-session regression tests.

### Task 2: CLI-compatible component and application recipes

**Files:**
- Create: `src/engine/cells/cellsRecipeContract.ts`
- Create: `src/engine/cells/cellsRecipeParity.integration.test.ts`
- Modify: `src/engine/cells/cellsRecipes.ts`
- Modify: `src/engine/cells/cellsAppRecipes.ts`
- Modify: recipe and audit tests under `src/engine/cells/`

**Interfaces:**
- Component snapshots expose separate class and registering entrypoints, SCSS plus CSS module, JSON locale catalogs, demo, unit tests, Vite config, CEM and README commands.
- Application snapshots use `@open-cells/core`, `@open-cells/page-mixin`, `startApp`, `app/scripts/app-routes.js`, `app/config/dev.js`, `app/config/prod.js`, pages, channels, data manager, locales and tests.
- The parity test imports the local CLI `composeRecipe` only in Node test execution and compares required paths, dependency versions, scripts and public API tokens.

- [ ] Write component and app parity assertions against the current local CLI plan.
- [ ] Run them and capture the current mismatch.
- [ ] Align the browser recipes without importing Node adapters into production.
- [ ] Re-run recipe, LSP, ZIP and parity tests.

### Task 3: Package resolver and module compiler

**Files:**
- Create: `src/engine/cells/cellsPackageResolver.ts`
- Create: `src/engine/cells/cellsPackageResolver.test.ts`
- Modify: `src/engine/cells/cellsPreviewCompiler.ts`
- Modify: `src/engine/cells/cellsWorkerProtocol.ts`

**Interfaces:**
- `resolveCellsModule(specifier, importer, workspace)` resolves relative `.js`, `.ts`, explicit directories and allowlisted package exports.
- Returns source plus canonical source identity for diagnostics.
- Rejects unknown packages, credentialed URLs, root escapes and unresolved imports before execution.

- [ ] Add RED cases for nested modules, TypeScript, index resolution, unknown packages and credentialed URLs.
- [ ] Implement the resolver without stripping imports/exports by regex.
- [ ] Attach source identity and line mappings to compiler errors.
- [ ] Verify stale builds cannot replace a newer generation.

### Task 4: Dynamic browser test runtime and coverage

**Files:**
- Create: `src/engine/cells/cellsTestProtocol.ts`
- Create: `src/engine/cells/cellsTestRuntime.ts`
- Create: `src/engine/cells/cellsCoverage.ts`
- Create: `src/engine/cells/cellsTestRuntime.test.ts`
- Modify: `src/engine/cells/cellsRuntimeSession.ts`
- Modify: `src/components/runtime/CellsLearningLab.tsx`

**Interfaces:**
- A dedicated sandbox test iframe receives a compiled fixture and test manifest with session/generation.
- It can mount, await definition/update, set properties, switch language, click, capture events, navigate and observe cleanup.
- Coverage result contains statements, branches, functions, lines, per-file counts and uncovered locations, or an explicit unavailable reason.

- [ ] Add failing behavioral tests that hardcoded source strings cannot satisfy.
- [ ] Add timeout, cancellation, syntax, compilation and internal-error cases.
- [ ] Implement the iframe runner and postMessage validation.
- [ ] Implement browser-compatible instrumentation and per-file reporting.
- [ ] Replace the source-only auditor in learner-facing results.

### Task 5: Cells mode in the existing standalone playground

**Files:**
- Modify: `src/types/runtime.ts`
- Modify: `src/templates/starterTemplates.ts`
- Modify: `src/components/playground/PlaygroundView.tsx`
- Modify: `src/components/playground/PlaygroundView.test.tsx`
- Create: `src/components/playground/CellsProjectSetup.tsx`
- Create: `src/components/playground/CellsRuntimePanel.tsx`

**Interfaces:**
- Adds typed `cells-component` and `cells-app` template IDs.
- Setup collects neutral name, `@open-cells-learning` namespace, exercise and allowed dependencies.
- Runtime panel exposes the equivalent command, Worker state, preview, tests, coverage, documentation and ZIP without shell/port/PID controls.

- [ ] Add UI tests for template selection, validation, command display and creation.
- [ ] Add state tests for loading, syntax/import failure, partial tests, completion and cancellation.
- [ ] Implement the setup and runtime panels without growing `PlaygroundView` into one component.
- [ ] Verify existing templates and draft persistence remain intact.

### Task 6: First guided Cells class

**Files:**
- Create: `src/curriculum/open-cells/types.ts`
- Create: `src/curriculum/open-cells/helpers.ts`
- Create: `src/curriculum/open-cells/factory.ts`
- Create: `src/curriculum/open-cells/specs01to06.ts`
- Create: `docs/guiones/open-cells/01-crear-primer-componente.md`
- Modify: `src/curriculum/open-cells/course.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces a silent-narration `ScrimLessonData` with speak captions, writes, file switches, gestures, preview run and pausing challenge.
- Challenge uses the component runtime and three progressive hints without solution files or exact final line.
- Editing during playback forks; returning restores the tape.

- [ ] Add a curriculum integration test for the complete lesson contract.
- [ ] Verify it fails while Open Cells contains only readings.
- [ ] Implement the factory, lesson, guion, reading, reasoning and distinct debug exercise.
- [ ] Verify player start gate, play/pause, fork, challenge and roadmap navigation.

### Task 7: Complete curriculum and projects

**Files:**
- Create: `src/curriculum/open-cells/sources.ts`
- Split/create: `src/curriculum/open-cells/specs*.ts`
- Create: `src/curriculum/open-cells/curriculumFlow.integration.test.ts`
- Create: `docs/guiones/open-cells/*.md`
- Modify: `src/curriculum/open-cells/course.ts`

**Interfaces:**
- Every lesson declares stable ID, required/introduced skills, observable objectives, common errors, mental model, guided tape, challenge, three hints, reading, reasoning, distinct debugging task, sources, domain checks and transfer.
- Project lessons implement a component-in-app, Museo, Clima, Relé and a Cells capstone using distinct workspaces and observable behavior.

- [ ] Add structural tests that enumerate every required lesson field and reject revealed solutions.
- [ ] Add progression tests preventing use of a skill before introduction.
- [ ] Rewrite the existing generated readings into explicit specs grouped by module.
- [ ] Implement and browser-test each project vertical slice.

### Task 8: Development-only CLI gate

**Files:**
- Create: `scripts/verify_cells_cli_parity.mjs`
- Create: `src/engine/cells/cellsCliGate.integration.test.ts`
- Modify: `package.json` only if a dedicated script is required.

**Interfaces:**
- Accepts `CELLS_CLI_ROOT`, defaults to the documented local path and validates the target before invocation.
- Materializes snapshots into `mkdtemp`, runs bounded CLI component/app commands with exact logs, and removes only that temporary root.
- Skips with a clear reason when the CLI or authorized public dependencies are unavailable; never reports compatibility from a skip.

- [ ] Add tests for root validation, fixture materialization and cleanup boundaries.
- [ ] Run the component gate and capture command outputs.
- [ ] Run the app gate with `prod.js` and inspect route/build artifacts.
- [ ] Record compatibility only when both gates exit successfully.

### Task 9: Persistence, security and complete browser acceptance

**Files:**
- Modify: `src/engine/cells/cellsWorkspaceRepository.ts`
- Modify: `src/components/runtime/CellsLearningLab.tsx`
- Add focused tests under `src/engine/cells/` and `src/components/playground/`.

**Interfaces:**
- Persists course, lesson, timestamp, workspace, active file, layout, fork, command, results and runtime preferences per versioned key.
- postMessage validation requires expected source, session and generation.
- Output truncation, secret redaction, compile/test timeout and Worker disposal are observable states.

- [ ] Add RED tests for corrupt storage, stale messages, credentialed imports, output overflow and disposal.
- [ ] Implement persistence migration and security guards.
- [ ] Run the required focused tests, full suite, lint, build and diff check separately.
- [ ] Exercise all specified catalog, lesson, playground, error, success and responsive flows with `agent-browser`.
- [ ] Update `docs/open-cells/completion-audit.md` requirement by requirement using fresh evidence.
