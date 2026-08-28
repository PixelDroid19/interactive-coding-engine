# Open Cells Accumulative Projects Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with TDD and review each completed slice before continuing.

**Goal:** Sustituir el workspace repetido de `academy-learning-card` por una progresión de componentes, páginas y aplicaciones diferentes que reutilizan artefactos anteriores.

**Architecture:** Una matriz declarativa asigna cada lección a una familia, artefacto, dependencias y foco. Recipes neutrales ensamblan workspaces exportables y los generadores de cinta consumen esa matriz.

**Tech Stack:** TypeScript, React 19, Vite 6, Vitest, CodeMirror 6 y runtime Cells en Worker/iframe.

**Spec:** `docs/superpowers/specs/2026-08-27-open-cells-acumulative-projects-design.md`

## Global Constraints

- Conservar 68 unidades y el orden scrim → lectura → razonamiento.
- UI, guiones, diagnósticos y documentación en español.
- Componentes neutrales `academy-*`; ninguna dependencia privada.
- SCSS es fuente y `.css.js` es el artefacto consumido.
- Preview, pruebas y exportación operan sobre el workspace completo.

### Task 1: Matriz curricular

**Files:** Create `src/curriculum/open-cells/lessonProjects.ts`; test in `lessonProjects.test.ts`.

- [ ] Definir tipos `OpenCellsLessonProject` y `OpenCellsArtifact`.
- [ ] Declarar las 68 asignaciones, primeras apariciones y dependencias.
- [ ] Probar diversidad, máximo de repetición y orden topológico.
- [ ] Commit de la matriz.

### Task 2: Recipes acumulativas

**Files:** Create `src/engine/cells/cellsCurriculumRecipes.ts`; test in `cellsCurriculumRecipes.test.ts`.

- [ ] Escribir pruebas que exijan tags, previews y imports distintos.
- [ ] Construir action button, status badge, state panel, product card, product list y search filter.
- [ ] Ensamblar la biblioteca y añadirla a la aplicación sin duplicar fuentes.
- [ ] Probar preview y resolución del grafo para cada familia.
- [ ] Commit de recipes.

### Task 3: Journeys y clases guiadas

**Files:** Modify `guidedLessons.ts`, `projectJourneys.ts`, `lesson06.ts` y sus pruebas.

- [ ] Sustituir rangos hardcodeados por la matriz.
- [ ] Generar focos y recorridos desde cada workspace real.
- [ ] Mantener tres archivos visitados, una escritura y una ejecución por clase.
- [ ] Regenerar guiones hablados desde los nuevos recorridos.
- [ ] Commit de la migración de clases.

### Task 4: Prácticas y auditoría dinámica

**Files:** Modify `cellsProjectAudit.ts`, `CellsLearningLab.tsx`, recipes de práctica y tests de integración.

- [ ] Hacer que la auditoría lea propiedades, eventos y dependencias desde metadata.
- [ ] Asignar prácticas al artefacto de cada bloque y aceptar soluciones equivalentes.
- [ ] Verificar que starter falla y solución completa pasa para cada laboratorio.
- [ ] Commit de prácticas y validadores.

### Task 5: Validación real

**Files:** Modify integration tests and any broken copy discovered by validation.

- [ ] Ejecutar todas las cintas y construir sus previews.
- [ ] Revisar en Browser una clase de cada familia y ambos temas.
- [ ] Probar propiedad, evento, navegación, estados y exportación.
- [ ] Ejecutar lint, suite completa, build y `git diff --check`.
- [ ] Dividir los cambios finales en commits coherentes y subirlos.
