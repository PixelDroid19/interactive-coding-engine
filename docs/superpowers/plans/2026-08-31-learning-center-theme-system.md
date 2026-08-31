# Learning Center and Shared Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rigid learning notebook with real free-form notes, explain the review loop, and make Learning Center and staff dashboard consume one restrained theme system aligned with the editor.

**Architecture:** PostgreSQL and the authenticated API remain the source of truth. The backend exposes note CRUD with ownership checks and migrates legacy structured notes into a single readable body. The frontend consumes a normalized note contract and shared semantic UI primitives whose CSS variables are emitted by the theme registry.

**Tech Stack:** PostgreSQL migrations, Fastify 5, TypeBox, React 19, TypeScript, SCSS, Testing Library, Vitest, Railway, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-31-learning-center-theme-system-design.md`

## Global Constraints

- Product copy remains Spanish.
- Courses and practices remain available without authentication; personal learning data requires an authenticated student.
- The backend is the source of truth; browser cache is not a silent fallback.
- Normal theme remains CodeSilk; cyber follows the approved editor and catalog references.
- No rainbow gradients, exaggerated neon halos, or page-owned cyber palettes.
- Do not redesign the editor or remove catalog colors that communicate course level.
- Do not use subagents.
- Preserve unrelated dirty changes and commit only explicit files.

---

### Task 1: Free-form notebook persistence

**Files:**
- Create: `/home/monasterios/Documents/v2/learning-platform-backend/migrations/011_free_form_notebook.sql`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/modules/learning/learningCenterRepository.ts`
- Modify: `/home/monasterios/Documents/v2/learning-platform-backend/src/http/routes.ts`
- Test: `/home/monasterios/Documents/v2/learning-platform-backend/tests/integration/api.integration.test.ts`

**Interfaces:**
- Produces: `NotebookInput = { courseSlug: string; title: string; body: string; itemKey?: string }`.
- Produces: `createNotebook(actorId, input)`, `updateNotebook(actorId, noteId, input)`, and `deleteNotebook(actorId, noteId)`.
- Produces: snapshot notes shaped as `{ id, title, body, itemKey, updatedAt }`.

- [ ] **Step 1: Write failing integration tests**

Add requests that create two notes in one course, update one, reject cross-actor update/delete, delete the owned note, and confirm the snapshot exposes only the remaining free-form note:

```ts
const created = await built.app.inject({
  method: 'POST', url: '/v1/me/notebook', headers: { 'x-anonymous-id': actor },
  payload: { courseSlug: 'open-cells', title: 'Registro', body: 'Importar no registra el componente.', itemKey: 'open-cells-01' },
});
expect(created.statusCode).toBe(201);
expect(created.json()).toMatchObject({ title: 'Registro', body: 'Importar no registra el componente.', itemKey: 'open-cells-01' });
```

- [ ] **Step 2: Verify RED**

Run `pnpm vitest run tests/integration/api.integration.test.ts -t "gestiona notas libres"` in the backend. Expected: `404` because `POST /v1/me/notebook` does not exist.

- [ ] **Step 3: Add migration and repository operations**

Migration adds nullable `title`, `body`, `item_key`, backfills `body` by joining non-empty legacy fields with headings, makes `body` non-null, and drops the unique `(actor_id, course_slug, skill_key)` constraint. Repository queries use `id` as identity and include `actor_id` in every mutation predicate.

- [ ] **Step 4: Register validated routes**

Register `POST /v1/me/notebook`, `PUT /v1/me/notebook/entries/:noteId`, and `DELETE /v1/me/notebook/entries/:noteId`. Validate title at 120 characters, body between 1 and 12000 characters, and optional lesson key with the existing `LessonKey` schema. Keep the legacy skill route available until the frontend migration is deployed.

- [ ] **Step 5: Verify GREEN and backend regression suite**

Run:

```bash
pnpm vitest run tests/integration/api.integration.test.ts -t "gestiona notas libres"
pnpm lint
pnpm build
```

Expected: all commands exit `0`.

- [ ] **Step 6: Commit backend slice**

```bash
git add migrations/011_free_form_notebook.sql src/modules/learning/learningCenterRepository.ts src/http/routes.ts tests/integration/api.integration.test.ts
git commit -m "feat(learning): add free-form notebook entries"
```

