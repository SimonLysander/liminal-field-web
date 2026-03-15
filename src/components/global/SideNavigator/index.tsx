import { Bot, GalleryHorizontalEnd, Home, NotebookPen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/note', label: 'Notes', icon: NotebookPen },
  { to: '/gallery', label: 'Gallery', icon: GalleryHorizontalEnd },
  { to: '/agent', label: 'Agent', icon: Bot },
];

const SideNavigator = () => {
  return (
    <nav className="flex flex-col items-center gap-1 px-2 py-4">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-md border border-transparent text-muted-foreground transition-colors',
              isActive
                ? 'border-border bg-accent text-foreground'
                : 'hover:bg-accent/50 hover:text-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span className="text-[10px] leading-none">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default SideNavigator;
