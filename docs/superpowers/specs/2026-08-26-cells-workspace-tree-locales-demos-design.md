# Diseño: explorador, locales y demos del curso Cells

## Objetivo

Presentar los proyectos Cells como proyectos reales y navegables, sin listas planas de rutas ni archivos duplicados que oculten dónde vive cada responsabilidad.

## Explorador compartido

- Construir un árbol a partir de las rutas del workspace.
- Mostrar carpetas antes que archivos y ordenar cada grupo alfabéticamente.
- Permitir expandir y contraer carpetas con teclado y ratón.
- Expandir automáticamente los ancestros del archivo activo.
- Mantener visibles los ancestros durante una búsqueda y resaltar el archivo activo.
- Usar semántica accesible `tree`, `treeitem` y `group`.
- Reutilizar el mismo explorador en el reproductor y en el laboratorio Cells.

## Contrato de un componente

El workspace de componente separa claramente:

- implementación en `src/`;
- entrada pública en la raíz;
- catálogo fuente en `locales/locales.json`;
- demo real en `demo/`;
- copia de locales consumida por la demo en `demo/locales/locales.json`;
- copia aislada para pruebas en `test/unit/locales/locales.json`;
- metadatos del paquete en la raíz.

La demo debe incluir una página índice, una variante básica, el controlador del playground y un punto de entrada de construcción. Debe importar la entrada pública del componente, permitir cambiar propiedades e idioma y mostrar los eventos emitidos.

## Contrato de una aplicación

La aplicación separa:

- textos globales en `app/locales-app/locales.json`;
- textos de cada página en `app/pages/<pagina>/locales/locales.json`;
- páginas, componentes, data managers, configuración y scripts en sus carpetas respectivas;
- locales de pruebas en el espacio de pruebas cuando sean necesarios.

No se usarán módulos `en.js` y `es.js` paralelos que presenten una segunda fuente de verdad.

## Enseñanza

Las lecciones deben explicar primero la responsabilidad de cada carpeta y después practicarla. La demo se enseña como un consumidor real del paquete, no como otro archivo de implementación. Los retos validarán comportamiento y estructura, no una línea exacta copiada.

## Aceptación

- Los dos exploradores muestran jerarquía limpia y operable.
- Los locales de componente y aplicación se resuelven desde sus ubicaciones correctas.
- La vista previa, los tests y las demos funcionan con los nuevos scaffolds.
- Las lecciones y guiones no enseñan las rutas antiguas.
- El laboratorio se recorre correctamente en temas normal y cyber.

