import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/home',
    label: 'Home',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/note',
    label: 'Notes',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/gallery',
    label: 'Gallery',
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

const SideNavigator = () => {
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-2">
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `group relative flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl transition-colors ${
              isActive
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`
          }
        >
          {icon}
          <span className="text-xs font-medium leading-none">{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default SideNavigator;
