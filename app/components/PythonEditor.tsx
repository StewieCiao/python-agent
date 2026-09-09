"use client";

import { useEffect, useRef } from "react";
import { highlightPython } from "../lib/editor/pythonHighlight.mjs";

export function PythonEditor({
  value,
  onChange,
  ariaLabel,
  readOnly = false,
  onKeyDown,
  onBlur,
  onScroll,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  readOnly?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  onScroll?: (event: React.UIEvent<HTMLTextAreaElement>) => void;
  testId?: string;
}) {
  const scrollRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const editor = scrollRef.current;
    const highlight = highlightRef.current;
    if (!editor || !highlight) return;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  }, [value]);

  return (
    <div className="python-editor">
      <pre aria-hidden="true" className="python-editor-highlight" ref={highlightRef} dangerouslySetInnerHTML={{ __html: highlightPython(value) || " " }} />
      <textarea
        aria-label={ariaLabel}
        data-testid={testId}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(event) => {
          if (highlightRef.current) {
            highlightRef.current.scrollTop = event.currentTarget.scrollTop;
            highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }
          onScroll?.(event);
        }}
        readOnly={readOnly}
        spellCheck={false}
        value={value}
      />
    </div>
  );
}
