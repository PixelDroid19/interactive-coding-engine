import React from 'react';

type UiSurfaceElement = 'article' | 'aside' | 'div' | 'section';
type UiSurfaceTone = 'default' | 'soft' | 'accent' | 'metric';

export interface UiSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: UiSurfaceElement;
  tone?: UiSurfaceTone;
}

export const UiSurface: React.FC<UiSurfaceProps> = ({ as = 'section', tone = 'default', className = '', ...props }) => (
  React.createElement(as, {
    ...props,
    className: `ui-surface ui-surface--${tone}${className ? ` ${className}` : ''}`,
  })
);
