import { useCallback, useEffect, useMemo, useState } from 'react';
import { structureApi, type StructureNode } from '@/services/structure';

const ROOT_KEY = 'root';

type FolderNode = StructureNode & { type: 'FOLDER' };

interface NoteNavigatorProps {
  onActiveNodeChange: (node: StructureNode | null) => void;
}

const NoteNavigator = ({ onActiveNodeChange }: NoteNavigatorProps) => {
  const [navigationState, setNavigationState] = useState<{ path: FolderNode[]; activeNodeId: string | null }>({
    path: [],
    activeNodeId: null,
  });
  const [dataState, setDataState] = useState<{ itemsByParentId: Record<string, StructureNode[]>; loadingParentId: string | null }>({
    itemsByParentId: {},
    loadingParentId: ROOT_KEY,
  });

  const isFolderNode = (node: StructureNode): node is FolderNode => node.type === 'FOLDER';

  const loadRoots = useCallback(async () => {
    setDataState((prev) => ({ ...prev, loadingParentId: ROOT_KEY }));
    try {
      const roots = await structureApi.getRootNodes();
      setDataState((prev) => ({ ...prev, itemsByParentId: { ...prev.itemsByParentId, [ROOT_KEY]: roots } }));
      setNavigationState({ path: [], activeNodeId: null });
      onActiveNodeChange(null);
    } catch {
      setDataState((prev) => ({ ...prev, itemsByParentId: { ...prev.itemsByParentId, [ROOT_KEY]: [] } }));
      setNavigationState({ path: [], activeNodeId: null });
      onActiveNodeChange(null);
    } finally {
      setDataState((prev) => ({ ...prev, loadingParentId: null }));
    }
  }, [onActiveNodeChange]);

  useEffect(() => {
    void loadRoots();
  }, [loadRoots]);

  const currentParentId = navigationState.path[navigationState.path.length - 1]?.id ?? ROOT_KEY;
  const currentItems = useMemo(() => dataState.itemsByParentId[currentParentId] ?? [], [currentParentId, dataState.itemsByParentId]);
  const isLoading = dataState.loadingParentId === currentParentId;
  const maxNotes = Math.max(1, currentItems.length);

  const handleDrillDown = useCallback(
    async (node: FolderNode) => {
      setNavigationState((prev) => ({ path: [...prev.path, node], activeNodeId: node.id }));
      onActiveNodeChange(node);

      if (dataState.itemsByParentId[node.id]) return;

      setDataState((prev) => ({ ...prev, loadingParentId: node.id }));
      try {
        const children = await structureApi.getChildren(node.id);
        setDataState((prev) => ({ ...prev, itemsByParentId: { ...prev.itemsByParentId, [node.id]: children } }));
      } finally {
        setDataState((prev) => ({
          ...prev,
          loadingParentId: prev.loadingParentId === node.id ? null : prev.loadingParentId,
        }));
      }
    },
    [dataState.itemsByParentId, onActiveNodeChange],
  );

  const handleSelectNode = useCallback(
    (node: StructureNode) => {
      setNavigationState((prev) => ({ ...prev, activeNodeId: node.id }));
      onActiveNodeChange(node);
    },
    [onActiveNodeChange],
  );

  const handleGoBack = useCallback(
    (toIndex: number) => {
      if (toIndex < 0) {
        setNavigationState({ path: [], activeNodeId: null });
        onActiveNodeChange(null);
        return;
      }

      setNavigationState((prev) => ({ path: prev.path.slice(0, toIndex + 1), activeNodeId: null }));
      onActiveNodeChange(null);
    },
    [onActiveNodeChange],
  );

  const handleNodeClick = (node: StructureNode) => {
    if (isFolderNode(node)) {
      void handleDrillDown(node);
      return;
    }
    handleSelectNode(node);
  };

  return (
    <div className="notes-left flex w-[17rem] shrink-0 flex-col rounded-[1.125rem] px-[1.25rem] py-[1.125rem]">
      <div className="notes-level flex flex-1 flex-col">
        {navigationState.path.length === 0 ? (
          <>
            <div className="notes-left-header mb-[0.875rem]">文稿</div>
            {isLoading ? (
              <div className="topic-item">
                <div className="topic-left">
                  <span className="topic-name">Loading…</span>
                </div>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="topic-item">
                <div className="topic-left">
                  <span className="topic-name">暂无公开节点</span>
                </div>
              </div>
            ) : (
              currentItems.map((node, index) => (
                <div key={node.id} className="topic-item" onClick={() => handleNodeClick(node)}>
                  <div className="topic-left">
                    <span className="topic-glyph">{node.type === 'FOLDER' ? '●' : '■'}</span>
                    <div className="topic-text">
                      <span className="topic-name">{node.name}</span>
                      <span className="topic-bar">
                        <span className="topic-bar-fill" style={{ width: `${((index + 1) / maxNotes) * 100}%` }} />
                      </span>
                    </div>
                  </div>
                  <span className="topic-count">{node.type === 'FOLDER' ? '?' : ''}</span>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className="notes-breadcrumb mb-[0.875rem] flex items-center gap-[0.375rem]">
              <span className="breadcrumb-back" onClick={() => handleGoBack(-1)}>
                ← 文稿
              </span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">{navigationState.path[navigationState.path.length - 1]?.name}</span>
            </div>
            <div className="flex flex-col gap-[0.5rem]">
              {currentItems.length === 0 ? (
                <div className="note-item">
                  <span className="note-index">-</span>
                  <div className="note-info">
                    <div className="note-item-title">No child nodes</div>
                  </div>
                </div>
              ) : (
                currentItems.map((node, index) => (
                  <div
                    key={node.id}
                    className={`note-item ${navigationState.activeNodeId === node.id ? 'active' : ''}`}
                    onClick={() => handleNodeClick(node)}
                  >
                    <span className="note-index">{index + 1}.</span>
                    <div className="note-info">
                      <div className="note-item-title">{node.name}</div>
                      <div className="note-item-meta">{node.type === 'FOLDER' ? 'folder' : 'published note'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoteNavigator;
