import { compileLesson } from '../../engine/lessonCompiler';
import {
  LESSON2_JS_SOLUTION,
  PATTERN_FILES,
  lesson2Workspace,
} from './workspaces';

const AUDIO_MS = 94_000;

export const LESSON_02 = compileLesson({
  id: 'fundamentos-02',
  title: '2. Pensamiento computacional',
  description:
    'Parte un problema en pasos y enseña a la página a convertir una temperatura.',
  audioUrl: '/audio/fundamentos-02.mp3?v=voz',
  language: 'es',
  durationMs: AUDIO_MS,
  initialWorkspace: lesson2Workspace,
  concepts: ['Dividir el problema', 'La fórmula es el programa'],
  teachNotes: [
    {
      title: 'Parte el problema',
      body: 'Si se ve enorme, córtalo. Leer el número. Hacer la cuenta. Mostrar el resultado. Un paso cada vez.',
    },
    {
      title: 'La cuenta es el programa',
      body: 'Celsius × 9 ÷ 5 + 32. Sin esa línea, el programa solo copia el número. Con ella, sirve para cualquier valor.',
    },
  ],
  beats: [
    { at: 0, type: 'chapter', title: 'Parte el problema' },
    {
      at: 400,
      type: 'speak',
      text: 'A veces el código parece difícil porque el problema se ve enorme. El truco es partirlo. Un paso, luego otro, luego otro.',
    },
    {
      at: 11000,
      type: 'speak',
      text: 'Hoy vamos a convertir una temperatura. No hace falta saber física. Solo tres cuentas, en orden.',
    },
    { at: 18000, type: 'chapter', title: 'Tres piezas' },
    {
      at: 18000,
      type: 'speak',
      text: 'Mira la página. Hay un número, un botón y un resultado. Tres piezas: leer el número, hacer la cuenta, y mostrarla.',
    },
    {
      at: 18000,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 56, y: 28, targetArea: 'preview' },
        { x: 54, y: 42, targetArea: 'preview' },
      ],
    },
    { at: 20000, type: 'switch', filePath: 'index.html' },
    {
      at: 20000,
      type: 'gesture',
      durationMs: 2200,
      points: [
        { x: 48, y: 16, targetArea: 'files', clicked: true },
        { x: 36, y: 40, targetArea: 'editor' },
        { x: 38, y: 58, targetArea: 'editor' },
      ],
    },
    { at: 29000, type: 'switch', filePath: 'app.js' },
    {
      at: 29000,
      type: 'gesture',
      durationMs: 800,
      points: [
        { x: 48, y: 32, targetArea: 'files', clicked: true },
        { x: 28, y: 30, targetArea: 'editor' },
      ],
    },
    {
      at: 29000,
      type: 'speak',
      text: 'El esqueleto ya está escrito. Leemos lo que escribiste, escuchamos el clic y pintamos el resultado. Falta la cuenta. Por eso ahora miente.',
    },
    { at: 39860, type: 'run' },
    {
      at: 40000,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 52, y: 48, targetArea: 'preview' },
        { x: 54, y: 62, targetArea: 'preview', clicked: true },
      ],
    },
    {
      at: 39860,
      type: 'speak',
      text: 'Si pulso Convertir, dice que veinte Celsius son veinte Fahrenheit. Copió el número. Todavía no hizo la cuenta.',
    },
    { at: 48380, type: 'chapter', title: 'La cuenta' },
    {
      at: 48380,
      type: 'speak',
      text: 'La cuenta es así. Tomas el Celsius, lo multiplicas por nueve, lo divides entre cinco, y le sumas treinta y dos. Eso es Fahrenheit. Escríbela tú.',
    },
    {
      at: 59000,
      type: 'challenge',
      challenge: {
        id: 'reto-fahrenheit',
        title: 'Reto: completa la fórmula',
        instructions: `Haz que convertir() calcule Fahrenheit de verdad.

1. Sustituye const fahrenheit = celsius;
2. Usa la fórmula celsius * 9 / 5 + 32
3. Pulsa Run y convierte 20. Debería dar 68.`,
        tests: [
          {
            id: 'usa-formula',
            description: 'La fórmula multiplica por 9/5 o 1.8 y suma 32',
            validatorType: 'source-regex',
            regexPattern: 'fahrenheit\\s*=\\s*celsius\\s*\\*\\s*(9\\s*\\/\\s*5|1\\.8)\\s*\\+\\s*32',
            errorMessage: 'Todavía no veo celsius * 9 / 5 + 32.',
            hintTip: 'Revisa la línea de fahrenheit.',
          },
          {
            id: 'convierte-20-es-68',
            description: '20 °C se convierte en 68 °F',
            validatorType: 'dom-check',
            domSelector: '#salida',
            domProperty: 'innerText',
            expectedValue: '68',
            errorMessage: 'Con 20 °C el resultado debe contener 68. ¿Probaste con Ejecutar?',
            hintTip: 'Después de corregir la fórmula, pulsa Ejecutar y verifica #salida.',
          },
          {
            id: 'escribe-salida',
            description: 'Sigue actualizando el texto de salida',
            validatorType: 'source-regex',
            regexPattern: 'salida\\.textContent\\s*=',
            errorMessage: 'No borres la línea que pinta el resultado.',
            hintTip: 'Deja salida.textContent = ...',
          },
        ],
        hints: [
          {
            level: 1,
            title: 'Dónde editar',
            text: 'Está marcado con TODO dentro de convertir().',
          },
          {
            level: 2,
            title: 'La fórmula',
            text: 'Fahrenheit = Celsius × 9 ÷ 5 + 32.',
          },
          {
            level: 3,
            title: 'Siguiente paso',
            text: 'A la derecha del igual usa la operación con * 9 / 5 + 32. No borres el resto de la línea.',
          },
        ],
        solutionExplanation: 'La cuenta es el paso que faltaba. Sin ella, el programa solo copia el número.',
      },
    },
    {
      at: 59840,
      type: 'speak',
      text: 'Si te salió, bien. Si no, mira cómo queda escrito y compáralo con lo tuyo. Así se aprende también.',
    },
    {
      at: 50000,
      type: 'gesture',
      durationMs: 1600,
      points: [
        { x: 28, y: 36, targetArea: 'editor' },
        { x: 44, y: 44, targetArea: 'editor' },
      ],
    },
    { at: 61640, type: 'write', filePath: 'app.js', content: LESSON2_JS_SOLUTION },
    { at: 67840, type: 'run' },
    {
      at: 68200,
      type: 'gesture',
      durationMs: 900,
      points: [
        { x: 54, y: 58, targetArea: 'preview' },
        { x: 56, y: 70, targetArea: 'preview' },
      ],
    },
    {
      at: 67840,
      type: 'speak',
      text: 'Veinte Celsius son sesenta y ocho Fahrenheit. La misma cuenta sirve para cualquier número. Por eso la escribimos una vez.',
    },
    { at: 75840, type: 'chapter', title: 'Encuentra la regla' },
    {
      at: 75840,
      type: 'speak',
      text: 'Último rato. Un juego. En cada ronda hay una regla escondida. Encuéntrala. Si ves la regla, ya puedes escribirla en código.',
    },
    { at: 82000, type: 'workspace', files: PATTERN_FILES, activeFilePath: 'app.js' },
    { at: 85340, type: 'run' },
    {
      at: 85340,
      type: 'gesture',
      durationMs: 1200,
      points: [
        { x: 48, y: 36, targetArea: 'preview' },
        { x: 62, y: 52, targetArea: 'preview' },
        { x: 50, y: 64, targetArea: 'preview' },
      ],
    },
    {
      at: 85340,
      type: 'speak',
      text: 'Pausa y juega. Cuando veas la regla, ya estás pensando como hay que pensar para programar. Primero la regla. Después el código.',
    },
  ],
});
