import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { cn } from '@/lib/utils';

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

/* 样式对齐设计系统：
 * - 圆角 rounded-xl（popover 档位）
 * - 阴影 shadow-[var(--shadow-md)]
 * - 边框 0.5px var(--box-border)
 * - 背景 var(--paper) */
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-xl py-1 outline-none',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
      className,
    )}
    style={{
      background: 'var(--paper)',
      border: '0.5px solid var(--box-border)',
      boxShadow: 'var(--shadow-md)',
    }}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
