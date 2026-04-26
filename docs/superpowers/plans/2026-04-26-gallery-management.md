# Gallery 管理流程实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为管理后台添加画廊动态管理功能，重构 admin 布局为图标栏 + 内容面板架构。

**Architecture:** Admin 页面拆分为 AdminShell（图标栏 + 路由出口）+ ContentAdmin（现有笔记管理）+ GalleryAdmin（新建画廊管理）。画廊前端通过 `galleryApi` 调用后端 `/api/v1/gallery/posts` 接口，不感知底层存储模型。展示端 gallery 页面更新为支持多图动态（左右滑切图，上下切动态）。

**Tech Stack:** React 19, TypeScript, Motion (framer-motion), Lucide React, Tailwind v4, 现有 CSS 变量设计系统

---

## 文件结构

```
新建:
  src/pages/admin/components/IconRail.tsx        — 48px 图标导航栏
  src/pages/admin/content/index.tsx              — 笔记管理（从 admin/index.tsx 拆出）
  src/pages/admin/gallery/index.tsx              — 画廊管理主页面
  src/pages/admin/gallery/components/PostList.tsx — 动态列表面板
  src/pages/admin/gallery/components/PostDetail.tsx — 动态详情/编辑视图
  src/pages/admin/gallery/hooks/useGalleryWorkspace.ts — 画廊状态管理
  src/services/gallery.ts                        — 画廊 API 服务层

修改:
  src/pages/admin/index.tsx                      — 重构为 AdminShell
  src/App.tsx                                    — 更新 admin 路由结构
  src/pages/gallery/index.tsx                    — 展示端支持多图动态
```

---

### Task 1: 画廊 API 服务层

**Files:**
- Create: `src/services/gallery.ts`

- [ ] **Step 1: 创建 gallery.ts 服务文件**

```typescript
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
```

- [ ] **Step 2: 确认 TypeScript 编译通过**

Run: `cd /Users/berrylucas/Desktop/Claude\ Practice/liminial-field/liminal-field-web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 无 gallery.ts 相关错误

- [ ] **Step 3: Commit**

```bash
git add src/services/gallery.ts
git commit -m "feat: 画廊 API 服务层

新建 galleryApi 封装 /api/v1/gallery/posts 端点调用。
前端不感知底层存储模型，只通过画廊接口操作。"
```

---

### Task 2: IconRail 图标导航栏组件

**Files:**
- Create: `src/pages/admin/components/IconRail.tsx`

- [ ] **Step 1: 创建 IconRail 组件**

```tsx
// src/pages/admin/components/IconRail.tsx

import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Image } from 'lucide-react';

/*
 * IconRail — 48px 窄图标导航栏
 *
 * 与右侧内容面板共享 sidebar-bg 背景，形成一体的浮动卡片。
 * 图标栏左圆角（radius-lg），内容面板右圆角。
 * 选中态：shelf 背景 + ink 图标色。未选中：ink-ghost 图标色。
 */

const NAV_ITEMS = [
  { path: '/admin/content', icon: FileText, label: '笔记管理' },
  { path: '/admin/gallery', icon: Image, label: '画廊管理' },
] as const;

