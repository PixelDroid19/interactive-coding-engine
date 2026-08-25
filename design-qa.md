# QA visual — tema Cyber

## Evidencia

- Referencia: `/home/monasterios/.codex/attachments/e6b452c7-9d8d-440f-8269-403a87d3f64f/image-2.png`
- Implementación: `/tmp/aula-cyber-final-1024x576.png`
- Comparación: `/tmp/aula-cyber-comparison.png`
- Viewport: 1024 × 576 CSS px
- Captura: 1024 × 576 px, DPR controlado por el navegador integrado
- Estado: Web Components y Lit, lección 1, capítulo «Aplicación trabajada», tema Cyber activo, reproducción pausada, subtítulos activos y vista previa flotante.

## Comparación de vista completa

La implementación conserva la estructura principal de la referencia: barra superior oscura, explorador izquierdo, editor central, vista previa a la derecha, subtítulos sobre el editor y línea de tiempo inferior. Usa amarillo eléctrico como acción y borde principal, magenta/morado para estados secundarios y cian para navegación.

Las diferencias deliberadas responden a la revisión del usuario: la vista previa no queda acoplada permanentemente, el código usa 14 px y los subtítulos muestran una frase a la vez. La ventana puede moverse, redimensionarse, minimizarse, ampliarse y alternar entre flotante y acoplada.

## Historial de hallazgos

### Iteración 1

- P1: la vista previa existía, pero el `clip-path` del editor la recortaba por ser un descendiente del panel aumentado.
- P1: el tema imponía `top/right/bottom/width/height` con `!important`, anulando el movimiento y redimensionado de la ventana.
- P1: HTML y CSS curriculares aparecían minificados en una sola línea.
- P2: el editor y varias etiquetas usaban fuentes de 8 a 11 px.
- P2: un subtítulo podía ocupar 140 px y cubrir demasiado editor.

Correcciones: la ventana flotante pasó a ser hermana del editor; recuperó su geometría inline; HTML/CSS se formatearon en plantillas comunes; el editor subió a 14 px; los subtítulos se segmentaron por frases.

### Iteración 2

- P1: controles anidados heredaban variables de `augmented-ui` y algunos bordes parecían incompletos.
- P1: reglas antiguas `clip-path: none !important` anulaban los cortes de la librería.
- P2: el subtítulo podía quedar debajo de la ventana en su posición inicial.

Correcciones: se añadieron `data-augmented-ui-reset` en 24 elementos anidados; se eliminaron geometrías manuales conflictivas; `augmented-ui` controla ahora los cortes; el subtítulo se desplaza a la zona libre cuando la vista previa está flotando.

## Evidencia funcional asociada

- 29 superficies con `data-augmented-ui`; 24 controles anidados con `data-augmented-ui-reset`.
- La ventana cambió de posición de `(878, 52)` a `(858, 92)`.
- El redimensionado cambió la ventana de `384 × 490` a `340 × 450`.
- El modo acoplado usa `position: relative`; el modo flotante vuelve a `position: fixed`.
- A 390 × 844 no existe desbordamiento horizontal y la ventana queda debajo de la barra superior.
- El HTML de muestra tiene 17 líneas; el CSS base, 36 líneas. El editor usa 14 px.

## Resultado

final result: passed
