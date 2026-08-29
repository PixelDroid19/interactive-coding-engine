# AGENTS.md

Instructions for coding agents working on this repo. Humans read `README.md`. Keep this file operational: how the class engine works, how to add audio and subtitles, and what not to break.

## What this is

Interactive programming lessons. A class is **not a video**: the editor is the tape. Audio, code writes, file switches, the instructor pointer, preview runs, and in-lesson challenges share one clock.

Product UI is **Spanish**. Spoken scripts are Spanish only. Do not add English UI copy unless the user asks.

Inspiration is Scrimba-style live coding. **Do not put Scrimba (or “SC Aula viva”) in the navbar, player, or other UI.** `README.md` may mention Scrimba as inspiration. GitHub repo name stays generic English.

## Commands

```bash
npm install
npm run dev                  # Vite, default :3000. Use -- --port=3001 if busy.
npm run lint                 # tsc --noEmit
npm test                     # vitest run
npm run build
```

No backend. Progress lives in `localStorage` keys `aula_*`.

After UI/layout/routing/state changes, verify in a real browser: enter the lesson, press play, pause, edit, run, go back to the roadmap, open a debug node. A single screenshot is not verification.

## Do not

- Autoplay audio. Browsers block it; the start gate exists so the first gesture is play.
- Spawn subagents or background agent teams unless the user explicitly asks for one.
- Replace Fundamentos lesson titles with mock course names.
- Put the solution in debug exercises (`solutionFiles`, last-hint exact code). Tests check **behavior**, not a copied line.
- Restyle the player as macOS chrome. Preview is a paper mini-browser, **floating by default**.
- Invent new concept tags. Roadmap white chips come from `LESSON_TERMS` in `src/curriculum/fundamentos/roadmap.ts`.
- Use a universal CSS reset (`* { margin:0; padding:0 }`) — it kills Tailwind spacing.
- Commit as anyone except **Damien Monasterios** if you are asked to commit.

## Visual language

CodeSilk: warm paper (`#f5f2eb`), hard black shadows, 2px black borders, highlighter yellow `#ffe600` / `#FFE600`. Fonts: Outfit, Space Grotesk, Patrick Hand (see `index.html`). Player tokens live in `src/index.css` (`:root` paper/pencil variables).

Roadmap home (`RoadmapHome`):

| Node | Action |
| --- | --- |
| Yellow | Opens the lesson immediately (no briefing modal) |
| Black **Depura** | Opens `DebuggingView` for that lesson |
| White | Popover that explains the term; does not open the lesson |

Each clickable must do something different.

## Architecture (where to edit)

| Path | Role |
| --- | --- |
| `src/curriculum/fundamentos/lessonNN.ts` | Beats: speak / write / gesture / challenge. `durationMs` must match the MP3. |
| `src/curriculum/fundamentos/workspaces.ts`, `pages.ts`, `shell.ts` | Starter HTML/CSS/JS the student sees |
| `src/curriculum/fundamentos/course.ts` | Course modules; each scrim is followed by its debug item |
| `src/curriculum/fundamentos/roadmap.ts` | Map layout + `LESSON_TERMS` glossary |
| `src/curriculum/fundamentos/debugExercises.ts` | One broken program per lesson |
| `src/engine/lessonCompiler.ts` | `compileLesson`: beats → event tape + `narrationScript` |
| `src/engine/playbackEngine.ts` | Loads lesson, owns play/pause/seek |
| `src/engine/syncEngine.ts` | rAF clock; pointer from `CursorTrack.getPositionAt` |
| `src/engine/audioNarrator.ts` | MP3 is the master clock; cues drive CC |
| `src/engine/cursor/` | Pointer interpolation (Catmull-Rom, rest+approach) |
| `src/engine/testRunner.ts` | Challenge/debug tests: `function-call`, `dom-check`, `source-regex` |
| `src/components/player/ScrimPlayer.tsx` | Player shell, start gate, captions, fork-on-edit |
| `src/components/player/Timeline.tsx` | Bottom bar after the class has started |
| `src/components/challenges/DebuggingView.tsx` | Debug lab |
| `docs/guiones/` | Spoken-only scripts |
| `public/audio/` | Metadatos JSON de sincronización; los MP3 publicados viven en Cloudflare R2 |
| `src/config/r2AudioManifest.generated.ts` | Mapa generado de lección → URL, clave legible y SHA-256 en R2 |

Stack: Vite 6, React 19, TypeScript, Tailwind v4, CodeMirror 6, lucide-react.

## Start gate (play)

On entering a scrim, `awaitingStart` is true. A full-screen gate (below the header) asks for **Empezar la clase**. That user gesture unmutes the audio element.

- Do **not** call `engine.play()` on mount.
- Space also starts/pauses (`ScrimPlayer` keydown), but skip it when focus is in the editor.
- After the first `playing` status, the gate hides for that visit; pause/play then uses the yellow button in the bottom bar.
- Reset `awaitingStart` when `lessonData.id` changes.
- Overlay `z-index: 90`, header `z-index: 100`, so Roadmap stays clickable and the floating preview is covered until play.

## Lessons: beats and clock

`compileLesson` in `lessonNN.ts`:

```ts
compileLesson({
  id: 'fundamentos-01',
  audioUrl: '/audio/fundamentos-01.mp3', // fuente temporal; compileLesson la resuelve al objeto R2 publicado
  durationMs: AUDIO_MS,                      // real MP3 length in ms
  beats: [
    { at: 0, type: 'chapter', title: '…' },
    { at: 400, type: 'speak', text: '…' },   // subtitle + sync cue
    { at: 11000, type: 'gesture', durationMs: 2800, points: [{ x, y, targetArea }] },
    { at: 20000, type: 'write', filePath: 'app.js', content: '…', mode: 'replace' },
    { at: 25000, type: 'switch', filePath: 'index.html' },
    { at: 30000, type: 'run' },
    { at: 40000, type: 'challenge', challenge: { … } },
  ],
})
```

