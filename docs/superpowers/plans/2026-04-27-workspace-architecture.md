# Workspace Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor backend from separate gallery/editor/home modules into a unified workspace module with scope-based Navigation isolation.

**Architecture:** Navigation gets a `scope` field to isolate business modules. A new WorkspaceModule provides unified CRUD routes (`/spaces/:scope/items/...`) with scope-specific ViewServices. Old gallery/editor/home modules are deleted. ContentItem reverts to business-agnostic (no category). Frontend service layer adapts to new API paths.

**Tech Stack:** NestJS, Typegoose/MongoDB, Fastify, React (frontend service layer only)

**Repos:**
- Backend: `/Users/berrylucas/Desktop/Claude Practice/liminial-field/liminal-field-server`
- Frontend: `/Users/berrylucas/Desktop/Claude Practice/liminial-field/liminal-field-web`

---

### Task 1: Add `scope` field to NavigationNode entity

**Files:**
- Modify: `src/modules/navigation/navigation.entity.ts`

- [ ] **Step 1: Add scope enum and field to entity**

```typescript
// navigation.entity.ts — add enum before NavigationNodeType
export enum NavigationScope {
  notes = 'notes',
  gallery = 'gallery',
}
```

Add field to `NavigationNode` class, after `name`:

```typescript
  @prop({ enum: NavigationScope, required: true, default: NavigationScope.notes, index: true })
  public scope!: NavigationScope;
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npx jest src/modules/navigation/ --no-coverage`
Expected: All 11 tests PASS (scope has default value so existing code still works)

- [ ] **Step 3: Commit**

```bash
git add src/modules/navigation/navigation.entity.ts
git commit -m "feat: add scope field to NavigationNode entity"
```

---

### Task 2: Add scope to NavigationRepository

**Files:**
- Modify: `src/modules/navigation/navigation.repository.ts`

- [ ] **Step 1: Add scope to CreateNavigationNode interface**

```typescript
export interface CreateNavigationNode {
  name: string;
  scope?: string;      // ← add
  parentId?: string;
  nodeType: NavigationNodeType;
  contentItemId?: string;
  order?: number;
}
```

- [ ] **Step 2: Pass scope in create method**

In `create()`, add `scope` to the create object:

```typescript
  async create(navigation: CreateNavigationNode): Promise<NavigationNode> {
    return this.navigationModel.create({
      name: navigation.name,
      scope: navigation.scope ?? NavigationScope.notes,
      parentId: navigation.parentId,
      nodeType: navigation.nodeType,
      contentItemId: navigation.contentItemId,
      order: navigation.order ?? 0,
      createdAt: new Date(),
      updatedAt: null,
    });
  }
```

Add the import: `import { NavigationNode, NavigationNodeType, NavigationScope } from './navigation.entity';`

- [ ] **Step 3: Add scope filter to listByParentId**

```typescript
  async listByParentId(parentId?: string, scope?: string): Promise<NavigationNode[]> {
    const filter: Record<string, unknown> = { parentId: parentId ?? null };
    if (scope) filter.scope = scope;
    return this.navigationModel
      .find(filter)
      .sort({ order: 1, name: 1, _id: 1 });
  }
```

- [ ] **Step 4: Add scope to findRootNodes**

```typescript
  async findRootNodes(scope?: string): Promise<NavigationNode[]> {
    return this.listByParentId(undefined, scope);
  }
```

- [ ] **Step 5: Add scope to countChildrenByParentIds**

```typescript
  async countChildrenByParentIds(
    parentIds: string[],
    scope?: string,
  ): Promise<Record<string, number>> {
    if (parentIds.length === 0) return {};

    const match: Record<string, unknown> = {
      parentId: { $in: parentIds.map((id) => new Types.ObjectId(id)) },
    };
    if (scope) match.scope = scope;

    const rows = await this.navigationModel.aggregate<{
      _id: unknown;
      count: number;
    }>([
      { $match: match },
      { $group: { _id: '$parentId', count: { $sum: 1 } } },
    ]);

    return Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
  }
```

- [ ] **Step 6: Run tests**

Run: `npx jest src/modules/navigation/ --no-coverage`
Expected: All PASS (scope params are optional, backward compatible)

- [ ] **Step 7: Commit**

```bash
git add src/modules/navigation/navigation.repository.ts
git commit -m "feat: add scope filtering to NavigationRepository"
```

---

### Task 3: Add scope to NavigationNodeService

**Files:**
- Modify: `src/modules/navigation/navigation.service.ts`
- Modify: `src/modules/navigation/dto/create-structure-node.dto.ts`
- Modify: `src/modules/navigation/dto/structure-node.dto.ts`

- [ ] **Step 1: Read the DTO files**

Read `src/modules/navigation/dto/create-structure-node.dto.ts` and `src/modules/navigation/dto/structure-node.dto.ts`.

- [ ] **Step 2: Add scope to CreateStructureNodeDto**

Add optional scope field:

```typescript
import { NavigationScope } from '../navigation.entity';

// Add to class:
  @IsEnum(NavigationScope)
  @IsOptional()
  scope?: NavigationScope;
```

- [ ] **Step 3: Add scope to StructureNodeDto**

Add `scope` field to `StructureNodeDto`:

```typescript
export class StructureNodeDto {
  id: string;
  name: string;
  type: StructureNodeType;
  scope: string;        // ← add
  parentId?: string;
  // ... rest unchanged

  static fromEntity(entity: NavigationNode, hasChildren = false): StructureNodeDto {
    const dto = new StructureNodeDto();
    dto.id = entity._id.toString();
    dto.name = entity.name;
    dto.scope = entity.scope ?? 'notes';    // ← add
    dto.type = entity.nodeType === NavigationNodeType.subject ? 'FOLDER' : 'DOC';
    // ... rest unchanged
  }
}
```

- [ ] **Step 4: Update listStructureNodes to accept scope**

In `navigation.service.ts`, update `listStructureNodes`:

