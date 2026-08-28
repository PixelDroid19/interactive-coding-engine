import { describe, expect, it } from 'vitest';
import { resolveInitialTheme, resolveThemeId, THEMES } from './themeRegistry';

describe('theme registry', () => {
  it('migra nombres históricos', () => {
    expect(resolveThemeId('hud')).toBe('cyber');
    expect(resolveThemeId('default')).toBe('normal');
    expect(resolveThemeId('desconocido')).toBeNull();
  });

  it('da prioridad a la URL y conserva un valor seguro', () => {
    expect(resolveInitialTheme('?theme=normal', 'hud')).toBe('normal');
    expect(resolveInitialTheme('?hud=1', 'default')).toBe('cyber');
    expect(resolveInitialTheme('', 'desconocido')).toBe('normal');
  });

  it('cada tema tiene metadatos y clases independientes', () => {
    expect(Object.values(THEMES).map((theme) => theme.id)).toEqual(['normal', 'cyber']);
    expect(THEMES.normal.rootClasses).not.toContain('hud');
    expect(THEMES.cyber.rootClasses).toContain('hud');
  });
});
