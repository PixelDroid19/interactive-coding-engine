# Matriz de cobertura para Open Cells

## Decisión de producto

Open Cells es un curso independiente con `course-open-cells`, progreso propio y un playground Cells dedicado. El curso de Web Components y Lit es un prerrequisito recomendado, no un contenedor del nuevo contenido. Las unidades nuevas no vuelven a enseñar Lit desde cero: recuperan el contrato previo en una frase y se concentran en las APIs, el runtime, el toolchain y la arquitectura Cells.

## Fuente Lit, curso existente y contenido Cells

| Fuente Lit local | Cobertura ya presente en Web Components y Lit | Decisión para Open Cells |
| --- | --- | --- |
| 01. Introducción a Lit | 15. Lit automatiza trabajo, no la plataforma | No repetir. Explicar qué añade Cells sobre Lit: runtime, mixins, i18n, páginas, canales y toolchain. |
| 02. Tu primer componente | 1. Contrato HTML; 15. LitElement | Usar como prerrequisito. Enseñar `cells component:create` y la anatomía real del scaffold. |
| 03. Templates con `html` | 16. Templates, bindings y seguridad | No repetir sintaxis. Practicar templates compuestos con dependencias registradas localmente. |
| 04. Propiedades reactivas | 18. Propiedades y atributos | Aplicar a la API pública de un componente Cells y a sus estados observables. |
| 05. Estado reactivo | 19–20. Estado interno e inmutabilidad | Aplicar a `disabled`, `loading`, `empty`, `error` y `success` sin duplicar la teoría de Lit. |
| 06. Propiedades computadas | 23. Ciclo reactivo y cambios | Reutilizar como prerrequisito; no crear una lección Cells solo para getters. |
| 07. Observando cambios | 23–24. `changedProperties`, `updated`, `updateComplete` | Enseñar cuándo el runtime Cells necesita esperar recursos, idioma o navegación. |
| 08. Constructor y conexión | 3 y 22. Conectar, limpiar y `super()` | Aplicar a la cadena `WidgetMixin(ScopedElementsMixin(LitElement))`. |
| 09. `firstUpdated` | 24. DOM actualizado | Aplicar únicamente cuando una integración Cells necesita DOM ya materializado. |
| 10. `updated` y desconexión | 3, 23 y 24 | Centrar la práctica Cells en cleanup de canales, abortos y recursos. |
| 11. Eventos DOM | 7 y 21. Eventos públicos y formularios | Distinguir eventos DOM normales de eventos de negocio Cells. |
| 12. Eventos personalizados | 7. `CustomEvent` público | Enseñar `this.emitEvent(...)`, nombre estable, `detail`, `bubbles` y `composed`. |
| 13. Comunicación entre componentes | 10 y 35. Flujo y suscripciones | Contrastar propiedad, evento, canal, navegación y estado retenido. |
| 14. CSS encapsulado | 4 y 25. Shadow DOM y temas | Aplicar al pipeline SCSS/CSS y a artefactos de estilo Cells. |
| 15. Estilos dinámicos | 28. `classMap`, `styleMap` y `ref` | No repetir directivas. Usar estados visuales de un componente Cells. |
| 16. Parts y variables | 25–26. Temas, slots y parts | Aplicar a tokens y contratos públicos de componentes Cells. |
| 17. Slots y composición | 8 y 26. Slots y composición pública | Aplicar a composición con `scopedElements`, sin volver a enseñar slots. |
| 18. Directivas | 27–28 y 33. Directivas y abstracciones | Prerrequisito opcional; no es contenido exclusivo Cells. |
| 19. Mixins | 41. Mixins heredados y composición | Profundizar en `WidgetMixin`, `CellsPageMixin` y orden de composición. |
| 20. Animaciones | 34. Movimiento accesible | No repetir. Solo aparecerá dentro de un proyecto si sirve al comportamiento. |
| 21. Proyecto final Lit | 32 y 40. Integraciones por cortes verticales | Sustituir por proyectos Cells exportables, no copiar el proyecto Lit. |
| 22. Testing en Lit | 14 y 31. Pruebas públicas y producción | Enseñar el contrato de `cells component:test`, runner browser-safe y coverage real. |
| 23. Observer | 35. Suscripciones y propietarios | Usar como puente conceptual hacia canales Cells y cleanup. |
| 24. Bridge con Lit | 36. Bridge y Adapter | Enseñar Cells Bridge real, no el patrón genérico nuevamente. |
| 25. Proyecto Museo | 37. Museo con estados y curaduría | Reinterpretar como app Cells con páginas, canales y componente propio. |
| 26. Proyecto Clima | 38. Clima, concurrencia y decisiones | Reinterpretar con data manager, cancelación y ciclo de página Cells. |
| 27. Proyecto Relé | 42–45. Grafo, eventos, reloj e historial | Reinterpretar con canales, estado retenido y cleanup Cells. |

## Conocimientos exclusivos que justifican el curso separado

