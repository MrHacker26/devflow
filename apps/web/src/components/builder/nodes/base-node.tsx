'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Copy, CopyPlus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

/** Subtle left accent — category-tinted, not bright fills. */
export function nodeAccentClass(type: WorkflowNodeType): string {
  if (type === 'if') return 'border-l-warning';
  if (type === 'verify') return 'border-l-success';

  switch (nodeCategory(type)) {
    case 'flow':
      return 'border-l-primary';
    case 'execution':
      return 'border-l-[color-mix(in_srgb,var(--primary)_55%,var(--muted-foreground))]';
    case 'environment':
      return 'border-l-[color-mix(in_srgb,var(--chart-5)_70%,var(--primary))]';
    case 'interaction':
      return 'border-l-secondary';
    case 'validation':
      return 'border-l-success';
  }
}

/** Category-colored icon chip — soft tint only. */
export function nodeIconToneClass(type: WorkflowNodeType): string {
  if (type === 'if') return 'text-warning bg-warning/12';
  if (type === 'verify') return 'text-success bg-success/12';

  switch (nodeCategory(type)) {
    case 'flow':
      return 'text-primary bg-primary/12';
    case 'execution':
      return 'text-primary/90 bg-primary/8';
    case 'environment':
      return 'text-[color-mix(in_srgb,var(--chart-5)_80%,var(--primary))] bg-[color-mix(in_srgb,var(--chart-5)_12%,transparent)]';
    case 'interaction':
      return 'text-secondary bg-secondary/12';
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

function NodeHoverMenu({ nodeId, canDelete }: { nodeId: string; canDelete: boolean }) {
  const actions = useBuilderNodeActions();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function placeMenu() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }

    placeMenu();

    function closeMenu() {
      setOpen(false);
      setMenuPos(null);
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    }

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open]);

  if (!actions) return null;

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="border-border bg-popover fixed z-[1000] w-36 overflow-hidden rounded-lg border py-1 shadow-[0_12px_32px_-12px_rgb(0_0_0_/_80%)]"
            style={{ top: menuPos.top, right: menuPos.right }}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <MenuItem
              icon={Pencil}
              label="Edit"
              onClick={() => {
                actions.onEdit(nodeId);
                setOpen(false);
                setMenuPos(null);
              }}
            />
            <MenuItem
              icon={Copy}
              label="Copy"
              onClick={() => {
                actions.onCopy(nodeId);
                setOpen(false);
                setMenuPos(null);
              }}
            />
            <MenuItem
              icon={CopyPlus}
              label="Duplicate"
              hint="⌘D"
              onClick={() => {
                actions.onDuplicate(nodeId);
                setOpen(false);
                setMenuPos(null);
              }}
            />
            {canDelete ? (
              <MenuItem
                icon={Trash2}
                label="Delete"
                hint="Del"
                danger
                onClick={() => {
                  actions.onDelete(nodeId);
                  setOpen(false);
                  setMenuPos(null);
                }}
              />
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Node actions"
        aria-label="Node actions"
        aria-expanded={open}
        className={cn(
          'nodrag nopan text-muted-foreground hover:text-foreground hover:bg-muted/70 focus-visible:ring-ring inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none',
          open ? 'bg-muted/70 text-foreground' : '',
        )}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          if (open) {
            setOpen(false);
            setMenuPos(null);
          } else {
            setOpen(true);
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {menu}
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  hint,
  danger,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  hint?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'nopan nodrag flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors',
        danger
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
      )}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-muted-foreground/50 font-mono text-[10px]">{hint}</span> : null}
    </button>
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
        'group/node relative min-w-[200px] overflow-visible rounded-xl border border-l-[3px] px-3.5 py-3 transition-all duration-200',
        'bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-sm',
        'border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]',
        'shadow-[0_8px_24px_-16px_rgb(0_0_0_/_70%)]',
        nodeAccentClass(type),
        selected &&
          'border-[color-mix(in_srgb,var(--primary)_40%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_28%,transparent),0_0_28px_-8px_color-mix(in_srgb,var(--primary)_45%,transparent),0_16px_36px_-16px_rgb(0_0_0_/_75%)]',
        simulating &&
          'border-primary/50 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_40%,transparent),0_0_36px_-6px_color-mix(in_srgb,var(--primary)_55%,transparent)]',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'inline-flex size-6 shrink-0 items-center justify-center rounded-md',
            nodeIconToneClass(type),
          )}
        >
          <NodeTypeIcon type={type} className="size-3.5" strokeWidth={2.25} />
        </span>
        <span className="text-muted-foreground/65 min-w-0 flex-1 text-[10px] font-medium tracking-[0.14em] uppercase">
          {nodeTypeLabel(type)}
        </span>
        {id ? <NodeHoverMenu nodeId={id} canDelete={canDelete} /> : null}
      </div>

      <div className="text-foreground font-heading mt-2 text-[13px] font-semibold tracking-tight">
        {label}
      </div>

      {badges.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.map((badge) => (
            <span
              key={badge}
              className="border-border/70 text-muted-foreground/80 inline-flex rounded-md border bg-black/20 px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      {fields && fields.length > 0 ? (
        <div className="border-border/40 mt-2.5 flex flex-col gap-1.5 border-t pt-2">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground/55 text-[9px] font-medium tracking-[0.12em] uppercase">
                {field.label}
              </span>
              <span
                className={cn(
                  'text-muted-foreground/85 max-w-[220px] truncate text-[11px]',
                  field.mono && 'font-mono',
                )}
                title={field.value}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}
