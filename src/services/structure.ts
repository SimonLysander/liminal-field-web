export type StructureNodeType = 'FOLDER' | 'DOC';

export interface StructureNode {
  id: string;
  name: string;
  type: StructureNodeType;
  parentId?: string;
  contentItemUUID?: string;
  sortOrder: number;
  hasChildren: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStructureNodeDto {
  name: string;
  type: StructureNodeType;
  parentId?: string;
  contentItemUUID?: string;
  sortOrder?: number;
}

export interface UpdateStructureNodeDto {
  name?: string;
  parentId?: string;
  contentItemUUID?: string;
  sortOrder?: number;
}

const BASE_URL = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const hasBody = options?.body !== undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!text) return undefined as T;
  return JSON.parse(text);
}

export const structureApi = {
  listNodes: (parentId?: string) =>
    request<StructureNode[]>(
      parentId ? `/navigation/structure?parentId=${parentId}` : '/navigation/structure',
    ),

  getRootNodes: () => request<StructureNode[]>('/navigation/structure'),

  getChildren: (parentId: string) =>
    request<StructureNode[]>(`/navigation/structure?parentId=${parentId}`),

  getPathByNodeId: (id: string) =>
    request<StructureNode[]>(`/navigation/structure/path/node/${id}`),

  getPathByContentItemUUID: (contentItemUUID: string) =>
    request<StructureNode[]>(
      `/navigation/structure/path/content/${contentItemUUID}`,
    ),

  createNode: (dto: CreateStructureNodeDto) =>
    request<StructureNode>('/navigation/structure', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateNode: (id: string, dto: UpdateStructureNodeDto) =>
    request<StructureNode>(`/navigation/structure/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  deleteNode: (id: string) => request<void>(`/navigation/${id}`, { method: 'DELETE' }),
};
