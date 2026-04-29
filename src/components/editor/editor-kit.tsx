/*
 * EditorKit — Plate 编辑器插件套件（精简版）
 *
 * 只保留个人知识库场景必需的插件，移除了协作（Comment/Suggestion/Discussion）、
 * DOCX 导入导出、数学公式、日期、提及、代码绘图、对齐/行高、脚注、多栏、目录等。
 * 系统以 Markdown + Git 为底层，不支持 Markdown 无法表达的格式。
 */

'use client';

import { BasicNodesKit } from './plugins/basic-nodes-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { TableKit } from './plugins/table-kit';
import { MediaKit } from './plugins/media-kit';
import { CalloutKit } from './plugins/callout-kit';
import { FontKit } from './plugins/font-kit';
import { MarkdownKit } from './plugins/markdown-kit';

export const EditorKit = [
  ...BasicNodesKit,
  ...CodeBlockKit,
  ...LinkKit,
  ...ListKit,
  ...TableKit,
  ...MediaKit,
  ...CalloutKit,
  ...FontKit,
  ...MarkdownKit,
];
