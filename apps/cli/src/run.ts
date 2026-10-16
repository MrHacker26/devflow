import type { PlanStep } from './plan';
import { applyTemplate } from './template';

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type CommandRunner = (
  command: string,
  options?: { stream?: boolean },
) => Promise<CommandResult>;

export type PromptAnswer = { ok: true; value: string } | { ok: false; message: string };

export type RunHooks = {
  onMarker?: (step: PlanStep) => void;
  onSkip?: (step: PlanStep) => void;
  onStart?: (step: PlanStep) => void;
  onPrompt?: (step: PlanStep) => Promise<PromptAnswer>;
};

export type RunResult =
  { ok: true } | { ok: false; step: PlanStep; exitCode: number; message: string };

export async function executePlan(
  steps: PlanStep[],
  runner: CommandRunner,
  hooks: RunHooks = {},
): Promise<RunResult> {
  const blocked = steps.find((step) => step.command && step.requiresSudo && !step.skipped);
  if (blocked) {
    return {
      ok: false,
      step: blocked,
      exitCode: 1,
      message: `"${blocked.label}" requires sudo, which is not supported yet.`,
    };
  }

  const variables = new Map<string, string>();

  for (const step of steps) {
    if (step.prompt) {
      if (!hooks.onPrompt) {
        return {
          ok: false,
          step,
          exitCode: 1,
          message: `"${step.label}" needs an answer.`,
        };
      }
      const answer = await hooks.onPrompt(step);
      if (!answer.ok) return { ok: false, step, exitCode: 1, message: answer.message };
      const value = answer.value.trim();
      if (!value) {
        return { ok: false, step, exitCode: 1, message: `"${step.label}" needs an answer.` };
      }
      variables.set(step.prompt.variableName, value);
      continue;
    }

    if (!step.command) {
      hooks.onMarker?.(step);
      continue;
    }
    if (step.skipped) {
      hooks.onSkip?.(step);
      continue;
    }

    const skipIf = fill(step.skipIfCommand, variables);
    if (!skipIf.ok) return { ok: false, step, exitCode: 1, message: skipIf.message };
    const command = fill(step.command, variables);
    if (!command.ok) return { ok: false, step, exitCode: 1, message: command.message };

    if (skipIf.value) {
      const check = await runner(skipIf.value, { stream: false });
      if (check.exitCode === 0) {
        hooks.onSkip?.({
          ...step,
          skipped: true,
          command: command.value,
          note: `skipped, skip if exited 0\n${skipIf.value}`,
        });
        continue;
      }
    }

    if (!command.value) {
      return { ok: false, step, exitCode: 1, message: `"${step.label}" has an empty command.` };
    }
    const ready = { ...step, command: command.value };
    hooks.onStart?.(ready);
    const result = await runner(command.value);
    const expected = step.expectedExitCode ?? 0;
    if (result.exitCode !== expected) {
      const detail = step.failureMessage?.trim();
      const failed = `"${step.label}" failed (exit ${result.exitCode}).`;
      return {
        ok: false,
        step,
        exitCode: result.exitCode,
        message: detail ? `${failed} ${detail}` : failed,
      };
    }
  }

  return { ok: true };
}

function fill(
  value: string | null,
  variables: ReadonlyMap<string, string>,
): { ok: true; value: string | null } | { ok: false; message: string } {
  if (!value) return { ok: true, value };
  const filled = applyTemplate(value, variables);
  if (!filled.ok) return filled;
  return { ok: true, value: filled.value };
}

export async function runShell(
  command: string,
  options?: { stream?: boolean },
): Promise<CommandResult> {
  const stream = options?.stream ?? true;
  let proc: Bun.Subprocess;
  try {
    proc = Bun.spawn(['sh', '-c', command], {
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: stream ? 'inherit' : 'ignore',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start command.';
    return { exitCode: 127, stdout: '', stderr: message };
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    collect(streamOf(proc.stdout), stream ? process.stdout : null),
    collect(streamOf(proc.stderr), stream ? process.stderr : null),
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
}

function streamOf(
  output: ReadableStream<Uint8Array> | number | undefined,
): ReadableStream<Uint8Array> | undefined {
  return typeof output === 'number' ? undefined : output;
}

async function collect(
  stream: ReadableStream<Uint8Array> | undefined,
  dest: NodeJS.WriteStream | null,
): Promise<string> {
  if (!stream) return '';
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    dest?.write(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
