import type { WorkflowNodeType } from '@devflow/shared';
import { type NodeProps } from '@xyflow/react';

import { getNodeMetaFields } from '../node-meta';
import { BaseWorkflowNode } from './base-node';
import { NodeHandle, handlePositions } from './node-handle';

type GenericData = {
  label: string;
  skipIfCommand?: string;
  requiresSudo?: boolean;
  [key: string]: unknown;
};

export function GenericWorkflowNode({ id, data, selected, type }: NodeProps & { type: string }) {
  const nodeType = type as WorkflowNodeType;
  const d = data as GenericData;
  const label = typeof d.label === 'string' ? d.label : nodeType;
  const fields = getNodeMetaFields(nodeType, d);

  return (
    <>
      {nodeType !== 'start' ? (
        <NodeHandle type="target" position={handlePositions.top} className="!bg-muted-foreground" />
      ) : null}
      <BaseWorkflowNode
        id={id}
        type={nodeType}
        label={label}
        fields={fields}
        data={d}
        selected={selected}
      />
      {nodeType !== 'end' ? (
        <NodeHandle
          type="source"
          position={handlePositions.bottom}
          className="!bg-muted-foreground"
        />
      ) : null}
    </>
  );
}

export function CommandWorkflowNode({ id, data, selected }: NodeProps) {
  const d = data as GenericData;
  return (
    <>
      <NodeHandle type="target" position={handlePositions.top} className="!bg-muted-foreground" />
      <BaseWorkflowNode
        id={id}
        type="command"
        label={d.label || 'Command'}
        fields={getNodeMetaFields('command', d)}
        data={d}
        selected={selected}
      />
      <NodeHandle
        type="source"
        position={handlePositions.bottom}
        className="!bg-muted-foreground"
      />
    </>
  );
}

export function InstallWorkflowNode({ id, data, selected }: NodeProps) {
  const d = data as GenericData;
  return (
    <>
      <NodeHandle type="target" position={handlePositions.top} className="!bg-muted-foreground" />
      <BaseWorkflowNode
        id={id}
        type="install"
        label={d.label || 'Install'}
        fields={getNodeMetaFields('install', d)}
        data={d}
        selected={selected}
      />
      <NodeHandle
        type="source"
        position={handlePositions.bottom}
        className="!bg-muted-foreground"
      />
    </>
  );
}

export function IfWorkflowNode({ id, data, selected }: NodeProps) {
  const d = data as GenericData;
  return (
    <>
      <NodeHandle type="target" position={handlePositions.top} className="!bg-muted-foreground" />
      <BaseWorkflowNode
        id={id}
        type="if"
        label={d.label || 'If'}
        fields={getNodeMetaFields('if', d)}
        data={d}
        selected={selected}
      />
      <NodeHandle
        type="source"
        position={handlePositions.bottom}
        id="success"
        className="!bg-success"
        style={{ left: '35%' }}
      />
      <NodeHandle
        type="source"
        position={handlePositions.bottom}
        id="failure"
        className="!bg-destructive"
        style={{ left: '65%' }}
      />
    </>
  );
}

export function VerifyWorkflowNode({ id, data, selected }: NodeProps) {
  const d = data as GenericData;
  return (
    <>
      <NodeHandle type="target" position={handlePositions.top} className="!bg-muted-foreground" />
      <BaseWorkflowNode
        id={id}
        type="verify"
        label={d.label || 'Verify'}
        fields={getNodeMetaFields('verify', d)}
        data={d}
        selected={selected}
      />
      <NodeHandle
        type="source"
        position={handlePositions.bottom}
        className="!bg-muted-foreground"
      />
    </>
  );
}
