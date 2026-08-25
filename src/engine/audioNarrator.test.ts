import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioNarrator, splitCaptionText } from './audioNarrator';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('splitCaptionText', () => {
  it('mantiene frases breves y divide narraciones largas sin perder palabras', () => {
    const text = 'Primera frase breve. Segunda frase con una explicación adicional. Tercera frase para cerrar.';
    const chunks = splitCaptionText(text, 45);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 45)).toBe(true);
    expect(chunks.join(' ')).toBe(text);
  });

  it('divide una oración larga por palabras cuando no tiene pausas', () => {
    const text = 'Esta narración deliberadamente extensa necesita caber en el editor sin cubrir toda la zona de trabajo del estudiante';
    const chunks = splitCaptionText(text, 38);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(' ')).toBe(text);
  });
});

describe('AudioNarrator en modo silencioso', () => {
  it('mantiene reloj y subtítulos sin crear audio ni usar síntesis de voz', () => {
    const createAudio = vi.fn();
    const speak = vi.fn();
    vi.stubGlobal('Audio', createAudio);
    vi.stubGlobal('window', { speechSynthesis: { speak, cancel: vi.fn(), getVoices: () => [] } });
    vi.spyOn(performance, 'now').mockReturnValueOnce(100).mockReturnValue(650);
    const subtitles: Array<string | null> = [];
    const narrator = new AudioNarrator((text) => subtitles.push(text));

    narrator.loadTrack({
      url: '/audio/no-debe-cargarse.mp3',
      durationMs: 4_000,
      narrationScript: [{ timestamp: 0, text: 'Observa cómo cambia el contexto.' }],
    }, 'silent');
    narrator.play(0);
    narrator.onTimeTick(550);

    expect(createAudio).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
    expect(subtitles).toContain('Observa cómo cambia el contexto.');
    expect(narrator.getPreciseAudioTimeMs()).toMatchObject({
      source: 'synthetic-timeline',
      isPlaying: true,
    });
  });
});
