import { useCallback, useState } from 'react';
import {
  Plate,
  PlateContent,
  PlateElement,
  PlateLeaf,
  createPlateEditor,
  usePlateEditor,
} from 'platejs/react';
import { MarkdownPlugin, serializeMd, deserializeMd } from '@platejs/markdown';
import {
  BoldPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  CodePlugin,
  HeadingPlugin,
  BlockquotePlugin,
} from '@platejs/basic-nodes/react';
import { CodeBlockPlugin } from '@platejs/code-block/react';
import { toggleCodeBlock } from '@platejs/code-block';
import { ListPlugin } from '@platejs/list/react';
import { toggleList } from '@platejs/list';
import { LinkPlugin, triggerFloatingLinkInsert } from '@platejs/link/react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
} from 'lucide-react';

/* ---------- Custom element components ---------- */

/* Plate v53 使用插件组件（而非全局 renderElement）渲染节点。
   每个组件通过 usePlateEditor 的 components 选项注册到对应插件，
   自动获得包含 editor 的完整 props。 */

function H1Element({ children, ...props }: any) {
  return (
    <PlateElement
      {...props}
      as="h1"
      className="mb-3 mt-7 font-bold leading-snug"
      style={{ color: 'var(--ink)', letterSpacing: '-0.02em', fontSize: 'var(--text-3xl)' }}
    >
      {children}
    </PlateElement>
  );
}

function H2Element({ children, ...props }: any) {
  return (
    <PlateElement
      {...props}
      as="h2"
      className="mb-2.5 mt-6 font-semibold leading-snug"
      style={{ color: 'var(--ink)', letterSpacing: '-0.015em', fontSize: 'var(--text-xl)' }}
    >
      {children}
    </PlateElement>
  );
}

function H3Element({ children, ...props }: any) {
  return (
    <PlateElement
      {...props}
      as="h3"
      className="mb-2 mt-5 font-semibold"
      style={{ color: 'var(--ink)', fontSize: 'var(--text-md)' }}
    >
      {children}
    </PlateElement>
  );
}

function BlockquoteElement({ children, ...props }: any) {
  return (
    <PlateElement
      {...props}
      as="blockquote"
      className="my-3 border-l-[3px] py-0.5 pl-5"
      style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink-faded)' }}
    >
      {children}
    </PlateElement>
  );
}

function CodeBlockElement({ children, ...props }: any) {
  return (
    <PlateElement
      {...props}
      as="pre"
      className="my-4 rounded-xl p-4"
      style={{
        background: 'var(--shelf)',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </PlateElement>
  );
}

function CodeLineElement({ children, ...props }: any) {
  return (
    <PlateElement {...props} as="div">
      {children}
    </PlateElement>
  );
}

function ParagraphElement({ children, ...props }: any) {
  return (
    <PlateElement {...props} as="div" className="my-1.5">
      {children}
    </PlateElement>
  );
}

function LinkElement({ children, ...props }: any) {
  return (
    <PlateElement
      {...props}
      as="a"
      className="transition-colors duration-150"
      style={{
        color: 'var(--ink)',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        cursor: 'pointer',
      }}
    >
      {children}
    </PlateElement>
  );
}

function CodeLeafElement({ children, ...props }: any) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="rounded-md px-1.5 py-[2px]"
      style={{
        background: 'var(--shelf)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--ink-light)',
      }}
    >
      {children}
    </PlateLeaf>
  );
}

/* ---------- Plugin list ---------- */

const plugins = [
  MarkdownPlugin,
  HeadingPlugin,
  BoldPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  CodePlugin,
  BlockquotePlugin,
  CodeBlockPlugin,
  ListPlugin,
  LinkPlugin,
];

/* ---------- Toolbar ---------- */

/* Lucide 统一配置 — strokeWidth 1.5 接近 SF Symbols */
const ICON = { size: 15, strokeWidth: 1.5 } as const;

type ToolItem = { icon: React.ReactNode; action: () => void; title: string };
type PlateEditorInstance = NonNullable<ReturnType<typeof usePlateEditor>>;

function Toolbar({ editor }: { editor: PlateEditorInstance }) {
  const groups: ToolItem[][] = [
    [
      { icon: 'H1', action: () => editor.tf.toggleBlock('h1'), title: '一级标题' },
      { icon: 'H2', action: () => editor.tf.toggleBlock('h2'), title: '二级标题' },
      { icon: 'H3', action: () => editor.tf.toggleBlock('h3'), title: '三级标题' },
    ],
    [
      { icon: <Bold {...ICON} />, action: () => editor.tf.toggleMark('bold'), title: '粗体' },
      { icon: <Italic {...ICON} />, action: () => editor.tf.toggleMark('italic'), title: '斜体' },
      { icon: <Strikethrough {...ICON} />, action: () => editor.tf.toggleMark('strikethrough'), title: '删除线' },
    ],
    [
      { icon: <List {...ICON} />, action: () => toggleList(editor, { listStyleType: 'disc' }), title: '无序列表' },
      { icon: <ListOrdered {...ICON} />, action: () => toggleList(editor, { listStyleType: 'decimal' }), title: '有序列表' },
      { icon: <Quote {...ICON} />, action: () => editor.tf.toggleBlock('blockquote', { wrap: true }), title: '引用' },
      { icon: <Code {...ICON} />, action: () => toggleCodeBlock(editor), title: '代码块' },
      { icon: <Link {...ICON} />, action: () => triggerFloatingLinkInsert(editor), title: '链接' },
    ],
  ];

  return (
    <div className="flex items-center gap-0.5">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && (
            <div
              className="mx-1.5 h-3.5"
              style={{ width: 1, background: 'var(--separator)', opacity: 0.5 }}
            />
          )}
          {group.map((tool) => (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              className="plate-toolbar-btn flex items-center justify-center rounded-md px-2 py-1.5 font-medium transition-all duration-150"
              style={{ color: 'var(--ink-faded)', fontSize: 'var(--text-xs)', minWidth: 28 }}
              onMouseDown={(e) => {
                e.preventDefault();
                tool.action();
              }}
            >
              {tool.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Main Component ---------- */

export function PlateMarkdownEditor({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  charCount?: number;
}) {
  const [initialValue] = useState(() => {
    const tempEditor = createPlateEditor({ plugins });
    try {
      return deserializeMd(tempEditor, initialMarkdown || '');
    } catch {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
  });

  const editor = usePlateEditor(
    {
      plugins,
      value: initialValue,
      override: {
        components: {
          h1: H1Element,
          h2: H2Element,
          h3: H3Element,
          blockquote: BlockquoteElement,
          code_block: CodeBlockElement,
          code_line: CodeLineElement,
          code: CodeLeafElement,
          a: LinkElement,
          p: ParagraphElement,
        },
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
    <Plate editor={editor} onValueChange={handleChange}>
      {/* Toolbar — sticky at top */}
      <div
        className="sticky top-0 z-10 mb-4 py-1.5"
        style={{ background: 'var(--paper)' }}
      >
        <Toolbar editor={editor} />
      </div>
      <PlateContent
        className="plate-editor-content min-h-[500px] w-full leading-[1.9] outline-none"
        style={{ color: 'var(--ink-light)', outline: 'none', border: 'none', boxShadow: 'none', fontSize: 'var(--text-lg)' }}
        placeholder="开始写作..."
      />
    </Plate>
  );
}
