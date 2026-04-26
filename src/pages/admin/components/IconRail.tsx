// src/pages/admin/components/IconRail.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Image } from 'lucide-react';

/*
 * IconRail — 48px 窄图标导航栏
 *
 * 与右侧内容面板共享 sidebar-bg 背景，形成一体的浮动卡片。
 * 图标栏左圆角（radius-lg），内容面板右圆角。
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
        borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
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
