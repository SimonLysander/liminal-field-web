// src/pages/admin/components/IconRail.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Image } from 'lucide-react';

/*
 * IconRail — 48px 窄图标导航栏
 *
 * 全高齐平布局，与右侧 TreePanel/PostList 共享 sidebar-bg 背景色。
 * 右侧 separator 边线将其与相邻面板分隔。
 * 选中态：shelf 背景 + ink 图标色。未选中：ink-ghost 图标色。
 */

const NAV_ITEMS = [
  { path: '/admin/content', icon: FileText, label: '笔记管理' },
  { path: '/admin/gallery', icon: Image, label: '画廊管理' },
] as const;

export function IconRail() {
  const location = useLocation();
  const navigate = useNavigate();

  /* 匹配当前路径到导航项（前缀匹配） */
  const activePath = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path),
  )?.path ?? NAV_ITEMS[0].path;

  return (
    <div
      className="flex shrink-0 flex-col items-center py-3 gap-1"
      style={{
        width: 48,
        background: 'var(--sidebar-bg)',
        borderRight: '0.5px solid var(--separator)',
      }}
    >
      {/* Logo */}
      <div
        className="mb-4 flex items-center justify-center rounded-lg"
        style={{
          width: 28,
          height: 28,
          background: 'var(--ink)',
          color: 'var(--accent-contrast)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
        }}
      >
        L
      </div>

      {/* Nav icons */}
      {NAV_ITEMS.map((item) => {
        const isActive = activePath === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{
              width: 36,
              height: 36,
              background: isActive ? 'var(--shelf)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'var(--ink-ghost)',
            }}
            title={item.label}
            onClick={() => navigate(item.path)}
          >
            <Icon size={18} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
