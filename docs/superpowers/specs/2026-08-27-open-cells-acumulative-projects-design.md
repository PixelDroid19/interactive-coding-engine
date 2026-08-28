# Open Cells: proyectos acumulativos y previews diversos

## Problema

Las clases 1–38 se generan desde `academy-learning-card` y las clases posteriores recorren una única tienda. Aunque cambian los conceptos, el proyecto visible cambia poco y no demuestra que los componentes construidos antes puedan reutilizarse.

## Decisión

El curso conservará 68 unidades, pero cada unidad declarará un `projectId`, un artefacto protagonista, sus dependencias ya enseñadas y el archivo que produce el resultado observable. Los workspaces se ensamblarán desde recipes neutrales y exportables; una lección solo puede importar un artefacto cuya primera aparición sea anterior.

## Familias acumulativas

1. `academy-action-button`: entrada pública, evento y paquete mínimo.
2. `academy-status-badge` y `academy-state-panel`: propiedades, disabled, estados, slots y estilos; reutilizan el botón.
3. `academy-product-card`: composición scoped; reutiliza botón y badge.
4. `academy-product-list` y `academy-search-filter`: idioma, eventos y flujo padre-hijo; reutilizan product-card.
5. `academy-catalog-kit`: demo, tests, metadata y exportación de la biblioteca construida.
6. `academy-catalog-app`: páginas y ciclo de aplicación que consumen la biblioteca.
7. `academy-favorites-page` y `academy-product-detail-page`: rutas, canales y navegación.
8. `academy-product-data-manager`, loading, empty y error: datos y cleanup sobre las superficies anteriores.
9. Aplicación integrada: pruebas verticales, producción y exportación.

## Arquitectura

`lessonProjects.ts` será la fuente única de la matriz curricular. `cellsCurriculumRecipes.ts` construirá los workspaces por familia y añadirá dependencias reutilizadas. `guidedLessons.ts` y `projectJourneys.ts` consumirán la matriz en lugar de decidir por rangos y rutas hardcodeadas.

El audit de componente obtendrá propiedades, eventos, dependencias scoped y controles de demo desde `custom-elements.json`; no exigirá `learnerName`, `continue` ni dos componentes concretos. El audit de aplicación seguirá verificando el flujo vertical, pero reconocerá los artefactos neutrales de la matriz.

## Criterios de aceptación

- Al menos diez tags o superficies protagonistas diferentes.
- No más de dos clases consecutivas con el mismo protagonista visual.
- Toda dependencia reutilizada aparece primero en una clase anterior.
- Las clases posteriores importan fuentes previas; no copian su implementación dentro del nuevo host.
- Cada cinta visita al menos tres archivos reales, escribe uno y termina en preview ejecutable.
- Cada práctica valida comportamiento con entradas variables.
- Guion, subtítulos, demo, metadata y test nombran el artefacto real de la unidad.
- No se añaden componentes, paquetes ni nombres privados.
