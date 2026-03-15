import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light';
    return (document.documentElement.classList.contains('dark') ? 'dark' : 'light') as Theme;
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('liminal-theme', next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('liminal-theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored);
    }
  }, [setTheme]);

  return { theme, setTheme };
}
