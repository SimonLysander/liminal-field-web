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
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{node.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Draft workspace based on the current {formalStatus} formal version.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onBackToContent()}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Back to Content
          </button>
          <button
            type="button"
            onClick={() => void onReloadDraft()}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Reload Draft
          </button>
          <button
            type="button"
            onClick={() => void onSaveDraft()}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => void onCommitDraft()}
            className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            Commit
          </button>
          <button
            type="button"
            onClick={() => void handleDiscardDraft()}
            className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            Discard Draft
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Loading draft workspace...
        </div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          {draftInfo && (
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {draftInfo}
            </div>
          )}
          {(isDirty || isAutosaving || lastDraftSavedAt || autosaveError) && (
            <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  {isAutosaving
                    ? 'Autosaving...'
                    : isDirty
                      ? 'Unsaved draft changes'
                      : 'Draft synced'}
                </span>
                {lastDraftSavedAt && (
                  <span>
                    Last draft:{' '}
                    {new Date(lastDraftSavedAt).toLocaleString('zh-CN')}
                  </span>
                )}
                <span>
                  Shortcut: Ctrl/Cmd + S commit, Ctrl/Cmd + Shift + S save draft
                </span>
              </div>
              {autosaveError && <p className="mt-2 text-red-600">{autosaveError}</p>}
            </div>
          )}
          {actionMessage && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {actionMessage}
            </div>
          )}

          <EditorShell
            sidePanel={
              <>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Draft Status</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {draftPresence.exists
                      ? 'An editor draft already exists for this content item.'
                      : 'This draft workspace has not been persisted yet.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Assets</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Draft assets are written into the same content directory and can be inserted
                    into Markdown paths under ./assets/.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600 hover:border-slate-400">
                  Select File
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => void handleAssetInput(event)}
                  />
                </label>

                <div className="space-y-2">
                  {assetsLoading ? (
                    <p className="text-sm text-slate-400">Loading assets...</p>
                  ) : assets.length === 0 ? (
                    <p className="text-sm text-slate-400">No assets yet.</p>
                  ) : (
                    assets.map((asset) => (
                      <div
                        key={asset.path}
                        className="rounded border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {asset.fileName}
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-slate-500">
                              {asset.path}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {asset.type} · {asset.size} bytes
                            </p>
                          </div>
                          <button
                            type="button"
                            className="shrink-0 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                            onClick={() => {
                              onInsertAsset(asset.path);
                              focusTextarea();
                            }}
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={draftState.title}
                  onChange={(event) => onEditorChange('title', event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Change Type
                </label>
                <select
                  value={draftState.changeType}
                  onChange={(event) =>
                    onEditorChange(
                      'changeType',
                      event.target.value as ContentChangeType,
                    )
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="patch">patch</option>
                  <option value="major">major</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Summary
              </label>
              <textarea
                value={draftState.summary}
                onChange={(event) => onEditorChange('summary', event.target.value)}
                className="min-h-28 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Change Note
              </label>
              <input
                type="text"
                value={draftState.changeNote}
                onChange={(event) => onEditorChange('changeNote', event.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyBlockInsertion('# ')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockInsertion('## ')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => applyInlineInsertion('**', '**')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => applyInlineInsertion('`', '`')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  Inline Code
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockInsertion('- ')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockInsertion('```ts\n\n```')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  Code Block
                </button>
                <button
                  type="button"
                  onClick={() => applyBlockInsertion('![](./assets/example.png)')}
                  className="rounded border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  Image
                </button>
              </div>

              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Markdown Body
                </label>
                <span className="text-xs text-slate-400">
                  {draftState.bodyMarkdown.length} chars
                </span>
              </div>
              <MarkdownEditorInput
                ref={textareaRef}
                value={draftState.bodyMarkdown}
                onChange={(value) => onEditorChange('bodyMarkdown', value)}
              />
            </div>
          </EditorShell>
        </>
      )}
    </div>
  );
};
