'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { PaletteCollapseButton } from './node-inspector';
import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { NodeTypeIcon } from './nodes/node-icons';
import { paletteNodeGroups } from './nodes/node-types';

export function NodePalette({
  onAdd,
  onCollapse,
}: {
  onAdd: (type: WorkflowNodeType) => void;
  onCollapse: () => void;
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
    <aside className="bg-sidebar flex w-60 shrink-0 flex-col border-r" aria-label="Node palette">
      <div className="flex h-12 shrink-0 items-center justify-between border-b pr-2 pl-4">
        <h2 className="text-sm font-medium">Nodes</h2>
        <PaletteCollapseButton collapsed={false} onToggle={onCollapse} />
      </div>

      <div className="p-3">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes"
            aria-label="Search nodes"
          />
          <InputGroupAddon align="inline-end">
            <Kbd>⌘K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 px-3 pb-4">
          {filteredGroups.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              No nodes match “{query.trim()}”.
            </p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <p className="text-muted-foreground px-2 pb-1 text-xs font-medium">{group.label}</p>
                {group.types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="text-foreground/90 hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex h-9 items-center gap-2.5 rounded-lg px-2 text-left text-sm transition-colors outline-none focus-visible:ring-3"
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 shrink-0 items-center justify-center rounded-md',
                        nodeIconToneClass(type),
                      )}
                    >
                      <NodeTypeIcon type={type} className="size-3.5" strokeWidth={2.1} />
                    </span>
                    {nodeTypeLabel(type)}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
