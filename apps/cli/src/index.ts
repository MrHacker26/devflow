#!/usr/bin/env bun
import { readFile, stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { cancel, intro, isCancel, log, outro, text } from '@clack/prompts';
import { workflowSchema, type Workflow } from '@devflow/shared';

import { planWorkflow, type PlanStep } from './plan';
import { executePlan, runShell } from './run';
import { fetchSharedWorkflow, isShareToken } from './share';

const usage = `DevFlow CLI

Usage:
  devflow run <workflow.json>
  devflow run <share-token>
  devflow run <workflow.json> --dry-run

Options:
  --dry-run   Print the happy path without running commands
  -h, --help  Show this help

A share token looks like df_... and is fetched from DEVFLOW_URL
(default http://localhost:3000).
`;

async function main() {
  let positionals: string[];
  let help: boolean;
  let dryRun: boolean;

  try {
    const parsed = parseArgs({
      args: Bun.argv.slice(2),
      allowPositionals: true,
      strict: true,
      options: {
        'dry-run': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
    });
    positionals = parsed.positionals;
    help = parsed.values.help;
    dryRun = parsed.values['dry-run'];
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Invalid arguments.');
    return;
  }

  const [command, target] = positionals;
  if (help || positionals.length === 0) {
    console.log(usage);
    return;
  }

  if (command !== 'run' || !target || positionals.length > 2) {
    fail(`Unknown command.\n\n${usage}`);
    return;
  }

  let workflow: Workflow;
  try {
    workflow = await loadWorkflow(target);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Could not load the workflow.');
    return;
  }

  const plan = planWorkflow(workflow);
  if (!plan.ok) {
    fail(plan.message);
    return;
  }

  intro(plan.name);
  if (dryRun) {
    for (const step of plan.steps) printStep(step);
    outro('Dry run complete. Nothing was executed.');
    return;
  }

  const result = await executePlan(
    plan.steps,
    (shellCommand, options) => runShell(shellCommand, options),
    {
      onMarker: (step) => log.info(step.label),
      onSkip: printStep,
      onStart: printStep,
      onPrompt: ask,
    },
  );
  if (!result.ok) {
    fail(result.message);
    return;
  }
  outro('Done.');
}

async function loadWorkflow(target: string): Promise<Workflow> {
  if (isShareToken(target) && !(await fileExists(target))) {
    return fetchSharedWorkflow(target);
  }

  let raw: string;
  try {
    raw = await readFile(target, 'utf8');
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    throw new Error(
      code === 'ENOENT' ? `Workflow file not found: ${target}` : `Could not read ${target}.`,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`${target} is not valid JSON.`);
  }

  const parsed = workflowSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') || 'workflow';
    throw new Error(`Invalid workflow at ${path}: ${issue?.message ?? 'unknown error'}`);
  }
  return parsed.data;
}

async function fileExists(target: string) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function ask(step: PlanStep) {
  const question = step.prompt?.question;
  if (!question) return { ok: false as const, message: `"${step.label}" needs an answer.` };

  const answer = await text({
    message: question,
    validate: (value) => (value?.trim() ? undefined : 'Enter a value.'),
  });
  if (isCancel(answer)) return { ok: false as const, message: 'Prompt cancelled.' };

  log.info(`${step.label}: ${answer.trim()}`);
  return { ok: true as const, value: answer.trim() };
}

function printStep(step: PlanStep) {
  if (step.prompt) {
    log.step(`${step.label}\n${step.note}`);
    return;
  }
  if (!step.command) {
    log.info(step.label);
    return;
  }

  const detail = step.note ? `${step.command}\n${step.note}` : step.command;
  if (step.skipped) {
    log.warn(`${step.label}\n${detail}`);
    return;
  }
  log.step(`${step.label}\n${detail}`);
}

function fail(message: string): void {
  cancel(message);
  process.exitCode = 1;
}

await main();
