import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type CreateStructureNodeDto,
  structureApi,
  type StructureNode,
  type StructureNodeType,
  type UpdateStructureNodeDto,
} from '../../services/structure';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TreeNode extends StructureNode {
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

type ModalMode = 'create' | 'edit';

interface ModalState {
  open: boolean;
  mode: ModalMode;
  node?: TreeNode;
  parentId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function updateNodeInTree(
  nodes: TreeNode[],
  id: string,
  updater: (n: TreeNode) => TreeNode,
): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (n.children) return { ...n, children: updateNodeInTree(n.children, id, updater) };
    return n;
  });
}

function removeNodeFromTree(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children ? { ...n, children: removeNodeFromTree(n.children, id) } : n));
}

function insertChildInTree(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...(n.children ?? []), child] };
    }
    if (n.children) {
      return { ...n, children: insertChildInTree(n.children, parentId, child) };
    }
    return n;
  });
}

function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children ?? []), 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: StructureNodeType }) => (
  <span
    className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${
      type === 'FOLDER' ? 'border-border bg-muted text-foreground' : 'border-border bg-muted text-foreground'
    }`}
  >
    {type === 'FOLDER' ? '📁 分类' : '📄 内容'}
  </span>
);

const IconBtn = ({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
  children: React.ReactNode;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`rounded p-1 transition-colors ${
      danger
        ? 'text-gray-500 hover:bg-muted hover:text-foreground'
        : 'text-gray-500 hover:bg-muted hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

// ─── Tree Node Component ──────────────────────────────────────────────────────

const TreeNodeItem = ({
  node,
  depth,
  selected,
  onSelect,
  onExpand,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (node: TreeNode) => void;
  onExpand: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}) => {
  const isSubject = node.type === 'FOLDER';
  const isSelected = selected === node.id;

  return (
    <div>
      <div
        className={`group flex cursor-pointer items-center gap-1 rounded border px-2 py-1.5 transition-colors ${
          isSelected ? 'border-gray-300 bg-gray-100' : 'border-transparent hover:bg-gray-50'
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* expand toggle */}
        <button
          className={`w-5 h-5 flex items-center justify-center text-gray-400 transition-transform flex-shrink-0 ${
            isSubject ? 'visible' : 'invisible'
          } ${node.isExpanded ? 'rotate-90' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isSubject) onExpand(node);
          }}
        >
          {node.isLoading ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path
                d="M8 5l8 7-8 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          )}
        </button>

        {/* node icon */}
        <span className="text-base flex-shrink-0">{isSubject ? '📁' : '📄'}</span>

        {/* name */}
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">{node.name}</span>

        {/* actions (shown on hover) */}
        <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isSubject && (
            <IconBtn
              title="添加子节点"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node.id);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </IconBtn>
          )}
          <IconBtn
            title="编辑"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                strokeLinecap="round"
              />
            </svg>
          </IconBtn>
          <IconBtn
            title="删除"
            danger
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" />
            </svg>
          </IconBtn>
        </span>
      </div>

      {/* children */}
      {node.isExpanded && node.children && (
        <div>
          {node.children.length === 0 ? (
            <p
              className="text-xs text-gray-400 py-1"
              style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}
            >
              暂无子节点
            </p>
          ) : (
            node.children.map((child) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
                onExpand={onExpand}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Form Modal ───────────────────────────────────────────────────────────────

const NodeFormModal = ({
  modal,
  onClose,
  onSubmit,
}: {
  modal: ModalState;
  onClose: () => void;
  onSubmit: (data: CreateStructureNodeDto | UpdateStructureNodeDto) => Promise<void>;
}) => {
  const [name, setName] = useState(modal.node?.name ?? '');
  const [type, setType] = useState<StructureNodeType>(modal.node?.type ?? 'FOLDER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('节点名称不能为空');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (modal.mode === 'create') {
        await onSubmit({
          name: name.trim(),
          type,
          parentId: modal.parentId,
        } as CreateStructureNodeDto);
      } else {
        await onSubmit({ name: name.trim() } as UpdateStructureNodeDto);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const isCreate = modal.mode === 'create';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isCreate ? '新建导航节点' : '编辑导航节点'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* parent hint */}
          {isCreate && modal.parentId && (
            <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                />
              </svg>
              将作为子节点创建
            </div>
          )}

          {/* name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              节点名称 <span className="text-red-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入节点名称"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm transition focus:outline-none"
            />
          </div>

          {/* node type (only for create) */}
          {isCreate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                节点类型 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['FOLDER', 'DOC'] as StructureNodeType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center gap-2 rounded border px-3 py-2.5 text-sm transition-colors ${
                      type === t
                        ? 'border-gray-400 bg-gray-100 text-gray-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{t === 'FOLDER' ? '📁' : '📄'}</span>
                    {t === 'FOLDER' ? '分类节点' : '内容节点'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* error */}
          {error && (
            <p className="flex items-center gap-1 text-sm text-gray-700">
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </p>
          )}

          {/* actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-800"
            >
              {submitting ? '提交中…' : isCreate ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

const ConfirmDialog = ({
  node,
  onConfirm,
  onCancel,
}: {
  node: TreeNode;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="mx-4 w-full max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">确认删除</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                确定要删除节点 <span className="font-medium text-gray-700">"{node.name}"</span> 吗？
              </p>
            </div>
          </div>
          {node.type === 'FOLDER' && (
            <p className="mb-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              ⚠️ 删除分类节点可能影响其子节点，请谨慎操作
            </p>
          )}
          {error && <p className="mb-3 text-sm text-gray-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="rounded border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-white transition-colors disabled:opacity-50 hover:bg-gray-800"
            >
              {loading ? '删除中…' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────

const DetailPanel = ({
  node,
  onEdit,
  onDelete,
  onAddChild,
}: {
  node: TreeNode | null;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAddChild: (parentId: string) => void;
}) => {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <svg
          viewBox="0 0 24 24"
          className="w-12 h-12 opacity-30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-sm">选择一个节点查看详情</p>
      </div>
    );
  }

  const fields: { label: string; value: React.ReactNode }[] = [
    {
      label: 'ID',
      value: (
        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono break-all">
          {node.id}
        </code>
      ),
    },
    { label: '名称', value: node.name },
    { label: '类型', value: <TypeBadge type={node.type} /> },
    {
      label: '父节点 ID',
      value: node.parentId ? (
        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono break-all">
          {node.parentId}
        </code>
      ) : (
        <span className="text-gray-400">根节点</span>
      ),
    },
    { label: '关联内容 ID', value: node.contentItemUUID ?? <span className="text-gray-400">—</span> },
    { label: '创建时间', value: formatDate(node.createdAt) },
    { label: '更新时间', value: formatDate(node.updatedAt) },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 break-all">{node.name}</h3>
          <div className="mt-1">
            <TypeBadge type={node.type} />
          </div>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          {node.type === 'FOLDER' && (
            <button
              onClick={() => onAddChild(node.id)}
              title="添加子节点"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              子节点
            </button>
          )}
          <button
            onClick={() => onEdit(node)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                strokeLinecap="round"
              />
            </svg>
            编辑
          </button>
          <button
            onClick={() => onDelete(node)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" />
            </svg>
            删除
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {fields.map(({ label, value }) => (
          <div key={label} className="border-b border-gray-50 pb-3 last:border-0">
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            <div className="text-sm text-gray-800">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Admin Page ──────────────────────────────────────────────────────────

const AdminPage = () => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

  // ── fetch root nodes ──
  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const roots = await structureApi.getRootNodes();
      setTree(roots.map((n) => ({ ...n, children: undefined, isExpanded: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoots();
  }, [loadRoots]);

  // ── expand / collapse ──
  const handleExpand = useCallback(async (node: TreeNode) => {
    if (node.isExpanded) {
      setTree((prev) => updateNodeInTree(prev, node.id, (n) => ({ ...n, isExpanded: false })));
      return;
    }
    setTree((prev) => updateNodeInTree(prev, node.id, (n) => ({ ...n, isLoading: true })));
    try {
      const children = await structureApi.getChildren(node.id);
      setTree((prev) =>
        updateNodeInTree(prev, node.id, (n) => ({
          ...n,
          isLoading: false,
          isExpanded: true,
          children: children.map((c) => ({ ...c, isExpanded: false })),
        })),
      );
    } catch {
      setTree((prev) => updateNodeInTree(prev, node.id, (n) => ({ ...n, isLoading: false })));
    }
  }, []);

  // ── create ──
  const openCreate = (parentId?: string) => setModal({ open: true, mode: 'create', parentId });

  const handleCreate = async (dto: CreateStructureNodeDto | UpdateStructureNodeDto) => {
    const created = await structureApi.createNode(dto as CreateStructureNodeDto);
    const newNode: TreeNode = { ...created, isExpanded: false };
    if (modal.parentId) {
      setTree((prev) => insertChildInTree(prev, modal.parentId!, newNode));
    } else {
      setTree((prev) => [...prev, newNode]);
    }
  };

  // ── edit ──
  const openEdit = (node: TreeNode) => setModal({ open: true, mode: 'edit', node });

  const handleEdit = async (dto: CreateStructureNodeDto | UpdateStructureNodeDto) => {
    const updated = await structureApi.updateNode(modal.node!.id, dto as UpdateStructureNodeDto);
    setTree((prev) => updateNodeInTree(prev, updated.id, (n) => ({ ...n, ...updated })));
    if (selected?.id === updated.id) setSelected((prev) => ({ ...prev!, ...updated }));
  };

  // ── delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await structureApi.deleteNode(deleteTarget.id);
    setTree((prev) => removeNodeFromTree(prev, deleteTarget.id));
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
  };

  const totalNodes = countNodes(tree);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── page header ── */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-gray-100">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">导航管理</h1>
            <p className="text-xs text-gray-500">Navigation Manager · Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* stat */}
          <div className="hidden items-center gap-1.5 rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-600 sm:flex">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                strokeLinecap="round"
              />
            </svg>
            共 <strong className="text-gray-800">{totalNodes}</strong> 个节点
          </div>
          {/* refresh */}
          <button
            onClick={loadRoots}
            disabled={loading}
            title="刷新"
            className="rounded border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.32-3.32M20 15a8 8 0 01-14.32 3.32"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* add root */}
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-1.5 rounded border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-800"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            新建根节点
          </button>
        </div>
      </header>

      {/* ── main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* left: tree panel */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">节点树</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading && tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-sm">加载中…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-red-400">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
                </svg>
                <p className="text-sm text-center">{error}</p>
                <button
                  onClick={loadRoots}
                  className="text-xs underline text-blue-500 hover:text-blue-600"
                >
                  重试
                </button>
              </div>
            ) : tree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 opacity-40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M3 7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 17a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm">暂无导航节点</p>
                <button
                  onClick={() => openCreate()}
                  className="text-xs text-blue-500 hover:underline"
                >
                  点击创建第一个节点
                </button>
              </div>
            ) : (
              tree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selected?.id ?? null}
                  onSelect={setSelected}
                  onExpand={handleExpand}
                  onAddChild={openCreate}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </div>
        </aside>

        {/* right: detail panel */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 h-full">
            <div className="h-full max-h-full border border-gray-200 bg-white p-6">
              <DetailPanel
                node={selected}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onAddChild={openCreate}
              />
            </div>
          </div>
        </main>
      </div>

      {/* ── modal ── */}
      {modal.open && (
        <NodeFormModal
          modal={modal}
          onClose={() => setModal({ open: false, mode: 'create' })}
          onSubmit={modal.mode === 'create' ? handleCreate : handleEdit}
        />
      )}

      {/* ── confirm delete ── */}
      {deleteTarget && (
        <ConfirmDialog
          node={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default AdminPage;
