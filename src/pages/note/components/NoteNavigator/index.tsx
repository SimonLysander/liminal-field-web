import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  structureApi,
  type StructureNode,
} from '@/services/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, FileText, Folder, Plus, Search } from 'lucide-react';

const ROOT_KEY = 'root';

type FolderNode = StructureNode & { type: 'FOLDER' };

interface NoteNavigatorProps {
  onActiveNodeChange: (node: StructureNode | null) => void;
}

/** 左侧：渐进式层级导航（每次只显示当前层级） */
const NoteNavigator = ({ onActiveNodeChange }: NoteNavigatorProps) => {
  const [navigationState, setNavigationState] = useState<{
    path: FolderNode[];
    activeNodeId: string | null;
  }>({
    path: [],
    activeNodeId: null,
  });
  const [dataState, setDataState] = useState<{
    itemsByParentId: Record<string, StructureNode[]>;
    loadingParentId: string | null;
  }>({
    itemsByParentId: {},
    loadingParentId: ROOT_KEY,
  });

  const isFolderNode = (node: StructureNode): node is FolderNode =>
    node.type === 'FOLDER';

  const loadRoots = useCallback(async () => {
    setDataState((prev) => ({ ...prev, loadingParentId: ROOT_KEY }));
    try {
      const roots = await structureApi.getRootNodes();
      setDataState((prev) => ({
        ...prev,
        itemsByParentId: {
          ...prev.itemsByParentId,
          [ROOT_KEY]: roots,
        },
      }));
      setNavigationState({
        path: [],
        activeNodeId: null,
      });
      onActiveNodeChange(null);
    } catch {
      setDataState((prev) => ({
        ...prev,
        itemsByParentId: {
          ...prev.itemsByParentId,
          [ROOT_KEY]: [],
        },
      }));
      setNavigationState({
        path: [],
        activeNodeId: null,
      });
      onActiveNodeChange(null);
    } finally {
      setDataState((prev) => ({ ...prev, loadingParentId: null }));
    }
  }, [onActiveNodeChange]);

  useEffect(() => {
    loadRoots();
  }, [loadRoots]);

  const currentParentId =
    navigationState.path[navigationState.path.length - 1]?.id ?? ROOT_KEY;
  const currentItems = useMemo(
    () => dataState.itemsByParentId[currentParentId] ?? [],
    [currentParentId, dataState.itemsByParentId],
  );
  const isLoading = dataState.loadingParentId === currentParentId;

  const handleDrillDown = useCallback(async (node: FolderNode) => {
    setNavigationState((prev) => ({
      path: [...prev.path, node],
      activeNodeId: node.id,
    }));
    onActiveNodeChange(node);

    if (dataState.itemsByParentId[node.id]) return;

    setDataState((prev) => ({ ...prev, loadingParentId: node.id }));
    try {
      const children = await structureApi.getChildren(node.id);
      setDataState((prev) => ({
        ...prev,
        itemsByParentId: {
          ...prev.itemsByParentId,
          [node.id]: children,
        },
      }));
    } finally {
      setDataState((prev) => ({
        ...prev,
        loadingParentId: prev.loadingParentId === node.id ? null : prev.loadingParentId,
      }));
    }
  }, [dataState.itemsByParentId, onActiveNodeChange]);

  const handleSelectNode = useCallback((node: StructureNode) => {
    setNavigationState((prev) => ({
      ...prev,
      activeNodeId: node.id,
    }));
    onActiveNodeChange(node);
  }, [onActiveNodeChange]);

  const handleGoBack = useCallback((toIndex: number) => {
    if (toIndex < 0) {
      setNavigationState({
        path: [],
        activeNodeId: null,
      });
      onActiveNodeChange(null);
      return;
    }

    setNavigationState((prev) => ({
      path: prev.path.slice(0, toIndex + 1),
      activeNodeId: null,
    }));
    onActiveNodeChange(null);
  }, [onActiveNodeChange]);

  const handleNodeClick = (node: StructureNode) => {
    if (isFolderNode(node)) {
      void handleDrillDown(node);
      return;
    }
    handleSelectNode(node);
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="搜索文档..." className="pl-7 h-8 text-sm" />
        </div>
        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" title="新建">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 返回上级（有路径时显示） */}
      {navigationState.path.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleGoBack(-1)}
          >
            ← 根
          </Button>
          {navigationState.path.map((s, i) => (
            <Button
              key={s.id}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleGoBack(i)}
            >
              {s.name}
            </Button>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : currentItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无文档
            </div>
          ) : (
            currentItems.map((node) => {
              const isSubject = node.type === 'FOLDER';
              const isSelected = navigationState.activeNodeId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleNodeClick(node)}
                  className={`
                    flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-left text-sm
                    transition-colors
                    ${isSelected ? 'border-border bg-accent' : 'hover:bg-accent/50'}
                  `}
                >
                  {isSubject ? (
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate flex-1">{node.name}</span>
                  {isSubject && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default NoteNavigator;
