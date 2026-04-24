import { ConfirmDialog } from './components/ConfirmDialog';
import { ContentVersionView } from './components/ContentVersionView';
import { DraftWorkspace } from './components/DraftWorkspace';
import { FolderDetailPanel } from './components/FolderDetailPanel';
import { NodeFormModal } from './components/NodeFormModal';
import { TreePanel } from './components/TreePanel';
import { useAdminWorkspace } from './hooks/useAdminWorkspace';

const AdminPage = () => {
  const workspace = useAdminWorkspace();

  return (
    <div className="admin-view">
      <TreePanel
        tree={workspace.tree}
        loading={workspace.loading}
        error={workspace.error}
        selectedNodeId={workspace.selectedNode?.id ?? null}
        onReload={workspace.loadRoots}
        onSelect={workspace.setSelectedNode}
        onExpand={workspace.handleExpand}
        onAddChild={workspace.openCreate}
        onEdit={workspace.openEdit}
        onDelete={workspace.setDeleteTarget}
      />

      <section className="admin-center admin-panel">
        <div className="admin-surface admin-paper admin-stack-gap">
          <div className="admin-header-strip">
            <div>
              <div className="panel-label">Admin Workspace</div>
              <h1 className="page-title">Knowledge-Base Control Room</h1>
              <p className="admin-copy">
                Structure, formal versions, draft workspaces, and assets all stay in one archive-like room.
              </p>
            </div>

            <div className="admin-header-actions">
              <button type="button" className="admin-button" onClick={() => void workspace.loadRoots()}>
                Reload Tree
              </button>
              <button type="button" className="admin-button admin-button-primary" onClick={() => workspace.openCreate()}>
                New Root
              </button>
            </div>
          </div>

          {!workspace.selectedNode ? (
            <div className="admin-empty-state">
              <div className="admin-empty-title">No node selected</div>
              <p className="admin-copy">
                Pick a folder or doc from the left archive rail. The center sheet only renders one formal object at a time.
              </p>
            </div>
          ) : workspace.selectedNode.type === 'FOLDER' ? (
            <FolderDetailPanel node={workspace.selectedNode} />
          ) : workspace.selectedNode.contentItemId ? (
            workspace.workspaceMode === 'draft' ? (
              <DraftWorkspace
                node={workspace.selectedNode}
                formalStatus={workspace.formalContent.status}
                draftState={workspace.draftState}
                draftPresence={workspace.draftPresence}
                loading={workspace.contentLoading}
                error={workspace.contentError}
                draftInfo={workspace.draftInfo}
                isDirty={workspace.isDirty}
                isAutosaving={workspace.isAutosaving}
                lastDraftSavedAt={workspace.lastDraftSavedAt}
                autosaveError={workspace.autosaveError}
                assets={workspace.assets}
                assetsLoading={workspace.assetsLoading}
                actionMessage={workspace.actionMessage}
                onReloadDraft={workspace.resumeDraft}
                onBackToContent={() => workspace.setWorkspaceMode('formal')}
                onEditorChange={workspace.handleDraftEditorChange}
                onSaveDraft={workspace.saveDraft}
                onCommitDraft={workspace.commitDraft}
                onDiscardDraft={workspace.discardDraft}
                onUploadAsset={workspace.uploadAsset}
                onInsertAsset={workspace.insertAssetPath}
              />
            ) : (
              <ContentVersionView
                node={workspace.selectedNode}
                content={workspace.formalContent}
                loading={workspace.contentLoading}
                error={workspace.contentError}
                history={workspace.history}
                historyLoading={workspace.historyLoading}
                assets={workspace.assets}
                assetsLoading={workspace.assetsLoading}
                draftPresence={workspace.draftPresence}
                actionMessage={workspace.actionMessage}
                onReload={() => workspace.loadFormalContent(workspace.selectedNode!.contentItemId!)}
                onPublish={workspace.publishContent}
                onUnpublish={workspace.unpublishContent}
                onCreateDraft={() => workspace.createDraftFromFormalVersion(false)}
                onResumeDraft={workspace.resumeDraft}
                onOverwriteDraft={() => workspace.createDraftFromFormalVersion(true)}
              />
            )
          ) : (
            <div className="admin-empty-state">
              <div className="admin-empty-title">Broken DOC binding</div>
              <p className="admin-copy">
                This DOC node has no content item binding. Recreate it through the current flow instead of patching the broken reference.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="admin-right admin-panel">
        <div className="admin-surface admin-side-stack">
          <div>
            <div className="panel-label">System Status</div>
            <div className="admin-note-card">
              <div className="admin-note-line">
                <span>Total nodes</span>
                <strong>{workspace.totalNodes}</strong>
              </div>
              <div className="admin-note-line">
                <span>Selection</span>
                <strong>{workspace.selectedNode?.name ?? '--'}</strong>
              </div>
              <div className="admin-note-line">
                <span>Mode</span>
                <strong>{workspace.workspaceMode}</strong>
              </div>
            </div>
          </div>

          <div>
            <div className="panel-label">Operator Notes</div>
            <div className="admin-note-card admin-copy">
              Formal pages are read-only. Draft workspaces hold editing, autosave, and commit. Publish only flips the public pointer.
            </div>
          </div>
        </div>
      </aside>

      {workspace.modal.open && (
        <NodeFormModal
          modal={workspace.modal}
          onClose={workspace.closeModal}
          onSubmit={workspace.handleCreateOrEdit}
        />
      )}

      {workspace.deleteTarget && (
        <ConfirmDialog
          node={workspace.deleteTarget}
          onConfirm={workspace.handleDelete}
          onCancel={() => workspace.setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default AdminPage;
