import { useEffect, useRef } from 'react';
import type { ContentChangeType, ContentStatus } from '@/services/content-items';
import { EditorShell } from './EditorShell';
import { MarkdownEditorInput } from './MarkdownEditorInput';
import type { DocEditorPanelProps } from '../types';

const TypeBadge = ({ type }: { type: 'FOLDER' | 'DOC' }) => (
  <span className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">
    {type === 'FOLDER' ? 'Folder' : 'Doc'}
  </span>
);

const StatusBadge = ({ status }: { status: ContentStatus }) => {
  const styles =
    status === 'published'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'archived'
        ? 'border-slate-300 bg-slate-100 text-slate-600'
        : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${styles}`}>
      {status}
    </span>
  );
};

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

function insertBlock(value: string, selectionStart: number, selectionEnd: number, block: string) {
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

export const DocEditorPanel = ({
  node,
  editorState,
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
  onEditorChange,
  onReload,
  onSaveDraft,
  onCommitContent,
  onPublishContent,
  onUnpublishContent,
  onUploadAsset,
  onInsertAsset,
}: DocEditorPanelProps) => {
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

      void onCommitContent();
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onCommitContent, onSaveDraft]);

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

  const handlePublish = async () => {
    const confirmed = window.confirm(
      'Publish this document now? It will become visible on public pages.',
    );
    if (!confirmed) return;

    await onPublishContent();
  };

  const handleUnpublish = async () => {
    const confirmed = window.confirm(
      'Move this document back to staged? It will be removed from public pages.',
    );
    if (!confirmed) return;

    await onUnpublishContent();
  };

  const applyInlineInsertion = (before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const result = insertAroundSelection(
      editorState.bodyMarkdown,
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
      editorState.bodyMarkdown,
      textarea.selectionStart,
      textarea.selectionEnd,
      block,
    );

    onEditorChange('bodyMarkdown', result.nextValue);
    focusTextarea(result.nextSelectionStart, result.nextSelectionEnd);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{node.name}</h2>
            <TypeBadge type={node.type} />
            <StatusBadge status={editorState.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            content id: {node.contentItemId ?? '--'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            `Save Draft` stores temporary editor work. `Commit` writes a formal
            <span className="font-medium text-slate-600"> staged</span> version.
            `Publish` makes it public. `Unpublish` moves it back to
            <span className="font-medium text-slate-600"> staged</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onReload()}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Reload
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
            onClick={() => void onCommitContent()}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Commit
          </button>
          {editorState.status === 'published' ? (
            <button
              type="button"
              onClick={() => void handleUnpublish()}
              className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handlePublish()}
              className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Loading content...
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
                      ? 'Unsaved changes'
                      : 'Draft synced'}
                </span>
                {lastDraftSavedAt && (
                  <span>
                    Last draft:{' '}
                    {new Date(lastDraftSavedAt).toLocaleString('zh-CN')}
                  </span>
                )}
                <span>Shortcut: Ctrl/Cmd + S commit, Ctrl/Cmd + Shift + S save draft</span>
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
                  <h3 className="text-sm font-semibold text-slate-900">Assets</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Uploaded files return a stable path under ./assets/.
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
                              {asset.type} 路 {asset.size} bytes
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
                  value={editorState.title}
                  onChange={(event) => onEditorChange('title', event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Lifecycle
                </label>
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {editorState.status}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  `staged` means committed but not public yet. `published` is visible
                  to public pages. `archived` is retained but taken offline.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Summary
              </label>
              <textarea
                value={editorState.summary}
                onChange={(event) => onEditorChange('summary', event.target.value)}
                className="min-h-28 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Change Note
                </label>
                <input
                  type="text"
                  value={editorState.changeNote}
                  onChange={(event) => onEditorChange('changeNote', event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Change Type
                </label>
                <select
                  value={editorState.changeType}
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
                  {editorState.bodyMarkdown.length} chars
                </span>
              </div>
              <MarkdownEditorInput
                ref={textareaRef}
                value={editorState.bodyMarkdown}
                onChange={(value) => onEditorChange('bodyMarkdown', value)}
              />
            </div>
          </EditorShell>
        </>
      )}
    </div>
  );
};
