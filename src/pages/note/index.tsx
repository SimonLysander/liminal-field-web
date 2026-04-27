/*
 * NotePage — Article reader with TOC and AI chat
 *
 * Reading width: max-w-[740px] px-10, matching the editor for consistency.
 *
 * Scroll-to-heading technique:
 *   Headings are rendered with data-heading-id attributes by MarkdownBody.
 *   scrollToHeading() uses getBoundingClientRect() to calculate the target
 *   position relative to the scroll container (not the viewport), then calls
 *   container.scrollTo({ behavior: 'smooth' }). CSS scroll-margin-top (80px)
 *   compensates for sticky headers so headings don't hide behind them.
 *
 * TOC panel: 200px wide right panel matching Sidebar/TreePanel/editor outline.
 *   Active heading tracked via scroll spy (passive scroll listener), with a
 *   spring-animated paddingLeft shift for the active item.
 *
 * AI chat FAB: radius-xl (12px) panel, radius-full button. Uses the
 *   ai-fab / ai-chat-panel CSS classes for midnight theme overrides.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { smoothBounce } from '@/lib/motion';
import { notesApi as contentItemsApi } from '@/services/workspace';
import type { ContentDetail } from '@/services/workspace';
import { BookOpen, X, Sparkles } from 'lucide-react';

/* ================================================================
 * /note      → NoteListView  已发布文章列表
 * /note/:id  → NoteReader     文章阅读器
 * ================================================================ */

export default function NotePage() {
  const { id } = useParams<{ id: string }>();
  return id ? <NoteReader id={id} /> : <NoteListView />;
}

/* ---------- Empty State ---------- */

function NoteListView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: smoothBounce }}
      >
        <BookOpen size={32} strokeWidth={1.2} style={{ color: 'var(--ink-ghost)', opacity: 0.5 }} />
        <span
          className="text-[15px] font-medium"
          style={{ color: 'var(--ink-ghost)', letterSpacing: '-0.01em' }}
        >
          选择一篇笔记开始阅读
        </span>
      </motion.div>
    </div>
  );
}

/* ---------- Article Reader ---------- */

type TocEntry = { level: number; text: string; id: string };

