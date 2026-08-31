import type { ThemeId } from '../../themes/themeRegistry';

export type UiSurfaceTone = 'default' | 'soft' | 'accent' | 'metric';
export type UiButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'icon';

export function surfaceAugmentation(themeId: ThemeId, tone: UiSurfaceTone): string | undefined {
  if (themeId !== 'cyber') return undefined;
  return `ui-surface ui-surface-${tone} tl-clip br-clip border inlay`;
}

export function buttonAugmentation(themeId: ThemeId, variant: UiButtonVariant): string | undefined {
  if (themeId !== 'cyber') return undefined;
  return `ui-button ui-button-${variant} tl-clip br-clip border inlay`;
}

export function navItemAugmentation(themeId: ThemeId, active: boolean): string | undefined {
  if (themeId !== 'cyber') return undefined;
  return `ui-nav-item${active ? '-active' : ''} tl-clip br-clip border inlay`;
}
