# Open Cells Curriculum V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a neutral, production-grade Open Cells course with complete component and application coverage, real reusable projects, and no research provenance.

**Architecture:** Preserve lessons 1–68 and enrich their shared pedagogy. Add focused advanced units through the existing curriculum factories, extend the neutral project matrix, and protect the boundary with a repository-level leak test.

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest, CodeMirror 6, local Cells runtime/playgrounds.

**Spec:** `docs/superpowers/specs/2026-08-28-open-cells-curriculum-v2-design.md`

## Global Constraints

- Do not copy reference files or expose their path, organization, URLs, products, infrastructure, or datasets.
- Use only neutral `academy-*` artifacts and fictional fixtures.
- Preserve existing IDs and unrelated dirty changes.
- Use behavior tests with variable inputs and verify visible work in a real browser.

---

### Task 1: Enforce the neutral-content boundary

**Files:**
- Create: `src/curriculum/open-cells/provenanceBoundary.integration.test.ts`
- Modify: `src/curriculum/open-cells/course.ts`
- Delete: `src/curriculum/open-cells/sources.ts`

**Interfaces:** Produces a source-free `OPEN_CELLS_COURSE` and a scan that fails on private provenance.

- [ ] Write a failing scan covering curriculum, scripts, recipes, and guiones.
- [ ] Run it and confirm current source cards fail.
- [ ] Remove visible sources and make the scan pass.
- [ ] Run the Open Cells integration suite.

### Task 2: Strengthen the lesson contract

**Files:**
- Modify: `src/curriculum/open-cells/units07to68.ts`
- Modify: `src/curriculum/open-cells/guidedLessons.ts`
- Test: `src/curriculum/open-cells/guidedLessons.integration.test.ts`

**Interfaces:** Every reading exposes explanation, worked example, file journey, diagnostic checklist, and transfer practice.

- [ ] Write failing structural assertions for the richer lesson contract.
- [ ] Confirm the generic three-section units fail.
- [ ] Extend the unit schema and generated guided lesson narration.
- [ ] Run focused curriculum tests.

### Task 3: Add missing production topics

**Files:**
- Create: `src/curriculum/open-cells/advancedUnits.ts`
- Modify: `src/curriculum/open-cells/course.ts`
- Modify: `src/curriculum/open-cells/course.integration.test.ts`

**Interfaces:** Produces stable lessons `open-cells-69` onward and an advanced module registered after the current path.

- [ ] Write failing coverage assertions for lifecycle, context, assets, themes, interceptors, delegated routes, templates, offline behavior, flags, observability, analytics, performance, CI/CD, and migrations.
- [ ] Add focused readings in dependency order.
- [ ] Register their scrims, readings, reasoning activities, and debug practices.
- [ ] Run course coverage tests.

### Task 4: Extend reusable project journeys

**Files:**
- Modify: `src/curriculum/open-cells/lessonProjects.ts`
- Modify: `src/curriculum/open-cells/lessonWorkspaces.ts`
- Modify: `src/curriculum/open-cells/projectJourneys.ts`
- Test: `src/curriculum/open-cells/lessonProjects.test.ts`

**Interfaces:** Maps every new lesson to a distinct neutral component, page, service, or application workspace.

- [ ] Write failing assertions that new lessons rotate artifacts and reuse earlier dependencies.
- [ ] Add neutral artifacts and workspace mappings.
- [ ] Add multi-file journeys with explicit read/write stops.
- [ ] Run project and workspace tests.

### Task 5: Complete scripts and practice evidence

**Files:**
- Create: `docs/guiones/open-cells/69.md` onward
- Modify: `src/curriculum/open-cells/debugExercises.ts`
- Modify: `src/curriculum/open-cells/reasoning.ts`
- Test: `src/curriculum/open-cells/reasoning.integration.test.ts`

**Interfaces:** Every new unit has spoken-only Spanish narration, an individual reasoning activity, and a different broken program.

- [ ] Write failing completeness checks.
- [ ] Add human Spanish scripts and practices without solutions.
- [ ] Verify behavioral validators use more than one input.
- [ ] Run all exercise tests.

### Task 6: Validate the full product

**Files:** No production changes unless validation exposes a defect.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] In a real browser, open early, component, app, and advanced lessons in normal and cyber themes.
- [ ] Exercise play, pause, edit, run, preview, practice, roadmap return, and ZIP continuation.
- [ ] Review the final diff for leaked provenance or unrelated changes.
