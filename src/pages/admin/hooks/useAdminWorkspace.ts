import { useCallback, useEffect, useMemo, useState } from 'react';
import { contentItemsApi } from '@/services/content-items';
import type {
  CreateStructureNodeDto,
  UpdateStructureNodeDto,
} from '@/services/structure';
import { structureApi } from '@/services/structure';
import {
  countNodes,
  findNodeInTree,
  getSiblings,
  insertChildInTree,
  moveNodeInTree,
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
  type PreviewState,
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
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
      setError(parseError(loadError, '加载导航树失败'));
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
      const message = parseError(draftError, '加载草稿失败');
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
          parseError(workspaceError, '加载正式内容失败'),
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
      setPreview(null);
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
        throw new Error('DOC 节点必须关联内容项');
      }

      const createdContent = await contentItemsApi.create({
        title: docCreate.title,
        summary: docCreate.summary,
        status: 'committed',
        bodyMarkdown: `# ${docCreate.title}\n`,
        changeNote: '初始内容',
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
          '是否覆盖已有草稿？',
        );
        if (!confirmed) return;
      }

      const draft = await contentItemsApi.saveDraft(selectedNode.contentItemId, {
        title: formalContent.latestVersion.title,
        summary: formalContent.latestVersion.summary,
        bodyMarkdown: formalContent.bodyMarkdown,
        changeNote: overwrite
          ? '从正式版本覆盖草稿'
          : '从正式版本创建草稿',
      });

      setDraftState(toDraftEditorStateFromDraft(draft));
      setDraftPresence({
        exists: true,
        savedAt: draft.savedAt,
      });
      setLastDraftSavedAt(draft.savedAt);
      setDraftInfo(
        `草稿工作区已就绪 ${new Date(draft.savedAt).toLocaleString('zh-CN')}`,
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
        `已恢复草稿 ${new Date(draft.savedAt).toLocaleString('zh-CN')}`,
      );
      setActionMessage('');
      setAutosaveError('');
      setIsDirty(false);
      setWorkspaceMode('draft');
    } catch (draftError) {
      setContentError(parseError(draftError, '恢复草稿失败'));
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
        `草稿已保存 ${new Date(draft.savedAt).toLocaleString('zh-CN')}`,
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
      `新版本已提交 ${new Date(saved.updatedAt).toLocaleString('zh-CN')}`,
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
    setActionMessage('草稿已丢弃');
  }, [formalContent, selectedNode?.contentItemId]);

  const publishContent = useCallback(async () => {
    if (!selectedNode?.contentItemId) return;

    const saved = await contentItemsApi.save(selectedNode.contentItemId, {
      title: formalContent.latestVersion.title,
      summary: formalContent.latestVersion.summary,
      status: 'published',
      bodyMarkdown: formalContent.bodyMarkdown,
      changeNote: '发布已提交版本',
      changeType: 'patch',
      action: 'publish',
    });

    setFormalContent(toFormalContentState(saved));
    setActionMessage(
      `内容已发布 ${new Date(saved.updatedAt).toLocaleString('zh-CN')}`,
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
      changeNote: '取消发布当前版本',
      changeType: 'patch',
      action: 'unpublish',
    });

    setFormalContent(toFormalContentState(saved));
    setActionMessage(
      `已取消发布 ${new Date(saved.updatedAt).toLocaleString('zh-CN')}`,
    );
  }, [
    formalContent.bodyMarkdown,
    formalContent.latestVersion.summary,
    formalContent.latestVersion.title,
    selectedNode?.contentItemId,
  ]);

  const previewVersion = useCallback(
    async (commitHash: string) => {
      if (!selectedNode?.contentItemId) return;

      /* Already previewing this version */
      if (preview?.commitHash === commitHash) return;

      /* If clicking the latest version, just exit preview */
      if (commitHash === formalContent.latestVersion.commitHash) {
        setPreview(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const detail = await contentItemsApi.getByVersion(
          selectedNode.contentItemId,
          commitHash,
        );
        setPreview({
          commitHash,
          title: detail.title,
          bodyMarkdown: detail.bodyMarkdown,
          committedAt: detail.updatedAt,
        });
      } catch (previewError) {
        setContentError(parseError(previewError, '加载版本内容失败'));
      } finally {
        setPreviewLoading(false);
      }
    },
    [selectedNode?.contentItemId, preview?.commitHash, formalContent.latestVersion.commitHash],
  );

  const exitPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const publishPreview = useCallback(async () => {
    if (!selectedNode?.contentItemId || !preview) return;

    const confirmed = window.confirm(
      `发布版本 ${preview.commitHash.slice(0, 8)} ？`,
    );
    if (!confirmed) return;

    const saved = await contentItemsApi.save(selectedNode.contentItemId, {
      title: preview.title,
      summary: formalContent.latestVersion.summary,
      status: 'published',
      bodyMarkdown: preview.bodyMarkdown,
      changeNote: `发布版本 ${preview.commitHash.slice(0, 8)}`,
      changeType: 'patch',
      action: 'publish',
    });

    setFormalContent(toFormalContentState(saved));
    setPreview(null);
    setActionMessage(
      `版本 ${preview.commitHash.slice(0, 8)} 已发布。`,
    );
    setHistory(await contentItemsApi.getHistory(selectedNode.contentItemId));
  }, [selectedNode?.contentItemId, preview, formalContent.latestVersion.summary]);

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
        setActionMessage(`已上传附件：${file.name}`);
      } finally {
        setAssetsLoading(false);
      }
    },
    [selectedNode?.contentItemId],
  );

  const handleMoveNode = useCallback(
    (nodeId: string, targetNodeId: string, position: 'before' | 'after' | 'inside') => {
      /* Optimistic update: move in local tree immediately */
      setTree((current) => {
        const updated = moveNodeInTree(current, nodeId, targetNodeId, position);

        /* Determine new parentId and sibling order for API call */
        let newParentId: string | null = null;
        if (position === 'inside') {
          newParentId = targetNodeId;
        } else {
          const [siblings] = getSiblings(updated, nodeId);
          const targetNode = findNodeInTree(updated, targetNodeId);
          if (targetNode) {
            /* Find parent by checking which list contains targetNodeId in the updated tree */
            const [, parentId] = getSiblings(updated, targetNodeId);
            newParentId = parentId;
          }
          /* Collect sibling IDs in order for batch reorder */
          const siblingIds = siblings.map((s) => s.id);
          void structureApi.reorderSiblings(newParentId, siblingIds).catch(() => {
            /* Revert on failure by reloading */
            void loadRoots();
          });
          return updated;
        }

        /* For 'inside' moves, update parentId via single-node update */
        void structureApi
          .updateNode(nodeId, { parentId: newParentId ?? undefined })
          .catch(() => {
            void loadRoots();
          });

        return updated;
      });
    },
    [loadRoots],
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
        setAutosaveError(parseError(autosaveFailure, '自动保存失败'));
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
    preview,
    previewLoading,
    previewVersion,
    exitPreview,
    publishPreview,
    handleMoveNode,
    uploadAsset,
    insertAssetPath,
    setWorkspaceMode,
  };
}
