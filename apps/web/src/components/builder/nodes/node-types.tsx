import type { WorkflowNodeType } from '@devflow/shared';
import type { NodeProps, NodeTypes } from '@xyflow/react';

import {
  CommandWorkflowNode,
  GenericWorkflowNode,
  IfWorkflowNode,
  InstallWorkflowNode,
  VerifyWorkflowNode,
} from './workflow-nodes';

function makeGeneric(type: WorkflowNodeType) {
  return function TypedGenericNode(props: NodeProps) {
    return <GenericWorkflowNode {...props} type={type} />;
  };
}

export const workflowNodeTypes = {
  start: makeGeneric('start'),
  end: makeGeneric('end'),
  command: CommandWorkflowNode,
  install: InstallWorkflowNode,
  if: IfWorkflowNode,
  verify: VerifyWorkflowNode,
  gitClone: makeGeneric('gitClone'),
  sshKey: makeGeneric('sshKey'),
  wait: makeGeneric('wait'),
  env: makeGeneric('env'),
  prompt: makeGeneric('prompt'),
} satisfies NodeTypes;

export const paletteNodeGroups: {
  label: string;
  types: WorkflowNodeType[];
}[] = [
  {
    label: 'Flow',
    types: ['start', 'end', 'if'],
  },
  {
    label: 'Execution',
    types: ['command', 'install', 'gitClone'],
  },
  {
    label: 'Environment',
    types: ['sshKey', 'env'],
  },
  {
    label: 'Validation',
    types: ['verify'],
  },
  {
    label: 'Interaction',
    types: ['prompt', 'wait'],
  },
];

export const paletteNodeTypes: WorkflowNodeType[] = paletteNodeGroups.flatMap(
  (group) => group.types,
);
