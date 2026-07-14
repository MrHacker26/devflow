'use client';

import { Check, CircleAlert, Copy, TriangleAlert, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  cliRunCommand,
  estimateExecutionSteps,
} from './node-meta';
import { nodeTypeLabel } from './nodes/base-node';
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
    const counts = new Map<string, number>();
    for (const node of nodes) {
      const type = node.type ?? 'command';
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([type, count]) => ({
        label: nodeTypeLabel(type as Parameters<typeof nodeTypeLabel>[0]),
        count,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [nodes]);

  const stats = [
    { label: 'Total Nodes', value: String(nodes.length) },
    { label: 'Total Connections', value: String(edges.length) },
    { label: 'Estimated Execution Steps', value: String(estimatedSteps) },
    { label: 'Workflow Version', value: `v${version}` },
    { label: 'Last Saved', value: formatLastSaved(lastSavedAt) },
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

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-5">
      <div>
        <p className="text-muted-foreground text-[10px] font-medium tracking-[0.14em] uppercase">
          Workflow Summary
        </p>
        <dl className="mt-3 flex flex-col gap-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground text-xs">{stat.label}</dt>
              <dd className="text-foreground text-xs font-medium tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <p className="text-muted-foreground text-[10px] font-medium tracking-[0.14em] uppercase">
          Node Type Breakdown
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {typeBreakdown.length === 0 ? (
            <li className="text-muted-foreground text-xs">No nodes yet</li>
          ) : (
            typeBreakdown.map((item) => (
              <li
                key={item.label}
                className="text-muted-foreground flex items-center justify-between gap-3 text-xs"
              >
                <span>{item.label}</span>
                <span className="text-foreground tabular-nums">{item.count}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        <p className="text-muted-foreground text-[10px] font-medium tracking-[0.14em] uppercase">
          CLI Command
        </p>
        <div className="border-border/60 bg-background/30 mt-3 flex items-center gap-2 rounded-xl border px-2.5 py-2">
          <code className="text-foreground/90 flex-1 truncate font-mono text-[11px]" title={command}>
            {command}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 rounded-lg px-2 text-xs"
            onClick={() => void copyCommand()}
            title="Copy CLI command"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-muted-foreground text-[10px] font-medium tracking-[0.14em] uppercase">
          Validation
        </p>
        {validation.status === 'valid' ? (
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Everything looks good.
          </p>
        ) : null}
        <ul className="mt-3 flex flex-col gap-2">
          {validation.checks.map((check) => {
            const clickable = Boolean(check.nodeId && onFocusNode && check.severity !== 'pass');
            const content = (
              <>
                {check.severity === 'pass' ? (
                  <Check className="text-success mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                ) : check.severity === 'warn' ? (
                  <TriangleAlert className="text-warning mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                ) : (
                  <X className="text-destructive mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
                )}
                <span
                  className={cn(
                    check.severity === 'pass' ? 'text-muted-foreground' : 'text-foreground',
                    clickable && 'hover:text-primary underline-offset-2 hover:underline',
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
                    className="flex w-full items-start gap-2 text-left text-xs transition-colors"
                    onClick={() => onFocusNode?.(check.nodeId!)}
                    title="Focus node"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-start gap-2 text-xs">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const config =
    status === 'valid'
      ? {
          label: 'Valid',
          icon: Check,
          className: 'border-success/25 bg-success/10 text-success',
        }
      : status === 'warnings'
        ? {
            label: 'Warnings',
            icon: CircleAlert,
            className: 'border-warning/25 bg-warning/10 text-warning',
          }
        : {
            label: 'Invalid',
            icon: X,
            className: 'border-destructive/25 bg-destructive/10 text-destructive',
          };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        config.className,
      )}
      title="Workflow validation — editing is never blocked"
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
