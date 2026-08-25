import React from 'react';
import { Braces, FileCode2 } from 'lucide-react';
import type { CourseLanguage } from '../../types/scrim';

interface LanguageSelectorProps {
  value: CourseLanguage;
  onChange: (language: CourseLanguage) => void;
  disabled?: boolean;
  compact?: boolean;
}

const options: Array<{
  value: CourseLanguage;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { value: 'javascript', label: 'JavaScript', icon: Braces },
  { value: 'python', label: 'Python', icon: FileCode2 },
];

export function LanguageSelector({ value, onChange, disabled = false, compact = false }: LanguageSelectorProps) {
  return (
    <div
      className={`course-language-selector${compact ? ' is-compact' : ''}`}
      role="group"
      aria-label="Lenguaje del ejercicio"
    >
      {options.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={active ? 'is-active' : ''}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => {
              if (!active) onChange(option.value);
            }}
          >
            <Icon size={14} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
