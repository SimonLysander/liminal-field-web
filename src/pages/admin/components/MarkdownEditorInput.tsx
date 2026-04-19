import { forwardRef } from 'react';

export const MarkdownEditorInput = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (value: string) => void;
  }
>(({ value, onChange }, ref) => (
  <textarea
    ref={ref}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="min-h-[520px] w-full rounded border border-slate-300 px-3 py-3 font-mono text-sm leading-6"
    spellCheck={false}
  />
));

MarkdownEditorInput.displayName = 'MarkdownEditorInput';
