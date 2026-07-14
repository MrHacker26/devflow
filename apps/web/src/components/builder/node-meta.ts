import type { WorkflowNodeType } from '@devflow/shared';

import { nodeTypeLabel } from './nodes/base-node';
import type { BuilderEdge, BuilderNode } from './workflow-serialize';

export type MetaField = {
  label: string;
  value: string;
  mono?: boolean;
};

export function nodeDisplayLabel(node: BuilderNode): string {
  if (typeof node.data.label === 'string' && node.data.label.trim()) {
    return node.data.label;
  }
  return nodeTypeLabel((node.type ?? 'command') as WorkflowNodeType);
}

export function getNodeMetaFields(
  type: WorkflowNodeType,
  data: Record<string, unknown>,
): MetaField[] {
  switch (type) {
    case 'command':
      return compact([
        field('Command', String(data.command ?? ''), true),
        data.platform && data.platform !== 'all' ? field('Platform', String(data.platform)) : null,
      ]);
    case 'install': {
      const packages = Array.isArray(data.packages) ? data.packages.map(String).join(', ') : '';
      return compact([
        field('Manager', String(data.packageManager ?? '')),
        packages ? field('Packages', packages, true) : null,
        data.packageManager === 'custom'
          ? field('Custom', String(data.customCommand ?? ''), true)
          : null,
      ]);
    }
    case 'verify':
      return compact([
        field('Command', String(data.command ?? ''), true),
        field('Expected Exit', String(data.expectedExitCode ?? 0), true),
      ]);
    case 'if':
      return compact([field('Condition', String(data.condition ?? ''), true)]);
    case 'gitClone':
      return compact([
        field('Repo', String(data.repoUrl ?? ''), true),
        data.targetDir ? field('Directory', String(data.targetDir), true) : null,
      ]);
    case 'sshKey':
      return compact([
        field('Email', String(data.email ?? '')),
        field('Key Type', String(data.keyType ?? 'ed25519')),
      ]);
    case 'wait':
      return compact([field('Seconds', String(data.seconds ?? 0), true)]);
    case 'env':
      return compact([
        field('Key', String(data.key ?? ''), true),
        data.defaultValue ? field('Default', String(data.defaultValue), true) : null,
      ]);
    case 'prompt':
      return compact([
        field('Question', String(data.question ?? '')),
        field('Variable', String(data.variableName ?? ''), true),
      ]);
    default:
      return [];
  }
}

function field(label: string, value: string, mono = false): MetaField | null {
  if (!value.trim()) return null;
  return { label, value, mono };
}

function compact(fields: Array<MetaField | null>): MetaField[] {
  return fields.filter((item): item is MetaField => item !== null);
}

export function workflowSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'workflow';
}

export function cliRunCommand(name: string): string {
  return `devflow run ${workflowSlug(name)}`;
}

/** Prefer always → on-success → first outgoing edge. */
export function getExecutionPath(
  nodes: BuilderNode[],
  edges: BuilderEdge[],
): { nodes: BuilderNode[]; edgeIds: string[] } {
  const start = nodes.find((node) => node.type === 'start');
  if (!start) return { nodes: [], edgeIds: [] };

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ordered: BuilderNode[] = [];
  const edgeIds: string[] = [];
  const visited = new Set<string>();
  let current: BuilderNode | undefined = start;

  while (current && !visited.has(current.id)) {
    ordered.push(current);
    visited.add(current.id);
    if (current.type === 'end') break;

    const outgoing = edges.filter((edge) => edge.source === current!.id);
    const nextEdge =
      outgoing.find((edge) => (edge.data?.condition ?? 'always') === 'always') ??
      outgoing.find((edge) => edge.data?.condition === 'on-success') ??
      outgoing[0];

    if (!nextEdge) break;
    edgeIds.push(nextEdge.id);
    current = byId.get(nextEdge.target);
  }

  return { nodes: ordered, edgeIds };
}

export function estimateExecutionSteps(nodes: BuilderNode[], edges: BuilderEdge[]): number {
  const path = getExecutionPath(nodes, edges);
  if (path.nodes.length > 0) return path.nodes.length;
  return nodes.length;
}
