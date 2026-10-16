import type { FlowNode, Workflow } from '@devflow/shared';

export type HostPlatform = 'mac' | 'linux' | 'windows' | 'other';

export type PlanStep = {
  id: string;
  type: FlowNode['type'];
  label: string;
  command: string | null;
  note: string | null;
};

export type PlanResult =
  { ok: true; name: string; steps: PlanStep[] } | { ok: false; message: string };

const supported = new Set<FlowNode['type']>([
  'start',
  'command',
  'install',
  'gitClone',
  'verify',
  'wait',
  'end',
]);

export function currentPlatform(): HostPlatform {
  switch (process.platform) {
    case 'darwin':
      return 'mac';
    case 'linux':
      return 'linux';
    case 'win32':
      return 'windows';
    default:
      return 'other';
  }
}

/** Happy path: always, then on-success, otherwise the first outgoing edge. */
export function planWorkflow(
  workflow: Workflow,
  host: HostPlatform = currentPlatform(),
): PlanResult {
  const start = workflow.nodes.find((node) => node.type === 'start');
  if (!start) return { ok: false, message: 'Workflow has no start node.' };

  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const steps: PlanStep[] = [];
  const visited = new Set<string>();
  let current: FlowNode | undefined = start;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);

    if (!supported.has(current.type)) {
      return {
        ok: false,
        message: `"${current.data.label}" (${current.type}) is not supported yet. This version dry-runs start, command, install, gitClone, verify, wait, and end.`,
      };
    }

    const step = stepFor(current, host);
    if (!step.ok) return step;
    steps.push(step.step);

    if (current.type === 'end') break;

    const outgoing = workflow.edges.filter((edge) => edge.source === current?.id);
    const nextEdge =
      outgoing.find((edge) => edge.condition === 'always') ??
      outgoing.find((edge) => edge.condition === 'on-success') ??
      outgoing[0];
    if (!nextEdge) break;

    const next = byId.get(nextEdge.target);
    if (!next) {
      return {
        ok: false,
        message: `Edge "${nextEdge.id}" points at missing node "${nextEdge.target}".`,
      };
    }
    current = next;
  }

  return { ok: true, name: workflow.name, steps };
}

function stepFor(
  node: FlowNode,
  host: HostPlatform,
): { ok: true; step: PlanStep } | { ok: false; message: string } {
  switch (node.type) {
    case 'start':
    case 'end':
      return { ok: true, step: step(node, null, null) };
    case 'command': {
      const command = node.data.command.trim();
      if (!command) return { ok: false, message: `"${node.data.label}" has an empty command.` };
      const skipped =
        node.data.platform !== 'all' && node.data.platform !== host
          ? `skipped on this machine (${host})`
          : null;
      const sudo = node.requiresSudo ? 'requires sudo' : null;
      return { ok: true, step: step(node, command, skipped ?? sudo) };
    }
    case 'install': {
      const command = installCommand(node);
      if (typeof command !== 'string') return command;
      return { ok: true, step: step(node, command, node.requiresSudo ? 'requires sudo' : null) };
    }
    case 'gitClone': {
      const directory = node.data.targetDir ? ` ${shellQuote(node.data.targetDir)}` : '';
      return {
        ok: true,
        step: step(
          node,
          `git clone ${shellQuote(node.data.repoUrl)}${directory}`,
          node.requiresSudo ? 'requires sudo' : null,
        ),
      };
    }
    case 'verify': {
      const command = node.data.command.trim();
      if (!command) return { ok: false, message: `"${node.data.label}" has an empty command.` };
      const expected = `expects exit ${node.data.expectedExitCode}`;
      const failure = node.data.failureMessage?.trim();
      return {
        ok: true,
        step: step(node, command, failure ? `${expected}. ${failure}` : expected),
      };
    }
    case 'wait': {
      if (!Number.isFinite(node.data.seconds) || node.data.seconds < 0) {
        return { ok: false, message: `"${node.data.label}" has an invalid wait.` };
      }
      return { ok: true, step: step(node, `sleep ${node.data.seconds}`, null) };
    }
    case 'sshKey':
    case 'env':
    case 'prompt':
    case 'if':
      return {
        ok: false,
        message: `"${node.data.label}" (${node.type}) is not supported yet.`,
      };
  }
}

function installCommand(
  node: Extract<FlowNode, { type: 'install' }>,
): string | { ok: false; message: string } {
  const { packageManager, packages, customCommand, label } = node.data;
  if (packageManager === 'custom') {
    const command = customCommand?.trim();
    if (!command) return { ok: false, message: `"${label}" needs a custom command.` };
    return command;
  }
  if (packages.length === 0) return { ok: false, message: `"${label}" has no packages.` };

  const list = packages.map(shellQuote).join(' ');
  switch (packageManager) {
    case 'brew':
      return `brew install ${list}`;
    case 'cask':
      return `brew install --cask ${list}`;
    case 'apt':
      return `apt-get install -y ${list}`;
    case 'npm':
      return `npm install -g ${list}`;
    case 'bun':
      return `bun add -g ${list}`;
    case 'vscode-extension':
      return packages.map((pkg) => `code --install-extension ${shellQuote(pkg)}`).join(' && ');
  }
}

function step(node: FlowNode, command: string | null, note: string | null): PlanStep {
  return {
    id: node.id,
    type: node.type,
    label: node.data.label,
    command,
    note,
  };
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@~+-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'\\''`)}'`;
}
