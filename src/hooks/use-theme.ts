import { useCallback, useState } from 'react';

type Theme = 'daylight' | 'midnight';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'daylight';
    try {
      const stored = localStorage.getItem('liminal-theme');
      if (stored === 'daylight' || stored === 'midnight') {
        document.body.setAttribute('data-theme', stored);
        return stored;
      }
    } catch {
      /* ignore */
    }

    return (document.body.getAttribute('data-theme') as Theme) || 'daylight';
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.body.setAttribute('data-theme', next);
    try {
      localStorage.setItem('liminal-theme', next);
    } catch {
      /* ignore */
    }
  }, []);

  return { theme, setTheme };
}
