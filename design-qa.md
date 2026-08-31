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

---

# QA visual — dashboard administrativo cyber

## Evidencia

- Referencia del lenguaje cyber: `/tmp/codex-clipboard-5102b455-27cc-4344-8ded-063439815553.png`.
- Implementación final: `/tmp/dashboard-cyber-final.png`.
- Comparación conjunta: `/tmp/dashboard-cyber-comparison-final.png`.
- Viewport compartido: 2558 × 1275 CSS px.
- Estado: sesión local con rol administrador, tema Cyber activo, pestaña Resumen del panel de seguimiento.
- Estados adicionales: `/tmp/dashboard-cyber-persona-detalle-clean.png`, `/tmp/dashboard-cyber-cursos-final.png` y regresión del tema normal `/tmp/dashboard-normal-regression.png`.

## Comparación de vista completa

El dashboard ya usa la misma gramática visible del editor: fondo negro azulado sin tarjetas grises genéricas, rail lateral con marco amarillo, cabecera compacta con marco cian, tipografía Chakra Petch/Fira Code, cortes angulares y colores funcionales. Amarillo identifica actividad y acciones principales, cian estructura y navegación, magenta seguimiento prioritario y verde estado correcto. Los efectos luminosos se limitan a indicadores pequeños; los paneles no tienen halos ni gradientes decorativos.

La referencia es un editor y el resultado un panel de gestión, por lo que no se copia su distribución de archivos/editor/salida. Se conserva su sistema visual y densidad para la estructura propia del dashboard.

## Historial de iteración

### Iteración 0

- P1: el dashboard anterior era un panel oscuro genérico, con bordes grises, tarjetas redondeadas y sin jerarquía cyber.
- P1: botones y superficies se estilaban por pantalla, sin reutilizar el contrato de tema.

### Iteración 1

- P1: una dimensión inválida de `augmented-ui` rellenaba por completo el rail y la cabecera.
- P2: todos los paneles de datos usaban cian y perdían el reparto semántico de amarillo, magenta y verde.

### Iteración 2

- P1 funcional: al abrir el expediente de una persona, el cliente local confundía el endpoint de detalle con la lista y desmontaba React, dejando la pantalla negra.
- P1 funcional: el endpoint local de acceso individual devolvía usuarios administrativos como si fueran cursos bloqueados.
- P2: los botones de gestión de cursos seguían siendo barras grandes específicas de la pantalla; se migraron a `UiButton` y se ajustó su anchura.

## Verificación enfocada

No existe una captura fuente equivalente para las vistas Personas y Cursos; por eso no se fuerza una comparación visual inventada. Se verificaron como estados funcionales del mismo sistema: abrir una persona, cargar progreso, intentos, feedback y acceso individual; volver, abrir Cursos, comprobar campos y acciones; cambiar al tema normal y confirmar que mantiene su lenguaje de papel.

No quedan diferencias P0, P1 o P2 respecto a la identidad visual solicitada ni fallos en los recorridos comprobados.

final result: passed

---

# QA visual — Centro de aprendizaje y catálogo cyber

## Evidencia

- Fuente visual del Centro: `/tmp/codex-clipboard-33d78263-483e-40fd-b62f-d6f21a054e92.png` (1309 × 1046 px).
- Implementación del Centro: `/tmp/exdev-learning-center-fixed.png` (1303 × 1039 px), viewport 1309 × 1044 CSS px, tema normal, pestaña Cuaderno.
- Comparación del Centro: `/tmp/exdev-center-comparison.png`.
- Fuente visual del catálogo: `/tmp/codex-clipboard-e3b9d8b1-2144-4d00-9cf7-e3cb8d1a6a24.png` (1750 × 715 px).
- Implementación del catálogo: `/tmp/exdev-catalog-cyber-fixed.png` (1743 × 713 px), viewport 1748 × 715 CSS px, tema cyber.
- Comparación del catálogo: `/tmp/exdev-catalog-comparison.png`.
- Comparación enfocada del icono: `/tmp/exdev-icon-comparison.png`.
- Densidad: captura del navegador integrado sin reescalado de la interfaz; las comparaciones completas normalizan cada par al tamaño de su fuente.

