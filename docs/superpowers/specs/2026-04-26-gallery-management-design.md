# Gallery 管理流程设计

## 概述

为 Liminal Field 添加画廊动态管理功能。画廊动态是类似朋友圈/微博的图文帖子，每条动态包含 1~N 张照片和一段描述文字。

## 核心决策

### 数据模型

复用现有的统一存储（结构树 + 内容项），不新建独立数据模型。一条画廊动态就是一个内容项，照片作为 assets 附件存储。

**一条动态的数据结构：**
- 照片（1~N 张，通过 assets 系统存储）
- 描述文字（存在 bodyMarkdown 或 summary 字段中）
- 发布状态：草稿 / 已发布
- 封面照片：第一张图作为封面，用于列表缩略图

**简化的草稿流程：**
- 有草稿能力（可以存着不发），但不追踪版本历史
- 发布后可以编辑，直接覆盖，不产生新版本
- 不需要笔记那样的 draft → commit → publish 三步流程

### Admin 架构 — 图标栏 + 内容面板

重构 `/admin` 布局为：

```
图标栏 (48px) + 内容面板 (200px) + 主区域 + 右侧面板
```

**图标栏（48px）：**
- 顶部：Logo
- 中间：模块图标（笔记、画廊，以后可扩展更多）
- 底部：设置（预留）
- 选中态：背景高亮 + 图标变深
- 视觉上与内容面板一体（共享 sidebar-bg 背景，图标栏左圆角，面板右圆角）

**内容面板（200px）：**
- 笔记模式：现有的 TreePanel（树形结构）
- 画廊模式：动态列表（缩略图 + 标题 + 照片数 + 状态标签）
  - 顶部筛选：全部 / 草稿 / 已发布
  - 底部操作：刷新 / 新建

### 画廊管理视图

选中一条动态后，中间主区域显示：

- **标题** — 动态标题（如"青岛 · 栈桥"）
- **照片网格** — 已上传的图片缩略图 + 添加按钮（`+`）
  - 第一张标记"封面"
  - 可拖拽排序
- **描述** — 文本编辑区
- **操作链接** — 编辑 / 发布(取消发布) / 删除

右侧面板显示简要信息：状态、照片数、创建时间、最后编辑时间。

### 展示端交互

画廊展示页（`/gallery`）：
- **左右滑** → 同一条动态内的多张照片
- **上下切** → 不同动态之间切换
- 保留现有的宝丽来卡片展示风格

## 路由结构

```
/admin                → AdminShell (图标栏 + 内容面板)
/admin/content        → 笔记管理 (现有 TreePanel + ContentVersionView)
/admin/gallery        → 画廊管理 (PostList + PostDetail)
/admin/edit/:id       → 草稿编辑器 (现有，不变)
```

默认 `/admin` 重定向到 `/admin/content`。

## 前端组件结构

```
src/pages/admin/
├── index.tsx              → AdminShell (图标栏 + 路由出口)
├── content/
│   └── index.tsx          → 现有笔记管理 (从 admin/index.tsx 拆出)
├── gallery/
│   ├── index.tsx          → GalleryAdmin (列表 + 详情 + 信息面板)
│   ├── components/
│   │   ├── PostList.tsx   → 左侧动态列表
│   │   ├── PostDetail.tsx → 中间详情/编辑视图
│   │   └── PostForm.tsx   → 新建/编辑动态表单
│   └── hooks/
│       └── useGalleryWorkspace.ts → 画廊状态管理
├── components/
│   ├── IconRail.tsx       → 48px 图标导航栏
│   ├── TreePanel.tsx      → (现有)
│   └── ...
```

## 后端 API

复用现有的 content-items API。画廊动态通过结构树中一个专用的根文件夹区分——约定一个名为 `_gallery` 的根节点，其下的所有 DOC 子节点即为画廊动态。前端通过该父节点 ID 查询子节点列表。

关键端点（全部已有）：
- `GET /api/v1/structure-nodes/:galleryRootId/children` — 获取画廊动态列表
- `POST /api/v1/structure-nodes` — 在 gallery 根节点下创建新动态节点
- `GET/PUT /api/v1/contents/:id` — 读取/更新动态内容
- `POST/GET /api/v1/contents/:id/assets` — 上传/列出照片
- `DELETE /api/v1/structure-nodes/:id` — 删除动态

不需要新增后端端点。

### 编辑交互

画廊动态的编辑是**原地编辑**（inline），不跳转到 `/admin/edit/:id`。PostDetail 组件在查看态和编辑态之间切换：
- 查看态：只读展示照片网格 + 描述文字 + 操作链接
- 编辑态：照片可拖拽排序/删除/新增，描述变为 textarea，底部显示保存/取消按钮

## 样式规范

遵循现有设计系统：
- 图标栏 + 面板：sidebar-bg (#F2F2F2)，radius-lg (10px)，shadow-sm
- 动态列表项：radius-lg (10px) hover/selected，缩略图 radius-sm (6px)
- 状态标签：已发布 mark-green，草稿 ink-ghost
- 照片网格：缩略图 radius-md (8px)
- 所有字体使用 CSS type scale 变量
