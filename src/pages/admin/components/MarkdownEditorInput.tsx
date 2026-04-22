import { forwardRef } from 'react';

export const MarkdownEditorInput = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
  }
>(({ value, disabled, onChange }, ref) => (
  <textarea
    ref={ref}
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
    className="min-h-[520px] w-full rounded border border-slate-300 px-3 py-3 font-mono text-sm leading-6 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    spellCheck={false}
  />
));

MarkdownEditorInput.displayName = 'MarkdownEditorInput';
