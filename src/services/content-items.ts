const BASE_URL = '/api/v1';

export type ContentItemBusinessType = 'note' | 'post';

export interface ContentItem {
  id: string;
  title: string;
  businessType: ContentItemBusinessType;
  contentPath: string;
  currentHash: string;
  content?: string;
  updatedAt: string;
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

export const contentItemsApi = {
  getById: (id: string) => request<ContentItem>(`/content-items/${id}`),
  list: (businessType?: ContentItemBusinessType) =>
    request<ContentItem[]>(
      businessType ? `/content-items?businessType=${businessType}` : '/content-items',
    ),
};

export const notesApi = {
  getById: (id: string) => request<ContentItem>(`/notes/${id}`),
  list: () => request<ContentItem[]>('/notes'),
};

export const postsApi = {
  getById: (id: string) => request<ContentItem>(`/posts/${id}`),
  list: () => request<ContentItem[]>('/posts'),
};
