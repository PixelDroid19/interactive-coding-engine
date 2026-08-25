# Laboratorios interactivos de IA local

## Objetivo

Enseñar prompts, resumen y escritura mediante experimentos ejecutables. El estudiante modifica entradas, usa un modelo real en su dispositivo, compara resultados y registra una conclusión. El código sigue presente para explicar el contrato, pero deja de ser la única forma de practicar.

## Experiencias

1. **Compara prompts:** ejecuta dos instrucciones sobre la misma entrada. Permite cambiar instrucción de sistema, prompt, temperatura y `top_p`. Muestra respuesta, motor y tiempo por variante.
2. **Resume:** permite pegar texto y elegir tipo (`key-points`, `tldr`, `teaser`, `headline`) y longitud. Construye una instrucción explícita y la ejecuta con el modelo local.
3. **Escribe:** recibe objetivo, contexto, tono y longitud, y lo ejecuta con el mismo modelo local para que el estudiante pueda comparar contratos.

Cada experiencia termina con una pregunta de observación. Escribir una conclusión no altera el resultado del modelo, pero es obligatorio para marcar el experimento como revisado.

## Motores

- **Transformers.js local (principal):** un Worker carga `onnx-community/LFM2.5-350M-ONNX` con `device: "webgpu"` y `dtype: "q4"`. Antes de cargar, `ModelRegistry` informa archivos, tamaño, caché y precisiones disponibles. Es un modelo conversacional de 350M parámetros orientado a dispositivo y con español entre sus idiomas declarados.
- **Chrome integrado (material de comparación):** las lecturas explican `LanguageModel`, `Summarizer` y `Writer`, su detección y su disponibilidad variable. No se usan como fallback silencioso en esta entrega.
- No existe una respuesta simulada. Si no hay API integrada ni WebGPU, se explica el requisito y se conserva el ejercicio editable para volver a intentarlo en un equipo compatible.

## Arquitectura

- `localGenerationProtocol.ts`: mensajes tipados entre interfaz y Worker.
- `localGeneration.worker.ts`: carga del modelo, progreso, generación y cancelación.
- `localGenerationService.ts`: ciclo de vida, timeout y API consumida por React.
- `AIInteractivePractice.tsx`: interfaz de las tres experiencias y comparación pedagógica.
- `ReadingItem.interactiveLab`: metadatos curriculares; `ReadingView` renderiza el laboratorio sin depender del id del curso.

## Progresión curricular

- Lección 12: anatomía y comparación de prompts.
- Lección 14: zero-shot frente a few-shot.
- Lección 24: local frente a alojado, WebGPU y requisitos del dispositivo.
- Lección 26: Hub, model card, Transformers.js v4, `ModelRegistry`, WebGPU, cuantización, tamaño y caché.
- Lección 27: Prompt API, Summarizer y Writer como contratos alternativos; la práctica usa el modelo local de forma reproducible.

Las fuentes oficiales de Chrome y Hugging Face se añaden a las lecturas correspondientes. Writer se presenta como prueba de origen, no como API universal o estable.

## Estados y seguridad

Estados visibles: no comprobado, no disponible, descargable, descargando, listo, generando, cancelado y error. Todo texto se procesa localmente. La interfaz no incluye claves ni llamadas remotas. El Worker se destruye al abandonar la lectura. Los resultados se etiquetan como generados y no se consideran hechos comprobados.

## Verificación

- Pruebas de adaptadores con implementaciones controladas de las APIs del navegador.
- Pruebas del servicio Worker: progreso, resultado, cancelación, timeout y limpieza.
- Pruebas de interfaz: no descarga al montar, cambia de experiencia, requiere entrada y muestra motor/resultado.
- Auditoría curricular: las cinco lecturas contienen el laboratorio esperado y fuentes oficiales.
- Chrome real: detección de capacidades, fallback WebGPU, descarga iniciada por clic, generación, comparación y diseño a 900 px.
