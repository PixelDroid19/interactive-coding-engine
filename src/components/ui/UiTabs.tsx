import React from 'react';

interface UiTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface UiTabsProps {
  ariaLabel: string;
  activeId: string;
  tabs: readonly UiTab[];
  onChange: (id: string) => void;
}

export const UiTabs: React.FC<UiTabsProps> = ({ ariaLabel, activeId, tabs, onChange }) => {
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const { key } = event;
    if (key === 'Enter' || key === ' ') {
      onChange(tabs[index].id);
      return;
    }
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
    const nextIndex = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : (index + direction + tabs.length) % tabs.length;
    event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <nav className="ui-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            id={`ui-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`ui-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
