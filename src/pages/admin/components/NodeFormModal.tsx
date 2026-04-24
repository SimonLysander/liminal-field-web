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
    <div className="admin-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="admin-modal-card">
        <div className="panel-label">{isCreate ? 'Create Node' : 'Edit Node'}</div>
        <h2 className="page-title">{isCreate ? 'Archive a new structure node' : 'Update node metadata'}</h2>

        <form onSubmit={handleSubmit} className="admin-form-stack">
          <label className="admin-field">
            <span className="admin-meta-label">Node name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="admin-input"
              placeholder="Example: World Building"
            />
          </label>

          {isCreate ? (
            <div className="admin-field">
              <span className="admin-meta-label">Node type</span>
              <div className="admin-toggle-row">
                {(['FOLDER', 'DOC'] as StructureNodeType[]).map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => setType(candidate)}
                    className={`admin-toggle${type === candidate ? ' active' : ''}`}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {needsDocFields ? (
            <div className="admin-detail-card">
              <div className="panel-label">Initial Content</div>
              <div className="admin-form-stack compact">
                <label className="admin-field">
                  <span className="admin-meta-label">Content title</span>
                  <input
                    type="text"
                    value={docCreate.title}
                    onChange={(event) => setDocCreate((current) => ({ ...current, title: event.target.value }))}
                    className="admin-input"
                    placeholder="Used for the initial formal version"
                  />
                </label>
                <label className="admin-field">
                  <span className="admin-meta-label">Content summary</span>
                  <textarea
                    value={docCreate.summary}
                    onChange={(event) => setDocCreate((current) => ({ ...current, summary: event.target.value }))}
                    className="admin-textarea"
                    placeholder="DOC nodes are created with a bound content item."
                  />
                </label>
              </div>
            </div>
          ) : null}

          {error ? <p className="admin-error-copy">{error}</p> : null}

          <div className="admin-action-row is-end">
            <button type="button" className="admin-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="admin-button admin-button-primary">
              {submitting ? 'Submitting...' : isCreate ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
