import { ConfirmDialog } from './components/ConfirmDialog';
import { DocEditorPanel } from './components/DocEditorPanel';
import { FolderDetailPanel } from './components/FolderDetailPanel';
import { NodeFormModal } from './components/NodeFormModal';
import { TreePanel } from './components/TreePanel';
import { useAdminWorkspace } from './hooks/useAdminWorkspace';

const AdminPage = () => {
  const workspace = useAdminWorkspace();

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Admin Workspace</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage structure, editor drafts, staged content, published documents, and assets in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
              {workspace.totalNodes} nodes
            </span>
            <button
              type="button"
              onClick={() => void workspace.loadRoots()}
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Reload Tree
            </button>
            <button
              type="button"
              onClick={() => workspace.openCreate()}
              className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              New Root
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
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

        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="min-h-full rounded border border-slate-200 bg-white p-6">
            {!workspace.selectedNode ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Select a node from the left tree.
              </div>
            ) : workspace.selectedNode.type === 'FOLDER' ? (
              <FolderDetailPanel node={workspace.selectedNode} />
            ) : workspace.selectedNode.contentItemId ? (
              <DocEditorPanel
                node={workspace.selectedNode}
                editorState={workspace.editorState}
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
                onEditorChange={workspace.handleEditorChange}
                onReload={() => workspace.loadContentWorkspace(workspace.selectedNode!.contentItemId!)}
                onSaveDraft={workspace.saveDraft}
                onCommitContent={workspace.commitContent}
                onPublishContent={workspace.publishContent}
                onUnpublishContent={workspace.unpublishContent}
                onUploadAsset={workspace.uploadAsset}
                onInsertAsset={workspace.insertAssetPath}
              />
            ) : (
              <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This DOC node has no content binding and should be recreated through the new flow.
              </div>
            )}
          </div>
        </main>
      </div>

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
