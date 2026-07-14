import type { FlowEdge, FlowNode, WorkflowLayout, WorkflowNodeType } from '@devflow/shared';
import type { Edge, Node } from '@xyflow/react';

export type BuilderNodeData = Record<string, unknown> & {
  label: string;
  skipIfCommand?: string;
  requiresSudo?: boolean;
};

export type BuilderNode = Node<BuilderNodeData, WorkflowNodeType>;
export type BuilderEdge = Edge<{ condition?: FlowEdge['condition'] }>;

export function createDefaultNodeData(type: WorkflowNodeType): BuilderNodeData {
  switch (type) {
    case 'start':
      return { label: 'Start' };
    case 'end':
      return { label: 'End' };
    case 'command':
      return { label: 'Run command', command: '', platform: 'all', requiresSudo: false };
    case 'install':
      return {
        label: 'Install package',
        packageManager: 'brew',
        packages: [],
        requiresSudo: false,
      };
    case 'gitClone':
      return { label: 'Clone repo', repoUrl: 'https://github.com/', requiresSudo: false };
    case 'sshKey':
      return { label: 'Generate SSH key', email: '', keyType: 'ed25519', requiresSudo: false };
    case 'verify':
      return { label: 'Verify', command: '', expectedExitCode: 0 };
    case 'wait':
      return { label: 'Wait', seconds: 5 };
    case 'env':
      return { label: 'Set env', key: '' };
    case 'prompt':
      return { label: 'Prompt', question: '', variableName: '' };
    case 'if':
      return { label: 'Condition', condition: '' };
  }
}

export function createInitialBuilderGraph(): {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
} {
  // Stable ids so SSR + client hydrate match (no crypto.randomUUID here).
  const startId = 'start';
  const endId = 'end';

  return {
    nodes: [
      {
        id: startId,
        type: 'start',
        position: { x: 250, y: 40 },
        data: createDefaultNodeData('start'),
      },
      {
        id: endId,
        type: 'end',
        position: { x: 250, y: 280 },
        data: createDefaultNodeData('end'),
      },
    ],
    edges: [
      {
        id: 'start-end',
        type: 'workflow',
        source: startId,
        target: endId,
        data: { condition: 'always' },
      },
    ],
  };
}

export function toFlowNodes(nodes: BuilderNode[]): FlowNode[] {
  return nodes.map((node) => {
    const type = (node.type ?? 'command') as WorkflowNodeType;
    const { skipIfCommand, requiresSudo, ...dataFields } = node.data;

    const base = {
      id: node.id,
      type,
      data: dataFields,
    };

    if (
      type === 'command' ||
      type === 'gitClone' ||
      type === 'install' ||
      type === 'sshKey'
    ) {
      return {
        ...base,
        skipIfCommand,
        requiresSudo: Boolean(requiresSudo),
      } as FlowNode;
    }

    return base as FlowNode;
  });
}

export function toFlowEdges(edges: BuilderEdge[]): FlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    condition: edge.data?.condition ?? 'always',
  }));
}

export function toLayout(nodes: BuilderNode[]): WorkflowLayout {
  return Object.fromEntries(nodes.map((node) => [node.id, node.position]));
}

export function fromSavedWorkflow(input: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  layout: WorkflowLayout;
}): { nodes: BuilderNode[]; edges: BuilderEdge[] } {
  const nodes: BuilderNode[] = input.nodes.map((node) => {
    const position = input.layout[node.id] ?? { x: 0, y: 0 };
    const executable =
      'skipIfCommand' in node || 'requiresSudo' in node
        ? {
            skipIfCommand: 'skipIfCommand' in node ? node.skipIfCommand : undefined,
            requiresSudo: 'requiresSudo' in node ? Boolean(node.requiresSudo) : false,
          }
        : {};

    return {
      id: node.id,
      type: node.type,
      position,
      data: {
        ...node.data,
        ...executable,
      } as BuilderNodeData,
    };
  });

  const nodeTypeById = new Map(input.nodes.map((node) => [node.id, node.type]));

  const edges: BuilderEdge[] = input.edges.map((edge) => {
    const sourceIsIf = nodeTypeById.get(edge.source) === 'if';
    const sourceHandle =
      sourceIsIf && edge.condition === 'on-success'
        ? 'success'
        : sourceIsIf && edge.condition === 'on-failure'
          ? 'failure'
          : undefined;

    return {
      id: edge.id,
      type: 'workflow',
      source: edge.source,
      target: edge.target,
      sourceHandle,
      data: { condition: edge.condition },
    };
  });

  return { nodes, edges };
}
