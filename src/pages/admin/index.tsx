/*
 * AdminShell — 管理后台壳子
 *
 * 布局：图标栏 (48px) + 子路由内容
 * 图标栏独立浮动卡片（左侧圆角），子路由各自渲染内容面板。
 * 通过 sidebar-bg 背景色 + 无间距，IconRail 和子页面的面板视觉上连为一体。
 */

import { Outlet } from 'react-router-dom';
import Topbar from '@/components/global/Topbar';
import { IconRail } from './components/IconRail';

const AdminShell = () => {
  return (
    <div className="flex h-screen" style={{ background: 'var(--paper)' }}>
      {/* Left: icon rail — floating card with left radius */}
      <div
        className="flex shrink-0"
        style={{
          margin: '8px 0 8px 8px',
          background: 'var(--sidebar-bg)',
          borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <IconRail />
      </div>

      {/* Right: Topbar + child route content */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--paper)' }}
      >
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
