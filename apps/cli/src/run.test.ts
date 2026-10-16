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
