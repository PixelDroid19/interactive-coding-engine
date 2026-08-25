import { describe, expect, it } from 'vitest';
import type { ReadingItem } from '../../types/curriculum';
import { AI_ENGINEER_COURSE } from './course';

function reading(number: number) {
  const id = `ai-engineer-${String(number).padStart(2, '0')}-lectura`;
  return AI_ENGINEER_COURSE.modules.flatMap((module) => module.items)
    .find((item): item is ReadingItem => item.type === 'reading' && item.id === id);
}

describe('laboratorios interactivos de AI Engineer', () => {
  it('inserta práctica local en la progresión de prompts y modelos', () => {
    const expected = new Map([
      [12, 'prompt'],
      [14, 'prompt'],
      [24, 'prompt'],
      [26, 'prompt'],
      [27, 'summarize'],
    ] as const);

    for (const [number, mode] of expected) {
      const item = reading(number);
      expect(item, `falta lectura ${number}`).toBeDefined();
      expect(item?.interactiveLab?.defaultMode, `falta laboratorio ${number}`).toBe(mode);
      expect(item?.interactiveLab?.input.trim().length, `laboratorio ${number} no tiene entrada editable`).toBeGreaterThan(40);
      expect(item?.interactiveLab?.observationPrompt, `laboratorio ${number} no pide comparar evidencia`).toMatch(/cambi|difer|evidencia|observ/i);
    }
  });

  it('enseña WebGPU, modelo, caché y APIs de tareas con fuentes actuales', () => {
    const modelUrls = reading(26)?.sources?.map((source) => source.url) ?? [];
    expect(modelUrls).toContain('https://huggingface.co/docs/transformers.js/index');
    expect(modelUrls).toContain('https://huggingface.co/blog/transformersjs-v4');
    expect(modelUrls).toContain('https://huggingface.co/onnx-community/LFM2.5-350M-ONNX');
    expect(modelUrls).toContain('https://codepen.io/manz/pen/qEayoMQ');

    const browserUrls = reading(27)?.sources?.map((source) => source.url) ?? [];
    expect(browserUrls).toContain('https://developer.chrome.com/docs/ai/built-in/overview?hl=es-419');
    expect(browserUrls).toContain('https://developer.chrome.com/docs/ai/summarizer-api?hl=es-419');
    expect(browserUrls).toContain('https://developer.chrome.com/docs/ai/writer-api?hl=es-419');
  });

  it('usa LFM2.5-350M para una tarea recomendada por su model card', () => {
    const lab = reading(26)?.interactiveLab;
    expect(lab?.systemPrompt).toMatch(/extrae|json|campos/i);
    expect(`${lab?.promptA}\n${lab?.promptB}\n${lab?.input}`).toMatch(/incidencia|prioridad|equipo/i);
    expect(lab?.systemPrompt).not.toMatch(/tutor de programación/i);
  });
});
