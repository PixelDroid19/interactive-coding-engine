import React from 'react';
import { useTheme } from '../../themes/ThemeProvider';
import { surfaceAugmentation, type UiSurfaceTone } from './uiAugmentation';

type UiSurfaceElement = 'article' | 'aside' | 'div' | 'header' | 'main' | 'section';

export interface UiSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: UiSurfaceElement;
  tone?: UiSurfaceTone;
}

export const UiSurface: React.FC<UiSurfaceProps> = ({ as = 'section', tone = 'default', className = '', ...props }) => {
  const { themeId } = useTheme();
  return React.createElement(as, {
    ...props,
    'data-augmented-ui': surfaceAugmentation(themeId, tone),
    className: `ui-surface ui-surface--${tone}${className ? ` ${className}` : ''}`,
  });
};
