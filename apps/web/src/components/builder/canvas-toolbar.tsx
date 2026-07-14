'use client';

import { Expand, Grid3x3, LayoutGrid, Minus, Plus, Redo2, Undo2 } from 'lucide-react';
import { Panel, useReactFlow, useStore } from '@xyflow/react';

import { Button } from '@/components/ui/button';
import { WithTooltip } from '@/components/ui/with-tooltip';
import { cn } from '@/lib/utils';

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
  active,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <WithTooltip label={label}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        className={cn(
          'text-muted-foreground hover:text-foreground h-7 rounded-md px-2',
          active && 'bg-muted text-foreground',
        )}
      >
        {children}
      </Button>
    </WithTooltip>
  );
}

export function CanvasToolbar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
}: {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const zoom = useStore((state) => state.transform[2]);
  const zoomPercent = Math.round(zoom * 100);

  return (
    <Panel
      position="top-left"
      className="!m-3 flex items-center gap-0.5 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-1 py-1 shadow-[0_8px_24px_-16px_rgb(0_0_0_/_70%)] backdrop-blur-sm"
    >
      <ToolbarButton label="Fit view" onClick={() => void fitView({ padding: 0.2, duration: 200 })}>
        <Expand className="size-3.5" />
        <span className="ml-1 text-[11px]">Fit view</span>
      </ToolbarButton>
      <ToolbarButton label="Undo (⌘Z)" disabled={!canUndo} onClick={onUndo}>
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Redo (⌘⇧Z)" disabled={!canRedo} onClick={onRedo}>
        <Redo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Auto layout (soon)" disabled onClick={() => undefined}>
        <LayoutGrid className="size-3.5" />
        <span className="ml-1 hidden text-[11px] sm:inline">Auto layout</span>
      </ToolbarButton>

      <span className="bg-border mx-1 h-4 w-px" aria-hidden />

      <ToolbarButton label="Zoom out" onClick={() => void zoomOut({ duration: 120 })}>
        <Minus className="size-3.5" />
      </ToolbarButton>
      <span
        className="text-muted-foreground min-w-[2.75rem] text-center font-mono text-[11px] tabular-nums"
        title="Current zoom"
      >
        {zoomPercent}%
      </span>
      <ToolbarButton label="Zoom in" onClick={() => void zoomIn({ duration: 120 })}>
        <Plus className="size-3.5" />
      </ToolbarButton>

      <span className="bg-border mx-1 h-4 w-px" aria-hidden />

      <ToolbarButton label="Toggle grid" onClick={onToggleGrid} active={showGrid}>
        <Grid3x3 className="size-3.5" />
        <span className="ml-1 hidden text-[11px] sm:inline">Grid</span>
      </ToolbarButton>
    </Panel>
  );
}