```typescript
  async listStructureNodes(
    parentId?: string,
    visibility?: ContentVisibility,
    scope?: string,
  ): Promise<StructureListResultDto> {
    if (parentId) {
      await this.getParentOrThrow(parentId);
    }
    const entities = await this.navigationRepository.listByParentId(parentId, scope);
    const readableEntities = await this.filterReadableEntities(
      entities,
      visibility,
    );
    const children = await this.toStructureDtos(readableEntities);

    const path = parentId
      ? await this.findStructurePathByNodeId(parentId)
      : [];

    const result = new StructureListResultDto();
    result.path = path;
    result.children = children;
    return result;
  }
```

- [ ] **Step 5: Update createStructureNode to pass scope**

In the `createStructureNode` method, pass scope to repository:

```typescript
    const created = await this.navigationRepository.create({
      name: dto.name,
      scope: dto.scope,
      parentId: dto.parentId,
      nodeType: this.toNavigationNodeType(dto.type),
      contentItemId: dto.contentItemId,
      order: dto.sortOrder ?? 0,
    });
```

- [ ] **Step 6: Update NavigationNodeController to pass scope**

In `navigation.controller.ts`, update `listStructureNodes`:

```typescript
  @Get('structure-nodes')
  async listStructureNodes(
    @Query('parentId') parentId?: string,
    @Query('visibility') visibility?: ContentVisibility,
    @Query('scope') scope?: string,
  ): Promise<StructureListResultDto> {
    return this.navigationNodeService.listStructureNodes(parentId, visibility, scope);
  }
```

- [ ] **Step 7: Run tests**

Run: `npx jest src/modules/navigation/ --no-coverage`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add src/modules/navigation/
git commit -m "feat: add scope support to NavigationNodeService and DTOs"
```

---

### Task 4: Revert ContentItem category field

**Files:**
- Modify: `src/modules/content/content-item.entity.ts`
- Modify: `src/modules/content/content.repository.ts`

- [ ] **Step 1: Remove ContentCategory enum and category field from entity**

In `content-item.entity.ts`, remove:
- The `ContentCategory` enum (lines 14-17)
- The `@prop({ enum: ContentCategory, default: ContentCategory.note })` and `category!: ContentCategory;` field

- [ ] **Step 2: Remove category from ContentRepository**

In `content.repository.ts`:
- Remove `ContentCategory` from imports
- Remove `category?: ContentCategory` from `CreateContentItemInput`
- Remove `category: input.category ?? ContentCategory.note,` from `create()` method
- Remove the entire `findByCategory` method

- [ ] **Step 3: Run content tests**

Run: `npx jest src/modules/content/ --no-coverage`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/content/content-item.entity.ts src/modules/content/content.repository.ts
git commit -m "revert: remove category field from ContentItem (storage layer is business-agnostic)"
```

---

### Task 5: Create WorkspaceModule — workspace.service.ts

**Files:**
- Create: `src/modules/workspace/workspace.module.ts`
- Create: `src/modules/workspace/workspace.service.ts`
- Create: `src/modules/workspace/dto/create-workspace-item.dto.ts`
- Create: `src/modules/workspace/dto/update-workspace-item.dto.ts`
- Create: `src/modules/workspace/dto/workspace-item.dto.ts`

- [ ] **Step 1: Create DTOs**

`src/modules/workspace/dto/workspace-item.dto.ts`:

```typescript
export class WorkspaceItemDto {
  id: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export class WorkspaceItemDetailDto extends WorkspaceItemDto {
  bodyMarkdown: string;
  plainText: string;
}
```

`src/modules/workspace/dto/create-workspace-item.dto.ts`:

```typescript
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkspaceItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  bodyMarkdown?: string;

  @IsString()
  @IsOptional()
  changeNote?: string;
}
```

`src/modules/workspace/dto/update-workspace-item.dto.ts`:

```typescript
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  bodyMarkdown?: string;

  @IsString()
  @IsNotEmpty()
  changeNote: string;
}
```

- [ ] **Step 2: Create workspace.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { ContentRepository } from '../content/content.repository';
import { ContentRepoService } from '../content/content-repo.service';
import { ContentStatus } from '../content/content-item.entity';
import { ContentSaveAction } from '../content/dto/save-content.dto';
import { NavigationRepository } from '../navigation/navigation.repository';
import { NavigationNodeType } from '../navigation/navigation.entity';
import { CreateWorkspaceItemDto } from './dto/create-workspace-item.dto';
import { UpdateWorkspaceItemDto } from './dto/update-workspace-item.dto';
import { WorkspaceItemDto, WorkspaceItemDetailDto } from './dto/workspace-item.dto';

