import { formatDate } from '../helpers';
import type { TreeNode } from '../types';

export const FolderDetailPanel = ({ node }: { node: TreeNode | null }) => {
  if (!node) {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-title">No folder selected</div>
        <p className="admin-copy">Pick a folder node to inspect its archival metadata.</p>
      </div>
    );
  }

  return (
    <div className="admin-stack-gap">
      <div className="admin-section-heading">
        <div className="panel-label">Folder Node</div>
        <h2 className="page-title">{node.name}</h2>
        <p className="admin-copy">
          Folder nodes only shape the tree. They never hold markdown bodies or formal versions.
        </p>
      </div>

      <div className="admin-meta-grid">
        <div className="admin-meta-card">
          <div className="admin-meta-label">Node ID</div>
          <div className="admin-mono">{node.id}</div>
        </div>
        <div className="admin-meta-card">
          <div className="admin-meta-label">Updated At</div>
          <div>{formatDate(node.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
};
