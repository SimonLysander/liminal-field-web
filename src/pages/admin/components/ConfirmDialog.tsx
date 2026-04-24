import { useState } from 'react';
import { parseError } from '../helpers';
import type { TreeNode } from '../types';

export const ConfirmDialog = ({
  node,
  onConfirm,
  onCancel,
}: {
  node: TreeNode;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (confirmError) {
      setError(parseError(confirmError, 'Delete failed.'));
      setLoading(false);
    }
  };

  return (
    <div className="admin-overlay" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="admin-modal-card compact">
        <div className="panel-label">Delete Node</div>
        <h3 className="page-title">Remove ¡°{node.name}¡±?</h3>
        <p className="admin-copy">
          The backend will reject this operation if the node still has children. This dialog only confirms intent.
        </p>
        {error ? <p className="admin-error-copy">{error}</p> : null}
        <div className="admin-action-row is-end">
          <button type="button" className="admin-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="admin-button admin-button-danger" onClick={() => void handleConfirm()} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
