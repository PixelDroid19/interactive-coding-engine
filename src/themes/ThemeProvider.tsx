import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { resolveInitialTheme, THEMES, type ThemeDefinition, type ThemeId } from './themeRegistry';

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setTheme: (theme: ThemeId) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const ALL_ROOT_CLASSES = [...new Set(Object.values(THEMES).flatMap((theme) => theme.rootClasses))];

export function applyThemeToDocument(themeId: ThemeId): void {
  const root = document.documentElement;
  const theme = THEMES[themeId];
  root.classList.add('dark');
  root.classList.remove(...ALL_ROOT_CLASSES);
  root.classList.add(...theme.rootClasses);
  root.dataset.theme = themeId;
  root.style.colorScheme = theme.colorScheme;
  try { localStorage.setItem('theme', themeId); } catch {}
}

function storedTheme(): string | null {
  try { return localStorage.getItem('theme'); } catch { return null; }
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => resolveInitialTheme(window.location.search, storedTheme()));

  const setTheme = useCallback((next: ThemeId) => setThemeId(next), []);
  const toggleTheme = useCallback(() => setThemeId((current) => current === 'cyber' ? 'normal' : 'cyber'), []);

  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  const value = useMemo<ThemeContextValue>(() => ({ themeId, theme: THEMES[themeId], setTheme, toggleTheme }), [setTheme, themeId, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return value;
}

export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
