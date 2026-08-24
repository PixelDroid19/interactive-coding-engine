# Plan de implementación: curso de JavaScript progresivo

## 1. Convertir la aplicación en multicurso

- Crear un registro de cursos integrados.
- Añadir catálogo visual de cursos.
- Persistir y restaurar `courseId` para catálogo, roadmap y actividades.
- Añadir navegación “Cursos” desde el roadmap.
- Eliminar textos y fallbacks que asumen Fundamentos.

## 2. Modelar el curso JavaScript

- Crear `src/curriculum/javascript/` con especificaciones, fábrica, curso, lecturas, prácticas, términos y workspaces.
- Usar identificadores `javascript-NN`.
- Agrupar 24 lecciones en ocho módulos.
- Mantener ejemplos y retos diferentes.

## 3. Redactar guiones y lecturas

- Escribir guiones hablados específicos, breves y naturales.
- Añadir lecturas con definición, segundo ejemplo, errores comunes, investigación guiada, preguntas frecuentes y transferencia.
- Añadir fuentes oficiales MDN/TC39.
- Exportar los guiones a `docs/guiones/javascript/`.

## 4. Crear prácticas reales

- Añadir un reto durante cada clase.
- Añadir una práctica de razonamiento diferente entre la lectura y el editor.
- Añadir un laboratorio de depuración distinto después de cada lectura.
- Usar comprobaciones de comportamiento con más de un caso.
- Evitar `solutionFiles`, respuestas exactas en starters y pistas que entreguen el código.

## 5. Integrar ayudas del editor

- Ampliar los niveles del LSP español para `javascript-NN`.
- Mostrar solo APIs ya enseñadas en cada punto.

## 6. Verificar

- Ejecutar auditorías de progresión y contenido.
- Ejecutar lint, pruebas y build.
- Probar en navegador el catálogo, ambos roadmaps, una clase inicial, una clase DOM, una clase asíncrona, lecturas, prácticas, navegación y restauración.
- Corregir hallazgos antes de cerrar.

La ejecución se realiza directamente en esta sesión, sin subagentes y sin modificar los archivos pedagógicos de Fundamentos.
