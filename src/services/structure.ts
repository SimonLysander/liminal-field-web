export type StructureNodeType = 'FOLDER' | 'DOC';
export type StructureVisibility = 'public' | 'all';
export interface StructureNode {
  id: string;
  name: string;
  type: StructureNodeType;
  parentId?: string;
  contentItemId?: string;
  sortOrder: number;
  hasChildren: boolean;
  createdAt: string;
  updatedAt?: string;
}
export interface CreateStructureNodeDto {
  name: string;
  type: StructureNodeType;
  parentId?: string;
  contentItemId?: string;
  sortOrder?: number;
}
export interface UpdateStructureNodeDto {
  name?: string;
  parentId?: string;
  contentItemId?: string;
  sortOrder?: number;
}
import { request } from './request';

function toQueryString(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export interface StructureListResult {
  path: StructureNode[];
  children: StructureNode[];
}

export const structureApi = {
  listNodes: (
    parentId?: string,
    options?: { visibility?: StructureVisibility },
  ) =>
    request<StructureListResult>(
      `/structure-nodes${toQueryString({
        parentId,
        visibility: options?.visibility,
      })}`,
    ),

  getRootNodes: (options?: { visibility?: StructureVisibility }) =>
    structureApi.listNodes(undefined, options),

  getChildren: (parentId: string, options?: { visibility?: StructureVisibility }) =>
    structureApi.listNodes(parentId, options),

  getPathByNodeId: (id: string) =>
    request<StructureNode[]>(`/structure-nodes/${id}/path`),

  getPathByContentItemId: (contentItemId: string) =>
    request<StructureNode[]>(`/contents/${contentItemId}/structure-path`),

  createNode: (dto: CreateStructureNodeDto) =>
    request<StructureNode>('/structure-nodes', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateNode: (id: string, dto: UpdateStructureNodeDto) =>
    request<StructureNode>(`/structure-nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  deleteNode: (id: string) =>
    request<void>(`/structure-nodes/${id}`, { method: 'DELETE' }),

  reorderSiblings: (parentId: string | null, nodeIds: string[]) =>
    request<void>('/structure-nodes/reorder', {
      method: 'POST',
      body: JSON.stringify({ parentId, nodeIds }),
    }),
};