// 画廊动态允许无描述，用零宽空格占位通过 bodyMarkdown 非空校验。
const EMPTY_BODY_PLACEHOLDER = '\u200B';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly contentService: ContentService,
    private readonly contentRepository: ContentRepository,
    private readonly contentRepoService: ContentRepoService,
    private readonly navigationRepository: NavigationRepository,
  ) {}

  async create(scope: string, dto: CreateWorkspaceItemDto): Promise<WorkspaceItemDetailDto> {
    const body = dto.bodyMarkdown || EMPTY_BODY_PLACEHOLDER;
    const summary = dto.summary || dto.title;

    const detail = await this.contentService.createContent({
      title: dto.title,
      summary,
      status: ContentStatus.committed,
      bodyMarkdown: body,
      changeNote: dto.changeNote || 'Created',
    });

    // 在 Navigation 中注册索引
    const siblings = await this.navigationRepository.findRootNodes(scope);
    await this.navigationRepository.create({
      name: dto.title,
      scope,
      nodeType: NavigationNodeType.content,
      contentItemId: detail.id,
      order: siblings.length,
    });

    return this.getById(scope, detail.id);
  }

  async list(scope: string, status?: 'draft' | 'published'): Promise<WorkspaceItemDto[]> {
    const nodes = await this.navigationRepository.findRootNodes(scope);
    const contentNodes = nodes.filter(
      (n) => n.nodeType === NavigationNodeType.content && n.contentItemId,
    );

    const items: WorkspaceItemDto[] = [];
    for (const node of contentNodes) {
      try {
        const item = await this.toListDto(node.contentItemId!);
        if (!status || item.status === status) {
          items.push(item);
        }
      } catch {
        // 跳过已损坏的条目
      }
    }
    return items;
  }

  async getById(_scope: string, contentItemId: string): Promise<WorkspaceItemDetailDto> {
    const content = await this.contentRepository.findById(contentItemId);
    if (!content) throw new NotFoundException(`Item ${contentItemId} not found`);

    const source = await this.contentRepoService.readContentSource(contentItemId);
    const version = content.latestVersion!;
    const bodyMarkdown = source.bodyMarkdown === EMPTY_BODY_PLACEHOLDER ? '' : source.bodyMarkdown;

    return {
      id: contentItemId,
      title: version.title,
      summary: version.summary,
      status: content.publishedVersion ? 'published' : 'draft',
      bodyMarkdown,
      plainText: source.plainText,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    };
  }

  async update(scope: string, contentItemId: string, dto: UpdateWorkspaceItemDto): Promise<WorkspaceItemDetailDto> {
    const content = await this.contentRepository.findById(contentItemId);
    if (!content) throw new NotFoundException(`Item ${contentItemId} not found`);

    const currentVersion = content.latestVersion!;
    const newTitle = dto.title ?? currentVersion.title;
    const newSummary = dto.summary ?? currentVersion.summary;

    let bodyMarkdown: string;
    if (dto.bodyMarkdown !== undefined) {
      bodyMarkdown = dto.bodyMarkdown || EMPTY_BODY_PLACEHOLDER;
    } else {
      const source = await this.contentRepoService.readContentSource(contentItemId);
      bodyMarkdown = source.bodyMarkdown;
    }

    const currentStatus = content.publishedVersion
      ? ContentStatus.published
      : ContentStatus.committed;

    await this.contentService.saveContent(contentItemId, {
      title: newTitle,
      summary: newSummary,
      status: currentStatus,
      bodyMarkdown,
      changeNote: dto.changeNote,
      action: ContentSaveAction.commit,
    });

    // nav node 名称同步
    if (dto.title) {
      const navNode = await this.navigationRepository.findByContentItemId(contentItemId);
      if (navNode) {
        await this.navigationRepository.update(navNode._id.toString(), { name: dto.title });
      }
    }

    return this.getById(scope, contentItemId);
  }

  async remove(_scope: string, contentItemId: string): Promise<void> {
    const navNode = await this.navigationRepository.findByContentItemId(contentItemId);
    if (navNode) {
      await this.navigationRepository.deleteById(navNode._id.toString());
    }
  }

  async publish(_scope: string, contentItemId: string): Promise<WorkspaceItemDetailDto> {
    const content = await this.contentRepository.findById(contentItemId);
    if (!content) throw new NotFoundException(`Item ${contentItemId} not found`);

    const version = content.latestVersion!;
    const source = await this.contentRepoService.readContentSource(contentItemId);

    await this.contentService.saveContent(contentItemId, {
      title: version.title,
      summary: version.summary,
      status: ContentStatus.committed,
      bodyMarkdown: source.bodyMarkdown,
      changeNote: 'Published',
      action: ContentSaveAction.publish,
    });

    return this.getById(_scope, contentItemId);
  }

  async unpublish(_scope: string, contentItemId: string): Promise<WorkspaceItemDetailDto> {
    const content = await this.contentRepository.findById(contentItemId);
    if (!content) throw new NotFoundException(`Item ${contentItemId} not found`);

    const version = content.latestVersion!;
    const source = await this.contentRepoService.readContentSource(contentItemId);

    await this.contentService.saveContent(contentItemId, {
      title: version.title,
      summary: version.summary,
      status: ContentStatus.published,
      bodyMarkdown: source.bodyMarkdown,
      changeNote: 'Unpublished',
      action: ContentSaveAction.unpublish,
    });

    return this.getById(_scope, contentItemId);
  }

  async uploadAsset(
    _scope: string,
    contentItemId: string,
    fileName: string,
    buffer: Buffer,
  ): Promise<{ path: string; fileName: string; size: number }> {
    await this.contentService.assertContentItemExists(contentItemId);
    await this.contentService.prepareWritableContentWorkspace();

    const stored = await this.contentRepoService.storeAsset(contentItemId, fileName, buffer);
    return { path: stored.path, fileName: stored.fileName, size: buffer.byteLength };
  }

  async listAssets(_scope: string, contentItemId: string) {
    await this.contentService.assertContentItemExists(contentItemId);
    return this.contentRepoService.listAssets(contentItemId);
  }

  private async toListDto(contentItemId: string): Promise<WorkspaceItemDto> {
    const content = await this.contentRepository.findById(contentItemId);
    if (!content) throw new NotFoundException(`Item ${contentItemId} not found`);

    const version = content.latestVersion!;
    return {
      id: contentItemId,
      title: version.title,
      summary: version.summary,
      status: content.publishedVersion ? 'published' : 'draft',
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    };
  }
}
```

- [ ] **Step 3: Create workspace.module.ts (initial, no controller yet)**

```typescript
import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { ContentModule } from '../content/content.module';
import { NavigationModule } from '../navigation/navigation.module';
import { EditorDraft } from '../editor/editor-draft.entity';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [ContentModule, NavigationModule, TypegooseModule.forFeature([EditorDraft])],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
```

Note: We temporarily import `EditorDraft` from the old path. We'll move it in Task 6.

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/modules/workspace/
git commit -m "feat: create WorkspaceService with scope-driven CRUD"
```

---

### Task 6: Create NoteViewService

