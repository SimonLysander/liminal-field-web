import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ---------- Data ---------- */

const spaces = ['home', 'notes', 'gallery', 'agent'] as const;
type Space = (typeof spaces)[number];

const labels: Record<Space, string> = {
  home: 'Home',
  notes: 'Notes',
  gallery: 'Gallery',
  agent: 'Agent',
};

const icons: Record<Space, React.ReactNode> = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 14 15 14 15 21" />
    </svg>
  ),
  notes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  gallery: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  agent: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18L6 21.5L7 14.5L2 9.5L9 8.5L12 2z" />
    </svg>
  ),
};

/* Placeholder data for sub-nav — matches the reference design */
const topics = [
  {
    name: '通感', emoji: '◯', notes: [
      { title: '阈限空间里的创作方法论', meta: 'Apr 22 · 2.4k 字', status: 'done' as const },
      { title: '声音的形状', meta: 'Apr 12 · 1.2k 字', status: 'done' as const },
      { title: '通感笔记：前言', meta: 'Mar 28 · 1.8k 字', status: 'draft' as const },
      { title: '关于颜色与记忆', meta: 'Apr 15 · 680 字', status: 'draft' as const },
    ],
  },
  {
    name: '创作方法', emoji: '△', notes: [
      { title: '反向日记', meta: 'Apr 3 · 320 字', status: 'done' as const },
      { title: '关于「场」的三种理解', meta: 'Mar 20 · 900 字', status: 'draft' as const },
      { title: '不确定性笔记', meta: 'Mar 10 · 560 字', status: 'draft' as const },
    ],
  },
  {
    name: '视觉参考', emoji: '□', notes: [
      { title: '松本大洋的留白', meta: 'Apr 8 · 450 字', status: 'done' as const },
      { title: '色彩实验笔记', meta: 'Feb 28 · 380 字', status: 'draft' as const },
    ],
  },
  {
    name: '旅行', emoji: '◇', notes: [
      { title: '青岛：扁平光的海', meta: 'Apr 21 · 600 字', status: 'done' as const },
      { title: '东京的暗角', meta: 'Jan 15 · 1.1k 字', status: 'done' as const },
    ],
  },
];

const tagGroups = [
  { label: '地点', tags: ['北京', '武汉', '青岛', '东京', '大理'] },
  { label: '风格', tags: ['扁平光', '自然', '街头', '抽象'] },
  { label: '相机', tags: ['GR III', 'iPhone', 'X100V'] },
];

const agentSessions = [
  { title: '写作模式分析', date: '今天', status: 'active' },
  { title: '文稿关联发现', date: '昨天', status: 'done' },
  { title: '本周创作总结', date: 'Apr 20', status: 'done' },
];

function getAmbientPhrase() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了，灵感不睡';
  if (h < 9) return '早晨的光很适合写字';
  if (h < 12) return '上午好，慢慢来';
  if (h < 14) return '午后，思绪沉淀中';
  if (h < 17) return '下午的时间最长';
  if (h < 19) return '傍晚，收集今天的碎片';
  if (h < 22) return '晚上好，记录一些什么吧';
  return '夜晚适合回看';
}

/* ---------- Path ↔ Space mapping ---------- */

function pathToSpace(pathname: string): Space {
  const seg = pathname.split('/')[1];
  if (seg === 'note') return 'notes';
  if (spaces.includes(seg as Space)) return seg as Space;
  return 'home';
}

function spaceToPath(space: Space): string {
  if (space === 'notes') return '/note';
  return `/${space}`;
}

