import type { WorkflowNodeType } from '@devflow/shared';

import { cn } from '@/lib/utils';

import { getNodeIcon } from './node-icons';

export function nodeAccentClass(type: WorkflowNodeType): string {
  switch (type) {
    case 'start':
    case 'end':
      return 'border-l-primary';
    case 'if':
      return 'border-l-warning';
    case 'verify':
      return 'border-l-success';
    default:
      return 'border-l-[color-mix(in_srgb,var(--muted-foreground)_35%,transparent)]';
  }
}

export function nodeIconToneClass(type: WorkflowNodeType): string {
  switch (type) {
    case 'start':
    case 'end':
      return 'text-primary bg-primary/10';
    case 'if':
      return 'text-warning bg-warning/10';
    case 'verify':
      return 'text-success bg-success/10';
    default:
      return 'text-muted-foreground bg-muted/60';
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

export function BaseWorkflowNode({
  type,
  label,
  subtitle,
  selected,
  children,
}: {
  type: WorkflowNodeType;
  label: string;
  subtitle?: string;
  selected?: boolean;
  children?: React.ReactNode;
}) {
  const Icon = getNodeIcon(type);

  return (
    <div
      className={cn(
        'min-w-[190px] rounded-xl border border-l-[3px] px-3.5 py-2.5 transition-all duration-150',
        'bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-sm',
        'border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]',
        'shadow-[0_8px_24px_-16px_rgb(0_0_0_/_70%)]',
        nodeAccentClass(type),
        selected &&
          'ring-primary/35 shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_25%,transparent),0_12px_32px_-12px_color-mix(in_srgb,var(--primary)_35%,transparent)] ring-2',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex size-5 shrink-0 items-center justify-center rounded-md',
            nodeIconToneClass(type),
          )}
        >
          <Icon className="size-3" strokeWidth={2.25} />
        </span>
        <span className="text-muted-foreground text-[10px] font-medium tracking-[0.12em] uppercase">
          {nodeTypeLabel(type)}
        </span>
      </div>
      <div className="text-foreground mt-1.5 text-sm font-medium tracking-tight">{label}</div>
      {subtitle ? (
        <div className="text-muted-foreground/80 mt-1.5 max-w-[210px] truncate rounded-md bg-black/20 px-1.5 py-0.5 font-mono text-[11px]">
          {subtitle}
        </div>
      ) : null}
      {children}
    </div>
  );
}
