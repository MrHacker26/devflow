'use client';

import { Grid3x3, LayoutGrid, Maximize, Minus, Plus, Redo2, Undo2 } from 'lucide-react';
import { Panel, useReactFlow, useStore } from '@xyflow/react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
        size="icon-sm"
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn('text-muted-foreground', active && 'bg-accent text-foreground')}
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
      className="bg-card !m-3 flex h-9 items-center gap-0.5 rounded-lg border px-1 shadow-sm"
    >
      <ToolbarButton label="Undo (⌘Z)" disabled={!canUndo} onClick={onUndo}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Redo (⌘⇧Z)" disabled={!canRedo} onClick={onRedo}>
        <Redo2 />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-4!" />

      <ToolbarButton label="Zoom out" onClick={() => void zoomOut({ duration: 120 })}>
        <Minus />
      </ToolbarButton>
      <span
        className="text-muted-foreground w-11 text-center font-mono text-xs tabular-nums"
        title="Current zoom"
      >
        {zoomPercent}%
      </span>
      <ToolbarButton label="Zoom in" onClick={() => void zoomIn({ duration: 120 })}>
        <Plus />
      </ToolbarButton>
      <ToolbarButton
        label="Fit to screen"
        onClick={() => void fitView({ padding: 0.2, duration: 200 })}
      >
        <Maximize />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-4!" />

      <ToolbarButton label="Toggle grid" onClick={onToggleGrid} active={showGrid}>
        <Grid3x3 />
      </ToolbarButton>
      <ToolbarButton label="Auto layout (coming soon)" disabled onClick={() => undefined}>
        <LayoutGrid />
      </ToolbarButton>
    </Panel>
  );
}
