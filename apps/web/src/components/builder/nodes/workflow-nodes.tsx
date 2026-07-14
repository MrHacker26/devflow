import type { WorkflowNodeType } from '@devflow/shared';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { BaseWorkflowNode } from './base-node';

type GenericData = {
  label: string;
  skipIfCommand?: string;
  requiresSudo?: boolean;
  [key: string]: unknown;
};

export function GenericWorkflowNode({
  data,
  selected,
  type,
}: NodeProps & { type: string }) {
  const nodeType = type as WorkflowNodeType;
  const label = typeof data.label === 'string' ? data.label : nodeType;

  return (
    <>
      {nodeType !== 'start' ? (
        <Handle type="target" position={Position.Top} className="!bg-muted-foreground !h-2 !w-2" />
      ) : null}
      <BaseWorkflowNode type={nodeType} label={label} selected={selected} />
      {nodeType !== 'end' ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-muted-foreground !h-2 !w-2"
        />
      ) : null}
    </>
  );
}

export function CommandWorkflowNode({ data, selected }: NodeProps) {
  const d = data as GenericData & { command?: string };
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !h-2 !w-2" />
      <BaseWorkflowNode
        type="command"
        label={d.label || 'Command'}
        subtitle={d.command}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !h-2 !w-2" />
    </>
  );
}

export function InstallWorkflowNode({ data, selected }: NodeProps) {
  const d = data as GenericData & {
    packageManager?: string;
    packages?: string[];
  };
  const subtitle =
    d.packageManager === 'custom'
      ? 'custom'
      : [d.packageManager, ...(d.packages ?? [])].filter(Boolean).join(' ');

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !h-2 !w-2" />
      <BaseWorkflowNode
        type="install"
        label={d.label || 'Install'}
        subtitle={subtitle}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !h-2 !w-2" />
    </>
  );
}

export function IfWorkflowNode({ data, selected }: NodeProps) {
  const d = data as GenericData & { condition?: string };
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !h-2 !w-2" />
      <BaseWorkflowNode
        type="if"
        label={d.label || 'If'}
        subtitle={d.condition}
        selected={selected}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="!bg-success !h-2 !w-2"
        style={{ left: '35%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="failure"
        className="!bg-destructive !h-2 !w-2"
        style={{ left: '65%' }}
      />
    </>
  );
}

export function VerifyWorkflowNode({ data, selected }: NodeProps) {
  const d = data as GenericData & { command?: string };
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !h-2 !w-2" />
      <BaseWorkflowNode
        type="verify"
        label={d.label || 'Verify'}
        subtitle={d.command}
        selected={selected}
      />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !h-2 !w-2" />
    </>
  );
}
