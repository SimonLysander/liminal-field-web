import type { TreeNode } from '../types';

const TypeBadge = ({ type }: { type: TreeNode['type'] }) => (
  <span className="admin-pill admin-pill-muted">{type === 'FOLDER' ? 'Folder' : 'Doc'}</span>
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
        className={`admin-tree-item${isSelected ? ' active' : ''}`}
        style={{ paddingLeft: `${depth * 18 + 14}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          type="button"
          className={`admin-tree-toggle${isFolder ? '' : ' is-hidden'}${node.isExpanded ? ' expanded' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            if (isFolder) onExpand(node);
          }}
        >
          {node.isLoading ? 'бн' : '?'}
        </button>

        <div className="admin-tree-copy">
          <span className="admin-tree-name">{node.name}</span>
          <TypeBadge type={node.type} />
        </div>

        <div className="admin-tree-actions">
          {isFolder ? (
            <button
              type="button"
              className="admin-tree-action"
              onClick={(event) => {
                event.stopPropagation();
                onAddChild(node.id);
              }}
            >
              Add
            </button>
          ) : null}
          <button
            type="button"
            className="admin-tree-action"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(node);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="admin-tree-action"
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
            <p className="admin-tree-empty" style={{ paddingLeft: `${(depth + 1) * 18 + 14}px` }}>
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
  <aside className="admin-left admin-panel">
    <div className="admin-surface admin-side-stack">
      <div className="admin-side-header">
        <div>
          <div className="panel-label">Structure Tree</div>
          <p className="admin-copy">Folders organize. Docs point to formal content.</p>
        </div>
        <button type="button" className="admin-button" onClick={() => void onReload()}>
          Reload
        </button>
      </div>

      <div className="admin-tree-list">
        {loading && tree.length === 0 ? (
          <div className="admin-empty-state compact">Loading navigation...</div>
        ) : error ? (
          <div className="admin-inline-error">
            <p>{error}</p>
            <button type="button" className="admin-button" onClick={() => void onReload()}>
              Retry
            </button>
          </div>
        ) : tree.length === 0 ? (
          <div className="admin-empty-state compact">No nodes yet.</div>
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
    </div>
  </aside>
);
