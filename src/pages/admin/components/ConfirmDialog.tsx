import { useState } from 'react';
import { motion } from 'motion/react';
import { smoothBounce } from '@/lib/motion';
import { parseError } from '../helpers';
import type { TreeNode } from '../types';

/**
 * Confirm dialog for destructive actions (delete node).
 *
 * Radius: container uses radius-xl (12px, modal tier).
 * Buttons use rounded-lg. Font sizes use type scale variables.
 */
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
      setError(parseError(confirmError, '删除失败'));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        className="w-[360px]"
        style={{
          background: 'var(--paper)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
        }}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: smoothBounce }}
      >
        <div className="px-6 pb-2 pt-5">
          <div className="font-semibold uppercase" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em' }}>
            删除节点
          </div>
          <h3 className="mt-1 font-semibold" style={{ color: 'var(--ink)', fontSize: 'var(--text-lg)' }}>
            确认删除「{node.name}」？
          </h3>
          <p className="mt-2 leading-relaxed" style={{ color: 'var(--ink-faded)', fontSize: 'var(--text-sm)' }}>
            如果该节点仍有子节点，后端将拒绝此操作。
          </p>
        </div>

        {error && (
          <div className="px-6">
            <p style={{ color: 'var(--mark-red)', fontSize: 'var(--text-xs)' }}>{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
          <button
            type="button"
            className="rounded-lg px-4 py-2 font-medium"
            style={{ background: 'var(--shelf)', color: 'var(--ink-faded)', fontSize: 'var(--text-sm)' }}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-lg px-4 py-2 font-medium transition-opacity duration-150 disabled:opacity-50"
            style={{ background: 'var(--mark-red)', color: '#fff', fontSize: 'var(--text-sm)' }}
            onClick={() => void handleConfirm()}
            disabled={loading}
          >
            {loading ? '删除中...' : '删除'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
