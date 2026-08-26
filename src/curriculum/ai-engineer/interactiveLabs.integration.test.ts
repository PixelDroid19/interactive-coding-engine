import { describe, expect, it } from 'vitest';
import type { ReadingItem } from '../../types/curriculum';
import { AI_ENGINEER_COURSE } from './course';

function reading(number: number) {
  const id = `ai-engineer-${String(number).padStart(2, '0')}-lectura`;
  return AI_ENGINEER_COURSE.modules.flatMap((module) => module.items)
    .find((item): item is ReadingItem => item.type === 'reading' && item.id === id);
}

describe('laboratorios interactivos de AI Engineer', () => {
  it('ubica la práctica de embeddings WebGPU después de enseñar los vectores', () => {
    expect(reading(17)?.handsOnLab).toBeUndefined();
    expect(reading(18)?.handsOnLab).toBe('embeddings-webgpu');
  });

  it('inserta práctica con modelo real en la progresión del chat', () => {
    const expected = new Map([
      [7, 'prompt'],
      [8, 'prompt'],
      [11, 'prompt'],
      [15, 'prompt'],
    ] as const);

    for (const [number, mode] of expected) {
      const item = reading(number);
      expect(item, `falta lectura ${number}`).toBeDefined();
      expect(item?.interactiveLab?.defaultMode, `falta laboratorio ${number}`).toBe(mode);
      expect(item?.interactiveLab?.input.trim().length, `laboratorio ${number} no tiene entrada editable`).toBeGreaterThan(40);
      expect(item?.interactiveLab?.observationPrompt, `laboratorio ${number} no pide comparar evidencia`).toMatch(/cambi|difer|evidencia|observ/i);
    }
  });

  it('enseña el motor real de la clase JSON con fuentes actuales', () => {
    const modelUrls = reading(11)?.sources?.map((source) => source.url) ?? [];
    expect(modelUrls).toContain('https://huggingface.co/docs/transformers.js/index');
    expect(modelUrls).toContain('https://huggingface.co/blog/transformersjs-v4');
    expect(modelUrls).toContain('https://huggingface.co/onnx-community/LFM2.5-350M-ONNX');
    expect(modelUrls).toContain('https://webllm.mlc.ai/docs/');
    expect(modelUrls).toContain('https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC');
    expect(modelUrls).toContain('https://codepen.io/manz/pen/qEayoMQ');
    expect(reading(11)?.sections.map((section) => section.content).join(' ')).toMatch(/modo JSON nativo|response_format/i);
  });

  it('usa un modelo pequeño multilingüe para una tarea estructurada', () => {
    const lab = reading(11)?.interactiveLab;
    expect(lab?.systemPrompt).toMatch(/extrae|json|campos/i);
    expect(`${lab?.promptA}\n${lab?.promptB}\n${lab?.input}`).toMatch(/incidencia|prioridad|equipo/i);
    expect(lab?.systemPrompt).not.toMatch(/tutor de programación/i);
    expect(lab?.title).toMatch(/WebLLM.*WebGPU/i);
    expect(lab?.expectedJsonKeys).toEqual(['problema', 'prioridad', 'equipo']);
  });
});
