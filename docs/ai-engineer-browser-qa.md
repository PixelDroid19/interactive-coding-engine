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

## Recorridos verificados en Chrome

- El catálogo abre AI Engineer desde la parte superior del roadmap, incluso si el catálogo estaba desplazado.
- La clase 1 respeta la compuerta de inicio; la cinta visual avanza, mueve el puntero, escribe código, muestra subtítulos y se detiene en el reto.
- Los starters JavaScript y Python fallan, las correcciones pasan 2/2 y Pyodide se prepara dentro de un Worker.
- Lectura, razonamiento y depuración conservan la secuencia Anterior/Siguiente y restauran la posición al recargar.
- El modelo local `Xenova/paraphrase-multilingual-MiniLM-L12-v2` se descargó y produjo un ranking semántico en el navegador.
- Una API temporal quedó activa solo en la pestaña. Un endpoint local inaccesible mostró un diagnóstico en español, sin revelar la clave, y la configuración desapareció al recargar.
- Los nueve proyectos aparecen en el roadmap. El primero abre en JavaScript y Python, ejecuta Python con Pyodide y permite avanzar a la siguiente clase y regresar.
- A 900 × 700, el proyecto ofrece paneles separados de Requisitos, Código y Salida; los tres son utilizables y no existe desbordamiento horizontal. El viewport se restauró al terminar.

## Riesgos observados, no bloqueantes

- La primera carga de Pyodide y del modelo de embeddings depende de descargar sus artefactos; las cargas posteriores aprovechan la caché del navegador.
- El build avisa de chunks grandes por TypeScript, Pyodide y ONNX. Los runtimes pesados ya se ejecutan en Workers, pero todavía hay margen para dividir más la carga inicial.

## Fallos esperados y mensajes

- Pyodide sin red en primera carga: explicar que no se pudo preparar Python y permitir reintentar.
- Bucle Python: detener a los 12 segundos y reiniciar el Worker.
- Modelo local no disponible: activar vector didáctico etiquetado como no semántico.
- API con clave o modelo inválido: mostrar un error sin incluir la clave.
- Respuesta API vacía o inválida: no tratarla como resultado correcto.
