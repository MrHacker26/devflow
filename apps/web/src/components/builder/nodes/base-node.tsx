'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Copy, CopyPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { useBuilderNodeActions } from '../builder-node-actions';
import type { MetaField } from '../node-meta';
import { getNodeBadges } from '../node-badges';
import { useSimulationNodeId } from '../simulation-context';
import { NodeTypeIcon } from './node-icons';

export type NodeCategory = 'flow' | 'execution' | 'environment' | 'validation' | 'interaction';

export function nodeCategory(type: WorkflowNodeType): NodeCategory {
  switch (type) {
    case 'start':
    case 'end':
    case 'if':
      return 'flow';
    case 'command':
    case 'install':
    case 'gitClone':
      return 'execution';
    case 'sshKey':
    case 'env':
      return 'environment';
    case 'verify':
      return 'validation';
    case 'prompt':
    case 'wait':
      return 'interaction';
  }
}

export function nodeIconToneClass(type: WorkflowNodeType): string {
  if (type === 'if') return 'text-warning bg-warning/12';

  switch (nodeCategory(type)) {
    case 'flow':
      return 'text-foreground bg-accent';
    case 'execution':
      return 'text-info bg-info/12';
    case 'environment':
      return 'text-chart-5 bg-chart-5/12';
    case 'interaction':
      return 'text-primary bg-primary/12';
    case 'validation':
      return 'text-success bg-success/12';
  }
}

export function nodeTypeLabel(type: WorkflowNodeType): string {
  switch (type) {
    case 'gitClone':
      return 'Git Clone';
    case 'sshKey':
      return 'SSH Key';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function NodeActionsMenu({ nodeId, canDelete }: { nodeId: string; canDelete: boolean }) {
  const actions = useBuilderNodeActions();
  if (!actions) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Node actions"
          className="nodrag nopan text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-3"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[1000] w-40">
        <DropdownMenuItem onSelect={() => actions.onEdit(nodeId)}>
          <Pencil />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onCopy(nodeId)}>
          <Copy />
          Copy
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onDuplicate(nodeId)}>
          <CopyPlus />
          Duplicate
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => actions.onDelete(nodeId)}>
              <Trash2 />
              Delete
              <DropdownMenuShortcut>Del</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function BaseWorkflowNode({
  id,
  type,
  label,
  fields,
  data,
  selected,
  children,
}: {
  id?: string;
  type: WorkflowNodeType;
  label: string;
  fields?: MetaField[];
  data?: Record<string, unknown>;
  selected?: boolean;
  children?: React.ReactNode;
}) {
  const canDelete = type !== 'start' && type !== 'end';
  const simulationNodeId = useSimulationNodeId();
  const simulating = Boolean(id && simulationNodeId === id);
  const badges = getNodeBadges(type, data ?? {});

  return (
    <div
      className={cn(
        'bg-card text-card-foreground relative w-60 rounded-xl border shadow-sm transition-[box-shadow,border-color] duration-150',
        selected && 'border-primary/60 ring-primary/25 ring-3',
        simulating && 'border-primary ring-primary/40 ring-3',
      )}
    >
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md',
            nodeIconToneClass(type),
          )}
        >
          <NodeTypeIcon type={type} className="size-3.5" strokeWidth={2.25} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-[11px] leading-4 font-medium">
            {nodeTypeLabel(type)}
          </span>
          <span className="truncate text-sm leading-5 font-medium" title={label}>
            {label}
          </span>
        </div>
        {id ? <NodeActionsMenu nodeId={id} canDelete={canDelete} /> : null}
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-1 px-3 pt-2.5">
          {badges.map((badge) => (
            <Badge
              key={badge}
              variant="outline"
              className="text-muted-foreground h-[18px] px-1.5 font-mono text-[10px] font-normal"
            >
              {badge}
            </Badge>
          ))}
        </div>
      ) : null}

      {fields && fields.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-1.5 border-t px-3 py-2.5">
          {fields.map((field) => (
            <div key={field.label} className="flex min-w-0 items-baseline gap-3">
              <dt
                className="text-muted-foreground w-18 shrink-0 truncate text-[11px]"
                title={field.label}
              >
                {field.label}
              </dt>
              <dd
                className={cn('min-w-0 flex-1 truncate text-xs', field.mono && 'font-mono')}
                title={field.value}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="h-3" />
      )}

      {children}
    </div>
  );
}
