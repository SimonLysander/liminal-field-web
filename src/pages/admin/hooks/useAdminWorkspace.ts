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
  updateNodeInTree,
} from '../helpers';
import {
  EMPTY_DRAFT_EDITOR_STATE,
  EMPTY_DRAFT_PRESENCE,
  EMPTY_FORMAL_CONTENT,
  type DraftEditorState,
  type ModalState,
  type NodeSubmitPayload,
  type TreeNode,
  type WorkspaceMode,
  toDraftEditorStateFromDetail,
  toDraftEditorStateFromDraft,
  toFormalContentState,
} from '../types';

export function useAdminWorkspace() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: 'create',
  });
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('formal');
  const [formalContent, setFormalContent] = useState(EMPTY_FORMAL_CONTENT);
  const [draftState, setDraftState] = useState(EMPTY_DRAFT_EDITOR_STATE);
  const [draftPresence, setDraftPresence] = useState(EMPTY_DRAFT_PRESENCE);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [draftInfo, setDraftInfo] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState('');
  const [autosaveError, setAutosaveError] = useState('');
  const [assets, setAssets] = useState<
    Awaited<ReturnType<typeof contentItemsApi.listAssets>>
  >([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof contentItemsApi.getHistory>>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const totalNodes = useMemo(() => countNodes(tree), [tree]);
  const isDocSelected = selectedNode?.type === 'DOC' && !!selectedNode.contentItemId;

  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const roots = await structureApi.getRootNodes({ visibility: 'all' });
      setTree(
        roots.map((node) => ({
          ...node,
          children: undefined,
          isExpanded: false,
        })),
      );
    } catch (loadError) {
      setError(parseError(loadError, 'Failed to load navigation tree.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoots();
  }, [loadRoots]);

  const probeDraftPresence = useCallback(async (contentItemId: string) => {
    try {
      const draft = await contentItemsApi.getDraft(contentItemId);
      setDraftPresence({
        exists: true,
        savedAt: draft.savedAt,
      });
      return draft;
    } catch (draftError) {
      const message = parseError(draftError, 'Failed to load draft.');
      if (!message.includes('404')) {
        throw draftError;
      }

      setDraftPresence(EMPTY_DRAFT_PRESENCE);
      return null;
    }
  }, []);

  const loadFormalContent = useCallback(
    async (contentItemId: string) => {
      setWorkspaceMode('formal');
      setContentLoading(true);
      setContentError('');
      setDraftInfo('');
      setActionMessage('');
      setAssetsLoading(true);
      setHistoryLoading(true);

      try {
        const [detail, assetsResult, historyResult, existingDraft] =
          await Promise.all([
            contentItemsApi.getById(contentItemId, { visibility: 'all' }),
            contentItemsApi.listAssets(contentItemId),
            contentItemsApi.getHistory(contentItemId),
            probeDraftPresence(contentItemId),
          ]);

        setFormalContent(toFormalContentState(detail));
        setDraftState(toDraftEditorStateFromDetail(detail));
        setAssets(assetsResult);
        setHistory(historyResult);
        setIsDirty(false);
        setLastDraftSavedAt(existingDraft?.savedAt ?? '');
        setAutosaveError('');
      } catch (workspaceError) {
        setContentError(
          parseError(workspaceError, 'Failed to load formal content.'),
        );
        setFormalContent(EMPTY_FORMAL_CONTENT);
        setDraftState(EMPTY_DRAFT_EDITOR_STATE);
        setAssets([]);
        setHistory([]);
        setDraftPresence(EMPTY_DRAFT_PRESENCE);
        setIsDirty(false);
        setLastDraftSavedAt('');
      } finally {
        setContentLoading(false);
        setAssetsLoading(false);
        setHistoryLoading(false);
      }
    },
    [probeDraftPresence],
  );

  useEffect(() => {
    if (!isDocSelected || !selectedNode?.contentItemId) {
      setWorkspaceMode('formal');
      setFormalContent(EMPTY_FORMAL_CONTENT);
      setDraftState(EMPTY_DRAFT_EDITOR_STATE);
      setDraftPresence(EMPTY_DRAFT_PRESENCE);
      setContentError('');
      setDraftInfo('');
      setActionMessage('');
      setAssets([]);
      setHistory([]);
      setIsDirty(false);
      setIsAutosaving(false);
      setLastDraftSavedAt('');
      setAutosaveError('');
      setHistoryLoading(false);
      return;
    }

    void loadFormalContent(selectedNode.contentItemId);
  }, [isDocSelected, loadFormalContent, selectedNode]);

  const handleExpand = useCallback(async (node: TreeNode) => {
    if (node.isExpanded) {
      setTree((current) =>
        updateNodeInTree(current, node.id, (target) => ({
          ...target,
          isExpanded: false,
        })),
      );
      return;
    }

    setTree((current) =>
      updateNodeInTree(current, node.id, (target) => ({
        ...target,
        isLoading: true,
      })),
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
        updateNodeInTree(current, node.id, (target) => ({
          ...target,
          isLoading: false,
        })),
      );
    }
  }, []);

  const openCreate = (parentId?: string) =>
    setModal({ open: true, mode: 'create', parentId });
  const openEdit = (node: TreeNode) =>
    setModal({ open: true, mode: 'edit', node });
  const closeModal = () => setModal({ open: false, mode: 'create' });

  const handleCreateOrEdit = async (payload: NodeSubmitPayload) => {
    if (modal.mode === 'edit' && modal.node) {
      const updated = await structureApi.updateNode(
        modal.node.id,
        payload.node as UpdateStructureNodeDto,
      );
      setTree((current) =>
        updateNodeInTree(current, updated.id, (target) => ({
          ...target,
          ...updated,
        })),
      );
      if (selectedNode?.id === updated.id) {
        setSelectedNode((current) =>
          current ? { ...current, ...updated } : current,
        );
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

      const createdContent = await contentItemsApi.create({
        title: docCreate.title,
        summary: docCreate.summary,
        status: 'committed',
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

  const handleDraftEditorChange = <K extends keyof DraftEditorState>(
    key: K,
    value: DraftEditorState[K],
  ) => {
    setDraftState((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setAutosaveError('');
  };

  const createDraftFromFormalVersion = useCallback(
    async (overwrite: boolean) => {
      if (!selectedNode?.contentItemId || !formalContent.id) return;

      if (overwrite && draftPresence.exists) {
        const confirmed = window.confirm(
          'Overwrite the existing draft with the current formal version?',
        );
        if (!confirmed) return;
      }

      const draft = await contentItemsApi.saveDraft(selectedNode.contentItemId, {
        title: formalContent.latestVersion.title,
        summary: formalContent.latestVersion.summary,
        bodyMarkdown: formalContent.bodyMarkdown,
        changeNote: overwrite
          ? 'Overwrite draft from current formal version'
          : 'Draft from current formal version',
      });

      setDraftState(toDraftEditorStateFromDraft(draft));
      setDraftPresence({
        exists: true,
        savedAt: draft.savedAt,
      });
      setLastDraftSavedAt(draft.savedAt);
      setDraftInfo(
        `Draft workspace ready from ${new Date(draft.savedAt).toLocaleString('zh-CN')}.`,
      );
      setActionMessage('');
      setAutosaveError('');
      setIsDirty(false);
      setWorkspaceMode('draft');
    },
    [
      draftPresence.exists,
      formalContent.bodyMarkdown,
      formalContent.id,
      formalContent.latestVersion.summary,
      formalContent.latestVersion.title,
      selectedNode?.contentItemId,
    ],
  );

  const resumeDraft = useCallback(async () => {
    if (!selectedNode?.contentItemId) return;

    setContentLoading(true);
    setContentError('');
    try {
      const draft = await contentItemsApi.getDraft(selectedNode.contentItemId);
      setDraftState(toDraftEditorStateFromDraft(draft));
      setDraftPresence({
        exists: true,
        savedAt: draft.savedAt,
      });
      setLastDraftSavedAt(draft.savedAt);
      setDraftInfo(
        `Resumed draft from ${new Date(draft.savedAt).toLocaleString('zh-CN')}.`,
      );
      setActionMessage('');
      setAutosaveError('');
      setIsDirty(false);
      setWorkspaceMode('draft');
    } catch (draftError) {
      setContentError(parseError(draftError, 'Failed to resume draft.'));
    } finally {
      setContentLoading(false);
    }
  }, [selectedNode?.contentItemId]);

  const saveDraft = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!selectedNode?.contentItemId) return;

      if (options?.silent) {
        setIsAutosaving(true);
        setAutosaveError('');
      }

      const draft = await contentItemsApi.saveDraft(selectedNode.contentItemId, {
        title: draftState.title,
        summary: draftState.summary,
        bodyMarkdown: draftState.bodyMarkdown,
        changeNote: draftState.changeNote,
      });

      setDraftPresence({
        exists: true,
        savedAt: draft.savedAt,
      });
      setIsDirty(false);
      setLastDraftSavedAt(draft.savedAt);

      if (options?.silent) {
        setDraftInfo('');
        setIsAutosaving(false);
        return;
      }

      setDraftInfo(
        `Draft saved at ${new Date(draft.savedAt).toLocaleString('zh-CN')}.`,
      );
      setActionMessage('');
      setIsAutosaving(false);
    },
    [
      draftState.bodyMarkdown,
      draftState.changeNote,
      draftState.summary,
      draftState.title,
      selectedNode?.contentItemId,
    ],
  );

  const commitDraft = useCallback(async () => {
    if (!selectedNode?.contentItemId) return;

    const saved = await contentItemsApi.save(selectedNode.contentItemId, {
      title: draftState.title,
      summary: draftState.summary,
      status: 'committed',
      bodyMarkdown: draftState.bodyMarkdown,
      changeNote: draftState.changeNote,
      changeType: draftState.changeType,
      action: 'commit',
    });

    await contentItemsApi.deleteDraft(selectedNode.contentItemId);

    setFormalContent(toFormalContentState(saved));
    setDraftPresence(EMPTY_DRAFT_PRESENCE);
    setDraftState(toDraftEditorStateFromDetail(saved));
    setDraftInfo('');
    setIsDirty(false);
    setLastDraftSavedAt('');
    setAutosaveError('');
    setWorkspaceMode('formal');
    setActionMessage(
      `New committed version created at ${new Date(saved.updatedAt).toLocaleString('zh-CN')}.`,
    );
    setHistory(await contentItemsApi.getHistory(selectedNode.contentItemId));
    setAssets(await contentItemsApi.listAssets(selectedNode.contentItemId));
  }, [
    draftState.bodyMarkdown,
    draftState.changeNote,
    draftState.changeType,
    draftState.summary,
    draftState.title,
    selectedNode?.contentItemId,
  ]);

  const discardDraft = useCallback(async () => {
    if (!selectedNode?.contentItemId) return;

    await contentItemsApi.deleteDraft(selectedNode.contentItemId);
    setDraftPresence(EMPTY_DRAFT_PRESENCE);
    setDraftState(toDraftEditorStateFromDetail({
      id: formalContent.id,
      title: formalContent.latestVersion.title,
      summary: formalContent.latestVersion.summary,
      status: formalContent.status,
      latestVersion: formalContent.latestVersion,
      publishedVersion: formalContent.publishedVersion,
      hasUnpublishedChanges: formalContent.hasUnpublishedChanges,
      bodyMarkdown: formalContent.bodyMarkdown,
      plainText: '',
      assetRefs: [],
      changeLogs: [],
      createdAt: '',
      updatedAt: formalContent.updatedAt,
    }));
    setDraftInfo('');
    setLastDraftSavedAt('');
    setAutosaveError('');
    setIsDirty(false);
    setWorkspaceMode('formal');
    setActionMessage('Draft discarded.');
  }, [formalContent, selectedNode?.contentItemId]);

  const publishContent = useCallback(async () => {
    if (!selectedNode?.contentItemId) return;

    const saved = await contentItemsApi.save(selectedNode.contentItemId, {
      title: formalContent.latestVersion.title,
      summary: formalContent.latestVersion.summary,
      status: 'published',
      bodyMarkdown: formalContent.bodyMarkdown,
      changeNote: 'Publish committed version',
      changeType: 'patch',
      action: 'publish',
    });

    setFormalContent(toFormalContentState(saved));
    setActionMessage(
      `Content published at ${new Date(saved.updatedAt).toLocaleString('zh-CN')}.`,
    );
  }, [
    formalContent.bodyMarkdown,
    formalContent.latestVersion.summary,
    formalContent.latestVersion.title,
    selectedNode?.contentItemId,
  ]);

  const unpublishContent = useCallback(async () => {
    if (!selectedNode?.contentItemId) return;

    const saved = await contentItemsApi.save(selectedNode.contentItemId, {
      title: formalContent.latestVersion.title,
      summary: formalContent.latestVersion.summary,
      status: 'committed',
      bodyMarkdown: formalContent.bodyMarkdown,
      changeNote: 'Unpublish current version',
      changeType: 'patch',
      action: 'unpublish',
    });

    setFormalContent(toFormalContentState(saved));
    setActionMessage(
      `Content unpublished at ${new Date(saved.updatedAt).toLocaleString('zh-CN')}.`,
    );
  }, [
    formalContent.bodyMarkdown,
    formalContent.latestVersion.summary,
    formalContent.latestVersion.title,
    selectedNode?.contentItemId,
  ]);

  const uploadAsset = useCallback(
    async (file: File) => {
      if (!selectedNode?.contentItemId) return;

      setAssetsLoading(true);
      try {
        await contentItemsApi.uploadAsset(selectedNode.contentItemId, file);
        const nextAssets = await contentItemsApi.listAssets(
          selectedNode.contentItemId,
        );
        setAssets(nextAssets);
        setActionMessage(`Uploaded asset: ${file.name}.`);
      } finally {
        setAssetsLoading(false);
      }
    },
    [selectedNode?.contentItemId],
  );

  const insertAssetPath = useCallback((path: string) => {
    setDraftState((current) => ({
      ...current,
      bodyMarkdown: `${current.bodyMarkdown}${
        current.bodyMarkdown.endsWith('\n') || !current.bodyMarkdown ? '' : '\n'
      }![](${path})\n`,
    }));
    setIsDirty(true);
    setAutosaveError('');
  }, []);

  useEffect(() => {
    if (
      workspaceMode !== 'draft' ||
      !selectedNode?.contentItemId ||
      !isDirty ||
      contentLoading
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      // Autosave belongs to the draft workspace only. The formal content view
      // should stay free of editing side effects so published and committed
      // versions remain clearly distinct from the working copy.
      void saveDraft({ silent: true }).catch((autosaveFailure) => {
        setIsAutosaving(false);
        setAutosaveError(parseError(autosaveFailure, 'Autosave failed.'));
      });
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    contentLoading,
    isDirty,
    saveDraft,
    selectedNode?.contentItemId,
    workspaceMode,
  ]);

  return {
    tree,
    selectedNode,
    loading,
    error,
    modal,
    deleteTarget,
    workspaceMode,
    formalContent,
    draftState,
    draftPresence,
    contentLoading,
    contentError,
    draftInfo,
    isDirty,
    isAutosaving,
    lastDraftSavedAt,
    autosaveError,
    assets,
    assetsLoading,
    history,
    historyLoading,
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
    handleDraftEditorChange,
    loadFormalContent,
    createDraftFromFormalVersion,
    resumeDraft,
    saveDraft,
    commitDraft,
    discardDraft,
    publishContent,
    unpublishContent,
    uploadAsset,
    insertAssetPath,
    setWorkspaceMode,
  };
}
