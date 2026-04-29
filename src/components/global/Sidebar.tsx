/*
 * Sidebar — Display page navigation (Apple Books style)
 *
 * Design decisions:
 *   - Floating card pattern: sidebar-bg (#F2F2F2) background with 8px margin,
 *     radius-lg (10px) corners, and shadow-sm elevation. This creates a
 *     card-like panel that "floats" off the white page background, matching
 *     Apple Books' left panel aesthetic.
 *   - Fixed 200px width: identical to admin TreePanel for visual consistency
 *     when switching between display and admin views.
 *   - Lucide icons (size=16, strokeWidth=1.5): unified icon style across all
 *     navigation items for a clean, consistent feel.
 *   - Notes sub-nav uses breadcrumb drill-down instead of a tree, since
 *     useParams() doesn't work outside <Routes> — we parse location.pathname
 *     directly to extract the active noteId.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { structureApi } from '@/services/structure';
import type { StructureNode } from '@/services/structure';
import {
  Home,
  FileText,
  Image,
  Sparkles,
  Search,
  Folder,
  File,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

/* ---------- Data ---------- */

type Space = 'home' | 'notes' | 'gallery' | 'agent';
const spaces: Space[] = ['notes'];
// TODO: 暂时隐藏 home / gallery / agent
// const spaces = ['home', 'notes', 'gallery', 'agent'] as const;

const labels: Record<Space, string> = {
  home: '首页',
  notes: '笔记',
  gallery: '画廊',
  agent: '助手',
};

/* Lucide 统一配置 */
const NAV_ICON = { size: 16, strokeWidth: 1.5 } as const;

const icons: Record<Space, React.ReactNode> = {
  home: <Home {...NAV_ICON} />,
  notes: <FileText {...NAV_ICON} />,
  gallery: <Image {...NAV_ICON} />,
  agent: <Sparkles {...NAV_ICON} />,
};

/* Placeholder data for gallery & agent sub-nav */
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
  return 'notes';
}

function spaceToPath(space: Space): string {
  if (space === 'notes') return '/note';
  return `/${space}`;
}

/* ---------- Notes tree navigation ---------- */

type BreadcrumbItem = { id: string; name: string };

