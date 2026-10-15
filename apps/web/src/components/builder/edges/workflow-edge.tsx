'use client';

import type { FlowEdge } from '@devflow/shared';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { useBuilderEdgeActions } from '../builder-node-actions';
import { useSimulationEdgeId } from '../simulation-context';

export type WorkflowEdgeData = {
  condition?: FlowEdge['condition'];
};

export type WorkflowEdgeType = Edge<WorkflowEdgeData, 'workflow'>;

function conditionPill(condition: FlowEdge['condition'] | undefined) {
  switch (condition) {
    case 'on-success':
      return {
        text: '✓ Success',
        className: 'border-success/25 bg-success/10 text-success',
      };
    case 'on-failure':
      return {
        text: '✕ Failure',
        className: 'border-destructive/25 bg-destructive/10 text-destructive',
      };
    case 'always':
    default:
      return {
        text: 'Always',
        className: 'border-border bg-card text-muted-foreground',
      };
  }
}

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  selected,
}: EdgeProps<WorkflowEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const [hovered, setHovered] = useState(false);
  const edgeActions = useBuilderEdgeActions();
  const pill = conditionPill(data?.condition);
  const activeEdgeId = useSimulationEdgeId();
  const simulating = activeEdgeId === id;
  const emphasized = selected || hovered || simulating;
  const isAlways = !data?.condition || data.condition === 'always';
  const showPill = !isAlways || emphasized;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        className={cn(
          simulating && 'workflow-edge-simulating',
          selected && 'workflow-edge-selected',
          hovered && !selected && 'workflow-edge-hovered',
        )}
        style={{
          ...style,
          stroke: simulating
            ? 'color-mix(in srgb, var(--primary) 85%, transparent)'
            : selected
              ? 'color-mix(in srgb, var(--primary) 75%, transparent)'
              : hovered
                ? 'color-mix(in srgb, var(--primary) 55%, transparent)'
                : 'color-mix(in srgb, var(--muted-foreground) 45%, transparent)',
          strokeWidth: emphasized ? 2.5 : 1.5,
          filter: emphasized
            ? 'drop-shadow(0 0 6px color-mix(in srgb, var(--primary) 40%, transparent))'
            : undefined,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {showPill ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute flex items-center gap-1"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shadow-sm',
                pill.className,
                isAlways && 'opacity-80',
              )}
            >
              {pill.text}
            </span>
            {emphasized && edgeActions ? (
              <button
                type="button"
                title="Delete connection"
                aria-label="Delete connection"
                className="border-border bg-card text-muted-foreground hover:text-destructive inline-flex size-5 items-center justify-center rounded-full border shadow-sm transition-colors"
                onClick={(event) => {
                  event.stopPropagation();
                  edgeActions.onDeleteEdge(id);
                }}
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const workflowEdgeTypes = {
  workflow: WorkflowEdge,
};
