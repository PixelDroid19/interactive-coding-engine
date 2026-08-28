# Agente local para aprender durante la lección

## Objetivo

Convertir el tutor WebGPU existente en un agente pedagógico que comprenda la petición de la persona, decida qué información necesita, use únicamente herramientas locales permitidas y produzca explicaciones, feedback o cambios verificables en el ejercicio. La interfaz debe seguir siendo clara para principiantes y no imitar herramientas de desarrollo generalistas.

## Experiencia

El selector de apoyo ofrece `Automático`, `Explícame`, `Dame una pista`, `Revisa mi trabajo` y `Trabaja conmigo`. Automático no preselecciona una acción: el modelo crea un plan con las herramientas necesarias. Los demás modos expresan una preferencia pedagógica y también restringen permisos. Preguntar por una causa nunca autoriza una escritura. Una petición explícita de corregir, implementar o modificar sí autoriza cambios cuando el modo sea Automático o Trabaja conmigo.

El selector de modelos permanece separado. Muestra modelos locales disponibles, distingue los guardados de los que requieren descarga y permite preparar otro modelo mediante un gesto deliberado. La ejecución usa WebLLM sobre WebGPU, sin API remota, CPU alternativo ni respuestas simuladas.

Cada herramienta aparece en la conversación con una descripción comprensible: `Leyó la lección`, `Revisó los archivos`, `Consultó los diagnósticos`, `Ejecutó las comprobaciones`, `Modificó app.js` o `Guardó un concepto para reforzar`. Los detalles técnicos se pueden desplegar, pero no dominan la conversación.

## Arquitectura

`tutorAgent.ts` realiza dos turnos de modelo. El primero exige JSON y permite que el LLM seleccione hasta tres llamadas del catálogo publicado. `tutorTools.ts` valida nombres, argumentos, disponibilidad y permisos antes de ejecutar cada llamada. El segundo turno recibe observaciones estructuradas y redacta la respuesta pedagógica. Un plan inválido se rechaza de forma visible; nunca se interpreta como código ni se sustituye silenciosamente por una decisión heurística.

`tutorContext.ts` publica una instantánea completa del ejercicio: archivos, archivo activo, contenido, diagnóstico, requisitos y, cuando exista, el último resultado de las comprobaciones. El contexto expone comandos estrechos para sustituir un archivo, ejecutar comprobaciones y restaurar el último cambio. El editor sigue siendo la fuente de verdad; el agente no mantiene una copia paralela.

Las herramientas disponibles son:

- `read_lesson`: objetivo, descripción, modelo mental, prerrequisitos, conceptos y errores frecuentes.
- `read_workspace`: lista o contenido de archivos del ejercicio.
- `read_diagnostics`: diagnóstico del editor y último resultado de comprobación.
- `run_checks`: solicita al host ejecutar la comprobación real disponible.
- `write_file`: sustituye un archivo existente; solo se permite con intención explícita de escritura y en Automático o Trabaja conmigo.
- `save_reinforcement`: propone una nota breve y un concepto curricular para reforzar. Solo persiste cuando existe evidencia reiterada en la conversación o los resultados.

Las escrituras registran la versión anterior y ofrecen `Deshacer`. No se crean rutas arbitrarias, no se ejecutan comandos y no hay acceso a red o sistema de archivos del equipo.

## Aprendizaje persistente

El perfil añade refuerzos del tutor con curso, actividad, concepto, nota, evidencia, contador y fecha. Repetir el mismo concepto incrementa el contador en vez de duplicarlo. El Centro de aprendizaje muestra estos refuerzos en Repaso y permite convertirlos en una nota personal o marcarlos como revisados.

## Centro de aprendizaje

La navegación se reorganiza en superficies con título y propósito visibles, estados vacíos útiles y mejor jerarquía en escritorio y móvil. `Líder` representa revisión humana externa y queda deshabilitado con candado y el texto `Próximamente · requiere revisión externa`; no se renderiza su formulario ni se registra evidencia mientras no exista backend. El tutor local de las lecciones no se bloquea.

## Temas y bordes

El catálogo obtiene el tema desde `ThemeProvider`. En Cyber, tarjetas, iconos y acciones incluyen tokens válidos de augmented-ui (`border` y cortes declarados) junto con sus identificadores de estilo. En Normal no existe ningún atributo `data-augmented-ui`. Cambiar de tema actualiza los atributos en el mismo render y no conserva pseudo-elementos o variables de Cyber.

## Validación

Las pruebas de integración cubren selección de herramientas por el modelo, rechazo de escrituras no autorizadas, edición y deshacer, comprobaciones, refuerzo persistente, cambio de modelo, bloqueo de Líder y atributos augmented-ui al alternar temas. La validación manual recorre una lección real en Normal y Cyber, escritorio y móvil, comprobando chat, scroll, selectores, estados de descarga y Centro de aprendizaje.

