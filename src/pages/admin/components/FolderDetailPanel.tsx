import { formatDate } from '../helpers';
import type { TreeNode } from '../types';

export const FolderDetailPanel = ({ node }: { node: TreeNode | null }) => {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Select a folder node to inspect it.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{node.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Folder nodes only organize the tree. They do not own markdown content.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Node ID</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-700">{node.id}</p>
        </div>
        <div className="rounded border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Updated At</p>
          <p className="mt-2 text-sm text-slate-700">{formatDate(node.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
};
