// src/services/gallery.ts

import { request } from './request';

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
