# Plan de implementación del playground nativo de Cells

1. Cambiar las pruebas de recetas y compilación para exigir componentes `academy-*`, ausencia total de referencias externas y un iframe sin interfaz de demo.
2. Sustituir dependencias y etiquetas externas por componentes locales neutrales con archivos fuente, SCSS, `css.js`, metadata, demo y pruebas.
3. Actualizar auditorías, mutaciones de prácticas, lecciones y guiones para comprobar los nuevos contratos por comportamiento.
4. Simplificar el compilador: documento ejecutable, metadata de demo y puente `postMessage` para propiedades, idioma y eventos.
5. Crear `CellsPreviewWorkbench` en React con casos, pestañas, viewport, idioma, documentación y eventos.
6. Integrar el workbench en `CellsLearningLab` y `FloatingBrowser`, conservando el render completo para aplicaciones.
7. Ejecutar pruebas dirigidas, suite completa, TypeScript y build.
8. Recorrer en navegador los laboratorios de componente y aplicación en temas normal/cyber y tamaños escritorio/móvil.