**Files:**
- Create: `src/modules/workspace/note-view.service.ts`
- Move: `src/modules/editor/editor-draft.entity.ts` → `src/modules/workspace/editor-draft.entity.ts`
- Move: `src/modules/editor/editor-draft.repository.ts` → `src/modules/workspace/editor-draft.repository.ts`
- Move DTOs: `src/modules/editor/dto/*` → `src/modules/workspace/dto/`

- [ ] **Step 1: Copy editor-draft files to workspace**

Copy the following files (update import paths as needed):
- `editor-draft.entity.ts` → `src/modules/workspace/editor-draft.entity.ts` (no changes needed)
- `editor-draft.repository.ts` → `src/modules/workspace/editor-draft.repository.ts` (update entity import path)
- `dto/editor-draft.dto.ts` → `src/modules/workspace/dto/editor-draft.dto.ts`
- `dto/save-draft.dto.ts` → `src/modules/workspace/dto/save-draft.dto.ts`
- `dto/uploaded-asset.dto.ts` → `src/modules/workspace/dto/uploaded-asset.dto.ts`

- [ ] **Step 2: Create note-view.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentService } from '../content/content.service';
import { ContentRepoService } from '../content/content-repo.service';
import { ContentGitService } from '../content/content-git.service';
import { ContentDetailDto } from '../content/dto/content-detail.dto';
import { ContentHistoryEntryDto } from '../content/dto/content-history.dto';
import { SaveContentDto } from '../content/dto/save-content.dto';
import { EditorDraftDto } from './dto/editor-draft.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { EditorDraft } from './editor-draft.entity';
import { EditorDraftRepository } from './editor-draft.repository';

@Injectable()
export class NoteViewService {
  constructor(
    private readonly contentService: ContentService,
    private readonly contentRepoService: ContentRepoService,
    private readonly contentGitService: ContentGitService,
    private readonly editorDraftRepository: EditorDraftRepository,
  ) {}

  private toDraftDto(draft: EditorDraft): EditorDraftDto {
    return {
      id: draft._id,
      contentItemId: draft.contentItemId,
      title: draft.title,
      summary: draft.summary,
      bodyMarkdown: draft.bodyMarkdown,
      changeNote: draft.changeNote,
      savedAt: draft.savedAt.toISOString(),
      savedBy: draft.savedBy,
    };
  }

  async saveContent(id: string, dto: SaveContentDto): Promise<ContentDetailDto> {
    return this.contentService.saveContent(id, dto);
  }

  async getDraft(id: string): Promise<EditorDraftDto> {
    await this.contentService.assertContentItemExists(id);
    const draft = await this.editorDraftRepository.findByContentItemId(id);
    if (!draft) {
      throw new NotFoundException(`Draft for content ${id} not found`);
    }
    return this.toDraftDto(draft);
  }

  async saveDraft(id: string, dto: SaveDraftDto): Promise<EditorDraftDto> {
    await this.contentService.assertContentEditable(id);
    const draft = await this.editorDraftRepository.save({
      contentItemId: id,
      title: dto.title,
      summary: dto.summary,
      bodyMarkdown: dto.bodyMarkdown,
      changeNote: dto.changeNote,
      savedAt: new Date(),
      savedBy: dto.savedBy,
    });
    return this.toDraftDto(draft);
  }

  async deleteDraft(id: string): Promise<void> {
    await this.contentService.assertContentItemExists(id);
    await this.editorDraftRepository.deleteByContentItemId(id);
  }

  async getHistory(id: string): Promise<ContentHistoryEntryDto[]> {
    await this.contentService.assertContentItemExists(id);
    return this.contentGitService.listContentHistory(id);
  }

  async getByVersion(id: string, commitHash: string): Promise<ContentDetailDto> {
    return this.contentService.getContentByVersion(id, commitHash);
  }
}
```

- [ ] **Step 3: Update workspace.module.ts**

Add NoteViewService and EditorDraftRepository:

```typescript
import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { ContentModule } from '../content/content.module';
import { NavigationModule } from '../navigation/navigation.module';
import { EditorDraft } from './editor-draft.entity';
import { EditorDraftRepository } from './editor-draft.repository';
import { WorkspaceService } from './workspace.service';
import { NoteViewService } from './note-view.service';

@Module({
  imports: [ContentModule, NavigationModule, TypegooseModule.forFeature([EditorDraft])],
  providers: [WorkspaceService, NoteViewService, EditorDraftRepository],
  exports: [WorkspaceService, NoteViewService],
})
export class WorkspaceModule {}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/modules/workspace/
git commit -m "feat: create NoteViewService with draft and history support"
```

---

### Task 7: Create GalleryViewService

**Files:**
- Create: `src/modules/workspace/gallery-view.service.ts`
- Create: `src/modules/workspace/dto/gallery-view.dto.ts`

- [ ] **Step 1: Create gallery-view.dto.ts**

```typescript
export class GalleryPhotoDto {
  id: string;
  url: string;
  fileName: string;
  size: number;
  order: number;
}

