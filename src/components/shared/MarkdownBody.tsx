/*
 * MarkdownBody — 共享 markdown 渲染组件
 *
 * 基于 react-markdown + remark-gfm，统一所有只读场景的 markdown 渲染：
 *   - 笔记阅读器 (NotePage)：正文 + TOC 滚动定位
 *   - 管理端内容预览 (ContentVersionView)：版本正文预览
 *
 * 样式全部通过 CSS 自定义属性（--ink, --shelf, --font-mono 等）驱动，
 * 自动适配 daylight/midnight 双主题。
 *
 * 每个 h1/h2/h3 自动分配递增的 data-heading-id 属性，供外层
 * TOC 面板通过 DOM 查询提取目录结构。不需要 TOC 的场景中
 * 这些属性无副作用。
 *
 * memo 包裹：markdown 不变时跳过 react-markdown 重新处理。
 */

import { memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownBody = memo(function MarkdownBody({ markdown }: { markdown: string }) {
  let headingIdx = 0;

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children, ...props }) => {
          const hid = `heading-${headingIdx++}`;
          return (
            <h1
              {...props}
              data-heading-id={hid}
              className="mb-3 mt-8 font-bold leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em', fontSize: 'var(--text-3xl)' }}
            >
              {children}
            </h1>
          );
        },
        h2: ({ children, ...props }) => {
          const hid = `heading-${headingIdx++}`;
          return (
            <h2
              {...props}
              data-heading-id={hid}
              className="mb-2.5 mt-7 font-semibold leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-0.015em', fontSize: 'var(--text-xl)' }}
            >
              {children}
            </h2>
          );
        },
        h3: ({ children, ...props }) => {
          const hid = `heading-${headingIdx++}`;
          return (
            <h3
              {...props}
              data-heading-id={hid}
              className="mb-2 mt-6 font-semibold"
              style={{ color: 'var(--ink)', fontSize: 'var(--text-md)' }}
            >
              {children}
            </h3>
          );
        },
        p: ({ children }) => (
          <p className="mb-5 text-justify" style={{ hangingPunctuation: 'allow-end' }}>{children}</p>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className="my-4 border-l-[3px] py-0.5 pl-5"
            style={{ borderColor: 'var(--ink-ghost)', color: 'var(--ink-faded)' }}
          >
            {children}
          </blockquote>
        ),
        pre: ({ children }) => (
          <pre
            className="my-4 overflow-x-auto whitespace-pre-wrap rounded-xl p-4"
            style={{ background: 'var(--shelf)', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.7, color: 'var(--ink-light)' }}
          >
            {children}
          </pre>
        ),
        code: ({ className, children, ...props }) => {
          /* 块级代码已由 pre 包裹，这里只处理内联代码 */
          if (className) return <code className={className} {...props}>{children}</code>;
          return (
            <code
              className="rounded-md px-1.5 py-[2px] text-[14px]"
              style={{ background: 'var(--shelf)', fontFamily: 'var(--font-mono)', color: 'var(--ink-light)' }}
              {...props}
            >
              {children}
            </code>
          );
        },
        ul: ({ children }) => <ul className="my-3 list-disc pl-7">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 list-decimal pl-7">{children}</ol>,
        li: ({ children }) => <li className="py-0.5">{children}</li>,
        hr: () => <hr className="my-8" style={{ borderColor: 'var(--separator)' }} />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150"
            style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</strong>,
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="w-full text-[14px]" style={{ borderCollapse: 'collapse' }}>{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-[14px] font-semibold" style={{ borderBottom: '1px solid var(--separator)', color: 'var(--ink-faded)' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2" style={{ borderBottom: '0.5px solid var(--separator)' }}>{children}</td>
        ),
      }}
    >
      {markdown}
    </Markdown>
  );
});

export default MarkdownBody;
