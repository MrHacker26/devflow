'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Command } from 'cmdk';
import {
  Expand,
  Keyboard,
  Play,
  Redo2,
  Save,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useEffect } from 'react';

import { cn } from '@/lib/utils';

import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { NodeTypeIcon } from './nodes/node-icons';
import { paletteNodeGroups } from './nodes/node-types';

export type CommandPaletteActions = {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onPreview: () => void;
  onSimulate: () => void;
  onOpenShortcuts: () => void;
  onAddNode: (type: WorkflowNodeType) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandPaletteActions;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  function run(action: () => void) {
    action();
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-[1100]">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[14vh] flex justify-center px-4">
        <Command
          label="Command palette"
          className="border-border bg-surface pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border shadow-[0_24px_64px_-24px_rgb(0_0_0_/_80%)]"
          loop
        >
          <div className="border-border flex items-center gap-2 border-b px-3">
            <Command.Input
              placeholder="Type a command or search nodes…"
              className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
              autoFocus
            />
            <kbd className="text-muted-foreground/70 rounded border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] px-1.5 py-0.5 font-mono text-[10px]">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
            <Command.Empty className="text-muted-foreground px-3 py-8 text-center text-sm">
              No matching commands.
            </Command.Empty>

            <Command.Group
              heading="Actions"
              className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:uppercase"
            >
              <PaletteItem
                icon={Save}
                label="Save workflow"
                hint="⌘S"
                onSelect={() => run(actions.onSave)}
              />
              <PaletteItem
                icon={Undo2}
                label="Undo"
                hint="⌘Z"
                onSelect={() => run(actions.onUndo)}
              />
              <PaletteItem
                icon={Redo2}
                label="Redo"
                hint="⇧⌘Z"
                onSelect={() => run(actions.onRedo)}
              />
              <PaletteItem
                icon={Expand}
                label="Fit view"
                onSelect={() => run(actions.onFitView)}
              />
              <PaletteItem
                icon={Play}
                label="Preview execution"
                onSelect={() => run(actions.onPreview)}
              />
              <PaletteItem
                icon={Sparkles}
                label="Simulate execution"
                onSelect={() => run(actions.onSimulate)}
              />
              <PaletteItem
                icon={Keyboard}
                label="Keyboard shortcuts"
                hint="?"
                onSelect={() => run(actions.onOpenShortcuts)}
              />
            </Command.Group>

            {paletteNodeGroups.map((group) => (
              <Command.Group
                key={group.label}
                heading={`Add · ${group.label}`}
                className="text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:uppercase"
              >
                {group.types.map((type) => (
                    <Command.Item
                      key={type}
                      value={`add ${nodeTypeLabel(type)} ${type} ${group.label}`}
                      onSelect={() => run(() => actions.onAddNode(type))}
                      className={cn(
                        'data-[selected=true]:bg-surface-elevated data-[selected=true]:text-foreground',
                        'text-muted-foreground flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none',
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
                      <span className="flex-1">{nodeTypeLabel(type)}</span>
                      <span className="text-muted-foreground/50 text-[10px]">Add node</span>
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-border text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-[11px]">
            <span>↑↓ navigate · ↵ run</span>
            <span className="font-mono">⌘K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function PaletteItem({
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  icon: typeof Save;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className={cn(
        'data-[selected=true]:bg-surface-elevated data-[selected=true]:text-foreground',
        'text-muted-foreground flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none',
      )}
    >
      <span className="bg-muted inline-flex size-6 items-center justify-center rounded-md">
        <Icon className="size-3.5" />
      </span>
      <span className="flex-1">{label}</span>
      {hint ? (
        <kbd className="text-muted-foreground/60 font-mono text-[10px]">{hint}</kbd>
      ) : null}
    </Command.Item>
  );
}
