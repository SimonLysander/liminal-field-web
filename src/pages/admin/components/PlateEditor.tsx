import { useCallback, useMemo, useState } from 'react';
import {
  Plate,
  PlateContent,
  PlateElement,
  PlateLeaf,
  createPlateEditor,
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePlateEditor,
} from 'platejs/react';
import type { PlateElementProps, PlateLeafProps } from 'platejs/react';
import type { TLinkElement } from 'platejs';
import { KEYS } from 'platejs';
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
import { getLinkAttributes, LinkRules } from '@platejs/link';
import {
  LinkPlugin,
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
  useLink,
} from '@platejs/link/react';
import { flip, offset } from '@platejs/floating';
import type { UseVirtualFloatingOptions } from '@platejs/floating';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  ExternalLink,
  Unlink,
  Text,
} from 'lucide-react';
import { ICON } from '@/lib/icons';

/* ---------- Custom element components ---------- */

function H1Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="h1"
      className="mb-1.5 mt-5 font-bold leading-snug text-ink text-3xl tracking-[-0.02em]"
    >
      {children}
    </PlateElement>
  );
}

function H2Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="h2"
      className="mb-1.5 mt-4 font-semibold leading-snug text-ink text-2xl tracking-[-0.015em]"
    >
      {children}
    </PlateElement>
  );
}

function H3Element({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="h3"
      className="mb-1 mt-3 font-semibold text-ink text-xl"
    >
      {children}
    </PlateElement>
  );
}

function BlockquoteElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="blockquote"
      className="my-3 border-l-[3px] py-0.5 pl-5 border-ink-ghost text-ink-faded"
    >
      {children}
    </PlateElement>
  );
}

function CodeBlockElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="pre"
      className="my-3 rounded-xl p-4 bg-shelf font-mono text-sm leading-[1.7] whitespace-pre-wrap break-words"
    >
      {children}
    </PlateElement>
  );
}

function CodeLineElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} as="div">
      {children}
    </PlateElement>
  );
}

function ParagraphElement({ children, ...props }: PlateElementProps) {
  return (
    <PlateElement {...props} as="div" className="my-0.5">
      {children}
    </PlateElement>
  );
}

function LinkElement({ children, element, ...props }: PlateElementProps) {
  const { props: linkProps } = useLink({ element });
  return (
    <PlateElement
      {...props}
      element={element}
      as="a"
      className="transition-colors duration-100 text-ink underline underline-offset-[3px] cursor-pointer"
      {...linkProps}
    >
      {children}
    </PlateElement>
  );
}

function CodeLeafElement({ children, ...props }: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="rounded-md px-1.5 py-[2px] bg-shelf font-mono text-sm text-ink-light"
    >
      {children}
    </PlateLeaf>
  );
}

/* ---------- LinkFloatingToolbar — 链接浮动编辑栏 ---------- */

/* 基于 Plate 官方 link-toolbar 组件简化，适配项目 CSS 变量体系。
   包含两种模式：
   - insert：Cmd+K 或工具栏按钮触发，输入 URL + 显示文本
   - edit：点击已有链接时显示，提供编辑/打开/取消链接操作 */

