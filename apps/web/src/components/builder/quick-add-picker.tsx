'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { NodeTypeIcon } from './nodes/node-icons';
import { paletteNodeGroups, paletteNodeTypes } from './nodes/node-types';

export function QuickAddPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (type: WorkflowNodeType) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paletteNodeTypes;
    return paletteNodeTypes.filter((type) => {
      const label = nodeTypeLabel(type).toLowerCase();
      return label.includes(q) || type.toLowerCase().includes(q);
    });
  }, [query]);

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center pt-[18vh]">
      <button
        type="button"
        aria-label="Close quick add"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="border-border bg-popover relative z-10 w-full max-w-sm overflow-hidden rounded-xl border shadow-2xl">
        <div className="border-border flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered[0]) {
                e.preventDefault();
                onSelect(filtered[0]);
              }
            }}
            placeholder="Search nodes… (install, verify, command)"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">No matching nodes</p>
          ) : query.trim() ? (
            filtered.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                className={cn(
                  'hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
                  'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-md',
                    nodeIconToneClass(type),
                  )}
                >
                  <NodeTypeIcon type={type} className="size-3.5" />
                </span>
                {nodeTypeLabel(type)}
              </button>
            ))
          ) : (
            paletteNodeGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="text-muted-foreground px-2.5 py-1 text-xs font-medium">
                  {group.label}
                </p>
                {group.types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onSelect(type)}
                    className={cn(
                      'hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
                      'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-md',
                        nodeIconToneClass(type),
                      )}
                    >
                      <NodeTypeIcon type={type} className="size-3.5" />
                    </span>
                    {nodeTypeLabel(type)}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        <p className="text-muted-foreground border-border border-t px-3 py-2 text-[11px]">
          Enter to insert first match · Esc to close
        </p>
      </div>
    </div>
  );
}
