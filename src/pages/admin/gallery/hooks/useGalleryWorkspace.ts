// src/pages/admin/gallery/hooks/useGalleryWorkspace.ts

import { useCallback, useEffect, useState } from 'react';
import { galleryApi } from '@/services/gallery';
import type { GalleryPost, GalleryPostDetail } from '@/services/gallery';

type StatusFilter = 'all' | 'draft' | 'published';

export function useGalleryWorkspace() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<GalleryPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  /* 加载动态列表 */
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await galleryApi.list(status);
      setPosts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  /* 选中一条动态 → 加载详情 */
  const selectPost = useCallback(async (postId: string) => {
    setEditing(false);
    try {
      const detail = await galleryApi.getById(postId);
      setSelectedPost(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载详情失败');
    }
  }, []);

  /* 创建新动态 */
  const createPost = useCallback(async (title: string, description: string) => {
    const post = await galleryApi.create({ title, description });
    await loadPosts();
    await selectPost(post.id);
    showMessage('已创建');
  }, [loadPosts, selectPost]);

  /* 更新动态 */
  const updatePost = useCallback(async (title: string, description: string) => {
    if (!selectedPost) return;
    await galleryApi.update(selectedPost.id, { title, description });
    await galleryApi.getById(selectedPost.id).then(setSelectedPost);
    await loadPosts();
    setEditing(false);
    showMessage('已保存');
  }, [selectedPost, loadPosts]);

  /* 删除动态 */
  const deletePost = useCallback(async () => {
    if (!selectedPost) return;
    await galleryApi.remove(selectedPost.id);
    setSelectedPost(null);
    await loadPosts();
    showMessage('已删除');
  }, [selectedPost, loadPosts]);

  /* 上传照片 */
  const uploadPhoto = useCallback(async (file: File) => {
    if (!selectedPost) return;
    await galleryApi.uploadPhoto(selectedPost.id, file);
    const updated = await galleryApi.getById(selectedPost.id);
    setSelectedPost(updated);
    await loadPosts();
  }, [selectedPost, loadPosts]);

  /* 删除照片 */
  const deletePhoto = useCallback(async (photoId: string) => {
    if (!selectedPost) return;
    await galleryApi.deletePhoto(selectedPost.id, photoId);
    const updated = await galleryApi.getById(selectedPost.id);
    setSelectedPost(updated);
    await loadPosts();
  }, [selectedPost, loadPosts]);

  /* 发布 / 取消发布 */
  const publishPost = useCallback(async () => {
    if (!selectedPost) return;
    await galleryApi.publish(selectedPost.id);
    const updated = await galleryApi.getById(selectedPost.id);
    setSelectedPost(updated);
    await loadPosts();
    showMessage('已发布');
  }, [selectedPost, loadPosts]);

  const unpublishPost = useCallback(async () => {
    if (!selectedPost) return;
    await galleryApi.unpublish(selectedPost.id);
    const updated = await galleryApi.getById(selectedPost.id);
    setSelectedPost(updated);
    await loadPosts();
    showMessage('已取消发布');
  }, [selectedPost, loadPosts]);

  function showMessage(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 2000);
  }

  return {
    posts,
    selectedPost,
    loading,
    error,
    statusFilter,
    editing,
    actionMessage,
    setStatusFilter,
    setEditing,
    selectPost,
    createPost,
    updatePost,
    deletePost,
    uploadPhoto,
    deletePhoto,
    publishPost,
    unpublishPost,
    reload: loadPosts,
  };
}