function LinkFloatingToolbar() {
  const floatingOptions: UseVirtualFloatingOptions = useMemo(() => ({
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['bottom-end', 'top-start', 'top-end'], padding: 12 }),
    ],
    placement: 'bottom-start',
  }), []);

  const insertState = useFloatingLinkInsertState({ floatingOptions });
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({ floatingOptions });
  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState);

  const inputProps = useFormInputProps({ preventDefaultOnEnterKeydown: true });

  if (hidden) return null;

  /* 浮动弹窗共用 className，动态定位 style 由 insertProps/editProps 注入，不可移除 */
  const popoverCls = "bg-paper border border-separator rounded-[10px] shadow-[0_4px_24px_rgba(0,0,0,0.12)] p-1 z-50";

  /* 输入框共用 className */
  const inputCls = "flex-1 h-7 bg-transparent border-none outline-none text-ink text-sm px-1.5 py-1";

  /* 工具栏按钮共用 className */
  const btnCls = "inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md border-none bg-transparent text-ink-faded text-xs cursor-pointer";

  const input = (
    <div className="flex w-[300px] flex-col" {...inputProps}>
      <div className="flex items-center">
        <div className="flex items-center pl-2 pr-1 text-ink-ghost">
          <Link className="size-4" />
        </div>
        <FloatingLinkUrlInput
          className={inputCls}
          placeholder="粘贴链接地址..."
          data-plate-focus
        />
      </div>
      <div className="mx-1 my-1 h-px bg-separator" />
      <div className="flex items-center">
        <div className="flex items-center pl-2 pr-1 text-ink-ghost">
          <Text className="size-4" />
        </div>
        <input
          className={inputCls}
          placeholder="显示文本"
          data-plate-focus
          {...textInputProps}
        />
      </div>
    </div>
  );

  const editContent = editState.isEditing ? input : (
    <div className="flex items-center">
      <button type="button" className={btnCls} {...editButtonProps}>
        编辑链接
      </button>
      <div className="mx-0.5 h-4 w-px bg-separator" />
      <LinkOpenButton className={btnCls} />
      <div className="mx-0.5 h-4 w-px bg-separator" />
      <button type="button" className={btnCls} {...unlinkButtonProps}>
        <Unlink className="size-4" />
      </button>
    </div>
  );

  return (
    <>
      {/* insertProps.style 包含浮动定位坐标，必须保留 */}
      <div ref={insertRef} className={popoverCls} {...insertProps}>
        {input}
      </div>
      <div ref={editRef} className={popoverCls} {...editProps}>
        {editContent}
      </div>
    </>
  );
}

function LinkOpenButton({ className }: { className: string }) {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = useMemo(() => {
    const entry = editor.api.node<TLinkElement>({
      match: { type: editor.getType(KEYS.link) },
    });
    if (!entry) return {};
    return getLinkAttributes(editor, entry[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, selection]);

  return (
    <a {...attributes} className={className} target="_blank" aria-label="在新标签页打开">
      <ExternalLink className="size-4" />
    </a>
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
  /* LinkPlugin 配置：
     - inputRules: 粘贴/空格/回车时自动将 URL 转为链接
     - render.afterEditable: 浮动编辑工具栏
     - render.node: 链接渲染组件 */
  LinkPlugin.configure({
    inputRules: [
      LinkRules.autolink({ variant: 'paste' }),
      LinkRules.autolink({ variant: 'space' }),
    ],
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];

/* ---------- Toolbar ---------- */

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
      { icon: <Bold {...ICON.md} />, action: () => editor.tf.toggleMark('bold'), title: '粗体' },
      { icon: <Italic {...ICON.md} />, action: () => editor.tf.toggleMark('italic'), title: '斜体' },
      { icon: <Strikethrough {...ICON.md} />, action: () => editor.tf.toggleMark('strikethrough'), title: '删除线' },
    ],
    [
      { icon: <List {...ICON.md} />, action: () => toggleList(editor, { listStyleType: 'disc' }), title: '无序列表' },
      { icon: <ListOrdered {...ICON.md} />, action: () => toggleList(editor, { listStyleType: 'decimal' }), title: '有序列表' },
      { icon: <Quote {...ICON.md} />, action: () => editor.tf.toggleBlock('blockquote', { wrap: true }), title: '引用' },
      { icon: <Code {...ICON.md} />, action: () => toggleCodeBlock(editor), title: '代码块' },
      { icon: <Link {...ICON.md} />, action: () => {
        /* Cmd+K 快捷键由 LinkPlugin 内置处理，
           工具栏按钮通过 floatingLink.show 触发同一套浮动 UI */
        if (!editor.selection) return;
        const api = editor.getApi(LinkPlugin);
        editor.setOption(LinkPlugin, 'text', editor.api.string(editor.selection));
        api.floatingLink.show('insert', editor.id);
      }, title: '链接' },
    ],
  ];

  return (
    <div className="flex items-center gap-0.5">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && (
            <div className="mx-1.5 h-3.5 w-px bg-separator opacity-50" />
          )}
          {group.map((tool) => (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              className="plate-toolbar-btn flex items-center justify-center rounded-md px-2 py-1.5 font-medium transition-all duration-100 text-ink-faded text-xs min-w-7"
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
      <div className="sticky top-0 z-10 mb-4 py-1.5 bg-paper">
        <Toolbar editor={editor} />
      </div>
      <PlateContent
        className="plate-editor-content min-h-[500px] w-full leading-[1.9] outline-none text-ink-light text-lg [border:none] [box-shadow:none]"
        placeholder="开始写作..."
      />
    </Plate>
  );
}
