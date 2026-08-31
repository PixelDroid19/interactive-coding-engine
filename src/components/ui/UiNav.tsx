import React from 'react';
import { useTheme } from '../../themes/ThemeProvider';
import { navItemAugmentation } from './uiAugmentation';

interface UiNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface UiNavProps {
  ariaLabel: string;
  activeId: string;
  items: readonly UiNavItem[];
  onChange(id: string): void;
  className?: string;
}

export const UiNav: React.FC<UiNavProps> = ({ ariaLabel, activeId, items, onChange, className = '' }) => {
  const { themeId } = useTheme();
  return <nav className={`ui-nav${className ? ` ${className}` : ''}`} aria-label={ariaLabel}>
    {items.map((item) => {
      const active = item.id === activeId;
      return (
        <button
          key={item.id}
          type="button"
          data-augmented-ui={navItemAugmentation(themeId, active)}
          aria-current={active ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge !== undefined && item.badge !== null ? <b>{item.badge}</b> : null}
        </button>
      );
    })}
  </nav>;
};
