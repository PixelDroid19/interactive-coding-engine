export type ThemeId = 'normal' | 'cyber';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  rootClasses: string[];
  colorScheme: 'dark';
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  normal: {
    id: 'normal',
    label: 'Normal',
    description: 'CodeSilk oscuro y sereno, pensado para estudiar durante mucho tiempo.',
    rootClasses: [],
    colorScheme: 'dark',
  },
  cyber: {
    id: 'cyber',
    label: 'Cyber',
    description: 'Alto contraste, geometría técnica y acentos neón.',
    rootClasses: ['hud', 'cyber'],
    colorScheme: 'dark',
  },
};

const LEGACY_IDS: Record<string, ThemeId> = {
  default: 'normal',
  paper: 'normal',
  classic: 'normal',
  normal: 'normal',
  hud: 'cyber',
  cyber: 'cyber',
};

export function resolveThemeId(value: string | null | undefined): ThemeId | null {
  return value ? LEGACY_IDS[value.trim().toLowerCase()] ?? null : null;
}

export function resolveInitialTheme(search: string, stored: string | null): ThemeId {
  const params = new URLSearchParams(search);
  const queryTheme = resolveThemeId(params.get('theme'));
  if (queryTheme) return queryTheme;
  if (params.get('hud') === '1') return 'cyber';
  return resolveThemeId(stored) ?? 'normal';
}