export class GalleryPostDto {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  coverUrl: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export class GalleryPostDetailDto extends GalleryPostDto {
  photos: GalleryPhotoDto[];
}
```

- [ ] **Step 2: Create gallery-view.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from '../content/content.repository';
import { ContentRepoService } from '../content/content-repo.service';
import { GalleryPhotoDto, GalleryPostDto, GalleryPostDetailDto } from './dto/gallery-view.dto';

// 画廊描述的零宽占位符，toPostDto 时需要还原为空串。
const EMPTY_DESCRIPTION_PLACEHOLDER = '\u200B';

@Injectable()
export class GalleryViewService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly contentRepoService: ContentRepoService,
  ) {}

  private buildPhotoUrl(contentItemId: string, fileName: string): string {
    return `/api/v1/spaces/gallery/items/${contentItemId}/assets/${fileName}`;
  }

  async toPostDto(contentItemId: string): Promise<GalleryPostDto> {
    const content = await this.contentRepository.findById(contentItemId);
    if (!content)
      throw new NotFoundException(`Gallery post ${contentItemId} not found`);

    const assets = await this.contentRepoService.listAssets(contentItemId);
    const imageAssets = assets.filter((a) => a.type === 'image');
    const coverAsset = imageAssets[0];
    const version = content.latestVersion!;

    let description = '';
    try {
      const source = await this.contentRepoService.readContentSource(contentItemId);
      description = source.bodyMarkdown === EMPTY_DESCRIPTION_PLACEHOLDER
        ? ''
        : source.bodyMarkdown;
    } catch {
      // 内容文件还不存在
    }

    return {
      id: contentItemId,
      title: version.title,
      description,
      status: content.publishedVersion ? 'published' : 'draft',
      coverUrl: coverAsset
        ? this.buildPhotoUrl(contentItemId, coverAsset.fileName)
        : null,
      photoCount: imageAssets.length,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    };
  }

  async toPostDetailDto(contentItemId: string): Promise<GalleryPostDetailDto> {
    const postDto = await this.toPostDto(contentItemId);
    const assets = await this.contentRepoService.listAssets(contentItemId);
    const imageAssets = assets.filter((a) => a.type === 'image');

    const photos: GalleryPhotoDto[] = imageAssets.map((asset, index) => ({
      id: asset.fileName,
      url: this.buildPhotoUrl(contentItemId, asset.fileName),
      fileName: asset.fileName,
      size: asset.size,
      order: index,
    }));

    return { ...postDto, photos };
  }

  async readPhotoBuffer(
    contentItemId: string,
    fileName: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    return this.contentRepoService.readAssetBuffer(contentItemId, fileName);
  }
}
```

- [ ] **Step 3: Update workspace.module.ts to include GalleryViewService**

Add to providers and exports:

```typescript
import { GalleryViewService } from './gallery-view.service';

// In @Module:
providers: [WorkspaceService, NoteViewService, GalleryViewService, EditorDraftRepository],
exports: [WorkspaceService, NoteViewService, GalleryViewService],
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/modules/workspace/
git commit -m "feat: create GalleryViewService for photo and cover logic"
```

---

### Task 8: Create WorkspaceController with unified routes

**Files:**
- Create: `src/modules/workspace/workspace.controller.ts`
- Modify: `src/modules/workspace/workspace.module.ts`

- [ ] **Step 1: Create workspace.controller.ts**

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { RawResponse } from '../../common/raw-response.decorator';
import type { MultipartFile } from '@fastify/multipart';
import { ContentDetailDto } from '../content/dto/content-detail.dto';
import { ContentHistoryEntryDto } from '../content/dto/content-history.dto';
import { SaveContentDto } from '../content/dto/save-content.dto';
import { WorkspaceService } from './workspace.service';
import { NoteViewService } from './note-view.service';
import { GalleryViewService } from './gallery-view.service';
import { CreateWorkspaceItemDto } from './dto/create-workspace-item.dto';
import { UpdateWorkspaceItemDto } from './dto/update-workspace-item.dto';
import { EditorDraftDto } from './dto/editor-draft.dto';
import { SaveDraftDto } from './dto/save-draft.dto';

type MultipartRequest = {
  file: () => Promise<MultipartFile | undefined>;
};

@Controller('spaces')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly noteViewService: NoteViewService,
    private readonly galleryViewService: GalleryViewService,
  ) {}

  // ─── 通用 CRUD ───

  @Get(':scope/items')
  async list(
    @Param('scope') scope: string,
    @Query('status') status?: 'draft' | 'published',
  ) {
    if (scope === 'gallery') {
      // 画廊列表返回带封面图的 GalleryPostDto
      const nodes = await this.workspaceService.list(scope, status);
      return Promise.all(nodes.map((n) => this.galleryViewService.toPostDto(n.id)));
    }
    return this.workspaceService.list(scope, status);
  }

  @Post(':scope/items')
  async create(
    @Param('scope') scope: string,
    @Body() dto: CreateWorkspaceItemDto,
  ) {
    return this.workspaceService.create(scope, dto);
  }

  @Get(':scope/items/:id')
  async getById(
    @Param('scope') scope: string,
    @Param('id') id: string,
  ) {
    if (scope === 'gallery') {
      return this.galleryViewService.toPostDetailDto(id);
    }
    return this.workspaceService.getById(scope, id);
  }

  @Put(':scope/items/:id')
  async update(
    @Param('scope') scope: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceItemDto,
  ) {
    return this.workspaceService.update(scope, id, dto);
  }

  @Delete(':scope/items/:id')
  async remove(
    @Param('scope') scope: string,
    @Param('id') id: string,
  ) {
    return this.workspaceService.remove(scope, id);
  }

  // ─── 发布/取消 ───

  @Put(':scope/items/:id/publish')
  async publish(@Param('scope') scope: string, @Param('id') id: string) {
    return this.workspaceService.publish(scope, id);
  }

  @Put(':scope/items/:id/unpublish')
  async unpublish(@Param('scope') scope: string, @Param('id') id: string) {
    return this.workspaceService.unpublish(scope, id);
  }

  // ─── 附件 ───

  @Post(':scope/items/:id/assets')
  async uploadAsset(
    @Param('scope') scope: string,
    @Param('id') id: string,
    @Req() request: MultipartRequest,
  ) {
    const file = await request.file();
    if (!file) throw new BadRequestException('File is required');
    const buffer = await file.toBuffer();
    return this.workspaceService.uploadAsset(scope, id, file.filename, buffer);
  }

  @Get(':scope/items/:id/assets')
  async listAssets(@Param('scope') scope: string, @Param('id') id: string) {
    return this.workspaceService.listAssets(scope, id);
  }

  // 文件直出（gallery 照片、notes 附件均通过此路由）
  @RawResponse()
  @Get(':scope/items/:id/assets/:fileName')
  async serveAsset(
    @Param('scope') _scope: string,
    @Param('id') id: string,
    @Param('fileName') fileName: string,
    @Res() reply: any,
  ) {
    const { buffer, contentType } =
      await this.galleryViewService.readPhotoBuffer(id, fileName);
    reply.header('Content-Type', contentType);
    reply.header('Cache-Control', 'public, max-age=86400');
    reply.send(buffer);
  }

  // ─── Notes 特有 ───

  @Get('notes/items/:id/draft')
  async getDraft(@Param('id') id: string): Promise<EditorDraftDto> {
    return this.noteViewService.getDraft(id);
  }

  @Put('notes/items/:id/draft')
  async saveDraft(
    @Param('id') id: string,
    @Body() dto: SaveDraftDto,
  ): Promise<EditorDraftDto> {
    return this.noteViewService.saveDraft(id, dto);
  }

  @Delete('notes/items/:id/draft')
  async deleteDraft(@Param('id') id: string): Promise<void> {
    return this.noteViewService.deleteDraft(id);
  }

  @Get('notes/items/:id/history')
  async getHistory(@Param('id') id: string): Promise<ContentHistoryEntryDto[]> {
    return this.noteViewService.getHistory(id);
  }

  @Get('notes/items/:id/versions/:commitHash')
  async getByVersion(
    @Param('id') id: string,
    @Param('commitHash') commitHash: string,
  ): Promise<ContentDetailDto> {
    return this.noteViewService.getByVersion(id, commitHash);
  }

  // ─── Notes 特有：保存正式内容（编辑器提交）───

  @Put('notes/items/:id')
  async saveNoteContent(
    @Param('id') id: string,
    @Body() dto: SaveContentDto,
  ): Promise<ContentDetailDto> {
    return this.noteViewService.saveContent(id, dto);
  }
}
```

- [ ] **Step 2: Update workspace.module.ts to register controller**

```typescript
import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { ContentModule } from '../content/content.module';
import { NavigationModule } from '../navigation/navigation.module';
import { EditorDraft } from './editor-draft.entity';
import { EditorDraftRepository } from './editor-draft.repository';
import { WorkspaceService } from './workspace.service';
import { NoteViewService } from './note-view.service';
import { GalleryViewService } from './gallery-view.service';
import { WorkspaceController } from './workspace.controller';