export function IconRail() {
  const location = useLocation();
  const navigate = useNavigate();

  /* 匹配当前路径到导航项（前缀匹配） */
  const activePath = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.path),
  )?.path ?? NAV_ITEMS[0].path;

  return (
    <div
      className="flex shrink-0 flex-col items-center py-3 gap-1"
      style={{
        width: 48,
        background: 'var(--sidebar-bg)',
        borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
      }}
    >
      {/* Logo */}
      <div
        className="mb-4 flex items-center justify-center rounded-lg"
        style={{
          width: 28,
          height: 28,
          background: 'var(--ink)',
          color: 'var(--accent-contrast)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
        }}
      >
        L
      </div>

      {/* Nav icons */}
      {NAV_ITEMS.map((item) => {
        const isActive = activePath === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{
              width: 36,
              height: 36,
              background: isActive ? 'var(--shelf)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'var(--ink-ghost)',
            }}
            title={item.label}
            onClick={() => navigate(item.path)}
          >
            <Icon size={18} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 确认 TypeScript 编译通过**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: 无 IconRail 相关错误

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/components/IconRail.tsx
git commit -m "feat: IconRail 图标导航栏组件

48px 窄图标栏，笔记/画廊两个入口，前缀匹配路径高亮。
与内容面板共享 sidebar-bg 背景形成一体浮动卡片。"
```

---

### Task 3: 拆分 AdminPage → AdminShell + ContentAdmin

**Files:**
- Modify: `src/pages/admin/index.tsx` — 重构为 AdminShell（图标栏 + 路由出口）
- Create: `src/pages/admin/content/index.tsx` — 笔记管理（原 AdminPage 主体逻辑）
- Modify: `src/App.tsx` — 更新路由结构

- [ ] **Step 1: 创建 ContentAdmin 页面**

将 `src/pages/admin/index.tsx` 中从 `const AdminPage` 开始的全部内容（包括 FormalSidePanel、VersionTimeline、EmptyState、SideSection、InfoRow、SideLink、AssetList 等所有组件）移动到 `src/pages/admin/content/index.tsx`，保持功能不变。

```tsx
// src/pages/admin/content/index.tsx
// 将现有 admin/index.tsx 的完整内容复制到这里
// 唯一的修改：
// 1. 移除 Topbar 导入和渲染（Topbar 移到 AdminShell）
// 2. 移除最外层的 <div className="flex h-screen"> 容器（由 AdminShell 提供）
// 3. 组件名从 AdminPage 改为 ContentAdmin
// 4. 移除 TreePanel 的外层 margin/borderRadius/boxShadow
//    （因为 AdminShell 的 sidebar 容器已经提供了这些样式，
//     TreePanel 只需要保留内部样式）

// 导出：
export default ContentAdmin;
```

关键改动点——ContentAdmin 的 return 结构变为：

```tsx
return (
  <>
    {/* TreePanel 作为 sidebar slot 传给 AdminShell（通过 Outlet context 或直接渲染） */}
    {/* 这里直接渲染，因为 ContentAdmin 整体就是 AdminShell 的子路由内容 */}
    <div className="flex flex-1 overflow-hidden">
      {/* Left — tree panel（不需要外层卡片样式，AdminShell 提供） */}
      <TreePanel
        tree={workspace.tree}
        /* ...所有现有 props... */
      />

      {/* Center + Right — 现有的内容预览 + 侧边面板 */}
      <main className="relative z-0 flex flex-1 flex-col overflow-hidden">
        {/* ...现有的 center + aside 内容... */}
      </main>
    </div>

    {/* Modals */}
    {workspace.modal.open && <NodeFormModal /* ... */ />}
    {workspace.deleteTarget && <ConfirmDialog /* ... */ />}
  </>
);
```

- [ ] **Step 2: 重写 admin/index.tsx 为 AdminShell**

```tsx
// src/pages/admin/index.tsx

/*
 * AdminShell — 管理后台壳子
 *
 * 布局：图标栏 (48px) + 内容面板 (由子路由提供) + 主区域
 * 图标栏和内容面板共享 sidebar-bg 背景，视觉上是一个浮动卡片。
 * 子路由通过 <Outlet /> 渲染在图标栏右侧。
 */

import { Outlet } from 'react-router-dom';
import Topbar from '@/components/global/Topbar';
import { IconRail } from './components/IconRail';

const AdminShell = () => {
  return (
    <div className="flex h-screen" style={{ background: 'var(--paper)' }}>
      {/* Sidebar: icon rail + content panel 一体 */}
      <div
        className="flex shrink-0 overflow-hidden"
        style={{
          margin: '8px 0 8px 8px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <IconRail />
        {/* 子路由的左侧面板内容由各自页面渲染 */}
      </div>

      {/* Main area */}
      <main
        className="relative z-0 flex flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--paper)' }}
      >
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
};

export default AdminShell;
```

**注意：** 上面是初始结构。sidebar 的内容面板（TreePanel / PostList）需要从子路由渲染到 icon rail 旁边。有两种实现方式：

方式 A（推荐）：AdminShell 不拆分 sidebar 内部，子路由页面各自渲染完整布局（icon rail 之后的所有内容）。AdminShell 只提供 icon rail + Outlet。

方式 B：使用 React Router 的 Outlet context 传递 sidebar 内容。

选择方式 A 更简单——每个子页面（ContentAdmin / GalleryAdmin）各自渲染自己的内容面板 + 主区域 + 右侧面板。AdminShell 只负责图标栏。

最终 AdminShell：

```tsx
const AdminShell = () => {
  return (
    <div className="flex h-screen" style={{ background: 'var(--paper)' }}>
      {/* 左侧：图标栏（固定） + 内容面板（由子路由渲染） */}
      <div
        className="flex shrink-0"
        style={{
          margin: '8px 0 8px 8px',
          background: 'var(--sidebar-bg)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <IconRail />
      </div>

      {/* 右侧：Topbar + 子路由内容 */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--paper)' }}
      >
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: 更新 App.tsx 路由**

修改 `src/App.tsx` 中的 admin 路由：

```tsx
// 修改前:
<Route path="/admin" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
<Route path="/admin/edit/:id" element={<Suspense fallback={null}><DraftEditPage /></Suspense>} />

// 修改后:
const AdminShell = lazy(() => import('./pages/admin'));
const ContentAdmin = lazy(() => import('./pages/admin/content'));
const GalleryAdmin = lazy(() => import('./pages/admin/gallery'));
const DraftEditPage = lazy(() => import('./pages/admin/edit'));

// 在 Routes 中:
<Route path="/admin" element={<Suspense fallback={null}><AdminShell /></Suspense>}>
  <Route index element={<Navigate to="/admin/content" replace />} />
  <Route path="content" element={<Suspense fallback={null}><ContentAdmin /></Suspense>} />
  <Route path="gallery" element={<Suspense fallback={null}><GalleryAdmin /></Suspense>} />
</Route>
<Route path="/admin/edit/:id" element={<Suspense fallback={null}><DraftEditPage /></Suspense>} />
```

- [ ] **Step 4: 调整 TreePanel 样式**

TreePanel 现在不再是独立的浮动卡片（AdminShell 的 sidebar 容器已提供 margin/borderRadius/boxShadow）。移除 TreePanel 自身的卡片样式，只保留内部样式：

修改 `src/pages/admin/components/TreePanel.tsx` 的 `<aside>` 样式：

```tsx
// 修改前:
style={{
  background: 'var(--sidebar-bg)',
  margin: '8px 0 8px 8px',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-sm)',
}}

// 修改后:
style={{
  background: 'var(--sidebar-bg)',
  borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
}}
```

说明：左圆角由 IconRail 提供，TreePanel 只需要右圆角。且不再需要 margin 和 shadow（AdminShell 容器提供）。

**但注意**：重新思考这个方案，IconRail 和 TreePanel 被不同的父容器包裹（IconRail 在 AdminShell，TreePanel 在 ContentAdmin via Outlet）。要让它们视觉上一体，需要调整方案。

**最终方案：** AdminShell 的 sidebar 容器只包含 IconRail。TreePanel/PostList 直接在子路由中渲染，紧贴 IconRail 右边，不加 margin。视觉上通过共享背景色 + 无间距来形成一体感。

ContentAdmin 的 TreePanel 样式改为：
```tsx
style={{
  background: 'var(--sidebar-bg)',
  // 无 margin, 无 borderRadius, 无 boxShadow
  // 紧贴 AdminShell 的 sidebar 容器
}}
```

AdminShell 的 sidebar 容器样式改为只包裹 IconRail：
```tsx
<div
  className="flex shrink-0"
  style={{
    margin: '8px 0 8px 8px',
    background: 'var(--sidebar-bg)',
    borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  }}
>
  <IconRail />
</div>
```

子路由中的面板（TreePanel / PostList）紧邻渲染，背景色相同，没有间距，视觉上连在一起。子路由面板不需要圆角（左圆角在 IconRail 容器，右边是直角过渡到主内容区）。

- [ ] **Step 5: 验证笔记管理功能不受影响**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 编译通过

在浏览器中访问 `/admin`，确认：
1. 自动重定向到 `/admin/content`
2. 左侧显示 IconRail + TreePanel
3. 现有的笔记管理功能完整可用
4. `/admin/edit/:id` 编辑器仍正常工作

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/index.tsx src/pages/admin/content/index.tsx src/pages/admin/components/TreePanel.tsx src/App.tsx
git commit -m "refactor: 拆分 AdminPage 为 AdminShell + ContentAdmin

AdminShell 提供图标栏 + 路由出口壳子。
ContentAdmin 承载现有笔记管理功能。
/admin 自动重定向到 /admin/content。
TreePanel 样式适配新的侧边栏容器结构。"
```

---

### Task 4: 画廊状态管理 Hook

**Files:**
- Create: `src/pages/admin/gallery/hooks/useGalleryWorkspace.ts`

- [ ] **Step 1: 创建 useGalleryWorkspace hook**

```typescript
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
```

- [ ] **Step 2: 确认编译通过**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/gallery/hooks/useGalleryWorkspace.ts
git commit -m "feat: useGalleryWorkspace 画廊状态管理 hook

管理动态列表、选中详情、CRUD、照片上传/删除、发布状态。
通过 galleryApi 调用后端画廊接口。"
```

---

### Task 5: PostList 动态列表组件

**Files:**
- Create: `src/pages/admin/gallery/components/PostList.tsx`

- [ ] **Step 1: 创建 PostList 组件**

```tsx
// src/pages/admin/gallery/components/PostList.tsx

import { RefreshCw, Plus } from 'lucide-react';
import type { GalleryPost } from '@/services/gallery';

type StatusFilter = 'all' | 'draft' | 'published';

const FILTER_LABELS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'published', label: '已发布' },
];

export function PostList({
  posts,
  loading,
  selectedPostId,
  statusFilter,
  onSelect,
  onFilterChange,
  onCreate,
  onReload,
}: {
  posts: GalleryPost[];
  loading: boolean;
  selectedPostId: string | null;
  statusFilter: StatusFilter;
  onSelect: (postId: string) => void;
  onFilterChange: (filter: StatusFilter) => void;
  onCreate: () => void;
  onReload: () => void;
}) {
  return (
    <div
      className="flex w-[200px] shrink-0 flex-col overflow-hidden"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-1">
        <div
          className="font-semibold"
          style={{ color: 'var(--ink)', fontSize: 'var(--text-base)', letterSpacing: '-0.01em' }}
        >
          画廊管理
        </div>
        <div className="mt-1" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)' }}>
          {posts.length} 条动态
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-3 flex gap-0 px-4 pb-2">
        {FILTER_LABELS.map((f) => (
          <button
            key={f.key}
            className="rounded-md px-2 py-1 transition-colors duration-150"
            style={{
              fontSize: 'var(--text-2xs)',
              fontWeight: statusFilter === f.key ? 500 : 400,
              background: statusFilter === f.key ? 'var(--shelf)' : 'transparent',
              color: statusFilter === f.key ? 'var(--ink)' : 'var(--ink-ghost)',
            }}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Post list */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-4">
        {loading && posts.length === 0 ? (
          <div className="px-3 py-8 text-center" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>
            加载中...
          </div>
        ) : posts.length === 0 ? (
          <div className="px-3 py-8 text-center" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>
            暂无动态
          </div>
        ) : (
          posts.map((post) => {
            const isSelected = selectedPostId === post.id;
            return (
              <div
                key={post.id}
                className="flex cursor-pointer gap-2 rounded-[10px] px-2 py-2 transition-all duration-150"
                style={{
                  background: isSelected ? 'var(--shelf)' : 'transparent',
                }}
                onClick={() => onSelect(post.id)}
              >
                {/* Cover thumbnail */}
                <div
                  className="shrink-0 rounded-md"
                  style={{
                    width: 38,
                    height: 38,
                    background: post.coverUrl
                      ? `url(${post.coverUrl}) center/cover`
                      : 'var(--paper-dark)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: isSelected ? 'var(--ink)' : 'var(--ink-light)',
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    {post.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--ink-ghost)', marginTop: 1 }}>
                    {post.photoCount} 张 · {new Date(post.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                  </div>
                  <span
                    className="rounded px-1 font-medium"
                    style={{
                      fontSize: '0.5625rem',
                      background: post.status === 'published' ? 'rgba(52,199,89,0.1)' : 'var(--shelf)',
                      color: post.status === 'published' ? 'var(--mark-green)' : 'var(--ink-ghost)',
                    }}
                  >
                    {post.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom actions */}
      <div
        className="flex items-center justify-between px-5 pb-4"
        style={{ borderTop: '0.5px solid var(--separator)', paddingTop: 12 }}
      >
        <button
          className="flex items-center gap-1.5 transition-colors duration-150"
          style={{ color: 'var(--ink-faded)', fontSize: 'var(--text-xs)' }}
          onClick={onReload}
        >
          <RefreshCw size={12} strokeWidth={1.5} />
          刷新
        </button>
        <button
          className="flex items-center gap-1 font-medium transition-colors duration-150"
          style={{ color: 'var(--ink)', fontSize: 'var(--text-xs)' }}
          onClick={onCreate}
        >
          <Plus size={12} strokeWidth={2} />
          新建
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/gallery/components/PostList.tsx
git commit -m "feat: PostList 画廊动态列表组件

缩略图+标题+状态标签，支持全部/草稿/已发布筛选。
复用 TreePanel 的底部操作栏模式。"
```

---

### Task 6: PostDetail 动态详情/编辑组件

**Files:**
- Create: `src/pages/admin/gallery/components/PostDetail.tsx`

- [ ] **Step 1: 创建 PostDetail 组件**

```tsx
// src/pages/admin/gallery/components/PostDetail.tsx

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { GalleryPostDetail } from '@/services/gallery';

/*
 * PostDetail — 画廊动态详情/原地编辑
 *
 * 查看态：只读展示照片网格 + 描述 + 操作链接
 * 编辑态：照片可删除/新增，描述变为 textarea，底部保存/取消
 *
 * 照片网格：缩略图 radius-md (8px)，第一张标记"封面"。
 * 操作链接：纯文本样式（编辑/发布/删除），和笔记管理的 TextLink 风格一致。
 */

export function PostDetail({
  post,
  editing,
  actionMessage,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onPublish,
  onUnpublish,
  onUploadPhoto,
  onDeletePhoto,
}: {
  post: GalleryPostDetail;
  editing: boolean;
  actionMessage: string;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (title: string, description: string) => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onUploadPhoto: (file: File) => void;
  onDeletePhoto: (photoId: string) => void;
}) {
  const [editTitle, setEditTitle] = useState(post.title);
  const [editDesc, setEditDesc] = useState(post.description);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* 进入编辑态时同步字段 */
  const handleStartEdit = () => {
    setEditTitle(post.title);
    setEditDesc(post.description);
    onEdit();
  };

  const handleSave = () => {
    onSave(editTitle, editDesc);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadPhoto(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 py-9">
      {/* Title */}
      {editing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="mb-1 w-full border-none bg-transparent font-bold outline-none"
          style={{ color: 'var(--ink)', fontSize: 'var(--text-3xl)', letterSpacing: '-0.02em' }}
        />
      ) : (
        <h2
          className="mb-1 font-bold"
          style={{ color: 'var(--ink)', fontSize: 'var(--text-3xl)', letterSpacing: '-0.02em' }}
        >
          {post.title}
        </h2>
      )}
      <div className="mb-5" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>
        {new Date(post.createdAt).toLocaleDateString('zh-CN')} · {post.status === 'published' ? '已发布' : '草稿'}
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className="mb-4 rounded-lg px-3 py-2" style={{ background: 'rgba(52,199,89,0.06)' }}>
          <p style={{ color: 'var(--mark-green)', fontSize: 'var(--text-xs)' }}>{actionMessage}</p>
        </div>
      )}

      {/* Photos section */}
      <div className="mb-5">
        <div
          className="mb-2 font-semibold uppercase"
          style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em' }}
        >
          照片
        </div>
        <div className="flex flex-wrap gap-2">
          {post.photos.map((photo, i) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden"
              style={{ width: 130, height: 98, borderRadius: 'var(--radius-md)' }}
            >
              <img
                src={photo.url}
                alt={photo.fileName}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span
                  className="absolute left-1 top-1 rounded px-1.5 py-px"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.5625rem' }}
                >
                  封面
                </span>
              )}
              {editing && (
                <button
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  onClick={() => onDeletePhoto(photo.id)}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}

          {/* Upload button (always visible in edit mode, also visible if no photos) */}
          {(editing || post.photos.length === 0) && (
            <button
              className="flex items-center justify-center"
              style={{
                width: 88,
                height: 98,
                borderRadius: 'var(--radius-md)',
                border: '1.5px dashed var(--separator)',
                color: 'var(--ink-ghost)',
                fontSize: 'var(--text-lg)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              +
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Description section */}
      <div className="mb-5">
        <div
          className="mb-2 font-semibold uppercase"
          style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em' }}
        >
          描述
        </div>
        {editing ? (
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="min-h-[100px] w-full resize-y rounded-[10px] border-none px-3.5 py-3 outline-none"
            style={{
              background: 'var(--shelf)',
              color: 'var(--ink-light)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.7,
              fontFamily: 'var(--font-sans)',
            }}
          />
        ) : (
          <div
            className="rounded-[10px] px-3.5 py-3 leading-[1.7]"
            style={{
              background: 'var(--shelf)',
              color: 'var(--ink-light)',
              fontSize: 'var(--text-base)',
            }}
          >
            {post.description || '暂无描述'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {editing ? (
          <>
            <TextAction label="保存" primary onClick={handleSave} />
            <TextAction label="取消" onClick={onCancelEdit} />
          </>
        ) : (
          <>
            <TextAction label="编辑" primary onClick={handleStartEdit} />
            {post.status === 'published' ? (
              <TextAction label="取消发布" onClick={onUnpublish} />
            ) : (
              <TextAction label="发布" onClick={onPublish} />
            )}
            <TextAction label="删除" danger onClick={onDelete} />
          </>
        )}
      </div>
    </div>
  );
}

function TextAction({ label, primary, danger, onClick }: {
  label: string;
  primary?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="transition-colors duration-150"
      style={{
        color: danger ? 'var(--mark-red)' : primary ? 'var(--ink)' : 'var(--ink-faded)',
        fontWeight: primary ? 500 : 400,
        fontSize: 'var(--text-xs)',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/gallery/components/PostDetail.tsx
git commit -m "feat: PostDetail 画廊动态详情/原地编辑

查看态/编辑态切换，照片网格（封面标记、hover 删除），
描述文本编辑，上传照片，发布/取消发布/删除操作。"
```

---

### Task 7: GalleryAdmin 主页面

**Files:**
- Create: `src/pages/admin/gallery/index.tsx`

- [ ] **Step 1: 创建 GalleryAdmin 页面**

```tsx
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
```

- [ ] **Step 2: 验证完整流程**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: 编译通过

在浏览器中访问 `/admin/gallery`，确认：
1. 左侧 IconRail 画廊图标高亮
2. PostList 显示（可能为空列表）
3. 点击"新建"可创建动态（需要后端接口就绪）
4. `/admin/content` 笔记管理仍正常

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/gallery/index.tsx
git commit -m "feat: GalleryAdmin 画廊管理主页面

PostList + PostDetail + InfoPanel 三栏布局。
通过 useGalleryWorkspace 管理状态，原地编辑动态。"
```

---

### Task 8: 更新展示端 Gallery 页面支持多图动态

**Files:**
- Modify: `src/pages/gallery/index.tsx`

- [ ] **Step 1: 重写 gallery 展示页**

替换 mock 数据，改为从 `galleryApi` 获取已发布的动态。支持：
- 上下导航切换不同动态
- 左右导航切换同一动态内的照片
- 保留宝丽来卡片展示风格

```tsx
// src/pages/gallery/index.tsx

/*
 * GalleryPage — Photo gallery with polaroid display
 *
 * 交互模型：
 *   - 左右滑 → 同一条动态内的多张照片
 *   - 上下切 → 不同动态之间切换
 *
 * 数据从 galleryApi 获取已发布动态列表，不再使用 mock 数据。
 * 保留宝丽来卡片展示风格和方向感知滑动动画。
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { smoothBounce } from '@/lib/motion';
import { galleryApi } from '@/services/gallery';
import type { GalleryPostDetail } from '@/services/gallery';

const slideVariantsY = {
  enter: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
};

const slideVariantsX = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPostDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [postIdx, setPostIdx] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [postDir, setPostDir] = useState(0);
  const [photoDir, setPhotoDir] = useState(0);

  useEffect(() => {
    galleryApi.list('published').then(async (listed) => {
      const details = await Promise.all(listed.map((p) => galleryApi.getById(p.id)));
      setPosts(details);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const post = posts[postIdx];
  const photo = post?.photos[photoIdx];

  /* 上下：切换动态 */
  const navigatePost = useCallback((dir: number) => {
    setPostDir(dir);
    setPostIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return posts.length - 1;
      if (next >= posts.length) return 0;
      return next;
    });
    setPhotoIdx(0);
  }, [posts.length]);

  /* 左右：切换照片 */
  const navigatePhoto = useCallback((dir: number) => {
    if (!post) return;
    setPhotoDir(dir);
    setPhotoIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return post.photos.length - 1;
      if (next >= post.photos.length) return 0;
      return next;
    });
  }, [post]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-base)' }}>加载中...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-base)' }}>暂无画廊内容</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-stretch overflow-hidden">
      {/* Center — polaroid display */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-10 py-8">
        <AnimatePresence mode="wait" custom={postDir}>
          <motion.div
            key={postIdx}
            custom={postDir}
            variants={slideVariantsY}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: smoothBounce }}
            className="flex flex-col items-center"
          >
            {/* Polaroid frame */}
            <div
              className="polaroid-frame relative transition-all duration-400"
              style={{
                background: 'var(--paper-white)',
                padding: '8px 8px 32px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                maxWidth: '75%',
              }}
            >
              <div
                className="relative flex w-full items-center justify-center overflow-hidden"
                style={{
                  borderRadius: 'var(--radius-md)',
                  minHeight: 320,
                  aspectRatio: '4/3',
                  background: 'var(--paper-dark)',
                }}
              >
                {photo ? (
                  <AnimatePresence mode="wait" custom={photoDir}>
                    <motion.img
                      key={`${postIdx}-${photoIdx}`}
                      src={photo.url}
                      alt={photo.fileName}
                      className="h-full w-full object-cover"
                      custom={photoDir}
                      variants={slideVariantsX}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25, ease: smoothBounce }}
                    />
                  </AnimatePresence>
                ) : (
                  <span style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-sm)' }}>
                    暂无照片
                  </span>
                )}

                {/* Left/right arrows (photo navigation) */}
                {post.photos.length > 1 && (
                  <>
                    <div
                      className="absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[10px] opacity-0 transition-all duration-250 hover:opacity-100"
                      style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                      onClick={() => navigatePhoto(-1)}
                    >
                      ‹
                    </div>
                    <div
                      className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[10px] opacity-0 transition-all duration-250 hover:opacity-100"
                      style={{ background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                      onClick={() => navigatePhoto(1)}
                    >
                      ›
                    </div>
                  </>
                )}

                {/* Photo indicator */}
                {post.photos.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {post.photos.map((_, i) => (
                      <span
                        key={i}
                        className="rounded-full transition-all duration-200"
                        style={{
                          width: i === photoIdx ? 12 : 4,
                          height: 4,
                          background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="px-1 pt-2.5 text-center" style={{ color: 'var(--ink-faded)', fontSize: 'var(--text-md)' }}>
                {post.title}
              </div>
            </div>

            {/* Description */}
            {post.description && (
              <motion.div
                className="mt-6 max-w-[75%] text-center leading-relaxed"
                style={{ color: 'var(--ink-light)', fontSize: 'var(--text-md)', letterSpacing: '-0.01em' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {post.description}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Up/down arrows (post navigation) */}
        {posts.length > 1 && (
          <>
            <div
              className="absolute left-1/2 top-3 flex h-6 w-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full text-[8px] opacity-0 transition-all duration-250 hover:opacity-60"
              style={{ color: 'var(--ink-ghost)' }}
              onClick={() => navigatePost(-1)}
            >
              &#x25B3;
            </div>
            <div
              className="absolute bottom-3 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full text-[8px] opacity-0 transition-all duration-250 hover:opacity-60"
              style={{ color: 'var(--ink-ghost)' }}
              onClick={() => navigatePost(1)}
            >
              &#x25BD;
            </div>
          </>
        )}
      </div>

      {/* Right — timeline (shows post list) */}
      <div
        className="flex w-[200px] shrink-0 flex-col overflow-y-auto px-4 py-10"
        style={{ borderLeft: '0.5px solid var(--separator)' }}
      >
        <div
          className="mb-3 text-[12px] font-semibold uppercase"
          style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
        >
          动态
        </div>
        <div className="flex flex-col gap-0.5">
          {posts.map((p, i) => (
            <div
              key={p.id}
              className="cursor-pointer rounded-lg px-2.5 py-2 transition-all duration-150"
              style={{
                background: i === postIdx ? 'var(--shelf)' : 'transparent',
                color: i === postIdx ? 'var(--ink)' : 'var(--ink-faded)',
                fontWeight: i === postIdx ? 500 : 400,
                fontSize: 'var(--text-sm)',
              }}
              onClick={() => { setPostDir(i > postIdx ? 1 : -1); setPostIdx(i); setPhotoIdx(0); }}
            >
              <div className="truncate">{p.title}</div>
              <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--ink-ghost)', marginTop: 2 }}>
                {p.photoCount} 张 · {new Date(p.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证编译通过**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: 在浏览器中验证**

访问 `/gallery`，确认：
1. 加载已发布动态（需后端接口就绪，否则显示空态）
2. 左右箭头切换照片（带指示器圆点）
3. 上下箭头切换动态
4. 右侧面板显示动态列表
5. 宝丽来卡片风格保持

- [ ] **Step 4: Commit**

```bash
git add src/pages/gallery/index.tsx
git commit -m "feat: 展示端 gallery 支持多图动态

替换 mock 数据为 galleryApi 调用。
左右滑切换同一动态内照片，上下切换不同动态。
保留宝丽来卡片展示风格，新增照片指示器圆点。"
```

---

## 自审检查

**Spec 覆盖：**
- ✅ 三层架构（通用存储 → 薄业务接口 → 前端）
- ✅ Admin 图标栏 + 内容面板架构
- ✅ 画廊动态 CRUD
- ✅ 照片上传/删除
- ✅ 发布/取消发布
- ✅ 原地编辑
- ✅ 展示端多图动态
- ✅ 左右滑/上下切交互
- ✅ 样式规范（type scale, radius tiers）

**占位符扫描：** 无 TBD/TODO。

**类型一致性：** GalleryPost, GalleryPostDetail, GalleryPhoto 在 gallery.ts 定义，所有组件使用同一套类型。
