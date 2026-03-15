const BASE_URL = '/api/v1';

export type NavigationNodeType = 'subject' | 'content';

export interface NavigationNode {
  id: string;
  name: string;
  nodeType: NavigationNodeType;
  parentId?: string;
  contentItemId?: string;
  order: number;
  hasChildren: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNavigationNodeDto {
  name: string;
  nodeType: NavigationNodeType;
  parentId?: string;
  contentItemId?: string;
  order?: number;
}

export interface UpdateNavigationNodeDto {
  name?: string;
  parentId?: string;
  contentItemId?: string;
  order?: number;
}

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

export const navigationApi = {
  listNodes: (parentId?: string) =>
    request<NavigationNode[]>(parentId ? `/navigation?parentId=${parentId}` : '/navigation'),

  getRootNodes: () => request<NavigationNode[]>('/navigation/roots'),

  getChildren: (parentId: string) => request<NavigationNode[]>(`/navigation/children/${parentId}`),

  getPathByNodeId: (id: string) => request<NavigationNode[]>(`/navigation/path/node/${id}`),

  getPathByContentItemId: (contentItemId: string) =>
    request<NavigationNode[]>(`/navigation/path/content/${contentItemId}`),

  createNode: (dto: CreateNavigationNodeDto) =>
    request<NavigationNode>('/navigation', { method: 'POST', body: JSON.stringify(dto) }),

  updateNode: (id: string, dto: UpdateNavigationNodeDto) =>
    request<NavigationNode>(`/navigation/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  deleteNode: (id: string) => request<void>(`/navigation/${id}`, { method: 'DELETE' }),
};
