import type { FlowNode, Workflow } from '@devflow/shared';

export type HostPlatform = 'mac' | 'linux' | 'windows' | 'other';

export type PlanStep = {
  id: string;
  type: FlowNode['type'];
  label: string;
  command: string | null;
  note: string | null;
  skipped: boolean;
  requiresSudo: boolean;
  expectedExitCode: number | null;
  failureMessage: string | null;
  skipIfCommand: string | null;
  prompt: { question: string; variableName: string } | null;
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
  'prompt',
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
        message: `"${current.data.label}" (${current.type}) is not supported yet. This version runs start, command, install, gitClone, verify, wait, prompt, and end.`,
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
      const platformSkipped = Boolean(skipped);
      const skipIf = platformSkipped ? null : skipIfOf(node);
      return {
        ok: true,
        step: step(node, command, platformSkipped ? skipped : joinNotes(sudo, skipIfNote(skipIf)), {
          skipped: platformSkipped,
          requiresSudo: node.requiresSudo,
          expectedExitCode: 0,
          skipIfCommand: skipIf,
        }),
      };
    }
    case 'install': {
      const command = installCommand(node);
      if (typeof command !== 'string') return command;
      const skipIf = skipIfOf(node);
      return {
        ok: true,
        step: step(
          node,
          command,
          joinNotes(node.requiresSudo ? 'requires sudo' : null, skipIfNote(skipIf)),
          {
            requiresSudo: node.requiresSudo,
            expectedExitCode: 0,
            skipIfCommand: skipIf,
          },
        ),
      };
    }
    case 'gitClone': {
      const directory = node.data.targetDir ? ` ${shellQuote(node.data.targetDir)}` : '';
      const skipIf = skipIfOf(node);
      return {
        ok: true,
        step: step(
          node,
          `git clone ${shellQuote(node.data.repoUrl)}${directory}`,
          joinNotes(node.requiresSudo ? 'requires sudo' : null, skipIfNote(skipIf)),
          { requiresSudo: node.requiresSudo, expectedExitCode: 0, skipIfCommand: skipIf },
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
        step: step(node, command, failure ? `${expected}. ${failure}` : expected, {
          expectedExitCode: node.data.expectedExitCode,
          failureMessage: failure ?? null,
        }),
      };
    }
    case 'wait': {
      if (!Number.isFinite(node.data.seconds) || node.data.seconds < 0) {
        return { ok: false, message: `"${node.data.label}" has an invalid wait.` };
      }
      return {
        ok: true,
        step: step(node, `sleep ${node.data.seconds}`, null, { expectedExitCode: 0 }),
      };
    }
    case 'prompt': {
      const question = node.data.question.trim();
      const variableName = node.data.variableName.trim();
      if (!question) return { ok: false, message: `"${node.data.label}" has an empty question.` };
      if (!variableName) {
        return { ok: false, message: `"${node.data.label}" has an empty variable name.` };
      }
      return {
        ok: true,
        step: step(node, null, `${question}\n{{${variableName}}}`, {
          prompt: { question, variableName },
        }),
      };
    }
    case 'sshKey':
    case 'env':
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

function step(
  node: FlowNode,
  command: string | null,
  note: string | null,
  extra: {
    skipped?: boolean;
    requiresSudo?: boolean;
    expectedExitCode?: number | null;
    failureMessage?: string | null;
    skipIfCommand?: string | null;
    prompt?: { question: string; variableName: string } | null;
  } = {},
): PlanStep {
  return {
    id: node.id,
    type: node.type,
    label: node.data.label,
    command,
    note,
    skipped: extra.skipped ?? false,
    requiresSudo: extra.requiresSudo ?? false,
    expectedExitCode: extra.expectedExitCode ?? null,
    failureMessage: extra.failureMessage ?? null,
    skipIfCommand: extra.skipIfCommand ?? null,
    prompt: extra.prompt ?? null,
  };
}

function skipIfOf(
  node: Extract<FlowNode, { type: 'command' | 'install' | 'gitClone' }>,
): string | null {
  const command = node.skipIfCommand?.trim();
  return command || null;
}

function skipIfNote(command: string | null): string | null {
  return command ? `skip if: ${command}` : null;
}

function joinNotes(...parts: Array<string | null>): string | null {
  const notes = parts.filter((part): part is string => Boolean(part));
  return notes.length > 0 ? notes.join('\n') : null;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@~+-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'\\''`)}'`;
}
