# Aula viva

Motor de clases interactivas de programación. Reproduces una lección como si alguien estuviera escribiendo al lado: el código se mueve, el cursor apunta, el preview ejecuta, y el audio va a tiempo. En cualquier momento pausas, editas y corres el resultado.

La inspiración es [Scrimba](https://scrimba.com): *screencasts* donde la grabación no es un vídeo plano, sino el propio editor. Esta plataforma toma esa idea y la construye como una app local: línea de tiempo, rama del alumno, retos que paran la clase, y un mini-navegador para ver la página.

## Qué es

No es un reproductor de vídeo con un editor pegado. La lección **es** el editor.

- El instructor graba cambios de código, cambios de archivo, el puntero y las ejecuciones.
- El alumno reproduce esa cinta. El workspace se reconstruye en cada instante.
- Si editas, sales de la cinta y trabajas sobre una rama propia. Puedes volver al punto grabado cuando quieras.
- El preview es un navegador aislado (iframe) con consola. Flota sobre el editor o se fija a un lado.
- Los retos pausan solos, corren pruebas sobre el código o el DOM, y sueltan pistas por niveles.

También hay playground libre, estudio para grabar lecciones nuevas, ejercicios de depuración y proyectos en solitario.

## Cómo corre

Hace falta Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. El puerto se puede cambiar: `npm run dev -- --port=3001`.

```bash
npm run build
npm run preview
npm run lint
```

No hace falta backend. El progreso, el volumen y las lecciones publicadas desde el estudio viven en `localStorage`.

## Cómo está armado

| Pieza | Rol |
| --- | --- |
| Reproductor | Reproduce eventos de la lección sincronizados con el audio |
| Motor de sync | Interpola el puntero y mantiene el reloj alineado con la voz |
| Compilador de lecciones | Convierte *beats* (hablar, escribir, cambiar de archivo, ejecutar, reto) en una cinta de eventos |
| Preview | Documento HTML/CSS/JS en un iframe con puente a la consola |
| Retos | Validadores por regex de fuente, llamada a función o DOM |
| Estudio | Graba la cinta en vivo y la publica en el curso |

Stack: Vite, React, TypeScript, Tailwind, CodeMirror.

## Licencia

Uso privado / educativo, salvo que se indique otra cosa.
