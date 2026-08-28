# Local Learning Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, tool-using pedagogical agent and polish the learning center and theme-specific catalog borders.

**Architecture:** A model-planned, schema-validated tool loop reads and acts on a host-owned exercise snapshot. Every action is logged, writes are capability-gated and undoable, and reinforcement feedback persists in the learning profile.

**Tech Stack:** React 19, TypeScript, WebLLM/WebGPU, CodeMirror 6, Vitest, Testing Library, augmented-ui.

**Spec:** `docs/superpowers/specs/2026-08-28-local-learning-agent-design.md`

## Global Constraints

- Product copy is Spanish.
- No backend, remote inference, CPU fallback, shell tool or arbitrary filesystem access.
- The LLM chooses tools through validated JSON; invalid plans fail visibly.
- A conceptual question must not mutate the exercise.
- Only explicit write intent in Automático or Trabaja conmigo permits `write_file`.
- Líder is the only blocked external-review surface; the local lesson tutor remains enabled.
- augmented-ui attributes exist only in Cyber.

---

### Task 1: Host-owned tutor workspace

**Files:**
- Modify: `src/learning/tutor/tutorContext.ts`
- Modify: `src/components/editor/CodeEditor.tsx`
- Test: `src/learning/tutor/tutorContext.test.ts`

**Interfaces:**
- Produces: `TutorWorkspaceSnapshot`, `TutorWorkspaceActions`, `publishTutorWorkspace()` and `useTutorWorkspace()`.

- [ ] Write a failing integration test that publishes multiple files, replaces one file and restores its previous content.
- [ ] Run `npx vitest run src/learning/tutor/tutorContext.test.ts` and confirm the missing workspace API fails.
- [ ] Implement the snapshot/actions external store and wire CodeEditor changes to the host callback.
- [ ] Run the focused test and confirm it passes.

### Task 2: Model-planned tools

**Files:**
- Create: `src/learning/tutor/tutorTools.ts`
- Create: `src/learning/tutor/tutorAgent.ts`
- Modify: `src/learning/tutor/tutorPrompt.ts`
- Test: `src/learning/tutor/tutorAgent.integration.test.ts`

**Interfaces:**
- Consumes: `TutorWorkspaceSnapshot`, `TutorWorkspaceActions`, `LocalGenerationService`.
- Produces: `runTutorTurn(input, service, workspace)` with `activities`, `response`, `changedFiles` and `reinforcement`.

- [ ] Write failing cases for lesson reading, workspace feedback, explicit editing, denied editing and invalid tool JSON.
- [ ] Run the focused integration test and confirm failures identify missing agent/tool modules.
- [ ] Implement exact tool schemas, JSON parsing, capability checks, sequential execution and the final response request.
- [ ] Run the focused integration test and confirm all cases pass.

### Task 3: Reinforcement persistence

**Files:**
- Modify: `src/learning/types.ts`
- Modify: `src/learning/mastery.ts`
- Modify: `src/learning/localLearningRepository.ts`
- Modify: `src/learning/curriculumEvidence.ts`
- Test: `src/learning/curriculumEvidence.test.ts`

**Interfaces:**
- Produces: `TutorReinforcement` and `saveTutorReinforcement()` with deduplication by course and skill.

- [ ] Add a failing test proving repeated feedback increments evidence count without duplicating the concept.
- [ ] Run the focused test and confirm it fails.
- [ ] Extend defaults, profile repair and persistence.
- [ ] Run the focused test and confirm it passes.

### Task 4: Tutor interaction UI

**Files:**
- Modify: `src/components/tutor/SocraticTutor.tsx`
- Modify: `src/index.css`
- Test: `src/components/tutor/SocraticTutor.test.tsx`

**Interfaces:**
- Consumes: `runTutorTurn`, local model catalog and tutor workspace.

- [ ] Add failing interaction coverage for the mode selector, model selector, activity log, file change and undo.
- [ ] Run the focused component test and confirm it fails.
- [ ] Replace the four-button mode grid with compact selectors, activity cards and undo controls while preserving focus management and streaming feedback.
- [ ] Run the focused component test and confirm it passes.

### Task 5: Learning center and external review lock

**Files:**
- Modify: `src/components/learning/LearningCenter.tsx`
- Modify: `src/components/learning/ReviewQueue.tsx`
- Modify: `src/components/learning/LeaderMode.tsx`
- Modify: `src/index.css`
- Test: `src/components/learning/LearningCenter.integration.test.tsx`

**Interfaces:**
- Consumes: tutor reinforcements from `LearningProfile`.

- [ ] Add a failing integration test for a disabled Líder tab, no interview form and visible reinforcement feedback.
- [ ] Run the focused test and confirm it fails.
- [ ] Implement the locked state and polish responsive navigation, panels, empty states and reinforcement cards.
- [ ] Run the focused test and confirm it passes.

### Task 6: Declarative augmented-ui catalog

**Files:**
- Modify: `src/components/curriculum/CourseCatalog.tsx`
- Modify: `src/themes/hud-augmented.css`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useTheme()`.

- [ ] Change the existing theme test to require valid augmented-ui tokens in Cyber and no attributes in Normal.
- [ ] Run the focused App test and confirm it fails.
- [ ] Render theme-owned attributes declaratively and remove duplicate/conflicting card border rules.
- [ ] Run the focused App test and confirm it passes.

### Task 7: Integrated validation

**Files:**
- Modify only files implicated by observed failures.

- [ ] Run focused tutor, learning-center and App integration suites.
- [ ] Run `npm run lint`, `npm test` and `npm run build`.
- [ ] Run `git diff --check`.
- [ ] In the real browser, exercise Normal and Cyber on desktop and mobile: prepare/select a model, ask a conceptual question, request feedback, make and undo a change, open Mis aprendizajes, inspect the locked Líder tab and alternate themes on the catalog.

