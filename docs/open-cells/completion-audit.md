# Auditoría de cumplimiento de Open Cells

Fecha de auditoría: 2026-08-26.

Esta auditoría usa como contrato el encargo completo y como evidencia el worktree y las ejecuciones reales. El curso de Open Cells permanece separado de `course-web-components-lit`; Lit es un prerrequisito, no un bloque duplicado.

| Requisito | Estado | Evidencia comprobable |
| --- | --- | --- |
| Curso independiente | Cumplido | `course-open-cells`, catálogo propio, ruta y roadmap propios. La UI muestra 68 lecciones y 141 prácticas. |
| Matriz Notas → Lit → Cells | Cumplido | `coverage-matrix.md` separa prerrequisitos Lit de los contratos Cells y los proyectos de transferencia. |
| Ruta completa, progresiva y sin tope artificial de 45 | Cumplido | 68 unidades agrupadas en 8 fases, desde el límite Lit/Cells hasta aplicaciones, datos, CLI y capstone. |
| Formato completo por unidad | Cumplido | Cada unidad sigue `scrim → lectura → razonamiento → depuración`; `guidedLessons.integration.test.ts` valida las 68 secuencias. |
| Clases guiadas | Cumplido | 68 cintas compiladas con capítulos, habla silenciosa, escrituras, cambios de archivo, puntero, preview y reto que pausa. |
| Guiones humanos sin audio inventado | Cumplido | 68 guiones hablados en `docs/guiones/open-cells/`, marcados `pendiente-de-voz`; los cues coinciden con el texto. No se añadió MP3 ficticio. |
| Retos sin solución visible | Cumplido | Starter distinto del programa demostrado, tres pistas progresivas y validación conductual con varias entradas. |
| Worker tipado, perezoso y cancelable | Cumplido | Protocolo discriminado, `requestId`, `sessionId`, generación, errores serializables, carga perezosa, cancelación y cierre. |
| VFS seguro y versionado | Cumplido | Rutas POSIX relativas, límites, rechazo de escape/colisiones, escrituras inmutables, generación e IndexedDB versionado. |
| Scaffolds de componente y aplicación | Cumplido | WidgetMixin, ScopedElementsMixin, i18n, eventos, demo, tests y docs; además PageMixin, rutas lazy, canales, lifecycle, datos y build exportable. |
| Proyectos integradores distintos | Cumplido | Museo, Clima, Relé y capstone poseen identidad, datos, canales, rutas y claves de borrador diferentes. |
| Resolver modular y allowlist | Cumplido | Grafo del workspace, extensiones/rutas, import map fijado y rechazo de imports o scripts remotos arbitrarios. |
| Preview aislado | Cumplido | `sandbox="allow-scripts"`, CSP, mensajes validados por `event.source` y ejecución correlacionada por `testRunId`. |
| i18n interactivo | Cumplido | El shell cambia ES/EN y el mismo componente actualiza texto dentro del iframe. Verificado en navegador. |
| Evento público observable | Cumplido | Inspector acotado muestra nombre y `detail`; el navegador observó `academy-learning-card-continue` con Ada. |
| Runner conductual browser-safe | Cumplido | Monta componente/app, cambia idioma y propiedades, pulsa, navega, comprueba cleanup/datos/cancelación y aplica timeout. |
| Coverage real | Cumplido | Instrumentación AST ejecutada dentro del Worker/iframe; reporta sentencias, ramas, funciones, líneas y archivos. |
| Playground independiente | Cumplido | Componente Cells y Aplicación Cells reutilizan `PlaygroundView` con código, preview, pruebas, coverage, comandos y ZIP. |
| Persistencia | Cumplido | Borradores y sesiones Cells versionados en IndexedDB por variante/proyecto/etapa; conserva archivo activo, generación, panel, comando, idioma, resultados, coverage y salida educativa. |
| ZIP y CLI real | Cumplido | ZIP cliente desde `WorkspaceSnapshot`; `cells:gate` materializa fixtures y ejecuta test/build reales de componente y app con la CLI absoluta. |

## Evidencia de navegador

- Catálogo y roadmap: curso independiente, 68 lecciones y 141 prácticas.
- Clase: inicio manual, subtítulos, puntero, varios archivos, preview flotante y reto que pausa.
- Proyecto Museo inicial: 15/19 contratos; falla cleanup y navegación tanto en revisión estructural como conductual.
- Proyecto Museo corregido desde CodeMirror: 19/19 contratos y coverage por archivo; reiniciar restaura los dos TODO.
- Componente: el shell cambió la demo de español a inglés sin recrear el proyecto.
- Evento: un clic dentro del Shadow DOM llegó al inspector como `academy-learning-card-continue · {"learnerName":"Ada"}`.

## Límites declarados

- La ejecución normal es 100 % de navegador. El binario Node de Cells solo se usa en `cells:gate`, fuera del producto.
- Los 68 guiones no tienen voz hasta que exista audio solicitado; la cinta conserva narración silenciosa y subtítulos sin URL MP3 falsa.
- El runtime no afirma instalar paquetes arbitrarios ni ejecutar npm, Vite, Vitest o Playwright dentro del Worker.
- El gate limpio informó vulnerabilidades transitivas de dependencias públicas. No se aplicó una actualización destructiva automática que pudiera romper la CLI.
