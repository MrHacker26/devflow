'use client';

import { Settings2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BuilderPreferences = {
  showGrid: boolean;
  snapToGrid: boolean;
  showMinimap: boolean;
  compactNodes: boolean;
  reduceAnimations: boolean;
};

export const defaultBuilderPreferences: BuilderPreferences = {
  showGrid: true,
  snapToGrid: false,
  showMinimap: true,
  compactNodes: false,
  reduceAnimations: false,
};

export function BuilderSettingsPopover({
  value,
  onChange,
}: {
  value: BuilderPreferences;
  onChange: (next: BuilderPreferences) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
  }, [open]);

  const items: {
    key: keyof BuilderPreferences;
    label: string;
    hint?: string;
  }[] = [
    { key: 'showGrid', label: 'Grid visibility' },
    { key: 'snapToGrid', label: 'Snap to grid' },
    { key: 'showMinimap', label: 'Show minimap' },
    { key: 'compactNodes', label: 'Compact nodes', hint: 'Coming soon' },
    { key: 'reduceAnimations', label: 'Reduce animations', hint: 'Coming soon' },
  ];

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-xl px-2"
        title="Builder settings"
        aria-label="Builder settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Settings2 className="size-4" />
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-label="Builder preferences"
          className="border-border bg-popover absolute top-full right-0 z-40 mt-1 w-56 rounded-xl border p-2 shadow-lg"
        >
          <p className="text-muted-foreground px-2 py-1 text-[10px] tracking-[0.12em] uppercase">
            Preferences
          </p>
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const checked = value[item.key];
              const future = item.key === 'compactNodes' || item.key === 'reduceAnimations';
              return (
                <li key={item.key}>
                  <label
                    className={cn(
                      'hover:bg-surface-elevated flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                      future && 'opacity-70',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={checked}
                      onChange={(event) =>
                        onChange({ ...value, [item.key]: event.target.checked })
                      }
                    />
                    <span className="text-foreground flex-1">{item.label}</span>
                    {item.hint ? (
                      <span className="text-muted-foreground/60 text-[10px]">{item.hint}</span>
                    ) : null}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
