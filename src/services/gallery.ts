// src/services/gallery.ts

const BASE_URL = '/api/v1';

export interface GalleryPost {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  coverUrl: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  fileName: string;
  size: number;
  order: number;
}

export interface GalleryPostDetail extends GalleryPost {
  photos: GalleryPhoto[];
}

export interface CreateGalleryPostDto {
  title: string;
  description: string;
}

export interface UpdateGalleryPostDto {
  title?: string;
  description?: string;
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
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const galleryApi = {
  list: (status?: 'draft' | 'published') => {
    const query = status ? `?status=${status}` : '';
    return request<GalleryPost[]>(`/gallery/posts${query}`);
  },

  getById: (id: string) =>
    request<GalleryPostDetail>(`/gallery/posts/${id}`),

  create: (dto: CreateGalleryPostDto) =>
    request<GalleryPost>('/gallery/posts', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateGalleryPostDto) =>
    request<GalleryPost>(`/gallery/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  remove: (id: string) =>
    request<void>(`/gallery/posts/${id}`, { method: 'DELETE' }),

  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<GalleryPhoto>(`/gallery/posts/${id}/photos`, {
      method: 'POST',
      body: formData,
    });
  },

  deletePhoto: (id: string, photoId: string) =>
    request<void>(`/gallery/posts/${id}/photos/${photoId}`, {
      method: 'DELETE',
    }),

  publish: (id: string) =>
    request<GalleryPost>(`/gallery/posts/${id}/publish`, { method: 'PUT' }),

  unpublish: (id: string) =>
    request<GalleryPost>(`/gallery/posts/${id}/unpublish`, { method: 'PUT' }),
};