## Hallazgos y correcciones

### Iteración 1

- P1: el Centro declaraba tres filas para cuatro superficies. La navegación ocupaba una fila implícita de `0px` y sus botones invadían el contenido de Cuaderno.
- P1: las tarjetas usaban gradientes en `--aug-border-bg`, produciendo esquinas cian, naranja o moradas que no correspondían al nivel.
- P2: categorías e iconos combinaban el color fijo de otra variante con la silueta de `augmented-ui`.
- P2: el resumen del Centro heredaba una superficie oscura en modo normal y perdía contraste.

Correcciones: el Centro reserva cuatro filas reales; el contenido comienza debajo de la navegación; cada tarjeta, categoría e icono hereda un único acento; el icono cyber usa una superficie oscura transparente sin la baldosa blanca; y el resumen normal usa fondo de papel con texto legible.

### Iteración 2

- La navegación mide 63.2 px y la fila principal comienza después de ella; solapamiento medido: 0 px.
- Los tres bordes computados son exactamente `#00ff66`, `#ffe600` y `#ff0055`.
- Los iconos y categorías usan el mismo acento que su tarjeta y no dejan una segunda silueta.
- No existe desbordamiento horizontal ni errores de consola en los estados comprobados.

## Superficies de fidelidad

- Tipografía: se conservan Chakra Petch, Space Grotesk y la jerarquía existente.
- Espaciado: se corrigió únicamente la pista colapsada; no se alteró la densidad del formulario ni de las tarjetas.
- Color: cada nivel mantiene un único color semántico y el resumen normal recupera contraste.
- Iconos: se conserva `BookOpen` de la librería existente; cambia solo su contenedor cyber.
- Contenido: títulos, etiquetas, progreso y acciones permanecen sin cambios.

## Resultado

No quedan diferencias P0, P1 o P2 asociadas con las tres capturas reportadas.

final result: passed

---

# QA visual — ayuda local y compositor compacto

## Evidencia

- Problema reportado: `/tmp/codex-clipboard-716b618c-2fbc-49ed-8d0d-079258ba720f.png`.
- Referencia de composición: `/tmp/codex-clipboard-61872996-fad3-4ac9-a511-7af47cb40661.png`.
- Estado de error reportado: `/tmp/codex-clipboard-ed7d19e8-75ab-4c80-b7d6-2895a8dd3a4f.png`.
- Implementación cyber: `/tmp/exdev-tutor-cyber-setup.png`, 1280 × 720 px.
- Implementación normal oscuro: `/tmp/exdev-tutor-normal-setup.png`, 1280 × 720 px.
- Comparación conjunta de referencia e implementación cyber: `/tmp/exdev-tutor-comparison.png`.

## Hallazgos y correcciones

- P1: `write_file` exigía incrustar código multilínea dentro del JSON del plan. Las comillas y saltos de línea volvían frágil la salida y una respuesta inválida terminaba el turno sin editar.
- P1: no existía recuperación estructurada ante un plan mal formado.
- P2: Enviar y Detener ocupaban una columna completa junto al campo y competían visualmente con la pregunta.

La decisión de herramienta ahora contiene únicamente la ruta existente. El contenido completo se genera en un turno separado, se limpia de una cerca Markdown exterior, se comprueba y solo entonces se entrega al ejecutor. Un plan inválido recibe una sola reparación acotada; si vuelve a fallar, no se escribe nada.

El compositor usa una acción circular de 40 px dentro del campo, con nombre accesible y `title`; el texto reserva espacio a la derecha para no quedar debajo del control. El mismo contrato se aplica a Enviar y Detener y conserva foco visible en los temas normal y cyber.

## Verificación visual y funcional

- El panel conserva contraste, separación y encaje en 1280 × 720 en ambos temas.
- No aparecieron errores de consola durante apertura, cambio de tema y navegación de la lección.
- La vista lista para conversar se valida en el componente sin descargar un modelo durante QA; la descarga WebGPU sigue requiriendo el gesto explícito del estudiante.
- Las pruebas cubren plan inválido, reparación única, JSON cercado, generación de archivo fuera del JSON, escritura real, deshacer y estructura del compositor.

final result: passed
