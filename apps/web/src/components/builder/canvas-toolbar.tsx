'use client';

import {
  Expand,
  Grid3x3,
  LayoutGrid,
  Minus,
  Plus,
  Redo2,
  Undo2,
} from 'lucide-react';
import { Panel, useReactFlow, useStore } from '@xyflow/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ToolbarButton({
  title,
  disabled,
  onClick,
  children,
  active,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      disabled={disabled}
      onClick={onClick}
      aria-label={title}
      className={cn(
        'text-muted-foreground hover:text-foreground h-7 rounded-md px-2',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </Button>
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
      <ToolbarButton title="Fit view" onClick={() => void fitView({ padding: 0.2, duration: 200 })}>
        <Expand className="size-3.5" />
        <span className="ml-1 text-[11px]">Fit view</span>
      </ToolbarButton>
      <ToolbarButton title="Undo (Ctrl/Cmd+Z)" disabled={!canUndo} onClick={onUndo}>
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Redo (Ctrl/Cmd+Shift+Z)" disabled={!canRedo} onClick={onRedo}>
        <Redo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton title="Auto layout (coming soon)" disabled onClick={() => undefined}>
        <LayoutGrid className="size-3.5" />
        <span className="ml-1 hidden text-[11px] sm:inline">Auto layout</span>
      </ToolbarButton>

      <span className="bg-border mx-1 h-4 w-px" aria-hidden />

      <ToolbarButton title="Zoom out" onClick={() => void zoomOut({ duration: 120 })}>
        <Minus className="size-3.5" />
      </ToolbarButton>
      <span
        className="text-muted-foreground min-w-[2.75rem] text-center font-mono text-[11px] tabular-nums"
        title="Current zoom"
      >
        {zoomPercent}%
      </span>
      <ToolbarButton title="Zoom in" onClick={() => void zoomIn({ duration: 120 })}>
        <Plus className="size-3.5" />
      </ToolbarButton>

      <span className="bg-border mx-1 h-4 w-px" aria-hidden />

      <ToolbarButton title="Toggle grid" onClick={onToggleGrid} active={showGrid}>
        <Grid3x3 className="size-3.5" />
        <span className="ml-1 hidden text-[11px] sm:inline">Grid</span>
      </ToolbarButton>
    </Panel>
  );
}
