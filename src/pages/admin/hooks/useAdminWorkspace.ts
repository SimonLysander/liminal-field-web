import { useCallback, useEffect, useMemo, useState } from 'react';
import { contentItemsApi } from '@/services/content-items';
import type {
  CreateStructureNodeDto,
  UpdateStructureNodeDto,
} from '@/services/structure';
import { structureApi } from '@/services/structure';
import {
  countNodes,
  insertChildInTree,
  parseError,
  removeNodeFromTree,
  toEditorState,
  updateNodeInTree,
} from '../helpers';
import {
  EMPTY_EDITOR_STATE,
  type EditorState,
  type ModalState,
  type NodeSubmitPayload,
  type TreeNode,
} from '../types';

export function useAdminWorkspace() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(EMPTY_EDITOR_STATE);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [draftInfo, setDraftInfo] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState('');
  const [autosaveError, setAutosaveError] = useState('');
  const [assets, setAssets] = useState<Awaited<ReturnType<typeof contentItemsApi.listAssets>>>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const totalNodes = useMemo(() => countNodes(tree), [tree]);
  const isDocSelected = selectedNode?.type === 'DOC' && !!selectedNode.contentItemId;

  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const roots = await structureApi.getRootNodes({ visibility: 'all' });
      setTree(roots.map((node) => ({ ...node, children: undefined, isExpanded: false })));
    } catch (loadError) {
      setError(parseError(loadError, 'Failed to load navigation tree.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoots();
  }, [loadRoots]);

  const loadContentWorkspace = useCallback(async (contentItemId: string) => {
    setContentLoading(true);
    setContentError('');
    setDraftInfo('');
    setActionMessage('');
    setAssetsLoading(true);

    try {
      const [detail, assetsResult] = await Promise.all([
        contentItemsApi.getById(contentItemId, { visibility: 'all' }),
        contentItemsApi.listAssets(contentItemId),
      ]);

      setEditorState(toEditorState(detail));
      setAssets(assetsResult);
      setIsDirty(false);
      setLastDraftSavedAt('');
      setAutosaveError('');

      try {
        const draft = await contentItemsApi.getDraft(contentItemId);
        // Restore the server draft first so the workspace resumes the latest
        // in-progress edits instead of silently overwriting them with the
        // published document body.
        setEditorState({
          title: draft.title,
          summary: draft.summary,
          status: detail.status,
          bodyMarkdown: draft.bodyMarkdown,
          changeNote: draft.changeNote,
          changeType: 'patch',
        });
        setDraftInfo(`Restored draft from ${new Date(draft.savedAt).toLocaleString('zh-CN')}.`);
        setLastDraftSavedAt(draft.savedAt);
      } catch (draftError) {
        const message = parseError(draftError, 'Failed to load draft.');
        if (!message.includes('404')) {
          setDraftInfo(`Draft load failed: ${message}`);
        }
      }
    } catch (workspaceError) {
      setContentError(parseError(workspaceError, 'Failed to load content workspace.'));
      setEditorState(EMPTY_EDITOR_STATE);
      setAssets([]);
      setIsDirty(false);
      setLastDraftSavedAt('');
    } finally {
      setContentLoading(false);
      setAssetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDocSelected || !selectedNode?.contentItemId) {
      setEditorState(EMPTY_EDITOR_STATE);
      setContentError('');
      setDraftInfo('');
      setActionMessage('');
      setAssets([]);
      setIsDirty(false);
      setIsAutosaving(false);
      setLastDraftSavedAt('');
      setAutosaveError('');
      return;
    }

    void loadContentWorkspace(selectedNode.contentItemId);
  }, [isDocSelected, loadContentWorkspace, selectedNode]);

  const handleExpand = useCallback(async (node: TreeNode) => {
    if (node.isExpanded) {
      setTree((current) =>
        updateNodeInTree(current, node.id, (target) => ({ ...target, isExpanded: false })),
      );
      return;
    }

    setTree((current) =>
      updateNodeInTree(current, node.id, (target) => ({ ...target, isLoading: true })),
    );

    try {
      const children = await structureApi.getChildren(node.id, {
        visibility: 'all',
      });
      setTree((current) =>
        updateNodeInTree(current, node.id, (target) => ({
          ...target,
          isLoading: false,
          isExpanded: true,
          children: children.map((child) => ({ ...child, isExpanded: false })),
        })),
      );
    } catch {
      setTree((current) =>
        updateNodeInTree(current, node.id, (target) => ({ ...target, isLoading: false })),
      );
    }
  }, []);

  const openCreate = (parentId?: string) => setModal({ open: true, mode: 'create', parentId });
  const openEdit = (node: TreeNode) => setModal({ open: true, mode: 'edit', node });
  const closeModal = () => setModal({ open: false, mode: 'create' });

  const handleCreateOrEdit = async (payload: NodeSubmitPayload) => {
    if (modal.mode === 'edit' && modal.node) {
      const updated = await structureApi.updateNode(
        modal.node.id,
        payload.node as UpdateStructureNodeDto,
      );
      setTree((current) =>
        updateNodeInTree(current, updated.id, (target) => ({ ...target, ...updated })),
      );
      if (selectedNode?.id === updated.id) {
        setSelectedNode((current) => (current ? { ...current, ...updated } : current));
      }
      return;
    }

    const createPayload = payload.node as CreateStructureNodeDto;
    let contentItemId = createPayload.contentItemId;

    if (createPayload.type === 'DOC') {
      const docCreate = payload.docCreate;
      if (!docCreate) {
        throw new Error('DOC nodes must be created with a content item.');
      }

      // Create the content item before the DOC node so every document node is
      // born with a valid binding and can immediately support save, draft, and assets.
      const createdContent = await contentItemsApi.create({
        title: docCreate.title,
        summary: docCreate.summary,
        status: 'staged',
        bodyMarkdown: `# ${docCreate.title}\n`,
        changeNote: 'Initial content',
        changeType: 'major',
      });
      contentItemId = createdContent.id;
    }

    const created = await structureApi.createNode({
      ...createPayload,
      contentItemId,
    });
    const newNode: TreeNode = { ...created, isExpanded: false };

    if (modal.parentId) {
      setTree((current) => insertChildInTree(current, modal.parentId!, newNode));
    } else {
      setTree((current) => [...current, newNode]);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    await structureApi.deleteNode(deleteTarget.id);
    setTree((current) => removeNodeFromTree(current, deleteTarget.id));
    if (selectedNode?.id === deleteTarget.id) {
      setSelectedNode(null);
    }
    setDeleteTarget(null);
  };

  const handleEditorChange = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setEditorState((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setAutosaveError('');
  };

  const saveDraft = useCallback(async (options?: { silent?: boolean }) => {
    if (!selectedNode?.contentItemId) return;

    if (options?.silent) {
      setIsAutosaving(true);
      setAutosaveError('');
    }

    const draft = await contentItemsApi.saveDraft(selectedNode.contentItemId, {
      title: editorState.title,
      summary: editorState.summary,
      bodyMarkdown: editorState.bodyMarkdown,
      changeNote: editorState.changeNote,
    });

    setIsDirty(false);
    setLastDraftSavedAt(draft.savedAt);

    if (options?.silent) {
      setDraftInfo('');
      setIsAutosaving(false);
      return;
    }

    setDraftInfo(`Draft saved at ${new Date(draft.savedAt).toLocaleString('zh-CN')}.`);
    setActionMessage('');
    setIsAutosaving(false);
  }, [editorState.bodyMarkdown, editorState.changeNote, editorState.summary, editorState.title, selectedNode?.contentItemId]);

  const saveContent = async (options?: {
    statusOverride?: EditorState['status'];
    action?: 'commit' | 'publish' | 'unpublish';
  }) => {
    if (!selectedNode?.contentItemId) return;

    const nextStatus = options?.statusOverride ?? editorState.status;
    const saved = await contentItemsApi.save(selectedNode.contentItemId, {
      title: editorState.title,
      summary: editorState.summary,
      status: nextStatus,
      bodyMarkdown: editorState.bodyMarkdown,
      changeNote: editorState.changeNote,
      changeType: editorState.changeType,
      action: options?.action,
    });

    setEditorState((current) => ({
      ...current,
      title: saved.title,
      summary: saved.summary,
      status: saved.status,
      bodyMarkdown: saved.bodyMarkdown,
    }));
    setActionMessage(
      `${
        saved.status === 'published'
          ? 'Content published'
          : saved.status === 'staged'
            ? 'Content committed'
            : 'Content saved'
      } at ${new Date(saved.updatedAt).toLocaleString('zh-CN')}.`,
    );
    setDraftInfo('');
    setIsDirty(false);
    setAutosaveError('');
  };

  const publishContent = async () => {
    // Publishing is a product action, not just "save whatever the current dropdown says".
    // Force the outgoing status so the primary button behaves exactly as the label promises.
    await saveContent({ statusOverride: 'published', action: 'publish' });
  };

  const commitContent = async () => {
    // Commit moves the current editor work into the formal pre-publish state
    // and is the only action that should create a Git history entry.
    await saveContent({ statusOverride: 'staged', action: 'commit' });
  };

  const unpublishContent = async () => {
    // Unpublish always returns the formal content back to staged instead of the
    // editor draft buffer, so published content and autosave remain separate concepts.
    await saveContent({ statusOverride: 'staged', action: 'unpublish' });
  };

  const uploadAsset = async (file: File) => {
    if (!selectedNode?.contentItemId) return;

    setAssetsLoading(true);
    try {
      await contentItemsApi.uploadAsset(selectedNode.contentItemId, file);
      const nextAssets = await contentItemsApi.listAssets(selectedNode.contentItemId);
      setAssets(nextAssets);
      setActionMessage(`Uploaded asset: ${file.name}.`);
    } finally {
      setAssetsLoading(false);
    }
  };

  const insertAssetPath = (path: string) => {
    setEditorState((current) => ({
      ...current,
      bodyMarkdown: `${current.bodyMarkdown}${current.bodyMarkdown.endsWith('\n') || !current.bodyMarkdown ? '' : '\n'}![](${path})\n`,
    }));
    setIsDirty(true);
    setAutosaveError('');
  };

  useEffect(() => {
    if (!selectedNode?.contentItemId || !isDirty || contentLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      // Autosave stays in the workspace layer instead of the input component so the future editor
      // can be replaced without rewriting save cadence, dirty tracking, or backend draft semantics.
      void saveDraft({ silent: true }).catch((autosaveFailure) => {
        setIsAutosaving(false);
        setAutosaveError(parseError(autosaveFailure, 'Autosave failed.'));
      });
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [contentLoading, isDirty, saveDraft, selectedNode?.contentItemId]);

  return {
    tree,
    selectedNode,
    loading,
    error,
    modal,
    deleteTarget,
    editorState,
    contentLoading,
    contentError,
    draftInfo,
    isDirty,
    isAutosaving,
    lastDraftSavedAt,
    autosaveError,
    assets,
    assetsLoading,
    actionMessage,
    totalNodes,
    loadRoots,
    setSelectedNode,
    handleExpand,
    openCreate,
    openEdit,
    closeModal,
    setDeleteTarget,
    handleCreateOrEdit,
    handleDelete,
    handleEditorChange,
    loadContentWorkspace,
    saveDraft,
    commitContent,
    publishContent,
    unpublishContent,
    uploadAsset,
    insertAssetPath,
  };
}
