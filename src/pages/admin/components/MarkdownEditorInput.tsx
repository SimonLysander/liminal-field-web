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
    className="admin-markdown-input"
    spellCheck={false}
  />
));

MarkdownEditorInput.displayName = 'MarkdownEditorInput';
