/*
 * EditorKit — 完整的 Plate 编辑器插件套件
 *
 * 组合所有 React kit，每个 kit 负责注册插件 + 绑定 UI 组件。
 * 插件按 key 去重，重复的 kit（如 IndentKit 被 ListKit 和 ToggleKit 同时引入）
 * 不会冲突，后注册的覆盖前者。
 *
 * 不包含 AI 功能（需要后端配置）和 BlockSelection（依赖 AIChatPlugin）。
 * 工具栏由 edit.tsx 通过 React Portal 渲染到页面顶栏。
 */

'use client';

import { BasicNodesKit } from './plugins/basic-nodes-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { LinkKit } from './plugins/link-kit';
import { ListKit } from './plugins/list-kit';
import { TableKit } from './plugins/table-kit';
// ToggleKit 暂时移除：内部 someToggle atom 在编辑器初始化前求值导致 crash
// import { ToggleKit } from './plugins/toggle-kit';
import { TocKit } from './plugins/toc-kit';
import { MediaKit } from './plugins/media-kit';
import { CalloutKit } from './plugins/callout-kit';
import { ColumnKit } from './plugins/column-kit';
import { MathKit } from './plugins/math-kit';
import { DateKit } from './plugins/date-kit';
import { MentionKit } from './plugins/mention-kit';
import { EmojiKit } from './plugins/emoji-kit';
import { FontKit } from './plugins/font-kit';
import { AlignKit } from './plugins/align-kit';
import { LineHeightKit } from './plugins/line-height-kit';
import { FootnoteKit } from './plugins/footnote-kit';
import { CodeDrawingKit } from './plugins/code-drawing-kit';
import { CommentKit } from './plugins/comment-kit';
import { SuggestionKit } from './plugins/suggestion-kit';
import { DiscussionKit } from './plugins/discussion-kit';
import { DocxKit } from './plugins/docx-kit';
import { DocxExportKit } from './plugins/docx-export-kit';
import { MarkdownKit } from './plugins/markdown-kit';
export const EditorKit = [
  /* 基础块级 + 行内标记 */
  ...BasicNodesKit,
  ...CodeBlockKit,

  /* 结构化元素 */
  ...LinkKit,
  ...ListKit,
  ...TableKit,
  // ...ToggleKit,
  ...TocKit,
  ...CalloutKit,
  ...ColumnKit,

  /* 嵌入内容 */
  ...MediaKit,
  ...MathKit,
  ...DateKit,
  ...MentionKit,
  ...EmojiKit,
  ...CodeDrawingKit,

  /* 文本样式 */
  ...FontKit,
  ...AlignKit,
  ...LineHeightKit,

  /* 脚注 */
  ...FootnoteKit,

  /* 协作标注 */
  ...CommentKit,
  ...SuggestionKit,
  ...DiscussionKit,

  /* 导入 / 导出 */
  ...DocxKit,
  ...DocxExportKit,

  /* Markdown 序列化（放在靠后位置，需要感知所有已注册的节点类型） */
  ...MarkdownKit,

  /* 工具栏由 edit.tsx 通过 Portal 手动渲染到顶栏区域 */
];