- Gramática y expectativas de la CLI Cells sin simular procesos Node.
- Scaffold real de componentes y aplicaciones.
- `WidgetMixin`, `this.t(...)` y `this.emitEvent(...)`.
- `ScopedElementsMixin` aplicado a dependencias Cells concretas.
- Catálogos EN/ES, carga de recursos y cambio de idioma desde el shell.
- Toolchain de demo, tests, locales, documentación y build.
- `custom-elements.json` y empaquetado consumible.
- Bootstrap de aplicaciones con el runtime público Cells.
- `CellsPageMixin`, páginas lazy, rutas, parámetros y navegación.
- Canales, publicación, suscripción, estado retenido y cleanup.
- Cells Bridge y comunicación con superficies externas.
- Data managers separados de páginas presentacionales.
- Estados `loading`, `empty`, `error` y `success`, abortos y carreras.
- Exportación de un WorkspaceSnapshot como proyecto compatible con la CLI real.

## Roadmap completo propuesto

La cantidad no se fija por simetría con el curso de Lit. La ruta inicial contiene 68 unidades porque cada una introduce o comprueba un contrato Cells distinto.

### Módulo 1 — De Lit a Cells

1. Qué añade Cells sobre Lit.
2. Contratos del runtime Cells.
3. Anatomía de un proyecto Cells.
4. Comandos reales y runtime educativo del navegador.
5. Workspace virtual y archivos exportables.
6. Crear el primer componente Cells.

### Módulo 2 — Componentes Cells

7. Anatomía del scaffold de componente.
8. `WidgetMixin` y su responsabilidad.
9. Componer mixins sin romper `super`.
10. Propiedades públicas y estado interno.
11. `disabled` como contrato observable.
12. Estados `loading`, `empty`, `error` y `success`.
13. Slots, parts y tokens en un componente Cells.
14. SCSS fuente y artefacto CSS sincronizado.

### Módulo 3 — Composición aislada

15. Por qué registrar dependencias localmente.
16. `ScopedElementsMixin`.
17. `static get scopedElements()`.
18. Importar clases sin registro global.
19. Dos hosts, una etiqueta y dos implementaciones.
20. Grafo de dependencias y paquetes alcanzables.
21. Import permitido frente a import arbitrario.
22. Diagnosticar una dependencia sin registrar.

### Módulo 4 — Idioma y eventos

23. `this.t(...)` y claves visibles.
24. Catálogos EN/ES completos.
25. Placeholders y contratos de traducción.
26. Inicialización y cambio de idioma.
27. Esperar recursos antes de afirmar texto.
28. `this.emitEvent(...)`.
29. `detail`, `bubbles` y `composed`.
30. Comunicación padre/hijo sin métodos privados.

### Módulo 5 — Calidad y toolchain

31. Demo interactiva del componente.
32. Pruebas de comportamiento público.
33. Aislamiento y timeout de tests en navegador.
34. Coverage real por archivo.
35. Locales generados y divergencias.
36. Documentación y `custom-elements.json`.
37. Build de demo y resolución de módulos.
38. Exportar un componente consumible.

### Módulo 6 — Aplicaciones Cells

39. Crear una app Cells.
40. Estructura real del workspace de aplicación.
41. Configuración `dev.js` y `prod.js`.
42. Bootstrap con el runtime público.
43. `CellsPageMixin`.
44. Páginas declarativas y lazy loading.
45. `onPageEnter` y parámetros de entrada.
46. `onPageLeave` y cleanup.

### Módulo 7 — Rutas y comunicación

47. Definir rutas y nombres de página.
48. Navegación imperativa.
49. Parámetros de ruta.
50. Evento DOM, canal y navegación: fronteras.
51. Publicar y suscribirse a un canal.
52. Payloads estables.
53. Estado retenido.
54. Suscripción tardía, desuscripción y ausencia de entregas posteriores.

### Módulo 8 — Bridge y datos

55. Cells Bridge como mediador.
56. Eventos externos y canales de aplicación.
57. Data manager separado de la página.
58. Transiciones de estado de una petición.
59. Loading y empty observables.
60. Error recuperable.
61. Cancelación y respuestas fuera de orden.
62. Cleanup del data manager al abandonar la página.

### Módulo 9 — Producción y compatibilidad

63. Tests de aplicación.
64. Locales de aplicación.
65. Build con configuración de producción.
66. Seguridad de iframe, Worker e imports.
67. Paridad entre runtime browser y CLI.
68. Exportación y continuación fuera de la plataforma.

### Prácticas integradoras implementadas

El recorrido combina 18 actividades de razonamiento con cinco laboratorios de código sobre proyectos exportables:

1. Componente Cells con dependencias scoped, idioma y evento público.
2. Aplicación con ciclo de página, cleanup y navegación nominal.
3. La misma aplicación ampliada con publicación y suscripción a canales.
4. La aplicación protegida frente a carreras y trabajo pendiente del data manager.
5. Entrega final con ruta desconocida, configuración de producción, comprobación de contratos y ZIP.

La aplicación se conserva entre etapas para aprender a evolucionar un sistema coherente, no a resolver snippets desconectados.
