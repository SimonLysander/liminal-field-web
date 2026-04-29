/*
 * EditorKit — Plate 编辑器插件套件（精简版）
 *
 * 只保留个人知识库场景必需的插件。
 * 系统以 Markdown + Git 为底层。
 */

'use client';

import { BasicNodesKit } from './plugins/basic-nodes-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { DateKit } from './plugins/date-kit';
import { DndKit } from './plugins/dnd-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { TableKit } from './plugins/table-kit';
import { MediaKit } from './plugins/media-kit';
import { FontKit } from './plugins/font-kit';
import { MarkdownKit } from './plugins/markdown-kit';

export const EditorKit = [
  ...BasicNodesKit,
  ...CodeBlockKit,
  ...DateKit,
  ...DndKit,
  ...LinkKit,
  ...ListKit,
  ...TableKit,
  ...MediaKit,
  ...FontKit,
  ...MarkdownKit,
];
