import { useState } from 'react';
import { motion } from 'motion/react';
import { smoothBounce } from '@/lib/motion';
import type { StructureNodeType } from '@/services/structure';
import { parseError } from '../helpers';
import { EMPTY_DOC_CREATE_STATE, type ModalState, type NodeSubmitPayload } from '../types';

/**
 * Modal dialog for creating or editing tree nodes.
 *
 * Uses a backdrop-blur overlay and a spring-animated card to match the
 * Apple-style treatment used elsewhere in the admin workspace.
 *
 * Radius: modal container uses radius-xl (12px, modal/overlay tier).
 * Inputs use rounded-lg (Tailwind, maps to radius-lg = 10px via @theme).
 * All font sizes use type scale variables (--text-2xs, --text-sm, --text-lg).
 */
export const NodeFormModal = ({
  modal,
  onClose,
  onSubmit,
}: {
  modal: ModalState;
  onClose: () => void;
  onSubmit: (payload: NodeSubmitPayload) => Promise<void>;
}) => {
  const [name, setName] = useState(modal.node?.name ?? '');
  const [type, setType] = useState<StructureNodeType>(modal.node?.type ?? 'FOLDER');
  const [docCreate, setDocCreate] = useState(EMPTY_DOC_CREATE_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCreate = modal.mode === 'create';
  const needsDocFields = isCreate && type === 'DOC';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('请输入节点名称');
      return;
    }

    if (needsDocFields && !docCreate.title.trim()) {
      setError('请输入内容标题');
      return;
    }

    if (needsDocFields && !docCreate.summary.trim()) {
      setError('请输入内容摘要');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isCreate) {
        await onSubmit({
          node: {
            name: name.trim(),
            type,
            parentId: modal.parentId,
          },
          docCreate: needsDocFields
            ? {
                title: docCreate.title.trim(),
                summary: docCreate.summary.trim(),
              }
            : undefined,
        });
      } else {
        await onSubmit({
          node: {
            name: name.trim(),
          },
        });
      }
      onClose();
    } catch (submitError) {
      setError(parseError(submitError, '提交失败'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-[420px] overflow-hidden"
        style={{
          background: 'var(--paper)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
        }}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: smoothBounce }}
      >
        <div className="px-6 pb-1 pt-5">
          <div className="font-semibold uppercase" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em' }}>
            {isCreate ? '创建节点' : '编辑节点'}
          </div>
          <h2 className="mt-1 font-semibold" style={{ color: 'var(--ink)', fontSize: 'var(--text-lg)', letterSpacing: '-0.01em' }}>
            {isCreate ? '新建结构节点' : '更新元数据'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-3">
          <FieldLabel label="节点名称">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-none px-3 py-2 outline-none"
              style={{ background: 'var(--shelf)', color: 'var(--ink)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)' }}
              placeholder="例如：世界观构建"
              autoFocus
            />
          </FieldLabel>

          {isCreate && (
            <FieldLabel label="节点类型">
              <div className="flex gap-1.5">
                {(['FOLDER', 'DOC'] as StructureNodeType[]).map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => setType(candidate)}
                    className="flex-1 rounded-lg py-2 font-medium transition-colors duration-150"
                    style={{
                      fontSize: 'var(--text-sm)',
                      background: type === candidate ? 'var(--accent)' : 'var(--shelf)',
                      color: type === candidate ? 'var(--accent-contrast)' : 'var(--ink-faded)',
                    }}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            </FieldLabel>
          )}

          {needsDocFields && (
            <div className="space-y-3 rounded-xl p-4" style={{ background: 'var(--shelf)' }}>
              <div className="font-semibold uppercase" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em' }}>
                初始内容
              </div>
              <FieldLabel label="标题">
                <input
                  type="text"
                  value={docCreate.title}
                  onChange={(e) => setDocCreate((c) => ({ ...c, title: e.target.value }))}
                  className="w-full rounded-lg border-none px-3 py-2 outline-none"
                  style={{ background: 'var(--paper)', color: 'var(--ink)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)' }}
                  placeholder="初始正式版本标题"
                />
              </FieldLabel>
              <FieldLabel label="摘要">
                <textarea
                  value={docCreate.summary}
                  onChange={(e) => setDocCreate((c) => ({ ...c, summary: e.target.value }))}
                  className="min-h-[60px] w-full resize-y rounded-lg border-none px-3 py-2 outline-none"
                  style={{ background: 'var(--paper)', color: 'var(--ink)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)' }}
                  placeholder="DOC 节点创建时会自动绑定内容项"
                />
              </FieldLabel>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--mark-red)', fontSize: 'var(--text-xs)' }}>{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-lg px-4 py-2 font-medium"
              style={{ background: 'var(--shelf)', color: 'var(--ink-faded)', fontSize: 'var(--text-sm)' }}
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2 font-medium transition-opacity duration-150 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)', fontSize: 'var(--text-sm)' }}
            >
              {submitting ? '提交中...' : isCreate ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)' }}>{label}</span>
      {children}
    </label>
  );
}
