import type { ModelRecord } from '@mlc-ai/web-llm';
import {
  LOCAL_GENERATION_DEVICE,
  LOCAL_GENERATION_ENGINE,
  type LocalModelOption,
} from './localGenerationProtocol';

const PROFILE_IDS = {
  light: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
  recommended: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC',
  deep: 'Qwen3.5-2B-q4f16_1-MLC',
} as const;

function humanSize(id: string): string {
  const match = id.match(/(?:^|[-_])(\d+(?:\.\d+)?[BM])(?:[-_]|$)/i);
  return match?.[1]?.toUpperCase() ?? '';
}

function humanFamily(id: string): string {
  if (/Qwen2\.5-Coder/i.test(id)) return 'Qwen 2.5 Coder';
  if (/Qwen3\.5/i.test(id)) return 'Qwen 3.5';
  if (/Qwen3/i.test(id)) return 'Qwen 3';
  if (/Qwen2\.5/i.test(id)) return 'Qwen 2.5';
  if (/SmolLM2/i.test(id)) return 'SmolLM 2';
  if (/Llama-3\.2/i.test(id)) return 'Llama 3.2';
  if (/TinyLlama/i.test(id)) return 'TinyLlama';
  if (/gemma3/i.test(id)) return 'Gemma 3';
  if (/gemma-2/i.test(id)) return 'Gemma 2';
  return id
    .replace(/-q\d+f\d+(?:_\d+)?-MLC.*$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function specialty(id: string): string {
  if (/Coder/i.test(id)) return 'Código y explicaciones';
  if (/SmolLM|TinyLlama|135M|360M/i.test(id)) return 'Respuestas breves';
  if (/Qwen3\.5|3B|2B/i.test(id)) return 'Razonamiento más profundo';
  return 'Tutoría general';
}

function profileFor(id: string): LocalModelOption['profile'] {
  const match = (Object.entries(PROFILE_IDS) as Array<[Exclude<LocalModelOption['profile'], 'custom'>, string]>)
    .find(([, modelId]) => modelId === id);
  return match?.[0] ?? 'custom';
}

export function buildTutorModelCatalog(
  records: ModelRecord[],
  maxVramMB = 2_300,
  cachedIds: ReadonlySet<string> = new Set(),
): LocalModelOption[] {
  return records
    .filter((record) => (record.model_type === undefined || record.model_type === 0))
    .filter((record) => (record.vram_required_MB ?? Number.POSITIVE_INFINITY) <= maxVramMB)
    .map((record) => {
      const id = record.model_id;
      const size = humanSize(id);
      return {
        id,
        model: id,
        label: `${humanFamily(id)}${size ? ` · ${size}` : ''}`,
        specialty: specialty(id),
        profile: profileFor(id),
        engine: LOCAL_GENERATION_ENGINE,
        device: LOCAL_GENERATION_DEVICE,
        cached: cachedIds.has(id),
        estimatedVramMB: record.vram_required_MB ?? 0,
        contextWindowSize: record.overrides?.context_window_size ?? 0,
      };
    })
    .sort((left, right) => left.estimatedVramMB - right.estimatedVramMB || left.label.localeCompare(right.label));
}

export function chooseTutorModelProfiles(catalog: LocalModelOption[]): Partial<Record<'light' | 'recommended' | 'deep', LocalModelOption>> {
  const byId = new Map(catalog.map((model) => [model.id, model]));
  const used = new Set<string>();
  const pick = (preferredId: string, fallback: (model: LocalModelOption) => boolean) => {
    const preferred = byId.get(preferredId);
    const selected = preferred ?? catalog.find((model) => !used.has(model.id) && fallback(model));
    if (selected) used.add(selected.id);
    return selected;
  };
  return {
    light: pick(PROFILE_IDS.light, (model) => model.estimatedVramMB <= 700),
    recommended: pick(PROFILE_IDS.recommended, (model) => model.estimatedVramMB >= 900 && model.estimatedVramMB <= 1_900),
    deep: pick(
      PROFILE_IDS.deep,
      (model) => model.estimatedVramMB >= 1_900 && /(?:1\.7|2|3)B/i.test(model.id),
    ) ?? pick(PROFILE_IDS.deep, (model) => model.estimatedVramMB >= 1_900),
  };
}

export function curateTutorModelCatalog(catalog: LocalModelOption[]): LocalModelOption[] {
  const profiles = chooseTutorModelProfiles(catalog);
  const ordered: Array<['light' | 'recommended' | 'deep', LocalModelOption | undefined]> = [
    ['light', profiles.light],
    ['recommended', profiles.recommended],
    ['deep', profiles.deep],
  ];
  const seen = new Set<string>();
  return ordered.flatMap(([profile, model]) => {
    if (!model || seen.has(model.id)) return [];
    seen.add(model.id);
    return [{ ...model, profile }];
  });
}