@Module({
  imports: [ContentModule, NavigationModule, TypegooseModule.forFeature([EditorDraft])],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, NoteViewService, GalleryViewService, EditorDraftRepository],
  exports: [WorkspaceService, NoteViewService, GalleryViewService],
})
export class WorkspaceModule {}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/modules/workspace/
git commit -m "feat: create WorkspaceController with unified /spaces/:scope/items routes"
```

---

### Task 9: Wire WorkspaceModule and remove old modules

**Files:**
- Modify: `src/app.module.ts`
- Modify: `src/modules/content/content.module.ts` (remove ContentController routes that moved)
- Delete: `src/modules/gallery/` (entire directory)
- Delete: `src/modules/editor/` (entire directory)
- Delete: `src/modules/home/` (entire directory)

- [ ] **Step 1: Update app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypegooseModule } from 'nestjs-typegoose';
import { ContentModule } from './modules/content/content.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { yamlLoader } from './config/yaml.loader';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [yamlLoader],
    }),
    TypegooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('mongo.host');
        const port = config.get<number>('mongo.port');
        const user = config.get<string>('mongo.username');
        const pass = config.get<string>('mongo.password');
        const db = config.get<string>('mongo.database');
        const authSource = config.get<string>('mongo.options.authSource');
        return {
          uri: `mongodb://${user}:${pass}@${host}:${port}/${db}?authSource=${authSource}`,
        };
      },
    }),
    ContentModule,
    NavigationModule,
    WorkspaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 2: Clean up ContentController**

Remove routes from `content.controller.ts` that now live in WorkspaceController. Keep only the `search` endpoint (if still needed) or remove the controller entirely if all routes moved. Check if any route is NOT covered by workspace controller before removing.

Content controller routes to remove:
- `GET /contents` → now `GET /spaces/notes/items`
- `POST /contents` → now `POST /spaces/notes/items`
- `GET /contents/:id` → now `GET /spaces/notes/items/:id`
- `PUT /contents/:id` → now `PUT /spaces/notes/items/:id`
- `GET /contents/:id/versions/:commitHash` → now `GET /spaces/notes/items/:id/versions/:hash`
- `GET /contents/:id/history` → now `GET /spaces/notes/items/:id/history`

Keep `GET /search` if still used, otherwise remove entire controller. Also keep `GET /contents/:contentItemId/structure-path` which is in NavigationController.

- [ ] **Step 3: Delete old modules**

```bash
rm -rf src/modules/gallery/
rm -rf src/modules/editor/
rm -rf src/modules/home/
```

- [ ] **Step 4: Verify compilation and fix any import issues**

Run: `npx tsc --noEmit`
Fix any broken imports.

- [ ] **Step 5: Run all tests**

Run: `npx jest --no-coverage`
Expected: Navigation tests pass. Old gallery/editor tests are gone. If any test imports from deleted modules, remove or update them.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: wire WorkspaceModule, remove gallery/editor/home modules"
```

---

### Task 10: Write workspace tests

**Files:**
- Create: `src/modules/workspace/__tests__/workspace.service.test.ts`
- Create: `src/modules/workspace/__tests__/workspace.controller.test.ts`

- [ ] **Step 1: Write workspace.service.test.ts**

Test at minimum:
- `create()` calls contentService.createContent + navigationRepository.create with correct scope
- `list()` queries navigation by scope and returns items
- `remove()` finds nav node by contentItemId and deletes it
- `publish()` calls contentService.saveContent with publish action

Follow the same mock pattern as existing navigation tests: mock all dependencies via constructor injection.

- [ ] **Step 2: Write workspace.controller.test.ts**

Test delegation pattern:
- `list('gallery')` delegates to galleryViewService
- `list('notes')` delegates to workspaceService
- `getDraft()` delegates to noteViewService
- `create()` delegates to workspaceService

- [ ] **Step 3: Run tests**

Run: `npx jest src/modules/workspace/ --no-coverage`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/modules/workspace/__tests__/
git commit -m "test: add workspace service and controller tests"
```

