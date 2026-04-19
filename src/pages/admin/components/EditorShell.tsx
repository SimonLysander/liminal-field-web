import type { ReactNode } from 'react';

export const EditorShell = ({
  children,
  sidePanel,
}: {
  children: ReactNode;
  sidePanel: ReactNode;
}) => (
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
    <div className="space-y-4">{children}</div>
    <aside className="space-y-4 rounded border border-slate-200 bg-slate-50 p-4">{sidePanel}</aside>
  </div>
);
