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
- El build contiene además un Worker independiente para generación local con Transformers.js y WebGPU.
- Cinco lecturas (12, 14, 24, 26 y 27) incluyen laboratorios reales de prompts, resumen o escritura.
- La suite completa registra 65 archivos y 466 pruebas aprobadas.
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
- La lectura 26 muestra el id exacto `onnx-community/LFM2.5-350M-ONNX`, consulta 297 MB para q4 antes de descargar, informa caché y enumera `fp32`, `fp16`, `q8`, `q4` y `q4f16`.
- La descarga solo comenzó después del clic. La segunda visita detectó los artefactos en caché.
- Se ejecutaron q4, q4f16 y q8 de LFM2.5 y q4 de Qwen2.5 como diagnóstico. En este equipo, la ruta WebGPU devolvió texto numéricamente corrupto con todos ellos.
- La demo externa de CodePen indicada como referencia reprodujo la misma corrupción en el mismo Chrome, por lo que el defecto quedó aislado al camino WebGPU del equipo y no a los prompts o la interfaz del curso.
- El laboratorio ahora detecta señales de salida corrupta o truncada y muestra un diagnóstico; no presenta ese texto como una respuesta válida.
- Los modos Resume y Escribe muestran sus controles específicos y regresan a Compara prompts sin perder la navegación de la lectura.
- Las lecturas con laboratorio usan un ancho mayor que las lecturas normales. A 900 × 700 el laboratorio apila sus zonas y conserva edición, tabs y navegación sin desbordamiento horizontal.
- La lectura dejó de ser una tarjeta vertical única: el encabezado, mapa de conceptos, esenciales, laboratorio, dudas, transferencia y biblioteca son superficies independientes.
- Los cuatro conceptos se muestran en una cuadrícula 2 × 2; las cinco fuentes se distribuyen en tres columnas de escritorio y el runtime local usa una franja horizontal sin altura vacía.
- A 900 × 700 el contenido mantiene `scrollWidth === clientWidth` (894 px), por lo que no existe desbordamiento horizontal.
- Los tabs Compara prompts, Resume y Escribe alternan sus controles específicos después del rediseño.
- La consola del recorrido final no registró errores ni advertencias.

## Riesgos observados, no bloqueantes

- La primera carga de Pyodide y del modelo de embeddings depende de descargar sus artefactos; las cargas posteriores aprovechan la caché del navegador.
- WebGPU puede existir y aun así producir inferencia numéricamente inválida por combinación de navegador, controlador y hardware. La validación evita un falso éxito, pero la generación útil debe repetirse en otro dispositivo compatible.
- El build avisa de chunks grandes por TypeScript, Pyodide y ONNX. Los runtimes pesados ya se ejecutan en Workers, pero todavía hay margen para dividir más la carga inicial.

## Fallos esperados y mensajes

- Pyodide sin red en primera carga: explicar que no se pudo preparar Python y permitir reintentar.
- Bucle Python: detener a los 12 segundos y reiniciar el Worker.
- Modelo local no disponible: activar vector didáctico etiquetado como no semántico.
- Generación WebGPU corrupta o truncada: rechazar el resultado, explicar la incompatibilidad del dispositivo y no marcar el experimento como revisado.
- API con clave o modelo inválido: mostrar un error sin incluir la clave.
- Respuesta API vacía o inválida: no tratarla como resultado correcto.