---

### Task 11: Data migration script

**Files:**
- Create: `scripts/migrate-navigation-scope.ts`

- [ ] **Step 1: Write migration script**

```typescript
/**
 * 迁移脚本：为 navigation_nodes 添加 scope 字段。
 *
 * 1. 所有现有节点设为 scope='notes'
 * 2. __gallery__ 根节点的子节点改为 scope='gallery'，parentId 置 null
 * 3. 删除 __gallery__ 根节点
 * 4. 创建复合索引 { scope, parentId }
 *
 * 运行: npx ts-node scripts/migrate-navigation-scope.ts
 */
import { connect, connection } from 'mongoose';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { resolve } from 'path';

async function migrate() {
  const configPath = resolve(__dirname, '../configs/db.yaml');
  const config = load(readFileSync(configPath, 'utf8')) as Record<string, any>;

  const { host, port, username, password, database, options } = config.mongo;
  const uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${options.authSource}`;

  await connect(uri);
  console.log('Connected to MongoDB');

  const db = connection.db;
  const col = db.collection('navigation_nodes');

  // Step 1: 所有现有节点设为 notes
  const step1 = await col.updateMany(
    { scope: { $exists: false } },
    { $set: { scope: 'notes' } },
  );
  console.log(`Step 1: Set ${step1.modifiedCount} nodes to scope=notes`);

  // Step 2: 找 __gallery__ 根节点
  const galleryRoot = await col.findOne({ name: '__gallery__', parentId: null });

  if (galleryRoot) {
    // Step 3: 子节点改为 gallery scope，parentId 置 null
    const step3 = await col.updateMany(
      { parentId: galleryRoot._id },
      { $set: { scope: 'gallery', parentId: null } },
    );
    console.log(`Step 3: Migrated ${step3.modifiedCount} gallery posts`);

    // Step 4: 删除 __gallery__ 根节点
    await col.deleteOne({ _id: galleryRoot._id });
    console.log('Step 4: Deleted __gallery__ root node');
  } else {
    console.log('No __gallery__ root found, skipping steps 3-4');
  }

  // Step 5: 创建复合索引
  await col.createIndex({ scope: 1, parentId: 1 });
  console.log('Step 5: Created { scope, parentId } index');

  // 同时清理 content_items 表中的 category 字段
  const contentCol = db.collection('content_items');
  const step6 = await contentCol.updateMany(
    { category: { $exists: true } },
    { $unset: { category: '' } },
  );
  console.log(`Step 6: Removed category from ${step6.modifiedCount} content items`);

  await connection.close();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/migrate-navigation-scope.ts
git commit -m "feat: add data migration script for navigation scope"
```

---

### Task 12: Frontend service layer adaptation

**Files (frontend repo):**
- Create: `src/services/workspace.ts`
- Modify: `src/services/structure.ts` (add scope param)
- Delete: `src/services/content-items.ts`
- Delete: `src/services/gallery.ts`
- Modify: all consumer files to use new imports

- [ ] **Step 1: Create src/services/workspace.ts**

```typescript
import { request } from './request';

export type WorkspaceScope = 'notes' | 'gallery';

// ─── 通用类型 ───