### Task 2: Frontend note contract and notebook flow

**Files:**
- Modify: `src/services/learningCenterApi.ts`
- Modify: `src/learning/types.ts`
- Modify: `src/components/learning/LearningCenter.tsx`
- Replace behavior in: `src/components/learning/LearningNotebook.tsx`
- Test: `src/components/learning/LearningNotebook.test.tsx`
- Test: `src/components/learning/LearningCenter.integration.test.tsx`

**Interfaces:**
- Consumes: backend note `{ id, title, body, itemKey, updatedAt }`.
- Produces: `createRemoteNotebook`, `updateRemoteNotebook`, and `deleteRemoteNotebook`.
- Produces: `NotebookEntry = { id, courseId, title, body, itemId?, updatedAt }`.

- [ ] **Step 1: Write failing component tests**

Assert that an empty notebook renders a title input, one body textarea, and `Guardar nota`; assert there is no `Concepto` select or legacy field labels. Add create, edit, delete, dirty-draft conflict, and error recovery behavior.

```tsx
expect(screen.getByLabelText('Título de la nota')).toBeTruthy();
expect(screen.getByLabelText('Nota')).toBeTruthy();
expect(screen.queryByRole('combobox')).toBeNull();
expect(screen.queryByLabelText('Modelo mental')).toBeNull();
```

- [ ] **Step 2: Verify RED**

Run `pnpm vitest run src/components/learning/LearningNotebook.test.tsx`. Expected: missing title/body controls and existing legacy select.

- [ ] **Step 3: Implement normalized contract and notebook UI**

Render a compact composer above a chronological note list. Selecting `Editar` loads one note into the composer; `Cancelar edición` restores a clean draft. The course is supplied by `LearningCenter`; an optional item context is displayed but never manually selected.

- [ ] **Step 4: Update optimistic reconciliation**

