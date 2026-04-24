import { NavLink } from 'react-router-dom';

const spaces = [
  { to: '/home', label: 'Home' },
  { to: '/note', label: 'Notes' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/agent', label: 'Agent' },
];

export default function SideNavigator() {
  return (
    <div className="sidebar-wrapper w-[3rem] shrink-0">
      <aside className="sidebar flex h-full w-[3rem] flex-col justify-center overflow-hidden">
        <nav className="nav-rail flex flex-col items-stretch">
          {spaces.map((space) => (
            <NavLink
              key={space.to}
              to={space.to}
              className={({ isActive }) =>
                `rail-item relative flex h-[2.75rem] items-center overflow-hidden whitespace-nowrap pl-[1.125rem] ${isActive ? 'active' : ''}`
              }
            >
              <span className="rail-label text-[0.5rem] leading-none">{space.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
