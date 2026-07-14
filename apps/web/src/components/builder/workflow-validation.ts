import type { WorkflowNodeType } from '@devflow/shared';

import type { BuilderEdge, BuilderNode } from './workflow-serialize';
import { nodeDisplayLabel } from './node-meta';

export type ValidationSeverity = 'pass' | 'warn' | 'fail';

export type ValidationCheck = {
  id: string;
  label: string;
  severity: ValidationSeverity;
  nodeId?: string;
};

export type ValidationStatus = 'valid' | 'warnings' | 'invalid';

export type WorkflowValidation = {
  checks: ValidationCheck[];
  status: ValidationStatus;
};

function directedReachableFromStart(nodes: BuilderNode[], edges: BuilderEdge[]): Set<string> {
  const start = nodes.find((node) => node.type === 'start');
  const seen = new Set<string>();
  if (!start) return seen;

  const queue = [start.id];
  seen.add(start.id);

  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of edges) {
      if (edge.source !== id || seen.has(edge.target)) continue;
      seen.add(edge.target);
      queue.push(edge.target);
    }
  }

  return seen;
}

function undirectedComponentCount(nodes: BuilderNode[], edges: BuilderEdge[]): number {
  if (nodes.length === 0) return 0;

  const adjacency = new Map<string, Set<string>>();
  for (const node of nodes) adjacency.set(node.id, new Set());
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const seen = new Set<string>();
  let components = 0;

  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    components += 1;
    const queue = [node.id];
    seen.add(node.id);
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const next of adjacency.get(id) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
  }

  return components;
}

function hasDirectedCycle(nodes: BuilderNode[], edges: BuilderEdge[]): boolean {
  const outgoing = new Map<string, string[]>();
  for (const node of nodes) outgoing.set(node.id, []);
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
  }

  const state = new Map<string, 0 | 1 | 2>();
  for (const node of nodes) state.set(node.id, 0);

  function visit(id: string): boolean {
    const current = state.get(id) ?? 0;
    if (current === 1) return true;
    if (current === 2) return false;
    state.set(id, 1);
    for (const next of outgoing.get(id) ?? []) {
      if (visit(next)) return true;
    }
    state.set(id, 2);
    return false;
  }

  for (const node of nodes) {
    if ((state.get(node.id) ?? 0) !== 0) continue;
    if (visit(node.id)) return true;
  }
  return false;
}

function missingRequiredField(node: BuilderNode): string | null {
  const type = (node.type ?? 'command') as WorkflowNodeType;
  const data = node.data;
  const name = nodeDisplayLabel(node);

  switch (type) {
    case 'command':
      return !String(data.command ?? '').trim() ? `${name}: command is required` : null;
    case 'verify':
      return !String(data.command ?? '').trim() ? `${name}: command is required` : null;
    case 'if':
      return !String(data.condition ?? '').trim() ? `${name}: condition is required` : null;
    case 'install':
      if (data.packageManager === 'custom') {
        return !String(data.customCommand ?? '').trim()
          ? `${name}: custom command is required`
          : null;
      }
      return !Array.isArray(data.packages) || data.packages.length === 0
        ? `${name}: packages are required`
        : null;
    case 'gitClone':
      return !String(data.repoUrl ?? '').trim() || String(data.repoUrl) === 'https://github.com/'
        ? `${name}: repo URL is required`
        : null;
    case 'sshKey':
      return !String(data.email ?? '').trim() ? `${name}: email is required` : null;
    case 'env':
      return !String(data.key ?? '').trim() ? `${name}: key is required` : null;
    case 'prompt':
      if (!String(data.question ?? '').trim()) return `${name}: question is required`;
      if (!String(data.variableName ?? '').trim()) return `${name}: variable name is required`;
      return null;
    case 'wait':
      return Number(data.seconds ?? 0) <= 0 ? `${name}: seconds must be > 0` : null;
    default:
      return null;
  }
}

