'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export type ContextMenuItem = {
  id: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
};

export function BuilderContextMenu({
  open,
  x,
  y,
  items,
  onClose,
}: {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Context menu"
      className="border-border bg-popover fixed z-50 min-w-[11rem] overflow-hidden rounded-xl border py-1 shadow-[0_16px_40px_-20px_rgb(0_0_0_/_80%)]"
      style={{ left: x, top: y }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            if (item.disabled) return;
            item.onSelect();
            onClose();
          }}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
            item.disabled && 'cursor-not-allowed opacity-40',
            item.danger
              ? 'text-destructive hover:bg-destructive/10'
              : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
          )}
        >
          <span className="flex-1">{item.label}</span>
          {item.hint ? (
            <span className="text-muted-foreground/50 font-mono text-[10px]">{item.hint}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
