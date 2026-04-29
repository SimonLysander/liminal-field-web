/*
 * PlateMarkdownEditor — Markdown 驱动的富文本编辑器
 *
 * 工具栏通过 React Portal 渲染到外部 DOM 容器（由 toolbarContainer prop 指定），
 * 使工具栏能出现在页面顶栏区域，同时保持 Plate 上下文可用。
 *
 * Markdown 双向转换：
 *   - 初始化时 deserializeMd 将 Markdown 转为 Plate 节点树
 *   - 编辑时 serializeMd 将节点树序列化回 Markdown
 */

import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plate,
  usePlateEditor,
} from 'platejs/react';
import { serializeMd, deserializeMd } from '@platejs/markdown';

import { EditorKit } from '@/components/editor/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';
import { TooltipProvider } from '@/components/ui/tooltip';

export function PlateMarkdownEditor({
  initialMarkdown,
  onChange,
  toolbarContainer,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  toolbarContainer?: HTMLElement | null;
}) {
  /* value 接受工厂函数 (editor) => Value，在 editor 完全初始化后才调用，
     避免在 React 上下文外触发 Jotai atom 求值导致 crash */
  const editor = usePlateEditor(
    {
      plugins: EditorKit,
      value: (editor) => {
        try {
          return deserializeMd(editor, initialMarkdown || '');
        } catch {
          return [{ type: 'p', children: [{ text: '' }] }];
        }
      },
    },
    [],
  );

  const handleChange = useCallback(() => {
    if (!editor) return;
    try {
      const md = serializeMd(editor);
      onChange(md);
    } catch {
      /* Serialize can fail during rapid edits — skip, next change will catch up */
    }
  }, [editor, onChange]);

  if (!editor) return null;

  return (
    <TooltipProvider>
      <Plate editor={editor} onValueChange={handleChange}>
        {toolbarContainer && createPortal(
          <FixedToolbar>
            <FixedToolbarButtons />
          </FixedToolbar>,
          toolbarContainer,
        )}
        <EditorContainer>
          <Editor variant="default" placeholder="开始写作..." />
        </EditorContainer>
      </Plate>
    </TooltipProvider>
  );
}
