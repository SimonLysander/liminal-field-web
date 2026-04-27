# Workspace 统一业务层架构设计

## 目标

将后端从"gallery/notes 各自为政"重构为"统一 workspace 业务层 + scope 隔离"，明确三层职责：ContentRepo（纯存储）→ Navigation（业务索引）→ Workspace（薄业务层）。

## 架构原则

```
┌─────────────────────────────────────────────┐
│  Workspace Module（薄业务层）                │
│  workspace.service    — scope 驱动的通用 CRUD │
│  note-view.service    — 草稿、版本、树形结构   │
│  gallery-view.service — 封面图、照片列表       │
│  ↓ 查索引               ↓ 拿 ref 读写        │
├──────────────────────┬──────────────────────┤
│  Navigation (MongoDB)│  Content (Git + FS)  │
│  业务索引层           │  纯存储层             │
│  scope 隔离           │  不感知业务           │
│  树形/平铺均可        │  read/write by ID    │
└──────────────────────┴──────────────────────┘
```

- **Content Module**：不出现任何业务概念（无 category、无 scope）。只暴露按 ID 的读写。
- **Navigation Module**：唯一知道"这个 content 属于谁"的地方。通过 `scope` 字段隔离业务模块。
- **Workspace Module**：薄业务层。查 Navigation 拿 ref，去 Content 读写。新增 scope 只需加枚举值 + 可选的 ViewService。

## NavigationNode 变更

### Entity

```typescript
NavigationNode {
  _id: ObjectId
  scope: 'notes' | 'gallery'    // 新增，必填，默认 'notes'
  name: string
  parentId?: ObjectId
  nodeType: 'subject' | 'content'
  contentItemId?: string
  order: number
  createdAt: Date
  updatedAt: Date | null
}
```

### 索引

新增复合索引：`{ scope: 1, parentId: 1 }`

### Repository 改动

- `listByParentId(parentId?, scope?)` — 加 scope 过滤
- `findRootNodes(scope)` — 按 scope 查根���点
- 按 ID 查的方法不需要改（ID 已唯一）

### Service 改动

- `listStructureNodes` 加 `scope` 参数，默认 `'notes'`
- 创建节点时必须传 scope

## Workspace Module 结构

```
src/modules/workspace/
  workspace.module.ts           — import ContentModule + NavigationModule
  workspace.controller.ts       — 统一路由
  workspace.service.ts          — scope 驱动的通用 CRUD + 发布/取消发布
  note-view.service.ts          — 笔记特有：草稿、版本历史、树形结构
  gallery-view.service.ts       — 画廊特有：封面图、照片列表、照片 URL
  dto/
```

### WorkspaceService（通用）

处理所有 scope 共享的流程：

- **create(scope, dto)** — contentService.createContent + navRepo.create(scope)
- **list(scope, filters)** — navRepo.findRootNodes(scope) → content enrich
- **getById(scope, id)** — content detail + scope 特有视图
- **update(scope, id, dto)** — contentService.saveContent + navRepo.update name
- **delete(scope, id)** — navRepo.delete（级联）
- **publish(scope, id)** — contentService.saveContent(action=publish)
- **unpublish(scope, id)** — contentService.saveContent(action=unpublish)
- **uploadAsset(scope, id, file)** — contentRepoService.storeAsset
- **listAssets(scope, id)** — contentRepoService.listAssets

### NoteViewService

从现有 EditorModule + ContentController 迁入：

- 草稿 CRUD（saveDraft, getDraft, deleteDraft）
- 版本历史（getHistory, getByVersion）
- 树形结构的展示逻辑（配合 NavigationService 的 scope 查询）

### GalleryViewService

从现有 GalleryService 迁入：

- 从 asset 列表推导封面图（第一张 image asset）
- 照片计数
- 照片 URL 构建
- 照片直出（readAssetBuffer���

## 统一 API 路由

### 通用路由

```
GET    /spaces/:scope/items              — 列表
POST   /spaces/:scope/items              — 创建
GET    /spaces/:scope/items/:id          — 详情
PUT    /spaces/:scope/items/:id          — 更新
DELETE /spaces/:scope/items/:id          — 删除
PUT    /spaces/:scope/items/:id/publish  — 发布
PUT    /spaces/:scope/items/:id/unpublish — 取消发布
POST   /spaces/:scope/items/:id/assets   — 上传附件
GET    /spaces/:scope/items/:id/assets   — 附��列表
```

### 笔记特有路由

```
GET    /spaces/notes/items/:id/draft          — 获取草稿
PUT    /spaces/notes/items/:id/draft          — 保存草稿
DELETE /spaces/notes/items/:id/draft          — 删除草稿
GET    /spaces/notes/items/:id/history        — 版本历史
GET    /spaces/notes/items/:id/versions/:hash — 版本详情
```

