# QA del curso AI Engineer

Fecha: 2026-08-25

## Estado automatizado

- 79 clases registradas en 14 módulos.
- 79 lecturas, 79 actividades de razonamiento y 79 laboratorios de depuración.
- 9 proyectos con variantes JavaScript y Python.
- Las clases usan narración visual silenciosa y no contienen URL de audio.
- Las 79 soluciones JavaScript pasan sus casos variables y los starters fallan.
- Las 79 soluciones Python se ejecutan con sus casos variables y los starters fallan.
- El build contiene Workers separados para Pyodide y embeddings locales.
- Las claves de API opcionales permanecen en memoria; la interfaz advierte que producción necesita backend seguro.

## Recorridos que deben repetirse en Chrome

La conexión de Chrome no estaba disponible durante este pase. No se sustituyó por capturas ni por un navegador diferente.

1. Abrir el catálogo y entrar a `AI Engineer: de fundamentos a sistemas confiables`.
2. Abrir la clase 1, iniciar la cinta visual y comprobar subtítulos, escritura y pausa en el reto.
3. Cambiar a Python, ejecutar el ejemplo y comprobar una solución correcta e incorrecta en Pyodide.
4. Abrir las actividades de presupuesto de contexto y ranking vectorial; resolverlas solo con teclado.
5. Abrir `Laboratorio de IA en el navegador`, cargar embeddings y verificar progreso, ranking y modo fallback sin red.
6. Configurar una API de prueba con una clave temporal y confirmar que desaparece al recargar.
7. Abrir proyectos en JavaScript y Python, editar, ejecutar, cambiar de lenguaje y confirmar borradores separados.
8. Volver al roadmap, usar Anterior y Siguiente, recargar y verificar la restauración del elemento actual.
9. Repetir en escritorio y ancho estrecho; comprobar que editor, paneles, textos y controles no se superponen.

## Fallos esperados y mensajes

- Pyodide sin red en primera carga: explicar que no se pudo preparar Python y permitir reintentar.
- Bucle Python: detener a los 12 segundos y reiniciar el Worker.
- Modelo local no disponible: activar vector didáctico etiquetado como no semántico.
- API con clave o modelo inválido: mostrar un error sin incluir la clave.
- Respuesta API vacía o inválida: no tratarla como resultado correcto.
