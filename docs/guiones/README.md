Guiones para leer en voz alta. Un archivo por cinta. El número del archivo conserva el id técnico del audio; el orden pedagógico real es el siguiente:

01-que-es-programar.md
02-pensamiento-computacional.md
03-variables-tipos.md
04-operadores.md
05-condicionales.md
06-bucles.md
07-funciones.md
08-arrays.md
09-objetos.md
10-dom.md
11-eventos-botones.md
12-inputs-formularios.md
13-listas-dom.md
14-proyecto-lista-tareas.md
15-depuracion.md
16-metodos-documentacion.md
17-pseudocodigo-diagramas.md
18-patrones-algoritmos.md
19-buscar-filtrar-transformar.md
20-casos-pruebas.md
21-estado-flujo.md
22-responsabilidades-modulos.md
23-arquitectura.md
24-proyecto-final.md

Los 24 guiones tienen `estado: audio_generado`. Sus voces fueron generadas con Aoede y volumen normalizado, y se publican en Cloudflare R2 con una clave que incluye curso, número, tema y hash corto. Los JSON de `public/audio/` registran duración, modelo, voz y guion de origen sin incorporar los MP3 al frontend.

Las 24 lecciones se generaron exclusivamente con `gemini-3.1-flash-tts-preview`. El reproductor carga cada MP3 desde R2 con caché inmutable y ajusta la cinta a su duración real.

Para regenerar una voz, usa `GEMINI_API_KEY` únicamente como variable de entorno y ejecuta `npm run audio:gemini -- --lesson=NN`. El generador está fijado a Gemini 3.1 Flash TTS y no admite modelos alternativos. No guardes claves en el repositorio. Después actualiza la duración, regenera el inventario R2, carga y verifica el objeto nuevo y actualiza el mapa generado del frontend.
