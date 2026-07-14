'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Blocks, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fadeUp, stagger } from '@/lib/motion';

import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { NodeTypeIcon } from './nodes/node-icons';
import { paletteNodeGroups } from './nodes/node-types';

export function NodePalette({
  onAdd,
}: {
  onAdd: (type: WorkflowNodeType) => void;
}) {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paletteNodeGroups;

    return paletteNodeGroups
      .map((group) => ({
        ...group,
        types: group.types.filter((type) => {
          const label = nodeTypeLabel(type).toLowerCase();
          return label.includes(q) || type.toLowerCase().includes(q);
        }),
      }))
      .filter((group) => group.types.length > 0);
  }, [query]);

  return (
    <aside className="blueprint-panel flex w-52 shrink-0 flex-col gap-3 overflow-y-auto border-r p-3">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-2"
      >
        <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-6 items-center justify-center rounded-md">
          <Blocks className="size-3.5" />
        </span>
        <div>
          <p className="text-foreground text-xs font-semibold tracking-wide">Add node</p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Click to place on canvas</p>
        </div>
      </motion.div>

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes…"
          className="bg-background/40 h-8 rounded-lg pr-12 pl-8 text-xs"
        />
        <kbd className="text-muted-foreground/70 pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-1 py-0.5 font-mono text-[9px]">
          ⌘K
        </kbd>
      </div>

      <motion.div
        className="flex flex-col gap-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {filteredGroups.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-foreground text-xs font-medium">No nodes found</p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
              No node matches your search.
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <motion.div key={group.label} variants={fadeUp} className="flex flex-col gap-1">
              <p className="text-muted-foreground px-2 text-[10px] font-medium tracking-[0.14em] uppercase">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.types.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onAdd(type)}
                      className={cn(
                        'hover:bg-surface-elevated group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                        'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105',
                          nodeIconToneClass(type),
                        )}
                      >
                        <NodeTypeIcon type={type} className="size-3.5" strokeWidth={2.1} />
                      </span>
                      {nodeTypeLabel(type)}
                    </button>
                  ))}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </aside>
  );
}