Rules:

- `at` is milliseconds from the start of **that MP3**. Align `speak` with when that sentence actually starts in the audio.
- `speak.text` is the subtitle. Keep it the same words as the recording (from `docs/guiones/`).
- Large writes use `mode: 'replace'`.
- Pointer coords are **0–100%** of `targetArea`: `'editor' | 'preview' | 'files'`.
- `gesture` emits waypoints; `syncEngine` interpolates. Do not spam a `pointer` every frame.
- In-lesson `challenge` pauses the tape. Hints may teach; they must not dump the finished program on hint 1.
- After compiling, `audioTrack.narrationScript` is the list of `{ timestamp, text }` from `speak` beats. That is what CC shows.

## Audio

Los MP3 publicados no forman parte del frontend. `compileLesson` resuelve cada ID mediante `src/config/r2AudioManifest.generated.ts` hacia una clave R2 legible e inmutable: `audio/<curso>/<número>-<tema>--<sha12>.mp3`.

1. Genera o coloca el MP3 en un directorio local temporal; `public/audio/` puede usarse durante la preparación, pero el archivo no se commitea.
2. Set `durationMs` in the lesson to the **real** file length (do not leave a stale constant).
3. Time the `speak` / `write` / `gesture` `at` values against the recording. Play the lesson and listen: if the mouse or the type-out leads/lags the voice, move `at`.
4. Ejecuta `pnpm audio:r2:descriptors`, construye el inventario en el backend, sube y verifica ambos buckets, y regenera el mapa del frontend.
5. Comprueba la URL pública y una petición `Range`; después elimina la copia MP3 temporal.

`AudioNarrator` prefers the MP3 as `hardware-audio` clock. If there is no URL, it falls back to speech synthesis / a synthetic clock. Fundamentos lessons always have an MP3 — do not remove `audioUrl`.

Los JSON de `public/audio/` son ayudas pequeñas de duración y sincronización. El reproductor en vivo no obtiene el MP3 de ese directorio: usa R2 y lee `narrationScript` desde los beats.

Regenerating TTS (only if the user asks): `npm run audio:generate` (Piper + cues). Prefer the user’s recorded MP3s when they exist.

## Subtitles (CC)

- Source: each `{ type: 'speak', text, at }` → `narrationScript`.
- Display: `ScrimPlayer` `activeSubtitle` + `.caption-chip` over the editor. Toggle CC on the timeline (`showCaptions`, default on).
- Copy must match the audio. Do not paraphrase in `speak` if the MP3 says something else.
- Guiones (`docs/guiones/NN-….md`): **only the spoken text** (plus the YAML header). No stage directions in the lines they read.

When you change a guion paragraph, update the matching `speak` beat and check `at`.

## Instructor pointer

- `InstructorCursor` is a 100% overlay; position is `%` of the target pane (`translate3d(x%, y%)` on the overlay, not on a 20px node).
- Source of truth while playing: `CursorTrack.getPositionAt(playbackTime)` every rAF — not discrete event snaps.
- Short same-area gaps: full interpolation. Long gaps: rest, then approach (~380ms). Clicks land on keyframe time.
- File-tree Y must map to **real file rows**. Editor X/Y map into the code column.
- Tests: `npx vitest run src/engine/cursor/cursorTrack.test.ts`.

## Debug exercises

`DebuggingExerciseItem` in `debugExercises.ts`, paired in `course.ts` via `withPractice(lesson)`.

- Separate from the in-video reto. Same concepts, **different broken program**.
- No `solutionFiles`. Hints say where to look, not `return x * y`.
- Prefer `validatorType: 'function-call'` on pure functions so students can fix it more than one way.
- Starter code must **fail** the tests. Do not include a case that already passes (e.g. hardcoded `3 * 4` if you test `3,4`).
- Wrap page DOM however you want; `testRunner` stubs `document` when calling functions outside the iframe.

## Adding a Fundamentos lesson (checklist)

1. Guion in `docs/guiones/` — spoken text only.
2. MP3 generado localmente, subido y verificado en R2 con clave legible; no se conserva en el bundle.
3. Workspace HTML/CSS/JS that looks like the class, not a dark “AI” theme.
4. `lessonNN.ts` with `speak`/`write`/`gesture` timed to the MP3, `durationMs` exact.
5. Register in `course.ts`, terms in `LESSON_TERMS`, debug item in `debugExercises.ts`.
6. Play it: start gate → audio + subtitles + pointer + writes stay together → in-lesson challenge pauses → debug node is a different program.

## Player behavior worth preserving

- Editing while the tape runs **forks** a learner branch (`isForked`). Play resumes the tape via “Volver”.
- Preview: `FloatingBrowser`, `position: fixed` when floating. `.browser-window { position: relative }` must not override `fixed` (set inline `position: fixed` if CSS fights).
- Do not let `.workspace-container { display:flex }` collide with a Tailwind grid on the file tree; files sidebar is a **fixed 210px** flex child.

## Code review rules

- Fail the change if a lesson can start audio without a user gesture.
- Fail if roadmap yellow/black/white nodes open the same surface.
- Fail if debug hints or tests encode the exact solution as the only accepted source string when a behavioral test would do.
- Fail UI work that was not exercised in the browser when the change is visible to a student.
- Fail new strings that mention Scrimba in the product UI.
