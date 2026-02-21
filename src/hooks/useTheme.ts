import { useState, useEffect, useCallback } from 'react';
import type { Theme } from '../types/index';
import { readState, writeState } from '../utils/localStorage';

export interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>(() => readState().theme);

  // Apply theme class to <html> on mount and on every theme change.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      const current = readState();
      writeState({ ...current, theme: next });
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
