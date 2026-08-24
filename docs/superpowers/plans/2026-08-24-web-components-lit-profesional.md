# Web Components y Lit profesional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar un curso independiente, sin un límite artificial de unidades, que lleve a estudiantes de JavaScript a construir y depurar aplicaciones con Web Components y Lit. La versión auditada contiene 45 unidades porque cada frontera conceptual conserva su propia explicación y práctica, incluido el proyecto Relé heredado.

**Architecture:** El curso replica el contrato multicurso existente mediante especificaciones declarativas y una fábrica, pero añade validación contra el iframe real para comprobar componentes. Lit se resuelve con un import map del preview, sin introducir TypeScript en el código del estudiante.

**Tech Stack:** React 19, TypeScript del host, JavaScript ES modules en los workspaces, Web Components, Lit 3.3.3, CodeMirror, Vitest, Browser.

**Spec:** `docs/superpowers/specs/2026-08-24-web-components-lit-profesional-design.md`

## Global Constraints

- No modificar ni reemplazar Fundamentos o JavaScript.
- No usar TypeScript ni decoradores en el código del curso.
- No incluir soluciones en starters, pistas o diagnóstico.
- Cada unidad construye una app y depura otra distinta.
- Verificar UI y comportamiento en navegador real.

---

### Task 1: Runtime profesional para Lit

**Files:** `src/engine/previewDocument.ts`, `src/engine/previewDocument.test.ts`, `src/engine/testRunner.ts`, `src/types/scrim.ts`

- [ ] Añadir import map para imports `lit` y `lit/*`.
- [ ] Añadir validador asíncrono `browser-script` sobre la vista previa real.
- [ ] Probar import map, resultados correctos, errores y vista no disponible.

### Task 2: Modelo pedagógico y fábrica

**Files:** `src/curriculum/web-components-lit/types.ts`, `factory.ts`, `reasoning.ts`

- [ ] Modelar lecturas profundas, aplicaciones, errores y fuentes.
- [ ] Crear workspaces browser con HTML, CSS y JavaScript.
- [ ] Compilar guion, ejemplo, starter y reto sin exponer solución.

### Task 3: Catorce unidades de Web Components

**Files:** `specs01to07.ts`, `specs08to14.ts`

- [ ] Implementar progresión nativa, aplicaciones, lecturas y bugs.
- [ ] Explicar herencia y `super()` antes del ciclo de vida de Lit.

### Task 4: Treinta y una unidades de Lit y arquitectura aplicada

**Files:** `specs15to20.ts`, `specs21to26.ts`, `specs27to32.ts`, `specs33to40.ts`, `specs41to45.ts`

- [ ] Implementar templates, reactividad, ciclo, estilos, directivas y arquitectura.
- [ ] Profundizar en directivas propias, animación accesible, Observer, Bridge/Adapter, APIs, SSR e hidratación.
- [ ] Migrar Mixins y Proyecto Relé mediante cadena de super, grafos, ciclos, orden topológico, eventos, reloj e historial.
- [ ] Cerrar con un capstone vertical y pruebas de navegador.

### Task 5: Registro, guiones y garantías

**Files:** `course.ts`, `curriculumFlow.integration.test.ts`, `docs/guiones/web-components-lit/`, `src/App.tsx`

- [ ] Registrar el tercer curso y sus 45 scrims.
- [ ] Exportar guiones humanos.
- [ ] Comprobar orden, cantidad, fuentes, starters rotos, JS-only y ausencia de soluciones.

### Task 6: Validación de producto

- [ ] Ejecutar `npm test`, `npm run lint` y `npm run build`.
- [ ] Probar catálogo, lección 1, ciclo nativo, transición a Lit, ciclo Lit y proyecto final en Browser.
- [ ] Corregir hallazgos y repetir la validación.
