'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * FakeCaret — 自定义粗光标 + 呼吸动画
 *
 * 原理：隐藏浏览器原生 caret（caret-color: transparent），
 * 监听 selectionchange 事件获取光标坐标，渲染一个绝对定位的 div。
 * 需要包裹在编辑器容器的 relative 父元素内。
 */
export function FakeCaret({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const caretRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const container = containerRef.current;
      const caret = caretRef.current;
      if (!container || !caret) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
        setVisible(false);
        return;
      }

      /* 确保光标在编辑器内 */
      const anchorNode = sel.anchorNode;
      if (!anchorNode || !container.contains(anchorNode)) {
        setVisible(false);
        return;
      }

      const range = sel.getRangeAt(0);
      let rect = range.getBoundingClientRect();

      /* 空行时 rect 全零，注入零宽空格临时测量 */
      if (rect.height === 0) {
        const span = document.createElement('span');
        span.textContent = '\u200b';
        range.insertNode(span);
        rect = span.getBoundingClientRect();
        span.remove();
        /* 恢复 selection（insertNode 会打乱） */
        sel.removeAllRanges();
        sel.addRange(range);
      }

      const containerRect = container.getBoundingClientRect();
      caret.style.left = `${rect.left - containerRect.left + container.scrollLeft}px`;
      const extraHeight = 4;
      caret.style.top = `${rect.top - containerRect.top + container.scrollTop - extraHeight / 2}px`;
      caret.style.height = `${rect.height + extraHeight}px`;
      setVisible(true);
    };

    const onSelectionChange = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return (
    <div
      ref={caretRef}
      className="fake-caret pointer-events-none absolute z-10"
      style={{
        width: 2.5,
        borderRadius: 1,
        background: 'var(--ink)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.1s',
      }}
    />
  );
}