/* ---------- Component ---------- */

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = pathToSpace(location.pathname);

  const [openTopic, setOpenTopic] = useState<number | null>(null);
  const [activeNote, setActiveNote] = useState('阈限空间里的创作方法论');
  const [activeTags, setActiveTags] = useState<Record<string, boolean>>({ '北京': true });

  const handleNavigate = (space: Space) => {
    navigate(spaceToPath(space));
    setOpenTopic(null);
  };

  return (
    <aside
      className="flex h-full shrink-0 flex-col overflow-y-auto"
      style={{
        width: 200,
        background: 'var(--sidebar-bg)',
        padding: '12px 8px',
      }}
    >
      {/* Header */}
      <div className="px-3 pb-5 pt-2">
        <span
          className="text-[13px] font-bold"
          style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
        >
          Liminal Field
        </span>
      </div>

      {/* Search trigger */}
      <button
        className="sidebar-search mb-2.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-all duration-150"
        style={{
          background: 'var(--shelf)',
          color: 'var(--ink-ghost)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4, color: 'var(--ink)' }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>搜索</span>
        <kbd className="ml-auto text-[11px]" style={{ opacity: 0.45, color: 'var(--ink-ghost)' }}>⌘K</kbd>
      </button>

      {/* Main navigation */}
      <nav className="flex flex-col gap-0.5">
        {spaces.map((space) => (
          <div
            key={space}
            className="nav-item relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors duration-150"
            onClick={() => handleNavigate(space)}
          >
            {/* Active indicator — shared layout animation for smooth sliding */}
            {space === active && (
              <motion.span
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--shelf)' }}
                layoutId="nav-active"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span
              className="relative z-[1] flex items-center transition-colors duration-200"
              style={{ color: space === active ? 'var(--accent)' : 'var(--ink-faded)' }}
            >
              {icons[space]}
            </span>
            <span
              className="relative z-[1] text-[13px] transition-colors duration-200"
              style={{
                color: space === active ? 'var(--ink)' : 'var(--ink-faded)',
                fontWeight: space === active ? 500 : 400,
              }}
            >
              {labels[space]}
            </span>
          </div>
        ))}
      </nav>

      {/* Sub-nav: Notes — topic list / note list */}
      {active === 'notes' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-3 my-2.5 h-px" style={{ background: 'var(--separator)' }} />
          <AnimatePresence mode="wait">
            {openTopic === null ? (
              <motion.div
                key="topics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div
                  className="px-3 pb-2 pt-1.5 text-[11px] font-medium uppercase"
                  style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
                >
                  文稿
                </div>
                {topics.map((t, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors duration-150"
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shelf)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => setOpenTopic(i)}
                  >
                    <span className="w-4 text-center text-[10px]" style={{ color: 'var(--ink-ghost)' }}>{t.emoji}</span>
                    <span className="text-[13px]" style={{ color: 'var(--ink-light)' }}>{t.name}</span>
                    <span className="ml-auto text-[11px]" style={{ color: 'var(--ink-ghost)' }}>{t.notes.length}</span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`t-${openTopic}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <div
                  className="cursor-pointer px-3 pb-2.5 pt-1 text-[12px] transition-colors duration-200"
                  style={{ color: 'var(--ink-faded)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-faded)'; }}
                  onClick={() => setOpenTopic(null)}
                >
                  ← 文稿 / {topics[openTopic].name}
                </div>
                {topics[openTopic].notes.map((n, ni) => (
                  <div
                    key={ni}
                    className="flex cursor-pointer items-start gap-2 rounded-lg px-3 py-1.5 transition-colors duration-150"
                    style={{ background: activeNote === n.title ? 'var(--shelf)' : 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shelf)'; }}
                    onMouseLeave={(e) => {
                      if (activeNote !== n.title) e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => setActiveNote(n.title)}
                  >
                    <span
                      className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={
                        n.status === 'done'
                          ? { background: 'var(--ink)', opacity: 0.4 }
                          : { border: '1.5px solid var(--ink-ghost)' }
                      }
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div
                        className="truncate text-[13px]"
                        style={{
                          color: activeNote === n.title ? 'var(--ink)' : 'var(--ink-light)',
                          fontWeight: activeNote === n.title ? 500 : 400,
                        }}
                      >
                        {n.title}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--ink-ghost)' }}>
                        {n.meta}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sub-nav: Gallery — tag filters */}
      {active === 'gallery' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-3 my-2.5 h-px" style={{ background: 'var(--separator)' }} />
          <div
            className="px-3 pb-2 pt-1.5 text-[11px] font-medium uppercase"
            style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
          >
            标签筛选
          </div>
          {tagGroups.map((g, i) => (
            <div key={i} className="mb-2.5 px-3">
              <div className="mb-1.5 text-[11px] font-medium" style={{ color: 'var(--ink-ghost)' }}>
                {g.label}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="cursor-pointer rounded-full px-2.5 py-[3px] text-[11px] transition-all duration-200"
                    style={
                      activeTags[t]
                        ? { background: 'var(--ink)', color: 'var(--accent-contrast)', fontWeight: 500 }
                        : { background: 'transparent', color: 'var(--ink-faded)', border: '1px solid var(--box-border)' }
                    }
                    onClick={() => setActiveTags((prev) => ({ ...prev, [t]: !prev[t] }))}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-nav: Agent — sessions */}
      {active === 'agent' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-3 my-2.5 h-px" style={{ background: 'var(--separator)' }} />
          <div
            className="px-3 pb-2 pt-1.5 text-[11px] font-medium uppercase"
            style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
          >
            对话
          </div>
          {agentSessions.map((s, i) => (
            <div
              key={i}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-[7px] transition-colors duration-150"
              style={{ background: i === 0 ? 'var(--shelf)' : 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shelf)'; }}
              onMouseLeave={(e) => {
                if (i !== 0) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div
                  className="truncate text-[13px]"
                  style={{
                    color: i === 0 ? 'var(--ink)' : 'var(--ink-light)',
                    fontWeight: i === 0 ? 500 : 400,
                  }}
                >
                  {s.title}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--ink-ghost)' }}>
                  {s.date}
                </div>
              </div>
              {s.status === 'active' && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: 'var(--ink)', opacity: 0.4 }}
                />
              )}
            </div>
          ))}
          <div
            className="mt-1 cursor-pointer rounded-lg px-3 py-2 text-[12px] transition-all duration-150"
            style={{ color: 'var(--ink-ghost)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ink-faded)';
              e.currentTarget.style.background = 'var(--shelf)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ink-ghost)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            + 新对话
          </div>
        </div>
      )}

      {/* Bottom — ambient phrase */}
      <div className="mt-auto px-3 py-4">
        <span
          className="text-[11px] leading-relaxed"
          style={{ color: 'var(--ink-ghost)', letterSpacing: '-0.01em' }}
        >
          {getAmbientPhrase()}
        </span>
      </div>
    </aside>
  );
}