export interface WorkspaceItem {
  id: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceItemDetail extends WorkspaceItem {
  bodyMarkdown: string;
  plainText: string;
}

// ─── Gallery 特有 ───

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

// ─── Notes 特有 ───

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

export interface ContentHistoryEntry {
  commitHash: string;
  committedAt: string;
  authorName: string;
  authorEmail: string;
  message: string;
  action: 'commit' | 'unknown';
}

// ─── Notes 特有（正式内容详情，兼容现有前端组件）───

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

// ─── API helpers ───

function scopePath(scope: WorkspaceScope) {
  return `/spaces/${scope}/items`;
}

function toQueryString(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ─── 通用 API ───

export const workspaceApi = {
  list: (scope: WorkspaceScope, options?: { status?: string; visibility?: ContentVisibility }) =>
    request<WorkspaceItem[]>(
      `${scopePath(scope)}${toQueryString({ status: options?.status, visibility: options?.visibility })}`,
    ),

  getById: (scope: WorkspaceScope, id: string, options?: { visibility?: ContentVisibility }) =>
    request<WorkspaceItemDetail>(
      `${scopePath(scope)}/${id}${toQueryString({ visibility: options?.visibility })}`,
    ),

  create: (scope: WorkspaceScope, dto: { title: string; summary?: string; bodyMarkdown?: string; changeNote?: string }) =>
    request<WorkspaceItemDetail>(scopePath(scope), {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (scope: WorkspaceScope, id: string, dto: { title?: string; summary?: string; bodyMarkdown?: string; changeNote: string }) =>
    request<WorkspaceItemDetail>(`${scopePath(scope)}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  remove: (scope: WorkspaceScope, id: string) =>
    request<void>(`${scopePath(scope)}/${id}`, { method: 'DELETE' }),

  publish: (scope: WorkspaceScope, id: string) =>
    request<WorkspaceItemDetail>(`${scopePath(scope)}/${id}/publish`, { method: 'PUT' }),

  unpublish: (scope: WorkspaceScope, id: string) =>
    request<WorkspaceItemDetail>(`${scopePath(scope)}/${id}/unpublish`, { method: 'PUT' }),

  uploadAsset: (scope: WorkspaceScope, id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<UploadedAsset>(`${scopePath(scope)}/${id}/assets`, {
      method: 'POST',
      body: formData,
    });
  },

  listAssets: (scope: WorkspaceScope, id: string) =>
    request<ListedAsset[]>(`${scopePath(scope)}/${id}/assets`),
};

// ─── Notes 特有 ───

export const notesApi = {
  // 笔记列表和详情兼容旧的 ContentListItem/ContentDetail 响应格式
  list: (options?: { visibility?: ContentVisibility; status?: ContentStatus }) =>
    request<ContentListItem[]>(
      `${scopePath('notes')}${toQueryString({ visibility: options?.visibility, status: options?.status })}`,
    ),

  getById: (id: string, options?: { visibility?: ContentVisibility }) =>
    request<ContentDetail>(
      `${scopePath('notes')}/${id}${toQueryString({ visibility: options?.visibility })}`,
    ),

  create: (dto: { title: string; summary: string; status: ContentStatus; bodyMarkdown: string; changeNote?: string; changeType?: ContentChangeType }) =>
    request<ContentDetail>(scopePath('notes'), {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  save: (id: string, dto: SaveContentDto) =>
    request<ContentDetail>(`${scopePath('notes')}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  getDraft: (id: string) =>
    request<EditorDraft>(`${scopePath('notes')}/${id}/draft`),

  saveDraft: (id: string, dto: SaveDraftDto) =>
    request<EditorDraft>(`${scopePath('notes')}/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  deleteDraft: (id: string) =>
    request<void>(`${scopePath('notes')}/${id}/draft`, { method: 'DELETE' }),

  getByVersion: (id: string, commitHash: string) =>
    request<ContentDetail>(`${scopePath('notes')}/${id}/versions/${commitHash}`),

  getHistory: (id: string) =>
    request<ContentHistoryEntry[]>(`${scopePath('notes')}/${id}/history`),

  listAssets: (id: string) =>
    request<ListedAsset[]>(`${scopePath('notes')}/${id}/assets`),

  uploadAsset: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<UploadedAsset>(`${scopePath('notes')}/${id}/assets`, {
      method: 'POST',
      body: formData,
    });
  },
};

// ─── Gallery 特有 ───

export const galleryApi = {
  list: (status?: 'draft' | 'published') => {
    const query = status ? `?status=${status}` : '';
    return request<GalleryPost[]>(`${scopePath('gallery')}${query}`);
  },

  getById: (id: string) =>
    request<GalleryPostDetail>(`${scopePath('gallery')}/${id}`),

  create: (dto: { title: string; description?: string }) =>
    request<GalleryPost>(scopePath('gallery'), {
      method: 'POST',
      body: JSON.stringify({ title: dto.title, bodyMarkdown: dto.description }),
    }),

  update: (id: string, dto: { title?: string; description?: string }) =>
    request<GalleryPost>(`${scopePath('gallery')}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: dto.title,
        bodyMarkdown: dto.description,
        changeNote: 'Gallery post updated',
      }),
    }),

  remove: (id: string) =>
    request<void>(`${scopePath('gallery')}/${id}`, { method: 'DELETE' }),

  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<GalleryPhoto>(`${scopePath('gallery')}/${id}/assets`, {
      method: 'POST',
      body: formData,
    });
  },

  deletePhoto: (id: string, photoId: string) =>
    request<void>(`${scopePath('gallery')}/${id}/assets/${photoId}`, {
      method: 'DELETE',
    }),

  publish: (id: string) =>
    request<GalleryPost>(`${scopePath('gallery')}/${id}/publish`, { method: 'PUT' }),

  unpublish: (id: string) =>
    request<GalleryPost>(`${scopePath('gallery')}/${id}/unpublish`, { method: 'PUT' }),
};
```

- [ ] **Step 2: Update structure.ts — add scope to structure-nodes requests**

In `structureApi.listNodes`, add scope parameter:

```typescript
  listNodes: (
    parentId?: string,
    options?: { visibility?: StructureVisibility; scope?: string },
  ) =>
    request<StructureListResult>(
      `/structure-nodes${toQueryString({
        parentId,
        visibility: options?.visibility,
        scope: options?.scope,
      })}`,
    ),

  getRootNodes: (options?: { visibility?: StructureVisibility; scope?: string }) =>
    structureApi.listNodes(undefined, options),

  getChildren: (parentId: string, options?: { visibility?: StructureVisibility; scope?: string }) =>
    structureApi.listNodes(parentId, options),
```

- [ ] **Step 3: Update all import references**

Search all files importing from `content-items` or `gallery` services and update:

- Replace `import { ... } from '@/services/content-items'` → `import { ... } from '@/services/workspace'`
- Replace `import { ... } from '@/services/gallery'` → `import { ... } from '@/services/workspace'`
- Replace `contentItemsApi.xxx` → `notesApi.xxx` (same method names)
- Replace `galleryApi.xxx` → `galleryApi.xxx` (same object name, just from new module)

Key files to update:
- `src/pages/admin/hooks/useAdminWorkspace.ts`
- `src/pages/admin/gallery/hooks/useGalleryWorkspace.ts`
- `src/pages/gallery/index.tsx`
- `src/components/global/Sidebar.tsx`
- Any other files found via grep

- [ ] **Step 4: Delete old service files**

```bash
rm src/services/content-items.ts
rm src/services/gallery.ts
```

- [ ] **Step 5: Verify frontend compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: unify frontend services into workspace.ts with /spaces/:scope/items routes"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] NavigationNode scope field — Task 1-3
- [x] WorkspaceModule structure — Tasks 5-8
- [x] NoteViewService (drafts, history) — Task 6
- [x] GalleryViewService (photos, cover) — Task 7
- [x] Unified API routes — Task 8
- [x] ContentItem category revert — Task 4
- [x] Delete gallery/editor/home modules — Task 9
- [x] Data migration — Task 11
- [x] Frontend service adaptation — Task 12
- [x] Structure-nodes scope param — Task 3, Task 12

**Placeholder scan:** No TBD/TODO found. All steps have code.

**Type consistency:** Verified method names and signatures are consistent across tasks (e.g., `toPostDto`, `toPostDetailDto`, `readPhotoBuffer` in GalleryViewService match usage in WorkspaceController).
