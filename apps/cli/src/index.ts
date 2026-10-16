#!/usr/bin/env bun
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';

import { cancel, intro, log, outro } from '@clack/prompts';
import { workflowSchema } from '@devflow/shared';

import { planWorkflow, type PlanStep } from './plan';
import { executePlan, runShell } from './run';

const usage = `DevFlow CLI

Usage:
  devflow run <workflow.json>
  devflow run <workflow.json> --dry-run

Options:
  --dry-run   Print the happy path without running commands
  -h, --help  Show this help
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

  const [command, file] = positionals;
  if (help || positionals.length === 0) {
    console.log(usage);
    return;
  }

  if (command !== 'run' || !file || positionals.length > 2) {
    fail(`Unknown command.\n\n${usage}`);
    return;
  }

  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    fail(code === 'ENOENT' ? `Workflow file not found: ${file}` : `Could not read ${file}.`);
    return;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    fail(`${file} is not valid JSON.`);
    return;
  }

  const parsed = workflowSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') || 'workflow';
    fail(`Invalid workflow at ${path}: ${issue?.message ?? 'unknown error'}`);
    return;
  }

  const plan = planWorkflow(parsed.data);
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

  const result = await executePlan(plan.steps, (command) => runShell(command), {
    onMarker: (step) => log.info(step.label),
    onSkip: printStep,
    onStart: printStep,
  });
  if (!result.ok) {
    fail(result.message);
    return;
  }
  outro('Done.');
}

function printStep(step: PlanStep) {
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