function NoteReader({ id }: { id: string }) {
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeToc, setActiveToc] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    contentItemsApi
      .getById(id)
      .then(setContent)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  /* 从 markdown 提取标题构建 TOC — 跳过代码块 */
  const toc = useMemo<TocEntry[]>(() => {
    if (!content) return [];
    let inCodeBlock = false;
    return content.bodyMarkdown
      .split('\n')
      .reduce<TocEntry[]>((acc, line) => {
        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          return acc;
        }
        if (inCodeBlock) return acc;
        const m = line.match(/^(#{1,3})\s+(.+)$/);
        if (m) {
          const text = m[2].trim();
          acc.push({
            level: m[1].length,
            text,
            id: `heading-${acc.length}`,
          });
        }
        return acc;
      }, []);
  }, [content]);

  /* Scroll spy — 监听滚动确定当前 TOC 位置 */
  const handleScroll = useCallback(() => {
    const container = centerRef.current;
    if (!container || toc.length === 0) return;
    const scrollTop = container.scrollTop + 120;
    const headingEls = container.querySelectorAll('[data-heading-id]');

    for (let i = headingEls.length - 1; i >= 0; i--) {
      const el = headingEls[i] as HTMLElement;
      if (el.offsetTop <= scrollTop) {
        setActiveToc(el.getAttribute('data-heading-id') || '');
        return;
      }
    }
    if (toc[0]) setActiveToc(toc[0].id);
  }, [toc]);

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToHeading = (headingId: string) => {
    const el = centerRef.current?.querySelector(`[data-heading-id="${headingId}"]`) as HTMLElement | null;
    if (!el || !centerRef.current) return;
    const top = el.getBoundingClientRect().top - centerRef.current.getBoundingClientRect().top + centerRef.current.scrollTop - 16;
    centerRef.current.scrollTo({ top, behavior: 'smooth' });
  };

  /* 标题信息 */
  const title = content?.publishedVersion?.title || content?.latestVersion.title || '';
  const summary = content?.publishedVersion?.summary || content?.latestVersion.summary || '';
  const wordCount = content?.bodyMarkdown.length || 0;
  const readMin = Math.max(1, Math.ceil(wordCount / 400));

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-[14px]" style={{ color: 'var(--ink-ghost)' }}>加载中...</span>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <span className="text-[14px]" style={{ color: 'var(--mark-red)' }}>{error || '文章不存在'}</span>
        <button className="text-[14px]" style={{ color: 'var(--ink-faded)' }} onClick={() => navigate('/note')}>
          ← 返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex w-full items-stretch overflow-hidden">
      {/* Center — article body */}
      <div className="flex-1 overflow-y-auto py-12" ref={centerRef}>
       <div className="mx-auto max-w-[740px] px-10">
        <div className="mb-5 flex items-center gap-3">
          <button
            className="text-[14px] transition-colors duration-150"
            style={{ color: 'var(--ink-ghost)' }}
            onClick={() => navigate('/note')}
          >
            ← 返回
          </button>
          <span className="text-[14px]" style={{ color: 'var(--ink-ghost)' }}>
            约 {wordCount > 1000 ? `${(wordCount / 1000).toFixed(1)}k` : wordCount} 字 · {readMin} min
          </span>
        </div>

        {/* 文章标题 */}
        <div
          className="relative mb-10 text-[1.5rem] font-bold leading-snug"
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--ink)',
            letterSpacing: '-0.015em',
          }}
        >
          {title}
          <span
            className="mt-5 block h-[2px] w-8 rounded-sm"
            style={{ background: 'var(--ink)', opacity: 0.15 }}
          />
        </div>

        {summary && (
          <div
            className="mb-8 text-[15px] leading-relaxed"
            style={{ color: 'var(--ink-faded)', fontStyle: 'italic' }}
          >
            {summary}
          </div>
        )}

        {/* Markdown 正文 */}
        <div className="note-prose leading-[1.9]" style={{ color: 'var(--ink-light)', fontSize: 'var(--text-lg)' }}>
          <MarkdownBody markdown={content.bodyMarkdown} toc={toc} />
        </div>
       </div>
      </div>

      {/* Right — TOC panel */}
      {toc.length > 0 && (
        <div
          className="flex w-[200px] shrink-0 flex-col gap-7 overflow-y-auto px-4 py-10"
          style={{ borderLeft: '0.5px solid var(--separator)' }}
        >
          <div>
            <div
              className="mb-3 text-[12px] font-semibold uppercase"
              style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
            >
              目录
            </div>
            {toc.map((item) => (
              <motion.div
                key={item.id}
                className="cursor-pointer border-l-2 py-[5px] text-[14px] transition-all duration-200"
                style={{
                  color: activeToc === item.id ? 'var(--ink)' : 'var(--ink-faded)',
                  fontWeight: activeToc === item.id ? 500 : 400,
                  borderColor: activeToc === item.id ? 'var(--ink)' : 'transparent',
                  paddingLeft: `${(item.level - 1) * 8 + 10}px`,
                }}
                animate={{ paddingLeft: activeToc === item.id ? (item.level - 1) * 8 + 12 : (item.level - 1) * 8 + 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => scrollToHeading(item.id)}
              >
                {item.text}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI floating action button */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3">
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              className="ai-chat-panel flex w-[340px] flex-col overflow-hidden"
              style={{
                maxHeight: 420,
                background: 'var(--paper)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
              }}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: smoothBounce }}
            >
              <div className="flex items-center justify-between px-[18px] pb-3 pt-3.5">
                <span className="truncate text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {title}
                </span>
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ color: 'var(--ink-ghost)' }}
                  onClick={() => setAiOpen(false)}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-[18px] pb-4 pt-2" style={{ minHeight: 140 }}>
                <div className="px-3 py-8 text-center text-[14px] leading-relaxed" style={{ color: 'var(--ink-ghost)' }}>
                  对这篇文稿的任何想法，随时问
                </div>
              </div>
              <div className="ai-chat-input-row px-3 pb-3">
                <input
                  ref={aiInputRef}
                  type="text"
                  className="w-full rounded-full border-none px-3.5 py-2.5 text-[14px] outline-none"
                  style={{ background: 'var(--paper-dark)', color: 'var(--ink)' }}
                  placeholder="提问..."
                  onKeyDown={(e) => e.key === 'Escape' && setAiOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className={`ai-fab flex h-10 w-10 items-center justify-center rounded-full border-none transition-all duration-250 ${aiOpen ? 'active' : ''}`}
          style={{
            background: aiOpen ? 'var(--ink)' : 'var(--paper)',
            color: aiOpen ? 'var(--accent-contrast)' : 'var(--ink-faded)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
          }}
          onClick={() => {
            setAiOpen((v) => !v);
            if (!aiOpen) setTimeout(() => aiInputRef.current?.focus(), 100);
          }}
        >
          <Sparkles size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* ---------- Markdown Body ---------- */

/** 渲染 markdown，同时为标题注入 data-heading-id 供 scroll spy 使用 */
function MarkdownBody({ markdown, toc }: { markdown: string; toc: TocEntry[] }) {
  let headingIdx = 0;

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children, ...props }) => {
          const entry = toc[headingIdx++];
          return (
            <h1
              {...props}
              data-heading-id={entry?.id}
              className="mb-3 mt-8 font-bold leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em', fontSize: 'var(--text-3xl)' }}
            >
              {children}
            </h1>
          );
        },
        h2: ({ children, ...props }) => {
          const entry = toc[headingIdx++];
          return (
            <h2
              {...props}
              data-heading-id={entry?.id}
              className="mb-2.5 mt-7 font-semibold leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-0.015em', fontSize: 'var(--text-xl)' }}
            >
              {children}
            </h2>
          );
        },
        h3: ({ children, ...props }) => {
          const entry = toc[headingIdx++];
          return (
            <h3
              {...props}
              data-heading-id={entry?.id}
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
}
