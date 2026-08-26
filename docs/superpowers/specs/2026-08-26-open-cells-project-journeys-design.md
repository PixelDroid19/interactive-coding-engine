# Diseño: clases Cells basadas en construcción de proyectos

## Problema comprobado

Las clases generadas abren un único archivo del scaffold y realizan la demostración en `checkpoints/leccion-NN.js`. Por eso una clase puede llamarse “Crear una app Cells” sin crear archivos de aplicación ni recorrer su grafo real.

## Principio pedagógico

Cada clase debe enseñar sobre el proyecto que la persona está construyendo:

1. ubicar la responsabilidad en el árbol;
2. abrir los archivos que colaboran;
3. predecir el flujo entre ellos;
4. escribir o completar un archivo real;
5. ejecutar y observar el resultado;
6. practicar el concepto de forma aislada o transferirlo a otra parte del mismo proyecto.

El checkpoint aislado puede seguir siendo el ejercicio evaluable, pero nunca será la demostración principal.

## Trayectoria de componente

Las clases 1–38 construyen y endurecen un componente consumible. Las clases de creación mostrarán explícitamente `package.json`, entradas públicas, `src/`, registro, demo, locales, pruebas, metadata, build y exportación. Las clases intermedias recorrerán al menos tres archivos reales relacionados con el concepto.

## Trayectoria de aplicación

Las clases 39–68 construyen una aplicación. La primera clase de la fase escribirá entrada HTML, bootstrap, rutas y primera página. Las siguientes conectarán componentes, ciclo de página, navegación, canales, locales, data managers, configuración, pruebas y entrega sobre ese mismo grafo.

## Cintas y guiones

- Los eventos `switch` deben cambiar archivos de verdad.
- Los eventos `write` de la demostración deben apuntar a archivos del proyecto, no a checkpoints.
- El guion debe nombrar el archivo, su consumidor y la salida observable.
- Los guiones Markdown se regenerarán desde los subtítulos para impedir divergencias.

## Aceptación

- Todas las clases generadas recorren al menos tres archivos reales.
- Las clases de creación/demo/rutas/páginas/locales/pruebas/build escriben el archivo responsable.
- La clase 39 construye una aplicación mediante varios archivos, no una función aislada.
- La clase 31 construye una demo real.
- La cinta ejecuta antes de devolver el starter del ejercicio.
- Guion, subtítulos, snapshots y desafíos permanecen sincronizados.

