import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { smoothBounce } from '@/lib/motion';

/* ---------- Mock Data ---------- */

const photos = [
  {
    file: 'IMG_2046.jpg', size: '4032 × 3024',
    caption: '青岛 · 栈桥 · 四月', date: '2026.04.21',
    camera: 'Ricoh GR III', settings: 'f/5.6 · 1/500s · ISO 200',
    desc: '四月的海面像一块灰色丝绸。扁平光把所有的对比度都抹掉了，只剩下颜色与颜色之间最微妙的那一层差异。',
  },
  {
    file: 'IMG_1987.jpg', size: '4032 × 3024',
    caption: '青岛 · 老城 · 四月', date: '2026.04.21',
    camera: 'Ricoh GR III', settings: 'f/2.8 · 1/125s · ISO 400',
    desc: '老城的墙面在雨后有一种湿润的质感，像未干的水彩。',
  },
  {
    file: 'IMG_1820.jpg', size: '6000 × 4000',
    caption: '东京 · 下北泽 · 一月', date: '2026.01.15',
    camera: 'X100V', settings: 'f/4 · 1/250s · ISO 800',
    desc: '窄巷里的光线被建筑切割成锐利的几何形状。',
  },
];

const timeline = [
  {
    year: '2026',
    months: [
      { name: '四月', count: 4, active: true },
      { name: '三月', count: 8 },
      { name: '二月', count: 3 },
      { name: '一月', count: 6 },
    ],
  },
  {
    year: '2025',
    months: [
      { name: '十二月', count: 12 },
      { name: '十一月', count: 5 },
      { name: '十月', count: 9 },
      { name: '九月', count: 7 },
      { name: '八月', count: 4 },
    ],
  },
];

/**
 * Direction-aware slide animation: new photos slide in from the direction
 * the user navigated (up = previous, down = next), creating spatial continuity.
 */
const slideVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
};

/* ---------- Component ---------- */

export default function GalleryPage() {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [direction, setDirection] = useState(0);

  const navigate = (dir: number) => {
    setDirection(dir);
    setPhotoIdx((prev) => {
      const next = prev + dir;
      if (next < 0) return photos.length - 1;
      if (next >= photos.length) return 0;
      return next;
    });
  };

  const photo = photos[photoIdx];

  return (
    <div className="flex flex-1 items-stretch overflow-hidden">
      {/* Center — polaroid display */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-10 py-8">
        {/* Polaroid frame */}
        <div
          className="relative transition-all duration-400"
          style={{
            background: 'var(--paper-white)',
            padding: '8px 8px 32px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '75%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
        >
          {/* Image area */}
          <div
            className="relative flex w-full items-center justify-center"
            style={{
              background: 'var(--paper-dark)',
              borderRadius: 'var(--radius-sm)',
              minHeight: 320,
              aspectRatio: '4/3',
            }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={photoIdx}
                className="text-[13px]"
                style={{ color: 'var(--ink-ghost)' }}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: smoothBounce }}
              >
                {photo.file} — {photo.size}
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows — visible on hover */}
            <div
              className="absolute left-1/2 top-3 flex h-6 w-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full text-[8px] opacity-0 transition-all duration-250"
              style={{ color: 'var(--ink-ghost)' }}
              onClick={() => navigate(-1)}
            >
              &#x25B3;
            </div>
            <div
              className="absolute bottom-3 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full text-[8px] opacity-0 transition-all duration-250"
              style={{ color: 'var(--ink-ghost)' }}
              onClick={() => navigate(1)}
            >
              &#x25BD;
            </div>
          </div>

          {/* Caption */}
          <div className="px-1 pt-2.5 text-center text-[13px]" style={{ color: 'var(--ink-faded)' }}>
            {photo.caption}
          </div>
        </div>

        {/* Photo metadata */}
        <motion.div
          className="flex w-full max-w-[75%] flex-col gap-2 self-center pt-6"
          key={photoIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div
            className="flex justify-center gap-1.5 text-[11px]"
            style={{ color: 'var(--ink-ghost)' }}
          >
            <span>{photo.date}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{photo.camera}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{photo.settings}</span>
          </div>
          <div
            className="text-center text-[14px] leading-relaxed"
            style={{ color: 'var(--ink-light)', letterSpacing: '-0.01em' }}
          >
            {photo.desc}
          </div>
        </motion.div>
      </div>

      {/* Right — timeline */}
      <div
        className="flex w-[200px] shrink-0 flex-col overflow-y-auto px-4 py-10"
        style={{ borderLeft: '0.5px solid var(--separator)' }}
      >
        <div
          className="mb-3 text-[11px] font-semibold uppercase"
          style={{ color: 'var(--ink-ghost)', letterSpacing: '0.04em' }}
        >
          时间线
        </div>

        {/* Timeline track with vertical line */}
        <div className="relative flex flex-col pl-[18px]">
          {/* Vertical connector line */}
          <div
            className="absolute left-[5px] top-3.5 bottom-3.5 w-px"
            style={{ background: 'var(--separator)' }}
          />

          {timeline.map((group, gi) => (
            <div key={gi}>
              {/* Year marker */}
              <div
                className="relative pb-1.5 pt-3.5 text-[11px] font-semibold"
                style={{ color: 'var(--ink-ghost)', letterSpacing: '-0.01em' }}
              >
                {/* Year dot */}
                <span
                  className="absolute top-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    left: -16,
                    width: 5,
                    height: 5,
                    border: '1.5px solid var(--ink-ghost)',
                    background: 'var(--paper)',
                  }}
                />
                {group.year}
              </div>

              {/* Month entries */}
              {group.months.map((m, mi) => (
                <div
                  key={mi}
                  className="relative flex cursor-pointer items-center gap-2 py-[5px] text-[13px] transition-all duration-200"
                  style={{
                    color: m.active ? 'var(--ink)' : 'var(--ink-faded)',
                    fontWeight: m.active ? 600 : 400,
                  }}
                >
                  {/* Timeline dot */}
                  <span
                    className="absolute -translate-y-1/2 rounded-full transition-all duration-250"
                    style={{
                      top: '50%',
                      left: m.active ? -21 : -20,
                      width: m.active ? 5 : 3,
                      height: m.active ? 5 : 3,
                      background: m.active ? 'var(--ink)' : 'var(--ink-ghost)',
                    }}
                  />
                  {m.name}
                  <span className="ml-auto text-[11px]" style={{ color: 'var(--ink-ghost)' }}>
                    {m.count}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
