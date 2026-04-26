// src/pages/admin/gallery/index.tsx

/*
 * GalleryAdmin — 画廊管理主页面
 *
 * 布局：PostList (200px) + PostDetail (flex-1) + InfoPanel (200px)
 * 渲染在 AdminShell 的 <Outlet /> 中。
 */

import { useGalleryWorkspace } from './hooks/useGalleryWorkspace';
import { PostList } from './components/PostList';
import { PostDetail } from './components/PostDetail';

export default function GalleryAdmin() {
  const ws = useGalleryWorkspace();

  const handleCreate = async () => {
    const title = window.prompt('动态标题');
    if (!title?.trim()) return;
    await ws.createPost(title.trim(), '');
  };

  const handleDelete = async () => {
    if (!window.confirm('确认删除此动态？')) return;
    await ws.deletePost();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — post list */}
      <PostList
        posts={ws.posts}
        loading={ws.loading}
        selectedPostId={ws.selectedPost?.id ?? null}
        statusFilter={ws.statusFilter}
        onSelect={(id) => void ws.selectPost(id)}
        onFilterChange={ws.setStatusFilter}
        onCreate={() => void handleCreate()}
        onReload={() => void ws.reload()}
      />

      {/* Center — post detail */}
      {ws.selectedPost ? (
        <PostDetail
          post={ws.selectedPost}
          editing={ws.editing}
          actionMessage={ws.actionMessage}
          onEdit={() => ws.setEditing(true)}
          onCancelEdit={() => ws.setEditing(false)}
          onSave={(t, d) => void ws.updatePost(t, d)}
          onDelete={() => void handleDelete()}
          onPublish={() => void ws.publishPost()}
          onUnpublish={() => void ws.unpublishPost()}
          onUploadPhoto={(f) => void ws.uploadPhoto(f)}
          onDeletePhoto={(id) => void ws.deletePhoto(id)}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-base)' }}>
            选择一条动态，或点击"新建"
          </div>
        </div>
      )}

      {/* Right — info panel */}
      {ws.selectedPost && (
        <aside
          className="flex w-[200px] shrink-0 flex-col overflow-y-auto px-4 py-7"
          style={{ borderLeft: '0.5px solid var(--separator)' }}
        >
          <div
            className="mb-3.5 font-semibold uppercase"
            style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.06em' }}
          >
            信息
          </div>
          <InfoRow label="状态" value={ws.selectedPost.status === 'published' ? '已发布' : '草稿'} />
          <InfoRow label="照片数" value={`${ws.selectedPost.photoCount} 张`} />
          <InfoRow label="创建时间" value={new Date(ws.selectedPost.createdAt).toLocaleDateString('zh-CN')} />
          <InfoRow label="最后编辑" value={new Date(ws.selectedPost.updatedAt).toLocaleString('zh-CN')} />
        </aside>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <div style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)' }}>{label}</div>
      <div className="mt-0.5" style={{ color: 'var(--ink)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}
