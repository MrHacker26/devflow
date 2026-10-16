import { describe, expect, test } from 'bun:test';
import { workflowSchema, type Workflow } from '@devflow/shared';

import { planWorkflow } from './plan';

function workflow(input: { name?: string; nodes: unknown; edges: unknown }): Workflow {
  return workflowSchema.parse({
    version: 1,
    id: 'wf_test',
    name: input.name ?? 'Toolchain',
    layout: {},
    nodes: input.nodes,
    edges: input.edges,
  });
}

describe('planWorkflow', () => {
  test('dry-runs the example toolchain file', async () => {
    const raw = await Bun.file(new URL('../examples/toolchain.json', import.meta.url)).json();
    const plan = planWorkflow(workflowSchema.parse(raw), 'mac');

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps.map((step) => step.command)).toEqual([
      null,
      'brew install oven-sh/bun/bun',
      'git clone https://github.com/example/devflow.git ~/src/devflow',
      'bun --version',
      null,
    ]);
    expect(plan.steps[1]?.note).toBe('skip if: command -v bun');
    expect(plan.steps[1]?.skipped).toBe(false);
    expect(plan.steps[2]?.note).toBe('skip if: test -d ~/src/devflow');
  });

  test('prints the happy path for supported nodes', () => {
    const plan = planWorkflow(
      workflow({
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'install-bun',
            type: 'install',
            data: { label: 'Install Bun', packageManager: 'brew', packages: ['oven-sh/bun/bun'] },
          },
          {
            id: 'clone',
            type: 'gitClone',
            data: {
              label: 'Clone repo',
              repoUrl: 'https://github.com/example/devflow.git',
              targetDir: '~/src/devflow',
            },
          },
          {
            id: 'check',
            type: 'verify',
            data: { label: 'Verify Bun', command: 'bun --version', expectedExitCode: 0 },
          },
          { id: 'pause', type: 'wait', data: { label: 'Wait', seconds: 2 } },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Done', command: 'echo ready', platform: 'all' },
          },
          { id: 'end', type: 'end', data: { label: 'End' } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'install-bun', condition: 'always' },
          { id: 'e2', source: 'install-bun', target: 'clone', condition: 'always' },
          { id: 'e3', source: 'clone', target: 'check', condition: 'always' },
          { id: 'e4', source: 'check', target: 'pause', condition: 'on-success' },
          { id: 'e5', source: 'pause', target: 'echo', condition: 'always' },
          { id: 'e6', source: 'echo', target: 'end', condition: 'always' },
        ],
      }),
      'mac',
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps.map((step) => step.command)).toEqual([
      null,
      'brew install oven-sh/bun/bun',
      'git clone https://github.com/example/devflow.git ~/src/devflow',
      'bun --version',
      'sleep 2',
      'echo ready',
      null,
    ]);
    expect(plan.steps[3]?.note).toBe('expects exit 0');
  });

  test('prefers on-success over on-failure', () => {
    const plan = planWorkflow(
      workflow({
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'ok',
            type: 'command',
            data: { label: 'Success', command: 'echo ok', platform: 'all' },
          },
          {
            id: 'bad',
            type: 'command',
            data: { label: 'Failure', command: 'echo bad', platform: 'all' },
          },
          { id: 'end', type: 'end', data: { label: 'End' } },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'ok', condition: 'on-success' },
          { id: 'e2', source: 'start', target: 'bad', condition: 'on-failure' },
          { id: 'e3', source: 'ok', target: 'end', condition: 'always' },
        ],
      }),
      'linux',
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps.map((step) => step.id)).toEqual(['start', 'ok', 'end']);
  });

  test('keeps a prompt on the path and records its variable', () => {
    const plan = planWorkflow(
      workflow({
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'ask',
            type: 'prompt',
            data: {
              label: 'GitHub email',
              question: 'What email should we use?',
              variableName: 'gitEmail',
            },
          },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'ask', condition: 'always' }],
      }),
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps[1]?.prompt).toEqual({
      question: 'What email should we use?',
      variableName: 'gitEmail',
    });
    expect(plan.steps[1]?.command).toBeNull();
  });

  test('rejects if, sshKey, and env on the path', () => {
    for (const node of [
      { id: 'branch', type: 'if' as const, data: { label: 'Node?', condition: 'command -v node' } },
      {
        id: 'key',
        type: 'sshKey' as const,
        data: { label: 'SSH', email: 'dev@example.com', keyType: 'ed25519' as const },
      },
      {
        id: 'theme',
        type: 'env' as const,
        data: { label: 'Theme', key: 'THEME', defaultValue: 'dark' },
      },
    ]) {
      const plan = planWorkflow(
        workflow({
          nodes: [{ id: 'start', type: 'start', data: { label: 'Start' } }, node],
          edges: [{ id: 'e1', source: 'start', target: node.id, condition: 'always' }],
        }),
      );
      expect(plan.ok).toBe(false);
    }
  });

  test('skips a command that does not match the host platform', () => {
    const plan = planWorkflow(
      workflow({
        nodes: [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'mac-only',
            type: 'command',
            requiresSudo: true,
            data: { label: 'Brew', command: 'brew update', platform: 'mac' },
          },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'mac-only', condition: 'always' }],
      }),
      'linux',
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps[1]?.note).toBe('skipped on this machine (linux)');
  });

  test('renders each install manager', () => {
    const cases = [
      ['cask', 'brew install --cask visual-studio-code'],
      ['apt', 'apt-get install -y git'],
      ['npm', 'npm install -g typescript'],
      ['bun', 'bun add -g prettier'],
      ['vscode-extension', 'code --install-extension esbenp.prettier-vscode'],
    ] as const;

    for (const [packageManager, command] of cases) {
      const plan = planWorkflow(
        workflow({
          nodes: [
            { id: 'start', type: 'start', data: { label: 'Start' } },
            {
              id: 'install',
              type: 'install',
              data: {
                label: 'Install',
                packageManager,
                packages: [command.split(' ').at(-1) ?? 'pkg'],
              },
            },
          ],
          edges: [{ id: 'e1', source: 'start', target: 'install', condition: 'always' }],
        }),
      );
      expect(plan.ok).toBe(true);
      if (!plan.ok) return;
      expect(plan.steps[1]?.command).toBe(command);
    }
  });
});
