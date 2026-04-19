import { useCallback, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem('liminal-theme');
      if (stored === 'dark' || stored === 'light') {
        document.documentElement.classList.toggle('dark', stored === 'dark');
        return stored;
      }
    } catch {
      /* ignore */
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
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

  return { theme, setTheme };
}
