import { describe, expect, it } from 'vitest';
import { ModelType, type ModelRecord } from '@mlc-ai/web-llm';
import { buildTutorModelCatalog, chooseTutorModelProfiles, curateTutorModelCatalog } from './localModelCatalog';

const records: ModelRecord[] = [
  {
    model: 'https://example.test/tiny',
    model_id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    model_lib: 'tiny.wasm',
    vram_required_MB: 376,
    overrides: { context_window_size: 4096 },
  },
  {
    model: 'https://example.test/coder',
    model_id: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
    model_lib: 'coder.wasm',
    vram_required_MB: 1630,
    overrides: { context_window_size: 4096 },
  },
  {
    model: 'https://example.test/deep',
    model_id: 'Qwen3.5-2B-q4f16_1-MLC',
    model_lib: 'deep.wasm',
    vram_required_MB: 2245,
    overrides: { context_window_size: 4096 },
  },
  {
    model: 'https://example.test/huge',
    model_id: 'Huge-8B-Instruct-MLC',
    model_lib: 'huge.wasm',
    vram_required_MB: 5900,
  },
  {
    model: 'https://example.test/vision',
    model_id: 'Vision-1B-MLC',
    model_lib: 'vision.wasm',
    vram_required_MB: 900,
    model_type: ModelType.VLM,
  },
];

describe('catálogo local para el tutor', () => {
  it('solo ofrece LLM de texto que caben en el límite local configurado', () => {
    const catalog = buildTutorModelCatalog(records, 2_300, new Set(['Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC']));

    expect(catalog.map((model) => model.id)).toEqual([
      'SmolLM2-360M-Instruct-q4f16_1-MLC',
      'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
      'Qwen3.5-2B-q4f16_1-MLC',
    ]);
    expect(catalog[1]).toMatchObject({ cached: true, estimatedVramMB: 1630, contextWindowSize: 4096 });
    expect(catalog[0].cached).toBe(false);
  });

  it('elige perfiles ligero, recomendado y profundo sin inventar modelos ausentes', () => {
    const catalog = buildTutorModelCatalog(records, 2_300);
    const profiles = chooseTutorModelProfiles(catalog);

    expect(profiles.light?.id).toBe('SmolLM2-360M-Instruct-q4f16_1-MLC');
    expect(profiles.recommended?.id).toBe('Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC');
    expect(profiles.deep?.id).toBe('Qwen3.5-2B-q4f16_1-MLC');
    expect(new Set(Object.values(profiles).map((model) => model?.id)).size).toBe(3);
  });

  it('produce etiquetas humanas sin esconder el identificador técnico', () => {
    const [model] = buildTutorModelCatalog(records.slice(1, 2), 2_300);

    expect(model.label).toBe('Qwen 2.5 Coder · 1.5B');
    expect(model.id).toContain('q4f16_1-MLC');
    expect(model.specialty).toBe('Código y explicaciones');
  });

  it('reduce el catálogo visible a tres decisiones comprensibles', () => {
    const curated = curateTutorModelCatalog(buildTutorModelCatalog(records, 2_300));

    expect(curated.map((model) => model.profile)).toEqual(['light', 'recommended', 'deep']);
    expect(curated.map((model) => model.id)).toEqual([
      'SmolLM2-360M-Instruct-q4f16_1-MLC',
      'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
      'Qwen3.5-2B-q4f16_1-MLC',
    ]);
  });
});
