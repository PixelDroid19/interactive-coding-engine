# Diseño del curso y runtime Open Cells

## Objetivo

Open Cells es un curso independiente que permite crear, ejecutar, comprobar y exportar componentes y aplicaciones Cells desde el navegador. El runtime conserva los contratos de archivos y comandos que puede ejecutar honestamente; nunca afirma que inició Node, un servidor, npm, Vitest o Playwright.

## Fronteras

- El curso de Web Components y Lit conserva su recorrido y progreso propios.
- El runtime Cells no usa `fs`, `child_process`, sockets, puertos ni backend.
- El código editable se transforma en un Worker y se muestra en un iframe aislado.
- Los imports del preview pertenecen a una allowlist; no existe instalación arbitraria de paquetes.
- El workspace visible es la única fuente de la vista previa, las comprobaciones y el ZIP.

## Arquitectura

```text
CellsLearningLab
  ├─ misión por etapa ─── componente, ciclo, canales, datos o entrega
  ├─ terminal Cells ───── gramática permitida y estado honesto
  ├─ árbol de archivos + CodeMirror/LSP
  ├─ CellsRuntimeClient ─ requestId, cancelación y generaciones
  │    └─ cellsRuntime.worker
  │         ├─ parser de comandos
  │         ├─ filesystem virtual
  │         ├─ recetas de componente y aplicación
  │         ├─ resolver allowlisted
  │         ├─ compilador de preview
  │         ├─ auditor de contratos
  │         └─ exportador ZIP
  └─ iframe sandbox + resultados por contrato
```

## Cortes verticales implementados

El componente `academy-learning-card` incluye package, README, fuente, demo, catálogos EN/ES, prueba, tipos y metadata. Compone `WidgetMixin(ScopedElementsMixin(LitElement))`, registra dependencias scoped, traduce el texto visible y emite una intención pública.

La aplicación `academy-store-app` continúa el aprendizaje en cuatro etapas sobre el mismo proyecto:

1. Ciclo de página, cleanup y navegación por nombre.
2. Publicación y suscripción a canales.
3. Estados de datos, respuestas fuera de orden y cancelación.
4. Ruta desconocida, configuración de producción y exportación.

El scaffold completo contiene entrada, rutas lazy, tres páginas, componente hijo, data manager, configuración dev/prod, locales, prueba, tipos y documentación.

## Protocolo

Cada mensaje lleva `sessionId`, `generation` y `requestId`.

Entradas:

- `project:create`, `project:load`
- `file:write`, `file:delete`
- `command:run`, `request:cancel`
- `preview:build`, `tests:run`
- `locales:generate`, `documentation:generate`
- `project:export`, `runtime:dispose`

Salidas:

- `runtime:ready`, `workspace:updated`
- `command:completed`, `preview:built`, `tests:completed`
- `locales:generated`, `documentation:generated`, `project:exported`
- `runtime:progress`, `request:cancelled`, `runtime:error`

Los payloads son serializables mediante structured clone. Los errores conservan código, mensaje, archivo, línea, columna y pista cuando existen.

## Filesystem virtual

- Rutas POSIX relativas, sin escapes mediante `..` ni rutas absolutas.
- Máximo: 120 archivos, 512 KiB por archivo y 8 MiB por workspace.
- Escrituras inmutables y `generation` incremental.
- Colisiones de archivo/directorio y duplicados producen errores de dominio.
- `WorkspaceSnapshot` es el contrato compartido por editor, preview, auditor y exportador.

## Terminal browser-safe

La gramática reconoce:

- `cells component:create --scaffold '<json>'`
- `cells component:test [--coverage]`
- `cells component:locales`
- `cells component:documentation`
- `cells component:build:demo`
- `cells component:dev`
- `cells app:create --scaffold '<json>'`
- `cells app:test [--coverage]`
- `cells app:build`
- `cells app:dev`

Los comandos `*:dev` construyen la vista previa en el navegador. No informan PID, puerto ni servidor. Los comandos `*:create` exigen un scaffold JSON explícito y no instalan dependencias.

## Preview y aislamiento

- La compilación ocurre dentro del Worker.
- El iframe usa `sandbox="allow-scripts"`, sin `allow-same-origin`.
- Lit, Scoped Elements y los módulos Cells educativos se resuelven únicamente desde la allowlist.
- Los módulos del workspace se reescriben como un grafo aislado, incluidas las rutas dinámicas.
- El código del estudiante no se evalúa en el hilo principal.
- Errores y estado cruzan una frontera explícita de mensajes.

## Comprobaciones

El runtime audita contratos declarados y el preview comprueba que el grafo puede construirse y ejecutarse en el iframe. El componente tiene siete contratos y la aplicación trece. Cada práctica retira dos contratos concretos.

La interfaz denomina el porcentaje **comportamientos**, no cobertura de líneas, y enumera cada contrato aprobado o fallido. Las pruebas del repositorio validan además VFS, protocolo, generación, preview, LSP, persistencia y ZIP.

## Persistencia y salida

Cada laboratorio guarda un snapshot versionado en IndexedDB bajo una clave separada por tipo y etapa. Reiniciar elimina únicamente ese borrador. La exportación produce un ZIP estándar con CRC y la jerarquía completa del proyecto visible.

## Curso independiente

`src/curriculum/open-cells` expone un `Course` propio: 68 lecturas progresivas, 18 prácticas de razonamiento y cinco laboratorios de código. `App.tsx` lo registra sin alterar `course-web-components-lit`. Ambos cursos conservan identificadores, progreso y recorridos separados.

## Evidencia de aceptación

- Protocolo, VFS, parser, recetas y generaciones probados.
- Worker real y cancelable.
- Preview real dentro del iframe aislado.
- Errores de LSP y documentación contextual en español.
- Contratos fallando y pasando en cada etapa.
- Porcentaje con denominador explícito y sin presentarlo como coverage de líneas.
- ZIP validado con una herramienta estándar.
- Navegación, edición, terminal, preview, comprobaciones, persistencia y responsive ejercitados en navegador.