export function validateWorkflow(nodes: BuilderNode[], edges: BuilderEdge[]): WorkflowValidation {
  const startNodes = nodes.filter((node) => node.type === 'start');
  const endCount = nodes.filter((node) => node.type === 'end').length;
  const reachable = directedReachableFromStart(nodes, edges);
  const components = undirectedComponentCount(nodes, edges);

  const linked = new Set<string>();
  for (const edge of edges) {
    linked.add(edge.source);
    linked.add(edge.target);
  }

  const outgoingBySource = new Map<string, number>();
  for (const edge of edges) {
    outgoingBySource.set(edge.source, (outgoingBySource.get(edge.source) ?? 0) + 1);
  }

  const checks: ValidationCheck[] = [];

  if (startNodes.length === 1) {
    checks.push({
      id: 'start',
      label: 'One Start Node',
      severity: 'pass',
      nodeId: startNodes[0]?.id,
    });
  } else if (startNodes.length === 0) {
    checks.push({
      id: 'start-missing',
      label: 'Missing Start node',
      severity: 'fail',
    });
  } else {
    for (const node of startNodes) {
      checks.push({
        id: `start-multi-${node.id}`,
        label: 'Multiple Start nodes',
        severity: 'fail',
        nodeId: node.id,
      });
    }
  }

  if (endCount >= 1) {
    checks.push({
      id: 'end',
      label: 'End Node Present',
      severity: 'pass',
      nodeId: nodes.find((node) => node.type === 'end')?.id,
    });
  } else {
    checks.push({
      id: 'end-missing',
      label: 'Missing End node',
      severity: 'fail',
    });
  }

  for (const node of nodes) {
    if (nodes.length <= 1) continue;
    if (linked.has(node.id)) continue;
    checks.push({
      id: `orphan-${node.id}`,
      label: `${nodeDisplayLabel(node)} is an orphan node`,
      severity: 'warn',
      nodeId: node.id,
    });
  }

  for (const node of nodes) {
    if (node.type === 'end') continue;
    const outgoing = outgoingBySource.get(node.id) ?? 0;
    if (outgoing > 0) continue;
    checks.push({
      id: `no-out-${node.id}`,
      label: `${nodeDisplayLabel(node)} has no outgoing connection`,
      severity: 'warn',
      nodeId: node.id,
    });
  }

  for (const node of nodes) {
    if (node.type === 'start') continue;
    if (reachable.has(node.id)) continue;
    checks.push({
      id: `unreachable-${node.id}`,
      label: `${nodeDisplayLabel(node)} is unreachable`,
      severity: 'warn',
      nodeId: node.id,
    });
  }

  if (components > 1) {
    checks.push({
      id: 'disconnected',
      label: 'Disconnected subgraph',
      severity: 'warn',
    });
  }

  if (hasDirectedCycle(nodes, edges)) {
    checks.push({
      id: 'cycle',
      label: 'Cycle detected (unsupported)',
      severity: 'fail',
    });
  }

  for (const node of nodes) {
    const missing = missingRequiredField(node);
    if (!missing) continue;
    checks.push({
      id: `required-${node.id}`,
      label: missing,
      severity: 'warn',
      nodeId: node.id,
    });
  }

  const hasFail = checks.some((check) => check.severity === 'fail');
  const hasWarn = checks.some((check) => check.severity === 'warn');

  const status: ValidationStatus = hasFail ? 'invalid' : hasWarn ? 'warnings' : 'valid';

  return { checks, status };
}

export function nodeCategoryColor(type: string | undefined): string {
  switch (type) {
    case 'start':
    case 'end':
      return '#5eead4';
    case 'if':
      return '#f2b57a';
    case 'verify':
      return '#62c98a';
    case 'command':
    case 'install':
    case 'gitClone':
      return '#4fd1c5';
    case 'sshKey':
    case 'env':
      return '#8b9bb3';
    case 'prompt':
    case 'wait':
      return '#f2b57a';
    default:
      return '#8b9bb3';
  }
}
