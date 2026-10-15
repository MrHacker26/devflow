'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Check, CircleAlert, Copy, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WithTooltip } from '@/components/ui/with-tooltip';
import { cn } from '@/lib/utils';

import { cliRunCommand, estimateExecutionSteps } from './node-meta';
import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { NodeTypeIcon } from './nodes/node-icons';
import type { BuilderEdge, BuilderNode } from './workflow-serialize';
import type { ValidationStatus, WorkflowValidation } from './workflow-validation';

function formatLastSaved(value: Date | string | null | undefined) {
  if (!value) return 'Never';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 p-4">
      <h3 className="text-muted-foreground text-xs font-medium">{title}</h3>
      {children}
    </section>
  );
}

export function WorkflowSummaryPanel({
  nodes,
  edges,
  version,
  lastSavedAt,
  validation,
  workflowName,
  onFocusNode,
}: {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  version: number;
  lastSavedAt: Date | string | null;
  validation: WorkflowValidation;
  workflowName: string;
  onFocusNode?: (nodeId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const command = cliRunCommand(workflowName);
  const estimatedSteps = estimateExecutionSteps(nodes, edges);

  const typeBreakdown = useMemo(() => {
    const counts = new Map<WorkflowNodeType, number>();
    for (const node of nodes) {
      const type = (node.type ?? 'command') as WorkflowNodeType;
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([type, count]) => ({ type, label: nodeTypeLabel(type), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [nodes]);

  const stats = [
    { label: 'Nodes', value: String(nodes.length) },
    { label: 'Connections', value: String(edges.length) },
    { label: 'Steps on main path', value: String(estimatedSteps) },
    { label: 'Version', value: `v${version}` },
  ];

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const issues = validation.checks.filter((check) => check.severity !== 'pass');
  const passes = validation.checks.filter((check) => check.severity === 'pass');

  return (
    <div className="flex flex-col">
      <PanelSection title="Overview">
        <dl className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card flex flex-col gap-1 rounded-lg border p-3">
              <dt className="text-muted-foreground text-xs">{stat.label}</dt>
              <dd className="text-lg leading-none font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground text-xs">
          Last saved <span className="text-foreground">{formatLastSaved(lastSavedAt)}</span>
        </p>
      </PanelSection>

      <Separator />

      <PanelSection title="Validation">
        <div className="flex items-center justify-between">
          <ValidationBadge status={validation.status} />
          <span className="text-muted-foreground text-xs tabular-nums">
            {passes.length}/{validation.checks.length} checks passed
          </span>
        </div>
        <ul className="flex flex-col gap-1">
          {[...issues, ...passes].map((check) => {
            const clickable = Boolean(check.nodeId && onFocusNode && check.severity !== 'pass');
            const content = (
              <>
                {check.severity === 'pass' ? (
                  <Check className="text-success mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                ) : check.severity === 'warn' ? (
                  <TriangleAlert className="text-warning mt-0.5 size-3.5 shrink-0" />
                ) : (
                  <X className="text-destructive mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                )}
                <span
                  className={cn(
                    'text-left',
                    check.severity === 'pass' ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {check.label}
                </span>
              </>
            );

            return (
              <li key={check.id}>
                {clickable ? (
                  <button
                    type="button"
                    className="hover:bg-accent focus-visible:ring-ring/50 -mx-2 flex w-[calc(100%+1rem)] items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3"
                    onClick={() => onFocusNode?.(check.nodeId!)}
                    title="Show on canvas"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-start gap-2 py-1.5 text-sm">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </PanelSection>

      <Separator />

      <PanelSection title="Run from the terminal">
        <div className="bg-card flex h-9 items-center gap-2 rounded-lg border pr-1 pl-3">
          <code className="flex-1 truncate font-mono text-xs" title={command}>
            {command}
          </code>
          <WithTooltip label={copied ? 'Copied' : 'Copy command'} side="left">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => void copyCommand()}
              aria-label="Copy CLI command"
            >
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </WithTooltip>
        </div>
      </PanelSection>

      <Separator />

      <PanelSection title="Node types">
        {typeBreakdown.length === 0 ? (
          <p className="text-muted-foreground text-sm">No nodes yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {typeBreakdown.map((item) => (
              <li key={item.type} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    'inline-flex size-5 shrink-0 items-center justify-center rounded',
                    nodeIconToneClass(item.type),
                  )}
                >
                  <NodeTypeIcon type={item.type} className="size-3" strokeWidth={2.25} />
                </span>
                <span className="flex-1">{item.label}</span>
                <span className="text-muted-foreground tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>
    </div>
  );
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const config =
    status === 'valid'
      ? { label: 'Valid', icon: Check, className: 'border-success/30 bg-success/10 text-success' }
      : status === 'warnings'
        ? {
            label: 'Warnings',
            icon: CircleAlert,
            className: 'border-warning/30 bg-warning/10 text-warning',
          }
        : {
            label: 'Invalid',
            icon: X,
            className: 'border-destructive/30 bg-destructive/10 text-destructive',
          };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={config.className}
      title="Workflow validation — editing is never blocked"
    >
      <Icon data-icon="inline-start" strokeWidth={2.5} />
      {config.label}
    </Badge>
  );
}
