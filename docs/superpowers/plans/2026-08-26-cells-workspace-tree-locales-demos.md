# Plan de implementación: explorador, locales y demos de Cells

> Ejecución directa en el checkout activo. Preservar cambios ajenos. No crear commits ni hacer push.

**Objetivo:** reemplazar las listas planas por un árbol reutilizable y alinear scaffolds, runtime y contenido educativo con una estructura Cells coherente.

**Arquitectura:** un modelo puro convierte el mapa de archivos en nodos; un componente accesible renderiza el árbol y ambos exploradores lo consumen. Las recetas son la fuente del scaffold; el compilador de preview lee sus catálogos JSON y el currículo referencia esas mismas rutas.

---

### Tarea 1: modelo y componente de árbol

**Archivos:**
- Crear: `src/components/editor/workspaceTreeModel.ts`
- Crear: `src/components/editor/workspaceTreeModel.test.ts`
- Crear: `src/components/editor/WorkspaceTree.tsx`
- Modificar: `src/components/editor/FileTree.tsx`
- Modificar: `src/index.css`

1. Escribir pruebas de jerarquía, orden, ancestros y filtrado.
2. Implementar el modelo hasta hacerlas pasar.
3. Renderizar carpetas expandibles con semántica accesible.
4. Integrarlo en `FileTree`, conservando crear, renombrar, eliminar y cursor.
5. Ejecutar pruebas del editor.

### Tarea 2: árbol persistente del laboratorio

**Archivos:**
- Modificar: `src/components/runtime/CellsLearningLab.tsx`
- Modificar: `src/engine/cells/cellsWorkspaceRepository.ts`
- Modificar: `src/engine/cells/cellsWorkspaceRepository.test.ts`
- Modificar: `src/index.css`

1. Probar la persistencia y validación de carpetas expandidas.
2. Sustituir la lista plana del laboratorio por `WorkspaceTree`.
3. Persistir expansión, restaurarla y mantener búsqueda con contexto.
4. Probar repositorio y render del laboratorio.

### Tarea 3: scaffolds y runtime

**Archivos:**
- Modificar: `src/engine/cells/cellsRecipes.ts`
- Modificar: `src/engine/cells/cellsAppRecipes.ts`
- Modificar: `src/engine/cells/cellsPreviewCompiler.ts`
- Modificar: pruebas `src/engine/cells/*Recipes.test.ts`, `cellsPreviewCompiler.test.ts`, `cellsRecipeParity.integration.test.ts`

1. Cambiar primero las pruebas para exigir las rutas nuevas y rechazar duplicados antiguos.
2. Añadir demo de componente ejecutable y locales separados por contexto.
3. Añadir locales globales y por página a la aplicación.
4. Leer los catálogos JSON desde el runtime y conservar cambio de idioma.
5. Ejecutar pruebas de recetas, preview, auditoría y paridad.

### Tarea 4: currículo y guiones

**Archivos:**
- Modificar: `src/curriculum/open-cells/guidedLessons.ts`
- Modificar: `src/curriculum/open-cells/lesson06.ts`
- Modificar: `src/curriculum/open-cells/units07to68.ts` cuando corresponda
- Modificar: `docs/guiones/open-cells/*.md` afectados
- Modificar: pruebas de integración del curso

1. Eliminar toda referencia educativa a las rutas antiguas.
2. Enseñar el catálogo fuente, sus copias de consumo y la separación con locales de app.
3. Enseñar el contrato completo de la demo y practicar controles, idioma y eventos.
4. Verificar que guion, subtítulos y workspace coincidan.
5. Ejecutar integraciones del curso.

### Tarea 5: validación real y revisión

1. Ejecutar tests Cells, lint, build y gate CLI.
2. Abrir componente y aplicación en el navegador.
3. Expandir carpetas, buscar, cambiar archivos, editar, preview, tests, idioma y eventos.
4. Repetir recorrido visual en temas normal y cyber y en ancho reducido.
5. Revisar `git diff --check`, archivos modificados y cualquier regresión antes de terminar.

