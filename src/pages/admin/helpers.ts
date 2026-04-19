import type { ContentDetail } from '@/services/content-items';
import type { EditorState, TreeNode } from './types';

export function formatDate(iso?: string) {
  if (!iso) return '--';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function updateNodeInTree(
  nodes: TreeNode[],
  id: string,
  updater: (node: TreeNode) => TreeNode,
): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children) {
      return { ...node, children: updateNodeInTree(node.children, id, updater) };
    }
    return node;
  });
}

export function removeNodeFromTree(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => {
      if (!node.children) return node;
      return { ...node, children: removeNodeFromTree(node.children, id) };
    });
}

export function insertChildInTree(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        isExpanded: true,
        children: [...(node.children ?? []), child],
      };
    }

    if (!node.children) return node;
    return { ...node, children: insertChildInTree(node.children, parentId, child) };
  });
}

export function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children ?? []), 0);
}

export function toEditorState(detail: ContentDetail): EditorState {
  return {
    title: detail.title,
    summary: detail.summary,
    status: detail.status,
    bodyMarkdown: detail.bodyMarkdown,
    changeNote: 'Update content',
    changeType: 'patch',
  };
}
