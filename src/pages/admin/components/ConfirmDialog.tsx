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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="mx-4 w-full max-w-sm rounded border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 px-6 py-5">
          <h3 className="text-base font-semibold text-slate-900">Delete node</h3>
          <p className="text-sm text-slate-600">
            Delete "{node.name}"? The backend will reject the request if the node still has children.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={loading}
              className="rounded border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
