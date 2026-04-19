import { useState } from 'react';
import type { StructureNodeType } from '@/services/structure';
import { parseError } from '../helpers';
import { EMPTY_DOC_CREATE_STATE, type ModalState, type NodeSubmitPayload } from '../types';

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
      setError('Node name is required.');
      return;
    }

    if (needsDocFields && !docCreate.title.trim()) {
      setError('Content title is required.');
      return;
    }

    if (needsDocFields && !docCreate.summary.trim()) {
      setError('Content summary is required.');
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
      setError(parseError(submitError, 'Submit failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-lg rounded border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isCreate ? 'Create node' : 'Edit node'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Node name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Example: World Building"
            />
          </div>

          {isCreate && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Node type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['FOLDER', 'DOC'] as StructureNodeType[]).map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => setType(candidate)}
                    className={`rounded border px-3 py-2 text-sm ${
                      type === candidate
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsDocFields && (
            <div className="space-y-4 rounded border border-slate-200 bg-slate-50 p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Content title</label>
                <input
                  type="text"
                  value={docCreate.title}
                  onChange={(event) =>
                    setDocCreate((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Used when creating the content item"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Content summary</label>
                <textarea
                  value={docCreate.summary}
                  onChange={(event) =>
                    setDocCreate((current) => ({ ...current, summary: event.target.value }))
                  }
                  className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="DOC nodes must be created with a content item."
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : isCreate ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
