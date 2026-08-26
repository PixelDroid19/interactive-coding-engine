# Open Cells Project Journeys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir las 68 cintas Cells en recorridos que construyen y conectan archivos reales de componente y aplicación.

**Architecture:** Un módulo de trayectorias declara archivos, orden y roles por unidad. El generador de clases consume esa trayectoria para crear snapshots iniciales incompletos, cambios de archivo, escrituras reales y ejecución; el desafío aislado se conserva después de la demostración. Un sincronizador deriva los guiones Markdown de los subtítulos compilados.

**Tech Stack:** TypeScript, React, motor de cintas existente, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-open-cells-project-journeys-design.md`

## Global Constraints

- No modificar el curso de Fundamentos ni el curso de Lit.
- No incluir soluciones completas dentro de las pistas.
- No usar checkpoints como demostración principal.
- No crear commits ni hacer push.
- Preservar cambios existentes ajenos al curso Cells.

---

### Task 1: Contrato de trayectorias reales

**Files:**
- Create: `src/curriculum/open-cells/projectJourneys.ts`
- Test: `src/curriculum/open-cells/projectJourneys.test.ts`

- [ ] Definir `OpenCellsProjectJourney` con `tour`, `writes` y explicaciones por archivo.
- [ ] Probar trayectorias especiales de componente, demo, app, páginas, datos, pruebas y build.
- [ ] Probar que ninguna trayectoria usa `checkpoints/`.

### Task 2: Cintas basadas en el proyecto

**Files:**
- Modify: `src/curriculum/open-cells/guidedLessons.ts`
- Modify: `src/curriculum/open-cells/guidedLessons.integration.test.ts`

- [ ] Construir snapshots iniciales con los archivos de escritura incompletos pero sintácticamente reconocibles.
- [ ] Emitir cambios entre al menos tres archivos reales.
- [ ] Escribir los archivos responsables y ejecutar antes del desafío.
- [ ] Conservar el ejercicio conductual como práctica posterior.
- [ ] Añadir una prueba que inspeccione eventos y snapshots de las 68 cintas.

### Task 3: Guiones sincronizados

**Files:**
- Create: `scripts/sync-open-cells-guiones.ts`
- Modify: `docs/guiones/open-cells/*.md`

- [ ] Generar cada guion desde `audioTrack.narrationScript` y conservar el encabezado YAML.
- [ ] Ejecutar el sincronizador.
- [ ] Verificar que la prueba de guiones detecta cualquier frase ausente.

### Task 4: Validación del recorrido real

- [ ] Ejecutar integración del currículo y suite Cells.
- [ ] Reproducir en navegador una clase de componente, demo y aplicación.
- [ ] Confirmar cambios de archivo, escrituras, ejecución, preview y desafío.
- [ ] Ejecutar suite completa, lint, build y revisar el diff.