### 画廊特有路由

```
GET    /spaces/gallery/items/:id/assets/:fileName — 图片文件直出
```

### 结构树路由（NavigationModule 保留）

```
GET    /structure-nodes          — 加 scope query 参数
POST   /structure-nodes          — body 带 scope
PUT    /structure-nodes/:id
DELETE /structure-nodes/:id
GET    /structure-nodes/:id/path
GET    /structure-nodes/:id/delete-stats
POST   /structure-nodes/reorder
```

### 旧路由迁移对照

| 旧路由 | 新路由 |
|--------|--------|
| `GET /contents` | `GET /spaces/notes/items` |
| `POST /contents` | `POST /spaces/notes/items` |
| `GET /contents/:id` | `GET /spaces/notes/items/:id` |
| `PUT /contents/:id` | `PUT /spaces/notes/items/:id` |
| `GET /contents/:id/draft` | `GET /spaces/notes/items/:id/draft` |
| `PUT /contents/:id/draft` | `PUT /spaces/notes/items/:id/draft` |
| `DELETE /contents/:id/draft` | `DELETE /spaces/notes/items/:id/draft` |
| `GET /contents/:id/history` | `GET /spaces/notes/items/:id/history` |
| `GET /contents/:id/versions/:hash` | `GET /spaces/notes/items/:id/versions/:hash` |
| `POST /contents/:id/assets` | `POST /spaces/notes/items/:id/assets` |
| `GET /contents/:id/assets` | `GET /spaces/notes/items/:id/assets` |
| `GET /gallery/posts` | `GET /spaces/gallery/items` |
| `POST /gallery/posts` | `POST /spaces/gallery/items` |
| `GET /gallery/posts/:id` | `GET /spaces/gallery/items/:id` |
| `PUT /gallery/posts/:id` | `PUT /spaces/gallery/items/:id` |
| `DELETE /gallery/posts/:id` | `DELETE /spaces/gallery/items/:id` |
| `PUT /gallery/posts/:id/publish` | `PUT /spaces/gallery/items/:id/publish` |
| `PUT /gallery/posts/:id/unpublish` | `PUT /spaces/gallery/items/:id/unpublish` |
| `GET /gallery/photos/:id/:fn` | `GET /spaces/gallery/items/:id/assets/:fn` |

## 数据迁移

### MongoDB（navigation_nodes 表）

```javascript
// 1. 所有现有节点设为 notes
db.navigation_nodes.updateMany(
  { scope: { $exists: false } },
  { $set: { scope: 'notes' } }
)

// 2. 找到 __gallery__ 根节点
const galleryRoot = db.navigation_nodes.findOne({
  name: '__gallery__', parentId: null
})

// 3. 子节点改为 scope=gallery，parentId 置 null（平铺）
if (galleryRoot) {
  db.navigation_nodes.updateMany(
    { parentId: galleryRoot._id },
    { $set: { scope: 'gallery', parentId: null } }
  )
  // 4. 删除 __gallery__ 根节点
  db.navigation_nodes.deleteOne({ _id: galleryRoot._id })
}

// 5. 加复合索引
db.navigation_nodes.createIndex({ scope: 1, parentId: 1 })
```

### ContentItem 表

回退之前添加的 `category` 字段和 `ContentCategory` 枚举。ContentItem 保持业务无关。

### Git 仓库

无需变动。文件结构 `content/<contentId>/` 不变。

## 模块删除清单

| 删除 | 去向 |
|------|------|
| `src/modules/gallery/` | 逻辑收入 workspace（gallery-view.service.ts） |
| `src/modules/editor/` | 逻辑��入 workspace（note-view.service.ts） |
| `src/modules/home/` | 逻辑收入 workspace |
| ContentItem 的 `category` 字段 | 删除，回退到业务无关 |
| ContentRepository 的 `findByCategory` | 删除 |

## 最终模块依赖图

```
WorkspaceModule
  imports: [ContentModule, NavigationModule]

NavigationModule
  imports: [ContentModule]
  exports: [NavigationRepository, NavigationNodeService]

ContentModule
  exports: [ContentService, ContentRepository, ContentRepoService, ContentGitService]
```

## 范围边界

**本次改动：**
- 后端架构重构（workspace module、navigation scope、模块删除/迁移）
- 前端 service 层适配（合并为 workspace.ts，路径改为 /spaces/:scope/items/...）
- 数据迁移脚本

**不动：**
- 前端页���路由（/gallery、/admin/gallery 等保持不变）
- 前端页面组件（hooks、components 只改 service 调用��
- Git 仓库文件结构
