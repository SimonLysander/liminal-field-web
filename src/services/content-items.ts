const BASE_URL = '/api/v1';

export type ContentStatus = 'committed' | 'published' | 'archived';
export type ContentChangeType = 'patch' | 'major';
export type ContentAssetType = 'image' | 'audio' | 'video' | 'file';
export type ContentVisibility = 'public' | 'all';
export type ContentSaveAction = 'commit' | 'publish' | 'unpublish';

export interface ContentVersion {
  commitHash: string;
  title: string;
  summary: string;
}

export interface ChangeLog {
  commitHash?: string;
  title?: string;
  summary?: string;
  createdAt: string;
  changeType: ContentChangeType;
  changeNote: string;
}

export interface ContentAssetRef {
  path: string;
  type: ContentAssetType;
}

export interface ContentListItem {
  id: string;
  title: string;
  summary: string;
  status: ContentStatus;
  latestVersion: ContentVersion;
  publishedVersion?: ContentVersion | null;
  latestCommitHash?: string;
  publishedCommitHash?: string;
  hasUnpublishedChanges: boolean;
  latestChange?: ChangeLog;
  createdAt: string;
  updatedAt: string;
}

export interface ContentDetail {
  id: string;
  title: string;
  summary: string;
  status: ContentStatus;
  latestVersion: ContentVersion;
  publishedVersion?: ContentVersion | null;
  latestCommitHash?: string;
  publishedCommitHash?: string;
  hasUnpublishedChanges: boolean;
  bodyMarkdown: string;
  plainText: string;
  assetRefs: ContentAssetRef[];
  changeLogs: ChangeLog[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentDto {
  title: string;
  summary: string;
  status: ContentStatus;
  bodyMarkdown: string;
  changeNote?: string;
  changeType?: ContentChangeType;
  createdBy?: string;
}

export interface SaveContentDto {
  title: string;
  summary: string;
  status: ContentStatus;
  bodyMarkdown: string;
  changeNote: string;
  changeType?: ContentChangeType;
  action?: ContentSaveAction;
  updatedBy?: string;
}

export interface SaveDraftDto {
  title: string;
  summary: string;
  bodyMarkdown: string;
  changeNote: string;
  savedBy?: string;
}

export interface EditorDraft {
  id: string;
  contentItemId: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  changeNote: string;
  savedAt: string;
  savedBy?: string;
}

export interface UploadedAsset {
  path: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface ListedAsset {
  path: string;
  fileName: string;
  type: ContentAssetType;
  size: number;
}

export interface ContentHistoryEntry {
  commitHash: string;
  committedAt: string;
  authorName: string;
  authorEmail: string;
  message: string;
  action: 'commit' | 'unknown';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const body = options?.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

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

export const contentItemsApi = {
  getById: (id: string, options?: { visibility?: ContentVisibility }) =>
    request<ContentDetail>(
      `/contents/${id}${toQueryString({ visibility: options?.visibility })}`,
    ),
  list: (options?: {
    visibility?: ContentVisibility;
    status?: ContentStatus;
  }) =>
    request<ContentListItem[]>(
      `/contents${toQueryString({
        visibility: options?.visibility,
        status: options?.status,
      })}`,
    ),
  create: (dto: CreateContentDto) =>
    request<ContentDetail>('/contents', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  save: (id: string, dto: SaveContentDto) =>
    request<ContentDetail>(`/contents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  getDraft: (id: string) => request<EditorDraft>(`/contents/${id}/draft`),
  saveDraft: (id: string, dto: SaveDraftDto) =>
    request<EditorDraft>(`/contents/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),
  deleteDraft: (id: string) =>
    request<void>(`/contents/${id}/draft`, {
      method: 'DELETE',
    }),
  getHistory: (id: string) =>
    request<ContentHistoryEntry[]>(`/contents/${id}/history`),
  listAssets: (id: string) => request<ListedAsset[]>(`/contents/${id}/assets`),
  uploadAsset: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<UploadedAsset>(`/contents/${id}/assets`, {
      method: 'POST',
      body: formData,
    });
  },
};