Track pending notes by note ID, reconcile server timestamps, and keep a dirty draft when a newer remote revision arrives. Delete removes the note optimistically only after the API succeeds.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
pnpm vitest run src/components/learning/LearningNotebook.test.tsx
pnpm vitest run src/components/learning/LearningCenter.integration.test.tsx
```

Expected: both suites pass without warnings.

- [ ] **Step 6: Commit frontend behavior slice**

```bash
git add src/services/learningCenterApi.ts src/learning/types.ts src/components/learning/LearningCenter.tsx src/components/learning/LearningNotebook.tsx src/components/learning/LearningNotebook.test.tsx src/components/learning/LearningCenter.integration.test.tsx
git commit -m "feat(learning): simplify personal notes"
```

### Task 3: Explain the review loop

**Files:**
- Modify: `src/components/learning/ReviewQueue.tsx`
- Test: `src/components/learning/ReviewQueue.test.tsx`
- Modify: `src/components/learning/LearningCenter.tsx`

**Interfaces:**
- Consumes: existing review cards and reinforcements.
- Produces: a visible explanation of scheduled recall and a three-step progress label.

- [ ] **Step 1: Write failing review tests**

Assert that a due review explains why it exists before the question, distinguishes agent reinforcement, and exposes `Responder`, `Comparar`, `Registrar recuerdo` as the sequence.

- [ ] **Step 2: Verify RED**

Run `pnpm vitest run src/components/learning/ReviewQueue.test.tsx`. Expected: explanation and sequence are absent.

- [ ] **Step 3: Implement concise instructional copy and hierarchy**

Add one short introduction and a small step indicator; do not add another form or additional student choices.

- [ ] **Step 4: Verify GREEN and commit**

Run `pnpm vitest run src/components/learning/ReviewQueue.test.tsx src/components/learning/LearningCenter.integration.test.tsx`, then commit `feat(learning): clarify scheduled reviews`.

### Task 4: Semantic UI primitives and theme tokens

**Files:**
- Create: `src/components/ui/UiButton.tsx`
- Create: `src/components/ui/UiSurface.tsx`
- Create: `src/components/ui/UiTabs.tsx`
- Create: `src/components/ui/UiField.tsx`
- Create: `src/components/ui/uiPrimitives.test.tsx`
- Create: `src/styles/components/_ui-primitives.scss`
- Modify: `src/styles/abstracts/_themes.scss`
- Modify: `src/styles/base/_tokens.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/themes/visualContracts.test.ts`

**Interfaces:**
- Produces: `UiButton`, `UiSurface`, `UiTabs`, and `UiField` with semantic variants only.
- Produces: `--ui-canvas`, `--ui-surface`, `--ui-surface-raised`, `--ui-text`, `--ui-muted`, `--ui-border`, `--ui-accent`, `--ui-focus`, `--ui-danger`, `--ui-shadow`, and `--ui-radius`.

- [ ] **Step 1: Write failing component and theme tests**

Exercise button disabled state, accessible tabs with arrow keys, field help/error association, and surface variants. Assert computed theme variables exist on the document root in normal and cyber modes.

- [ ] **Step 2: Verify RED**

Run `pnpm vitest run src/components/ui/uiPrimitives.test.tsx src/themes/visualContracts.test.ts`. Expected: missing modules and missing semantic variables.

- [ ] **Step 3: Implement primitives and tokens**

Primitives forward native props and refs, contain no theme conditionals, and style only through semantic variables. Normal emits paper/ink/hard shadow; cyber emits near-black surfaces, thin neutral borders, yellow accent, cyan focus, and no glow token.

- [ ] **Step 4: Verify GREEN and commit**

Run targeted tests plus `pnpm lint`; commit `refactor(ui): centralize themed primitives`.

### Task 5: Refactor Learning Center and staff dashboard visuals

**Files:**
- Modify: `src/components/learning/LearningCenter.tsx`
- Modify: `src/components/learning/LearningNotebook.tsx`
- Modify: `src/components/learning/ReviewQueue.tsx`
- Modify: `src/auth/StaffDashboard.tsx`
- Modify: `src/styles/components/_learning-center.scss`
- Modify: `src/styles/components/_staff-dashboard.scss`
- Modify: `src/styles/themes/cyber/_modals.scss`
- Modify: `src/styles/themes/cyber-augmented/_modals.scss`
- Test: `src/components/learning/LearningCenter.integration.test.tsx`
- Test: `src/themes/visualContracts.test.ts`

**Interfaces:**
- Consumes: semantic UI primitives and variables from Task 4.
- Produces: no page-specific cyber palette or rainbow augmented border.

- [ ] **Step 1: Add failing integration and visual-contract assertions**

Assert the Learning Center and dashboard render shared primitive classes in cyber mode without component-specific theme modifier classes. Assert the modal augmented border uses `var(--ui-border)` rather than a gradient.

- [ ] **Step 2: Verify RED**

Run `pnpm vitest run src/components/learning/LearningCenter.integration.test.tsx src/themes/visualContracts.test.ts`. Expected: page-owned cyber classes and gradient border remain.

- [ ] **Step 3: Refactor components and remove duplicated overrides**

Use shared surfaces, buttons, fields and tabs. Delete learning-center and dashboard neon blocks, magenta drop shadows, scanline button overlays and local cyan/yellow literals. Preserve approved catalog level accents and editor selectors.

- [ ] **Step 4: Verify GREEN and commit**

Run targeted tests and commit `refactor(theme): align learning surfaces with editor`.

### Task 6: Full verification and deployment

**Files:**
- Modify only if validation finds a proven defect.

**Interfaces:**
- Consumes: completed backend and frontend slices.
- Produces: production deployments on Railway and Vercel.

- [ ] **Step 1: Run complete automated verification**

Backend:

```bash
pnpm test:all
pnpm lint
pnpm build
```

Frontend:

```bash
pnpm test
pnpm lint
pnpm build
```

- [ ] **Step 2: Run real desktop browser flows**

At a desktop viewport, verify normal and cyber themes with: empty notes, create/edit/delete note, due review, reinforcement, loading, API error, dashboard overview, and theme switching. Confirm the editor and catalog retain the approved visual language.

- [ ] **Step 3: Deploy backend and migrate production**

Push the backend commit, deploy the Railway service, run migrations, verify `/health/ready`, and execute authenticated note CRUD against production with a disposable note removed at the end.

- [ ] **Step 4: Deploy frontend**

Push frontend commits, deploy Vercel production, verify `https://devt.lat`, asset loading, API CORS, and both themes in the production browser.

- [ ] **Step 5: Record evidence**

Capture test counts, deployment IDs, health responses, and browser screenshots. Leave the goal active if any requirement lacks direct evidence.