function useStructureLevel(parentId: string | undefined) {
  const [nodes, setNodes] = useState<StructureNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const req = parentId
      ? structureApi.getChildren(parentId, { visibility: 'public' })
      : structureApi.getRootNodes({ visibility: 'public' });

    req
      .then((result) => { if (!cancelled) setNodes(result.children); })
      .catch(() => { if (!cancelled) setNodes([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [parentId]);

  return { nodes, loading };
}

/* ---------- Component ---------- */

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = pathToSpace(location.pathname);

  /* 从 pathname 解析当前 noteId / topicId
   * Sidebar 渲染在 <Routes> 外层，useParams() 不可用，
   * 用正则从 location.pathname 提取：
   *   /note/:noteId                → 根级文稿
   *   /note/topic/:topicId         → 主题目录
   *   /note/topic/:topicId/:noteId → 主题下的文稿 */
  const activeTopicId = (() => {
    const m = location.pathname.match(/^\/note\/topic\/([^/]+)/);
    return m ? m[1] : null;
  })();

  const activeNoteId = (() => {
    const m = location.pathname.match(/^\/note\/topic\/[^/]+\/(.+)$/)
           || location.pathname.match(/^\/note\/(?!topic\/)(.+)$/);
    return m ? m[1] : null;
  })();

  const [activeTags, setActiveTags] = useState<Record<string, boolean>>({ '北京': true });

  /* 笔记树导航状态 */
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const currentParentId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;
  const { nodes: currentNodes, loading: notesLoading } = useStructureLevel(currentParentId);

  /* URL → breadcrumb 同步
   *   /note/:noteId       → 通过 contentItemId 反查路径
   *   /note/topic/:topicId → 通过 nodeId 反查路径
   *   /note                → 根级别，清空 breadcrumb */
  useEffect(() => {
    if (active !== 'notes') return;
    let cancelled = false;

    if (activeNoteId) {
      structureApi.getPathByContentItemId(activeNoteId).then((path) => {
        if (cancelled) return;
        const folders = path
          .filter((n) => n.type === 'FOLDER')
          .map((n) => ({ id: n.id, name: n.name }));
        setBreadcrumb(folders);
      }).catch(() => {});
    } else if (activeTopicId) {
      structureApi.getPathByNodeId(activeTopicId).then((path) => {
        if (cancelled) return;
        const folders = path
          .filter((n) => n.type === 'FOLDER')
          .map((n) => ({ id: n.id, name: n.name }));
        setBreadcrumb(folders);
      }).catch(() => {});
    }

    return () => { cancelled = true; };
  }, [activeNoteId, activeTopicId, active]);

  const handleNavigate = (space: Space) => {
    navigate(spaceToPath(space));
    setBreadcrumb([]);
  };

  /* 进入文件夹：立即更新 breadcrumb + 同步 URL */
  const enterFolder = (node: StructureNode) => {
    setBreadcrumb((prev) => [...prev, { id: node.id, name: node.name }]);
    navigate(`/note/topic/${node.id}`);
  };

  /* 面包屑回退：回到指定层级的文件夹，或回到根 */
  const goToBreadcrumb = (index: number | null) => {
    if (index === null) {
      setBreadcrumb([]);
      navigate('/note');
    } else {
      setBreadcrumb(breadcrumb.slice(0, index + 1));
      navigate(`/note/topic/${breadcrumb[index].id}`);
    }
  };

  return (
    <aside
      className="flex shrink-0 flex-col overflow-y-auto"
      style={{
        width: 200,
        background: 'var(--sidebar-bg)',
        padding: '12px 8px',
        margin: '12px 0 12px 12px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="px-3 pb-5 pt-2">
        <span
          className="text-[14px] font-bold"
          style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
        >
          Liminal Field
        </span>
      </div>

      {/* Search trigger */}
      <button
        className="sidebar-search mb-2.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] transition-all duration-150"
        style={{
          background: 'var(--shelf)',
          color: 'var(--ink-ghost)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <Search size={13} strokeWidth={2} style={{ opacity: 0.4, color: 'var(--ink)' }} />
        <span>搜索</span>
        <kbd className="ml-auto text-[12px]" style={{ opacity: 0.45, color: 'var(--ink-ghost)' }}>⌘K</kbd>
      </button>

      {/* Main navigation */}
      <nav className="flex flex-col gap-0.5">
        {spaces.map((space) => (
          <div
            key={space}
            className="nav-item relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors duration-150"
            onClick={() => handleNavigate(space)}
          >
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
              className="relative z-[1] text-[14px] transition-colors duration-200"
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

      {/* Sub-nav: Notes — tree drill-down, fetches per level */}
      {active === 'notes' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-3 my-2.5 h-px" style={{ background: 'var(--separator)' }} />

          {/* 面包屑导航 — 单行返回路径模式
           *  根层级：section 标题样式，无箭头
           *  有层级：← 箭头回退一级 + 路径段可点击
           *  超长时 hover … 弹出完整路径 */}
          <div className="px-3 pb-2 pt-1.5">
            {breadcrumb.length === 0 ? (
              /* 根层级 — 纯标题，不可点击 */
              <span
                className="text-[12px] font-medium uppercase"
                style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
              >
                文稿
              </span>
            ) : (
              /* 有层级 — ← 回退一级 + 路径显示
               * 1 级: ← 文稿
               * 2+ 级: ← … / 直接父级（hover … 弹出完整路径可点击） */
              <div className="flex items-center whitespace-nowrap">
                <span
                  className="shrink-0 cursor-pointer rounded p-0.5 transition-colors duration-150"
                  style={{ color: 'var(--ink-faded)' }}
                  onClick={() =>
                    breadcrumb.length >= 2
                      ? goToBreadcrumb(breadcrumb.length - 2)
                      : goToBreadcrumb(null)
                  }
                >
                  <ChevronLeft size={14} strokeWidth={2} />
                </span>
                <div className="flex min-w-0 items-center">
                  {breadcrumb.length === 1 ? (
                    /* 只有 1 级：显示 "文稿" 点击回根 */
                    <span
                      className="max-w-[120px] cursor-pointer truncate rounded px-1 py-0.5 text-[12px] transition-colors duration-150"
                      style={{ color: 'var(--ink-light)' }}
                      onClick={() => goToBreadcrumb(null)}
                    >
                      文稿
                    </span>
                  ) : (
                    /* 2+ 级：… / 直接父级名
                     * hover … 用 Radix HoverCard 弹出完整路径 */
                    <>
                      <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <span
                            className="cursor-pointer rounded px-1 py-0.5 text-[12px] transition-colors duration-150"
                            style={{ color: 'var(--ink-ghost)' }}
                          >
                            …
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent align="start" sideOffset={4} className="min-w-[140px]">
                          <div
                            className="flex cursor-pointer items-center gap-2 truncate px-3 py-1.5 text-[12px] transition-colors duration-150"
                            style={{ color: 'var(--ink-light)' }}
                            onClick={() => goToBreadcrumb(null)}
                          >
                            <Folder size={14} strokeWidth={1.5} style={{ color: 'var(--ink-ghost)' }} />
                            文稿
                          </div>
                          {breadcrumb.slice(0, -1).map((item, i) => (
                            <div
                              key={item.id}
                              className="flex cursor-pointer items-center gap-2 truncate py-1.5 text-[12px] transition-colors duration-150"
                              style={{
                                color: 'var(--ink-light)',
                                paddingLeft: `${(i + 1) * 10 + 12}px`,
                                paddingRight: 12,
                              }}
                              onClick={() => goToBreadcrumb(i)}
                            >
                              <Folder size={14} strokeWidth={1.5} style={{ color: 'var(--ink-ghost)' }} />
                              {item.name}
                            </div>
                          ))}
                        </HoverCardContent>
                      </HoverCard>
                      <span className="text-[10px]" style={{ color: 'var(--ink-ghost)' }}>/</span>
                      <span
                        className="max-w-[100px] truncate text-[12px]"
                        style={{ color: 'var(--ink-light)' }}
                      >
                        {breadcrumb[breadcrumb.length - 1].name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {notesLoading ? (
            <div className="px-3 py-4 text-[12px]" style={{ color: 'var(--ink-ghost)' }}>加载中...</div>
          ) : currentNodes.length === 0 ? (
            <div className="px-3 py-4 text-[12px]" style={{ color: 'var(--ink-ghost)' }}>空</div>
          ) : (
            <motion.div
              key={currentParentId || 'root'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
            >
              {currentNodes.map((node) =>
                node.type === 'FOLDER' ? (
                  <div
                    key={node.id}
                    className="hover-shelf flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors duration-150"
                    onClick={() => enterFolder(node)}
                  >
                    <Folder size={14} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--ink-ghost)' }} />
                    <span className="truncate text-[14px]" style={{ color: 'var(--ink-light)' }}>{node.name}</span>
                    {node.hasChildren && (
                      <ChevronRight size={12} strokeWidth={2} className="ml-auto shrink-0" style={{ color: 'var(--ink-ghost)' }} />
                    )}
                  </div>
                ) : node.contentItemId ? (
                  <div
                    key={node.id}
                    className="hover-shelf flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors duration-150"
                    style={{ background: activeNoteId === node.contentItemId ? 'var(--shelf)' : undefined }}
                    onClick={() => navigate(
                      currentParentId
                        ? `/note/topic/${currentParentId}/${node.contentItemId}`
                        : `/note/${node.contentItemId}`,
                    )}
                  >
                    <File size={14} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--ink-ghost)' }} />
                    <span
                      className="truncate text-[14px]"
                      style={{
                        color: activeNoteId === node.contentItemId ? 'var(--ink)' : 'var(--ink-light)',
                        fontWeight: activeNoteId === node.contentItemId ? 500 : 400,
                      }}
                    >
                      {node.name}
                    </span>
                  </div>
                ) : null,
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Sub-nav: Gallery — tag filters (placeholder) */}
      {active === 'gallery' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-3 my-2.5 h-px" style={{ background: 'var(--separator)' }} />
          <div
            className="px-3 pb-2 pt-1.5 text-[12px] font-medium uppercase"
            style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
          >
            标签筛选
          </div>
          {tagGroups.map((g, i) => (
            <div key={i} className="mb-2.5 px-3">
              <div className="mb-1.5 text-[12px] font-medium" style={{ color: 'var(--ink-ghost)' }}>
                {g.label}
              </div>
              <div className="flex flex-wrap gap-1">
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="cursor-pointer rounded-full px-2.5 py-[3px] text-[12px] transition-all duration-200"
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

      {/* Sub-nav: Agent — sessions (placeholder) */}
      {active === 'agent' && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-3 my-2.5 h-px" style={{ background: 'var(--separator)' }} />
          <div
            className="px-3 pb-2 pt-1.5 text-[12px] font-medium uppercase"
            style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
          >
            对话
          </div>
          {agentSessions.map((s, i) => (
            <div
              key={i}
              className="hover-shelf flex cursor-pointer items-center justify-between rounded-lg px-3 py-[7px] transition-colors duration-150"
              style={{ background: i === 0 ? 'var(--shelf)' : undefined }}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div
                  className="truncate text-[14px]"
                  style={{
                    color: i === 0 ? 'var(--ink)' : 'var(--ink-light)',
                    fontWeight: i === 0 ? 500 : 400,
                  }}
                >
                  {s.title}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--ink-ghost)' }}>{s.date}</div>
              </div>
              {s.status === 'active' && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--ink)', opacity: 0.4 }} />
              )}
            </div>
          ))}
          <div
            className="hover-shelf hover-ink-faded mt-1 cursor-pointer rounded-lg px-3 py-2 text-[12px] transition-all duration-150"
            style={{ color: 'var(--ink-ghost)' }}
          >
            + 新对话
          </div>
        </div>
      )}

      {/* Bottom — ambient phrase */}
      <div className="mt-auto px-3 py-4">
        <span
          className="text-[12px] leading-relaxed"
          style={{ color: 'var(--ink-ghost)', letterSpacing: '-0.01em' }}
        >
          {getAmbientPhrase()}
        </span>
      </div>
    </aside>
  );
}
