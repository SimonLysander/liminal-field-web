import type { ContentStatus } from '@/services/content-items';
import { EditorShell } from './EditorShell';
import type { ContentVersionViewProps } from '../types';

function getReadableHistoryTitle(message: string, action: string) {
  const [, note] = message.split(' | ');
  if (note?.trim()) {
    return note.trim();
  }

  if (action === 'commit') {
    return 'Formal version commit';
  }

  return 'Formal version update';
}

const StatusBadge = ({ status }: { status: ContentStatus }) => {
  const styles =
    status === 'published'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${styles}`}
    >
      {status}
    </span>
  );
};

export const ContentVersionView = ({
  node,
  content,
  loading,
  error,
  history,
  historyLoading,
  assets,
  assetsLoading,
  draftPresence,
  actionMessage,
  onReload,
  onPublish,
  onUnpublish,
  onCreateDraft,
  onResumeDraft,
  onOverwriteDraft,
}: ContentVersionViewProps) => {
  const latestVersion = content.latestVersion;
  const publishedVersion = content.publishedVersion;

  const handlePublish = async () => {
    const confirmed = window.confirm(
      content.status === 'published' && content.hasUnpublishedChanges
        ? 'Publish the latest committed version now? It will replace the current public version.'
        : 'Publish this committed version now? It will become visible on public pages.',
    );
    if (!confirmed) return;
    await onPublish();
  };

  const handleUnpublish = async () => {
    const confirmed = window.confirm(
      'Unpublish this document now? It will be removed from public pages.',
    );
    if (!confirmed) return;
    await onUnpublish();
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{node.name}</h2>
            <StatusBadge status={content.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Formal content view. Select draft actions on the right to start editing.
          </p>
          {content.status === 'published' && content.hasUnpublishedChanges && (
            <p className="mt-1 text-xs text-amber-600">
              A newer committed version exists. The public page is still serving
              commit {publishedVersion?.commitHash.slice(0, 8) ?? '--'}.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onReload()}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Reload
          </button>
          {content.status === 'published' && content.hasUnpublishedChanges && (
            <button
              type="button"
              onClick={() => void handlePublish()}
              className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Publish Latest
            </button>
          )}
          {content.status === 'published' ? (
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
          {actionMessage && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {actionMessage}
            </div>
          )}

          <EditorShell
            sidePanel={
              <>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Draft Workspace</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Editing happens in a separate draft workspace. The formal content view stays
                    read-only.
                  </p>
                </div>

                {draftPresence.exists ? (
                  <div className="space-y-2 rounded border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-900">
                      Existing draft found
                    </p>
                    <p className="text-xs text-amber-700">
                      Last saved:{' '}
                      {draftPresence.savedAt
                        ? new Date(draftPresence.savedAt).toLocaleString('zh-CN')
                        : '--'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void onResumeDraft()}
                      className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      Resume Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => void onOverwriteDraft()}
                      className="w-full rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                    >
                      Overwrite Draft
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void onCreateDraft()}
                    className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    Create Draft
                  </button>
                )}

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-900">Assets</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Assets referenced by the current formal version.
                  </p>
                </div>

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
                    ))
                  )}
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-slate-900">History</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Read-only formal version history from the knowledge-base repo.
                  </p>
                </div>

                <div className="space-y-2">
                  {historyLoading ? (
                    <p className="text-sm text-slate-400">Loading history...</p>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No formal versions yet. Create or commit content first.
                    </p>
                  ) : (
                    history.map((entry) => (
                      <div
                        key={entry.commitHash}
                        className="rounded border border-slate-200 bg-white p-3"
                      >
                        <p className="truncate text-sm font-medium text-slate-800">
                          {getReadableHistoryTitle(entry.message, entry.action)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                          {entry.action}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {entry.commitHash.slice(0, 8)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(entry.committedAt).toLocaleString('zh-CN')}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {entry.authorName} · {entry.authorEmail}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Title</p>
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {latestVersion.title || '--'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Status</p>
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {content.status}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Latest Commit</p>
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                  {latestVersion.commitHash.slice(0, 8) || '--'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Published Commit</p>
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                  {publishedVersion?.commitHash.slice(0, 8) ?? '--'}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Latest Version Title</p>
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {latestVersion.title || '--'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Published Version Title</p>
                <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {publishedVersion?.title || '--'}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">Latest Version Summary</p>
              <div className="mt-1 min-h-24 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
                {latestVersion.summary || '--'}
              </div>
            </div>

            {publishedVersion && (
              <div>
                <p className="text-sm font-medium text-slate-700">Published Version Summary</p>
                <div className="mt-1 min-h-24 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
                  {publishedVersion.summary || '--'}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">Markdown Body</p>
                <span className="text-xs text-slate-400">
                  Updated {new Date(content.updatedAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <pre className="min-h-[520px] whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-sm leading-6 text-slate-700">
                {content.bodyMarkdown || '--'}
              </pre>
            </div>
          </EditorShell>
        </>
      )}
    </div>
  );
};
