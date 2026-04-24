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

const StatusBadge = ({ status }: { status: ContentStatus }) => (
  <span className={`admin-pill ${status === 'published' ? 'is-published' : 'is-committed'}`}>
    {status}
  </span>
);

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
    <div className="admin-stack-gap">
      <div className="admin-section-heading admin-section-row">
        <div>
          <div className="panel-label">Formal Version View</div>
          <div className="admin-heading-line">
            <h2 className="page-title">{node.name}</h2>
            <StatusBadge status={content.status} />
          </div>
          <p className="admin-copy">
            Formal versions are read-only here. Drafts are created in a separate workspace.
          </p>
          {content.status === 'published' && content.hasUnpublishedChanges ? (
            <p className="admin-warning-copy">
              A newer committed version exists. Public pages still serve {publishedVersion?.commitHash.slice(0, 8) ?? '--'}.
            </p>
          ) : null}
        </div>

        <div className="admin-action-row">
          <button type="button" className="admin-button" onClick={() => void onReload()}>
            Reload
          </button>
          {content.status === 'published' ? (
            <>
              {content.hasUnpublishedChanges ? (
                <button type="button" className="admin-button admin-button-primary" onClick={() => void handlePublish()}>
                  Publish Latest
                </button>
              ) : null}
              <button type="button" className="admin-button admin-button-danger" onClick={() => void handleUnpublish()}>
                Unpublish
              </button>
            </>
          ) : (
            <button type="button" className="admin-button admin-button-primary" onClick={() => void handlePublish()}>
              Publish
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-empty-state">Loading content...</div>
      ) : error ? (
        <div className="admin-inline-error">{error}</div>
      ) : (
        <>
          {actionMessage ? <div className="admin-inline-success">{actionMessage}</div> : null}

          <EditorShell
            sidePanel={
              <>
                <section className="admin-side-section">
                  <div className="panel-label">Draft Workspace</div>
                  <p className="admin-copy">
                    Formal content stays locked here. Editing only begins after you create or resume a draft.
                  </p>

                  {draftPresence.exists ? (
                    <div className="admin-note-card">
                      <div className="admin-note-line">
                        <span>Existing draft</span>
                        <strong>yes</strong>
                      </div>
                      <div className="admin-note-line is-wrap">
                        <span>Last saved</span>
                        <strong>
                          {draftPresence.savedAt ? new Date(draftPresence.savedAt).toLocaleString('zh-CN') : '--'}
                        </strong>
                      </div>
                      <div className="admin-side-actions">
                        <button type="button" className="admin-button" onClick={() => void onResumeDraft()}>
                          Resume Draft
                        </button>
                        <button type="button" className="admin-button admin-button-danger" onClick={() => void onOverwriteDraft()}>
                          Overwrite Draft
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="admin-button admin-button-primary" onClick={() => void onCreateDraft()}>
                      Create Draft
                    </button>
                  )}
                </section>

                <section className="admin-side-section">
                  <div className="panel-label">Assets</div>
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
                          <div className="admin-side-caption">
                            {asset.type} ¡¤ {asset.size} bytes
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="admin-side-section">
                  <div className="panel-label">History</div>
                  <p className="admin-copy">Read-only formal version history from the knowledge-base repo.</p>
                  <div className="admin-side-list">
                    {historyLoading ? (
                      <div className="admin-empty-state compact">Loading history...</div>
                    ) : history.length === 0 ? (
                      <div className="admin-empty-state compact">No formal versions yet.</div>
                    ) : (
                      history.map((entry) => (
                        <div key={entry.commitHash} className="admin-history-card">
                          <div className="admin-side-title">{getReadableHistoryTitle(entry.message, entry.action)}</div>
                          <div className="admin-side-caption uppercase">{entry.action}</div>
                          <div className="admin-side-mono">{entry.commitHash.slice(0, 8)}</div>
                          <div className="admin-side-caption">{new Date(entry.committedAt).toLocaleString('zh-CN')}</div>
                          <div className="admin-side-caption">{entry.authorName} ¡¤ {entry.authorEmail}</div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            }
          >
            <div className="admin-meta-grid">
              <div className="admin-meta-card">
                <div className="admin-meta-label">Latest Commit</div>
                <div className="admin-mono">{latestVersion.commitHash.slice(0, 8) || '--'}</div>
              </div>
              <div className="admin-meta-card">
                <div className="admin-meta-label">Published Commit</div>
                <div className="admin-mono">{publishedVersion?.commitHash.slice(0, 8) ?? '--'}</div>
              </div>
            </div>

            <div className="admin-meta-grid">
              <div className="admin-meta-card">
                <div className="admin-meta-label">Latest Version Title</div>
                <div>{latestVersion.title || '--'}</div>
              </div>
              <div className="admin-meta-card">
                <div className="admin-meta-label">Published Version Title</div>
                <div>{publishedVersion?.title || '--'}</div>
              </div>
            </div>

            <div className="admin-detail-card">
              <div className="admin-meta-label">Latest Version Summary</div>
              <p className="admin-detail-copy">{latestVersion.summary || '--'}</p>
            </div>

            {publishedVersion ? (
              <div className="admin-detail-card">
                <div className="admin-meta-label">Published Version Summary</div>
                <p className="admin-detail-copy">{publishedVersion.summary || '--'}</p>
              </div>
            ) : null}

            <div className="admin-detail-card is-body">
              <div className="admin-detail-header">
                <div className="admin-meta-label">Markdown Body</div>
                <div className="admin-side-caption">Updated {new Date(content.updatedAt).toLocaleString('zh-CN')}</div>
              </div>
              <pre className="admin-markdown-preview">{content.bodyMarkdown || '--'}</pre>
            </div>
          </EditorShell>
        </>
      )}
    </div>
  );
};
