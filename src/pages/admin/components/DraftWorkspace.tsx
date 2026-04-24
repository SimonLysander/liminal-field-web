import { useEffect, useRef } from 'react';
import { EditorShell } from './EditorShell';
import { MarkdownEditorInput } from './MarkdownEditorInput';
import type { DraftWorkspaceProps } from '../types';
import type { ContentChangeType } from '@/services/content-items';

function insertAroundSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after = '',
) {
  const selected = value.slice(selectionStart, selectionEnd);
  const nextValue =
    value.slice(0, selectionStart) +
    before +
    selected +
    after +
    value.slice(selectionEnd);

  return {
    nextValue,
    nextSelectionStart: selectionStart + before.length,
    nextSelectionEnd: selectionStart + before.length + selected.length,
  };
}

function insertBlock(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  block: string,
) {
  const prefix = value.slice(0, selectionStart);
  const needsLeadingBreak = prefix.length > 0 && !prefix.endsWith('\n');
  const insertion = `${needsLeadingBreak ? '\n' : ''}${block}`;
  const nextValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);

  return {
    nextValue,
    nextSelectionStart: selectionStart + insertion.length,
    nextSelectionEnd: selectionStart + insertion.length,
  };
}

export const DraftWorkspace = ({
  node,
  formalStatus,
  draftState,
  draftPresence,
  loading,
  error,
  draftInfo,
  isDirty,
  isAutosaving,
  lastDraftSavedAt,
  autosaveError,
  assets,
  assetsLoading,
  actionMessage,
  onReloadDraft,
  onBackToContent,
  onEditorChange,
  onSaveDraft,
  onCommitDraft,
  onDiscardDraft,
  onUploadAsset,
  onInsertAsset,
}: DraftWorkspaceProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isSaveKey =
        event.key.toLowerCase() === 's' && (event.metaKey || event.ctrlKey);
      if (!isSaveKey) return;

      event.preventDefault();

      if (event.shiftKey) {
        void onSaveDraft();
        return;
      }

      void onCommitDraft();
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onCommitDraft, onSaveDraft]);

  const focusTextarea = (selectionStart?: number, selectionEnd?: number) => {
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      if (selectionStart !== undefined && selectionEnd !== undefined) {
        textarea.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  };

  const handleAssetInput = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUploadAsset(file);
    event.target.value = '';
  };

  const applyInlineInsertion = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertAroundSelection(
      draftState.bodyMarkdown,
      textarea.selectionStart,
      textarea.selectionEnd,
      before,
      after,
    );

    onEditorChange('bodyMarkdown', result.nextValue);
    focusTextarea(result.nextSelectionStart, result.nextSelectionEnd);
  };

  const applyBlockInsertion = (block: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertBlock(
      draftState.bodyMarkdown,
      textarea.selectionStart,
      textarea.selectionEnd,
      block,
    );

    onEditorChange('bodyMarkdown', result.nextValue);
    focusTextarea(result.nextSelectionStart, result.nextSelectionEnd);
  };

  const handleDiscardDraft = async () => {
    const confirmed = window.confirm(
      'Discard the current draft and return to the formal content view?',
    );
    if (!confirmed) return;
    await onDiscardDraft();
  };

  return (
    <div className="admin-stack-gap">
      <div className="admin-section-heading admin-section-row">
        <div>
          <div className="panel-label">Draft Workspace</div>
          <h2 className="page-title">{node.name}</h2>
          <p className="admin-copy">
            This draft is based on the current {formalStatus} formal version. Commit creates a new formal version; publish is separate.
          </p>
        </div>

        <div className="admin-action-row">
          <button type="button" className="admin-button" onClick={() => void onBackToContent()}>
            Back to Content
          </button>
          <button type="button" className="admin-button" onClick={() => void onReloadDraft()}>
            Reload Draft
          </button>
          <button type="button" className="admin-button" onClick={() => void onSaveDraft()}>
            Save Draft
          </button>
          <button type="button" className="admin-button admin-button-primary" onClick={() => void onCommitDraft()}>
            Commit
          </button>
          <button type="button" className="admin-button admin-button-danger" onClick={() => void handleDiscardDraft()}>
            Discard Draft
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-empty-state">Loading draft workspace...</div>
      ) : error ? (
        <div className="admin-inline-error">{error}</div>
      ) : (
        <>
          {draftInfo ? <div className="admin-inline-note">{draftInfo}</div> : null}
          {actionMessage ? <div className="admin-inline-success">{actionMessage}</div> : null}
          {(isDirty || isAutosaving || lastDraftSavedAt || autosaveError) && (
            <div className="admin-inline-note">
              <div className="admin-inline-wrap">
                <span>{isAutosaving ? 'Autosaving...' : isDirty ? 'Unsaved draft changes' : 'Draft synced'}</span>
                {lastDraftSavedAt ? <span>Last draft {new Date(lastDraftSavedAt).toLocaleString('zh-CN')}</span> : null}
                <span>Ctrl/Cmd + S commit ¡¤ Ctrl/Cmd + Shift + S save draft</span>
              </div>
              {autosaveError ? <p className="admin-error-copy">{autosaveError}</p> : null}
            </div>
          )}

          <EditorShell
            sidePanel={
              <>
                <section className="admin-side-section">
                  <div className="panel-label">Draft Status</div>
                  <div className="admin-note-card">
                    <div className="admin-note-line">
                      <span>Persisted draft</span>
                      <strong>{draftPresence.exists ? 'yes' : 'no'}</strong>
                    </div>
                    <div className="admin-note-line is-wrap">
                      <span>Saved at</span>
                      <strong>{draftPresence.savedAt ? new Date(draftPresence.savedAt).toLocaleString('zh-CN') : '--'}</strong>
                    </div>
                  </div>
                </section>

                <section className="admin-side-section">
                  <div className="panel-label">Assets</div>
                  <p className="admin-copy">
                    Draft assets write into the same content directory. Inserted paths stay under ./assets/.
                  </p>
                  <label className="admin-upload-box">
                    Select File
                    <input type="file" className="hidden" onChange={(event) => void handleAssetInput(event)} />
                  </label>
                  <div className="admin-side-list">
                    {assetsLoading ? (
                      <div className="admin-empty-state compact">Loading assets...</div>
                    ) : assets.length === 0 ? (
                      <div className="admin-empty-state compact">No assets yet.</div>
                    ) : (
                      assets.map((asset) => (
                        <div key={asset.path} className="admin-side-card">
                          <div className="admin-side-title">{asset.fileName}</div>
                          <div className="admin-side-mono">{asset.path}</div>
                          <div className="admin-side-caption">{asset.type} ¡¤ {asset.size} bytes</div>
                          <button
                            type="button"
                            className="admin-button"
                            onClick={() => {
                              onInsertAsset(asset.path);
                              focusTextarea();
                            }}
                          >
                            Insert
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            }
          >
            <div className="admin-meta-grid">
              <label className="admin-field">
                <span className="admin-meta-label">Title</span>
                <input
                  type="text"
                  value={draftState.title}
                  onChange={(event) => onEditorChange('title', event.target.value)}
                  className="admin-input"
                />
              </label>
              <label className="admin-field">
                <span className="admin-meta-label">Change Type</span>
                <select
                  value={draftState.changeType}
                  onChange={(event) => onEditorChange('changeType', event.target.value as ContentChangeType)}
                  className="admin-input"
                >
                  <option value="patch">patch</option>
                  <option value="major">major</option>
                </select>
              </label>
            </div>

            <label className="admin-field">
              <span className="admin-meta-label">Summary</span>
              <textarea
                value={draftState.summary}
                onChange={(event) => onEditorChange('summary', event.target.value)}
                className="admin-textarea"
              />
            </label>

            <label className="admin-field">
              <span className="admin-meta-label">Change Note</span>
              <input
                type="text"
                value={draftState.changeNote}
                onChange={(event) => onEditorChange('changeNote', event.target.value)}
                className="admin-input"
              />
            </label>

            <div className="admin-detail-card">
              <div className="admin-detail-header">
                <div className="admin-meta-label">Markdown Body</div>
                <div className="admin-side-caption">{draftState.bodyMarkdown.length} chars</div>
              </div>
              <div className="admin-toolbar">
                <button type="button" className="admin-tool" onClick={() => applyBlockInsertion('# ')}>
                  H1
                </button>
                <button type="button" className="admin-tool" onClick={() => applyBlockInsertion('## ')}>
                  H2
                </button>
                <button type="button" className="admin-tool" onClick={() => applyInlineInsertion('**', '**')}>
                  Bold
                </button>
                <button type="button" className="admin-tool" onClick={() => applyInlineInsertion('`', '`')}>
                  Inline Code
                </button>
                <button type="button" className="admin-tool" onClick={() => applyBlockInsertion('- ')}>
                  List
                </button>
                <button type="button" className="admin-tool" onClick={() => applyBlockInsertion('```ts\n\n```')}>
                  Code Block
                </button>
                <button type="button" className="admin-tool" onClick={() => applyBlockInsertion('![](./assets/example.png)')}>
                  Image
                </button>
              </div>
              <MarkdownEditorInput ref={textareaRef} value={draftState.bodyMarkdown} onChange={(value) => onEditorChange('bodyMarkdown', value)} />
            </div>
          </EditorShell>
        </>
      )}
    </div>
  );
};
