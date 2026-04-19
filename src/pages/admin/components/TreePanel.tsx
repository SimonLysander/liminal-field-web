import type { TreeNode } from '../types';

const TypeBadge = ({ type }: { type: TreeNode['type'] }) => (
  <span className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
    {type === 'FOLDER' ? 'Folder' : 'Doc'}
  </span>
);

const TreeNodeItem = ({
  node,
  depth,
  selectedNodeId,
  onSelect,
  onExpand,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  selectedNodeId: string | null;
  onSelect: (node: TreeNode) => void;
  onExpand: (node: TreeNode) => void;
  onAddChild: (parentId?: string) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}) => {
  const isFolder = node.type === 'FOLDER';
  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      <div
        className={`group flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5 transition-colors ${
          isSelected ? 'border-slate-300 bg-slate-100' : 'border-transparent hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${depth * 18 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          type="button"
          className={`flex h-5 w-5 items-center justify-center text-slate-400 transition-transform ${
            isFolder ? 'visible' : 'invisible'
          } ${node.isExpanded ? 'rotate-90' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            if (isFolder) onExpand(node);
          }}
        >
          {node.isLoading ? (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                className="opacity-25"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M8 5l8 7-8 7" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{node.name}</span>
        <TypeBadge type={node.type} />

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isFolder && (
            <button
              type="button"
              className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              title="Add child node"
              onClick={(event) => {
                event.stopPropagation();
                onAddChild(node.id);
              }}
            >
              +
            </button>
          )}
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            title="Edit node"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(node);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            title="Delete node"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node);
            }}
          >
            Del
          </button>
        </div>
      </div>

      {node.isExpanded && node.children && (
        <div>
          {node.children.length === 0 ? (
            <p className="py-1 text-xs text-slate-400" style={{ paddingLeft: `${(depth + 1) * 18 + 8}px` }}>
              No child nodes
            </p>
          ) : (
            node.children.map((child) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedNodeId={selectedNodeId}
                onSelect={onSelect}
                onExpand={onExpand}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const TreePanel = ({
  tree,
  loading,
  error,
  selectedNodeId,
  onReload,
  onSelect,
  onExpand,
  onAddChild,
  onEdit,
  onDelete,
}: {
  tree: TreeNode[];
  loading: boolean;
  error: string;
  selectedNodeId: string | null;
  onReload: () => Promise<void>;
  onSelect: (node: TreeNode) => void;
  onExpand: (node: TreeNode) => void;
  onAddChild: (parentId?: string) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}) => (
  <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
    <div className="border-b border-slate-200 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Navigation Tree</p>
    </div>
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {loading && tree.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading navigation...</div>
      ) : error ? (
        <div className="space-y-3 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void onReload()}
            className="rounded border border-red-300 px-3 py-2 text-sm text-red-700"
          >
            Retry
          </button>
        </div>
      ) : tree.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-400">No nodes yet.</div>
      ) : (
        tree.map((node) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            depth={0}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
            onExpand={onExpand}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  </aside>
);
