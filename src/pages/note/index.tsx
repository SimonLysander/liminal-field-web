import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { smoothBounce } from '@/lib/motion';

/* ---------- Mock Data ---------- */

const tocItems = [
  '一、什么是阈限',
  '二、创作即过渡',
  '三、边界感知',
  '四、不确定性的价值',
  '五、方法论尝试',
];

/**
 * Each paragraph maps to a TOC section index (`toc`).
 * Marks use CSS underline annotations (mark-blue/red/green) from global styles.
 */
const paragraphs = [
  {
    toc: 0,
    text: (
      <>
        在边界与边界之间，存在一种<span className="mark-blue">尚未被命名的状态</span>
        。它不是混乱，而是一种更高维度的秩序——你必须先放弃旧的框架，才能看见新的可能。
      </>
    ),
  },
  {
    toc: 1,
    text: (
      <>
        这种状态在人类学中被称为「<span className="mark-red">阈限</span>」（liminal），由阿诺尔德·范热内普在1909年提出。
        他观察到，所有的过渡仪式都包含三个阶段：分离、阈限、聚合。而阈限阶段是
        <span className="mark-green">最危险也最富创造力的</span>
        ——旧的身份已经脱落，新的身份尚未成形。
      </>
    ),
  },
  {
    toc: 2,
    text: (
      <>
        我开始思考：创作本身是不是一种永恒的阈限状态？每一次面对空白的稿纸，
        你都在经历一次微型的身份危机——你既不是「还没开始写的人」，也不是「已经写完的人」。
        你<span className="mark-blue">悬浮在两者之间</span>。
      </>
    ),
  },
  {
    toc: 3,
    text: (
      <>
        这种悬浮感是不舒适的。大多数人选择尽快通过它——快速写下第一个句子，快速做出第一个决定。
        但如果你能在这种不舒适中停留更久一点，你会发现：正是这种
        <span className="mark-red">「不确定」在保护你的创造力</span>。
      </>
    ),
  },
  {
    toc: 4,
    text: (
      <>
        确定性是创造力的天敌。当你确切地知道自己要写什么、怎么写、写给谁看，
        你已经不是在创作了——你是在执行。执行是重要的，但它和创作是
        <span className="mark-green">两种完全不同的认知状态</span>。
      </>
    ),
  },
];

/* ---------- Component ---------- */

export default function NotePage() {
  const [activeToc, setActiveToc] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const centerRef = useRef<HTMLDivElement>(null);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const aiInputRef = useRef<HTMLInputElement>(null);

  /*
   * Scroll spy: determines which TOC section the user is currently reading
   * by checking which paragraph's offsetTop is closest to the scroll position.
   * Scans in reverse so the last paragraph above the threshold wins.
   */
  const handleScroll = useCallback(() => {
    const container = centerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop + 120;
    for (let i = paraRefs.current.length - 1; i >= 0; i--) {
      const el = paraRefs.current[i];
      if (el && el.offsetTop <= scrollTop) {
        setActiveToc(paragraphs[i].toc);
        return;
      }
    }
    setActiveToc(0);
  }, []);

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToSection = (tocIdx: number) => {
    const paraIdx = paragraphs.findIndex((p) => p.toc === tocIdx);
    const el = paraRefs.current[paraIdx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative flex w-full items-stretch overflow-hidden" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Center — article body */}
      <div className="flex-1 overflow-y-auto px-14 py-12" ref={centerRef}>
        <div className="mb-5 flex items-center gap-3">
          <span className="text-[13px]" style={{ color: 'var(--ink-ghost)' }}>April 22, 2026</span>
          <span className="text-[12px]" style={{ color: 'var(--ink-ghost)' }}>约 2.4k 字 · 8 min</span>
        </div>

        {/* Article title — serif font, with decorative underline */}
        <div
          className="relative mb-10 text-[1.5rem] font-bold leading-snug"
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--ink)',
            letterSpacing: '-0.015em',
          }}
        >
          阈限空间里的创作方法论
          {/* Decorative rule under title */}
          <span
            className="mt-5 block h-[2px] w-8 rounded-sm"
            style={{ background: 'var(--ink)', opacity: 0.15 }}
          />
        </div>

        {/* Paragraphs */}
        <div
          className="text-[0.9375rem] leading-[1.9]"
          style={{ color: 'var(--ink-light)', letterSpacing: '-0.01em' }}
        >
          {paragraphs.map((p, i) => (
            <p
              key={i}
              ref={(el) => { paraRefs.current[i] = el; }}
              className="mb-6 text-justify"
              style={{ hangingPunctuation: 'allow-end' }}
            >
              {p.text}
            </p>
          ))}
        </div>
      </div>

      {/* Right — TOC panel */}
      <div
        className="flex w-[200px] shrink-0 flex-col gap-7 overflow-y-auto px-4 py-10"
        style={{ borderLeft: '0.5px solid var(--separator)' }}
      >
        <div>
          <div
            className="mb-3 text-[11px] font-semibold uppercase"
            style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
          >
            Structure
          </div>
          {tocItems.map((item, i) => (
            <motion.div
              key={i}
              className="cursor-pointer border-l-2 py-[5px] text-[13px] transition-all duration-200"
              style={{
                color: activeToc === i ? 'var(--ink)' : 'var(--ink-faded)',
                fontWeight: activeToc === i ? 500 : 400,
                borderColor: activeToc === i ? 'var(--ink)' : 'transparent',
              }}
              animate={{ paddingLeft: activeToc === i ? 12 : 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => scrollToSection(i)}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI floating action button + chat panel */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3">
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              className="flex w-[340px] flex-col overflow-hidden"
              style={{
                maxHeight: 420,
                background: 'var(--paper)',
                borderRadius: 'var(--radius-xl)',
                boxShadow:
                  '0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
              }}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: smoothBounce }}
            >
              {/* Chat header */}
              <div className="flex items-center justify-between px-[18px] pb-3 pt-3.5">
                <span
                  className="truncate text-[13px] font-semibold"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
                >
                  阈限空间里的创作方法论
                </span>
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150"
                  style={{ color: 'var(--ink-ghost)' }}
                  onClick={() => setAiOpen(false)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {/* Empty state */}
              <div className="flex-1 overflow-y-auto px-[18px] pb-4 pt-2" style={{ minHeight: 140 }}>
                <div
                  className="px-3 py-8 text-center text-[13px] leading-relaxed"
                  style={{ color: 'var(--ink-ghost)' }}
                >
                  对这篇文稿的任何想法，随时问
                </div>
              </div>
              {/* Input */}
              <div className="ai-chat-input-row px-3 pb-3">
                <input
                  ref={aiInputRef}
                  type="text"
                  className="w-full rounded-full border-none px-3.5 py-2.5 text-[13px] outline-none transition-shadow duration-200"
                  style={{
                    background: 'var(--paper-dark)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-sans)',
                  }}
                  placeholder="提问..."
                  onKeyDown={(e) => e.key === 'Escape' && setAiOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB button */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4m0 10v4M5.6 5.6l2.8 2.8m7.2 7.2l2.8 2.8M3 12h4m10 0h4M5.6 18.4l2.8-2.8m7.2-7.2l2.8-2.8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
