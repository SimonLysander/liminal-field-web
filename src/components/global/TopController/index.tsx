import { useTheme } from '@/hooks/use-theme';

const TopController = () => {
  const { theme, setTheme } = useTheme();

  return (
    // Layout and spacing move back to Uno so the shell stays aligned with the repo's styling stack.
    <div className="topbar pointer-events-none fixed inset-x-0 top-0 z-100 flex h-[2.625rem] items-center justify-between px-[1.5rem]">
      <div className="topbar-left pointer-events-auto flex items-center gap-[1rem]">
        <span className="tb-brand text-[0.8125rem] leading-none">Liminal Field</span>
      </div>
      <div className="topbar-center pointer-events-auto absolute left-1/2 -translate-x-1/2">
        <button className="search-trigger flex items-center gap-[0.375rem] border-none bg-transparent" type="button">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="kbd">Ctrl K</span>
        </button>
      </div>
      <div className="topbar-right pointer-events-auto flex items-center gap-[1rem]">
        <button
          type="button"
          className="theme-toggle h-[0.5rem] w-[0.5rem] rounded-full border-none"
          onClick={() => setTheme(theme === 'daylight' ? 'midnight' : 'daylight')}
          aria-label="Toggle theme"
        />
      </div>
    </div>
  );
};

export default TopController;
