# Centro de aprendizaje y sistema visual compartido

## Objetivo

Convertir el Centro de aprendizaje en dos herramientas comprensibles para un estudiante y hacer que el modo cyber consuma el mismo sistema de componentes que el resto de la plataforma. La referencia visual es el editor actual: superficies oscuras sobrias, líneas finas, jerarquía tipográfica técnica y color usado como señal, no como decoración luminosa.

## Experiencia del estudiante

### Repaso

`Repaso` es una práctica breve de recuperación. La pantalla explicará que la plataforma programa una pregunta a partir de actividad real y que responder sin abrir la lección ayuda a recordar. Mostrará una sola pregunta y una sola respuesta a la vez.

Después de escribir, el estudiante compara su explicación mediante criterios claros y registra cuánto pudo recordar. Los conceptos que el agente detectó como débiles aparecen como recomendaciones de refuerzo, diferenciadas de las tarjetas programadas.

### Mis notas

`Mis notas` es un cuaderno libre, no una ficha académica. El estudiante podrá:

- escribir un título opcional;
- guardar una nota en un único campo de texto;
- ver las notas anteriores del curso;
- editar una nota existente;
- reconocer la lección asociada cuando la nota se creó desde un contexto de lección.

No habrá selector de conceptos ni campos obligatorios de “modelo mental”, “patrón”, “ejemplo” o “error”. El curso se asocia automáticamente y la lección es opcional.

Las notas estructuradas existentes se conservarán. Durante la migración, sus campos se combinarán en una nota legible y podrán editarse con el nuevo formato.

## Modelo de datos y API

La tabla de notas ganará los campos `title`, `body` e `item_key`. `skill_key` dejará de ser la identidad visible y se mantendrá únicamente para compatibilidad con evidencia histórica. Cada nota tendrá su propio identificador, permitiendo varias notas por curso.

Contratos:

- `POST /v1/me/notebook` crea una nota libre.
- `PUT /v1/me/notebook/:noteId` actualiza una nota perteneciente al actor autenticado.
- `DELETE /v1/me/notebook/:noteId` elimina una nota perteneciente al actor autenticado.
- El snapshot del Centro devuelve `title`, `body`, `itemKey` y `updatedAt`.

Las rutas validarán longitudes, pertenencia y curso. No se aceptará que un usuario modifique notas de otra identidad.

## Componentes compartidos

Se crearán primitivas de presentación en `src/components/ui`:

- `UiButton`: variantes `primary`, `secondary`, `quiet` y `danger`.
- `UiSurface`: paneles y tarjetas con niveles de elevación.
- `UiTabs`: navegación accesible con teclado.
- `UiField`: etiqueta, ayuda, control y error.

Estas primitivas no conocerán el tema activo. Consumirán variables semánticas como `--ui-surface`, `--ui-border`, `--ui-accent`, `--ui-focus` y `--ui-shadow`. El Centro de aprendizaje y el dashboard usarán estas primitivas o sus clases base, eliminando estilos cyber particulares por pantalla.

## Temas

El registro de temas será la única fuente de colores, bordes, tipografía funcional, radios y sombras.

Normal conserva CodeSilk: papel cálido, tinta oscura, amarillo de resaltador y sombra dura.

Cyber conserva lo aprobado del editor:

- fondo y superficies casi negras;
- bordes finos y rectos;
- amarillo para acciones principales;
- cian reservado para foco, estado activo y separación técnica;
- magenta o verde solo cuando comunican una categoría ya existente, como niveles del catálogo;
- sin degradados arcoíris, halos intensos ni sombras de neón en paneles genéricos.

El catálogo puede seguir usando el color de nivel. El editor no se rediseña; sirve como referencia y consumidor del mismo vocabulario visual.

## Compatibilidad y estados

- El Centro sigue requiriendo una cuenta de estudiante para información personal.
- Cursos y prácticas continúan disponibles sin autenticación.
- La caché local sigue siendo solo una mejora temporal; el backend conserva la fuente de verdad.
- Carga, error, contenido vacío y conflicto de edición mantienen mensajes accionables.
- El flujo se optimiza para escritorio y conserva una adaptación básica en pantallas estrechas.

## Verificación

- Pruebas de componente demostrarán que no existe selector fijo ni formulario de cuatro campos.
- Pruebas de integración cubrirán crear, editar, listar y eliminar notas, aislamiento por usuario y migración de notas anteriores.
- Pruebas del repaso verificarán el texto explicativo y el ciclo responder, comparar y calificar.
- Contratos visuales comprobarán que los temas emiten variables semánticas compartidas y que el Centro/dashboard no declaran paletas cyber propias.
- Se probará en navegador real, escritorio, tema normal y cyber, con datos, vacío, carga y error.

