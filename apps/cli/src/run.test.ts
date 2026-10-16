import { describe, expect, test } from 'bun:test';
import { workflowSchema, type Workflow } from '@devflow/shared';

import { planWorkflow } from './plan';
import { executePlan, runShell, type CommandResult } from './run';

function workflow(input: { nodes: unknown; edges: unknown }): Workflow {
  return workflowSchema.parse({
    version: 1,
    id: 'wf_test',
    name: 'Run',
    layout: {},
    nodes: input.nodes,
    edges: input.edges,
  });
}

function planned(nodes: unknown[], edges: unknown[], host: 'mac' | 'linux' = 'linux') {
  const plan = planWorkflow(workflow({ nodes, edges }), host);
  if (!plan.ok) throw new Error(plan.message);
  return plan.steps;
}

const ok = (stdout = ''): CommandResult => ({ exitCode: 0, stdout, stderr: '' });

describe('executePlan', () => {
  test('runs commands in order and skips markers and other platforms', async () => {
    const calls: string[] = [];
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'mac-only',
            type: 'command',
            data: { label: 'Brew', command: 'brew update', platform: 'mac' },
          },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Hello', command: 'echo hello', platform: 'all' },
          },
          { id: 'end', type: 'end', data: { label: 'End' } },
        ],
        [
          { id: 'e1', source: 'start', target: 'mac-only', condition: 'always' },
          { id: 'e2', source: 'mac-only', target: 'echo', condition: 'always' },
          { id: 'e3', source: 'echo', target: 'end', condition: 'always' },
        ],
      ),
      async (command) => {
        calls.push(command);
        return ok();
      },
    );

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['echo hello']);
  });

  test('stops on the first failing command', async () => {
    const calls: string[] = [];
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'bad',
            type: 'command',
            data: { label: 'Fail', command: 'false', platform: 'all' },
          },
          {
            id: 'later',
            type: 'command',
            data: { label: 'Later', command: 'echo later', platform: 'all' },
          },
        ],
        [
          { id: 'e1', source: 'start', target: 'bad', condition: 'always' },
          { id: 'e2', source: 'bad', target: 'later', condition: 'always' },
        ],
      ),
      async (command) => {
        calls.push(command);
        return { exitCode: 1, stdout: '', stderr: 'no' };
      },
    );

    expect(calls).toEqual(['false']);
    expect(result).toMatchObject({
      ok: false,
      exitCode: 1,
      message: '"Fail" failed (exit 1).',
    });
  });

  test('accepts a verify step whose exit code matches', async () => {
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'check',
            type: 'verify',
            data: { label: 'Missing', command: 'false', expectedExitCode: 1 },
          },
        ],
        [{ id: 'e1', source: 'start', target: 'check', condition: 'always' }],
      ),
      async () => ({ exitCode: 1, stdout: '', stderr: '' }),
    );

    expect(result.ok).toBe(true);
  });

  test('uses the verify failure message when the exit code does not match', async () => {
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'check',
            type: 'verify',
            data: {
              label: 'Verify Bun',
              command: 'bun --version',
              expectedExitCode: 0,
              failureMessage: 'Bun is not available on PATH.',
            },
          },
        ],
        [{ id: 'e1', source: 'start', target: 'check', condition: 'always' }],
      ),
      async () => ({ exitCode: 127, stdout: '', stderr: '' }),
    );

    expect(result).toMatchObject({
      ok: false,
      message: '"Verify Bun" failed (exit 127). Bun is not available on PATH.',
    });
  });

  test('refuses a sudo step before running anything', async () => {
    let calls = 0;
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Hello', command: 'echo hello', platform: 'all' },
          },
          {
            id: 'root',
            type: 'install',
            requiresSudo: true,
            data: { label: 'Install git', packageManager: 'apt', packages: ['git'] },
          },
        ],
        [
          { id: 'e1', source: 'start', target: 'echo', condition: 'always' },
          { id: 'e2', source: 'echo', target: 'root', condition: 'always' },
        ],
      ),
      async () => {
        calls += 1;
        return ok();
      },
    );

    expect(calls).toBe(0);
    expect(result).toMatchObject({
      ok: false,
      message: '"Install git" requires sudo, which is not supported yet.',
    });
  });

  test('skips a step when its skip check exits 0', async () => {
    const calls: Array<[string, boolean]> = [];
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'install',
            type: 'install',
            skipIfCommand: 'command -v bun',
            data: { label: 'Install Bun', packageManager: 'brew', packages: ['oven-sh/bun/bun'] },
          },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Hello', command: 'echo hello', platform: 'all' },
          },
        ],
        [
          { id: 'e1', source: 'start', target: 'install', condition: 'always' },
          { id: 'e2', source: 'install', target: 'echo', condition: 'always' },
        ],
      ),
      async (command, options) => {
        calls.push([command, options?.stream ?? true]);
        return ok();
      },
    );

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      ['command -v bun', false],
      ['echo hello', true],
    ]);
  });

  test('runs a step when its skip check exits non-zero', async () => {
    const calls: string[] = [];
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'clone',
            type: 'gitClone',
            skipIfCommand: 'test -d ~/src/devflow',
            data: {
              label: 'Clone repo',
              repoUrl: 'https://github.com/example/devflow.git',
              targetDir: '~/src/devflow',
            },
          },
        ],
        [{ id: 'e1', source: 'start', target: 'clone', condition: 'always' }],
      ),
      async (command) => {
        calls.push(command);
        return command.startsWith('test ') ? { exitCode: 1, stdout: '', stderr: '' } : ok();
      },
    );

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      'test -d ~/src/devflow',
      'git clone https://github.com/example/devflow.git ~/src/devflow',
    ]);
  });

  test('does not run a skip check for a platform-skipped step', async () => {
    const calls: string[] = [];
    await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'mac-only',
            type: 'command',
            skipIfCommand: 'command -v brew',
            data: { label: 'Brew', command: 'brew update', platform: 'mac' },
          },
        ],
        [{ id: 'e1', source: 'start', target: 'mac-only', condition: 'always' }],
      ),
      async (command) => {
        calls.push(command);
        return ok();
      },
    );

    expect(calls).toEqual([]);
  });

  test('fills a prompt answer into the next command', async () => {
    const calls: string[] = [];
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'ask',
            type: 'prompt',
            data: { label: 'Email', question: 'Email?', variableName: 'gitEmail' },
          },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Use email', command: 'echo {{gitEmail}}', platform: 'all' },
          },
        ],
        [
          { id: 'e1', source: 'start', target: 'ask', condition: 'always' },
          { id: 'e2', source: 'ask', target: 'echo', condition: 'always' },
        ],
      ),
      async (command) => {
        calls.push(command);
        return ok();
      },
      {
        onPrompt: async () => ({ ok: true, value: 'dev@example.com' }),
      },
    );

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['echo dev@example.com']);
  });

  test('stops when a prompt is cancelled', async () => {
    const calls: string[] = [];
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'ask',
            type: 'prompt',
            data: { label: 'Email', question: 'Email?', variableName: 'gitEmail' },
          },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Use email', command: 'echo {{gitEmail}}', platform: 'all' },
          },
        ],
        [
          { id: 'e1', source: 'start', target: 'ask', condition: 'always' },
          { id: 'e2', source: 'ask', target: 'echo', condition: 'always' },
        ],
      ),
      async (command) => {
        calls.push(command);
        return ok();
      },
      { onPrompt: async () => ({ ok: false, message: 'Prompt cancelled.' }) },
    );

    expect(calls).toEqual([]);
    expect(result).toMatchObject({ ok: false, message: 'Prompt cancelled.' });
  });

  test('does not run a command that still has an unset variable', async () => {
    let calls = 0;
    const result = await executePlan(
      planned(
        [
          { id: 'start', type: 'start', data: { label: 'Start' } },
          {
            id: 'echo',
            type: 'command',
            data: { label: 'Use email', command: 'echo {{gitEmail}}', platform: 'all' },
          },
        ],
        [{ id: 'e1', source: 'start', target: 'echo', condition: 'always' }],
      ),
      async () => {
        calls += 1;
        return ok();
      },
    );

    expect(calls).toBe(0);
    expect(result).toMatchObject({ ok: false, message: 'Variable "gitEmail" is not set.' });
  });
});

describe('runShell', () => {
  test('runs a shell command and captures its output', async () => {
    const result = await runShell('echo hello', { stream: false });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('hello\n');
  });

  test('returns a non-zero exit code', async () => {
    const result = await runShell('exit 4', { stream: false });
    expect(result.exitCode).toBe(4);
  });
});
