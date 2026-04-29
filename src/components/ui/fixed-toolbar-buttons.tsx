'use client';

import type { TElement } from 'platejs';

import {
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  PaintBucketIcon,
  PilcrowIcon,
  QuoteIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useEditorReadOnly, useSelectionFragmentProp } from 'platejs/react';

import {
  getBlockType,
  setBlockType,
} from '@/components/editor/transforms';

import { FontColorToolbarButton } from './font-color-toolbar-button';
import { FontSizeToolbarButton } from './font-size-toolbar-button';
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from './list-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { ToolbarButton, ToolbarGroup } from './toolbar';

export function FixedToolbarButtons() {
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();

  // 检测当前选区的块类型，用于高亮对应按钮
  const blockType = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          {/* H1/H2/H3/Text 直接按钮，替代下拉菜单 */}
          <ToolbarGroup>
            <ToolbarButton
              pressed={blockType === KEYS.p}
              onClick={() => setBlockType(editor, KEYS.p)}
              tooltip="正文"
            >
              <PilcrowIcon />
            </ToolbarButton>

            <ToolbarButton
              pressed={blockType === 'h1'}
              onClick={() => setBlockType(editor, 'h1')}
              tooltip="标题 1"
            >
              <Heading1Icon />
            </ToolbarButton>

            <ToolbarButton
              pressed={blockType === 'h2'}
              onClick={() => setBlockType(editor, 'h2')}
              tooltip="标题 2"
            >
              <Heading2Icon />
            </ToolbarButton>

            <ToolbarButton
              pressed={blockType === 'h3'}
              onClick={() => setBlockType(editor, 'h3')}
              tooltip="标题 3"
            >
              <Heading3Icon />
            </ToolbarButton>

            <ToolbarButton
              pressed={blockType === KEYS.blockquote}
              onClick={() => setBlockType(editor, KEYS.blockquote)}
              tooltip="引用"
            >
              <QuoteIcon />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <FontColorToolbarButton nodeType={KEYS.color} tooltip="Text color">
              <BaselineIcon />
            </FontColorToolbarButton>

            <FontColorToolbarButton
              nodeType={KEYS.backgroundColor}
              tooltip="Background color"
            >
              <PaintBucketIcon />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MediaToolbarButton nodeType={KEYS.img} />
          </ToolbarGroup>
        </>
      )}
    </div>
  );
}
