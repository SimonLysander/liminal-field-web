import type { ReactNode } from 'react';

export const EditorShell = ({
  children,
  sidePanel,
}: {
  children: ReactNode;
  sidePanel: ReactNode;
}) => (
  <div className="admin-shell-grid">
    <div className="admin-shell-main">{children}</div>
    <aside className="admin-shell-side">{sidePanel}</aside>
  </div>
);
