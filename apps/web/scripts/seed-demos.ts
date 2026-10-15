import 'dotenv/config';

import type { FlowEdge, FlowNode, WorkflowLayout } from '@devflow/shared';
import { and, asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { user } from '../src/db/schema/auth';
import { workflows } from '../src/db/schema/workflow';

type DemoWorkflow = {
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  layout: WorkflowLayout;
};

function edge(
  id: string,
  source: string,
  target: string,
  condition: FlowEdge['condition'] = 'always',
): FlowEdge {
  return { id, source, target, condition };
}

const macOnboarding: DemoWorkflow = {
  name: 'macOS engineer setup',
  description: 'Homebrew, Bun, GitHub SSH, clone monorepo, verify toolchain.',
  nodes: [
    { id: 'start', type: 'start', data: { label: 'Start' } },
    {
      id: 'prompt-email',
      type: 'prompt',
      data: {
        label: 'GitHub email',
        question: 'What email should we use for your SSH key?',
        variableName: 'gitEmail',
      },
    },
    {
      id: 'install-brew-tools',
      type: 'install',
      skipIfCommand: 'command -v bun',
      requiresSudo: false,
      data: {
        label: 'Install Bun via Homebrew',
        packageManager: 'brew',
        packages: ['oven-sh/bun/bun'],
      },
    },
    {
      id: 'install-vscode',
      type: 'install',
      skipIfCommand: 'command -v code',
      requiresSudo: false,
      data: {
        label: 'Install VS Code',
        packageManager: 'cask',
        packages: ['visual-studio-code'],
      },
    },
    {
      id: 'ssh-key',
      type: 'sshKey',
      skipIfCommand: 'test -f ~/.ssh/id_ed25519.pub',
      requiresSudo: false,
      data: {
        label: 'Generate SSH key',
        email: 'dev@example.com',
        keyType: 'ed25519',
      },
    },
    {
      id: 'clone-repo',
      type: 'gitClone',
      skipIfCommand: 'test -d ~/src/devflow',
      requiresSudo: false,
      data: {
        label: 'Clone DevFlow',
        repoUrl: 'https://github.com/example/devflow.git',
        targetDir: '~/src/devflow',
      },
    },
    {
      id: 'verify-bun',
      type: 'verify',
      data: {
        label: 'Verify Bun',
        command: 'bun --version',
        expectedExitCode: 0,
        failureMessage: 'Bun is not available on PATH.',
      },
    },
    { id: 'end', type: 'end', data: { label: 'Done' } },
  ],
  edges: [
    edge('e1', 'start', 'prompt-email'),
    edge('e2', 'prompt-email', 'install-brew-tools'),
    edge('e3', 'install-brew-tools', 'install-vscode'),
    edge('e4', 'install-vscode', 'ssh-key'),
    edge('e5', 'ssh-key', 'clone-repo'),
    edge('e6', 'clone-repo', 'verify-bun'),
    edge('e7', 'verify-bun', 'end', 'on-success'),
  ],
  layout: {
    start: { x: 280, y: 0 },
    'prompt-email': { x: 280, y: 200 },
    'install-brew-tools': { x: 280, y: 400 },
    'install-vscode': { x: 280, y: 620 },
    'ssh-key': { x: 280, y: 840 },
    'clone-repo': { x: 280, y: 1060 },
    'verify-bun': { x: 280, y: 1280 },
    end: { x: 280, y: 1480 },
  },
};

const nodeVerifyDemo: DemoWorkflow = {
  name: 'Node + Docker check',
  description: 'Install Node via Homebrew (or skip), verify Node and Docker are healthy.',
  nodes: [
    { id: 'start', type: 'start', data: { label: 'Start' } },
    {
      id: 'if-node',
      type: 'if',
      data: {
        label: 'Node installed?',
        condition: 'command -v node',
      },
    },
    {
      id: 'install-node',
      type: 'install',
      requiresSudo: false,
      data: {
        label: 'Install Node',
        packageManager: 'brew',
        packages: ['node'],
      },
    },
    {
      id: 'verify-node',
      type: 'verify',
      data: {
        label: 'Verify Node 20+',
        command: 'node -v',
        expectedExitCode: 0,
        failureMessage: 'Node.js is missing.',
      },
    },
    {
      id: 'verify-docker',
      type: 'verify',
      data: {
        label: 'Verify Docker',
        command: 'docker info',
        expectedExitCode: 0,
        failureMessage: 'Docker daemon is not running. Start Docker Desktop and retry.',
      },
    },
    { id: 'end', type: 'end', data: { label: 'Ready' } },
  ],
  edges: [
    edge('e1', 'start', 'if-node'),
    edge('e2', 'if-node', 'install-node', 'on-failure'),
    edge('e3', 'if-node', 'verify-node', 'on-success'),
    edge('e4', 'install-node', 'verify-node'),
    edge('e5', 'verify-node', 'verify-docker', 'on-success'),
    edge('e6', 'verify-docker', 'end', 'on-success'),
  ],
  layout: {
    start: { x: 360, y: 0 },
    'if-node': { x: 360, y: 200 },
    'install-node': { x: 40, y: 440 },
    'verify-node': { x: 360, y: 700 },
    'verify-docker': { x: 360, y: 940 },
    end: { x: 360, y: 1180 },
  },
};

const vscodeExtensionsDemo: DemoWorkflow = {
  name: 'VS Code extensions pack',
  description: 'Install recommended editor extensions for the team.',
  nodes: [
    { id: 'start', type: 'start', data: { label: 'Start' } },
    {
      id: 'wait-code',
      type: 'wait',
      data: { label: 'Wait for VS Code', seconds: 2 },
    },
    {
      id: 'install-exts',
      type: 'install',
      requiresSudo: false,
      data: {
        label: 'Install extensions',
        packageManager: 'vscode-extension',
        packages: ['esbenp.prettier-vscode', 'dbaeumer.vscode-eslint', 'bradlc.vscode-tailwindcss'],
      },
    },
    {
      id: 'set-env',
      type: 'env',
      data: {
        label: 'Editor theme hint',
        key: 'DEVFLOW_EDITOR_THEME',
        defaultValue: 'blueprint-dark',
      },
    },
    {
      id: 'echo-done',
      type: 'command',
      requiresSudo: false,
      data: {
        label: 'Print success',
        command: 'echo "VS Code extensions installed"',
        platform: 'all',
      },
    },
    { id: 'end', type: 'end', data: { label: 'End' } },
  ],
  edges: [
    edge('e1', 'start', 'wait-code'),
    edge('e2', 'wait-code', 'install-exts'),
    edge('e3', 'install-exts', 'set-env'),
    edge('e4', 'set-env', 'echo-done'),
    edge('e5', 'echo-done', 'end'),
  ],
  layout: {
    start: { x: 280, y: 0 },
    'wait-code': { x: 280, y: 200 },
    'install-exts': { x: 280, y: 400 },
    'set-env': { x: 280, y: 640 },
    'echo-done': { x: 280, y: 860 },
    end: { x: 280, y: 1080 },
  },
};

const demos = [macOnboarding, nodeVerifyDemo, vscodeExtensionsDemo];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  const email = process.env.SEED_USER_EMAIL;
  const [owner] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(email ? eq(user.email, email) : undefined)
    .orderBy(asc(user.createdAt))
    .limit(1);

  if (!owner) {
    throw new Error(
      email
        ? `No user with email ${email}. Sign up in the app first.`
        : 'No users found. Sign up in the app first, or set SEED_USER_EMAIL.',
    );
  }
  console.log(`seeding demos for ${owner.email}`);

  for (const demo of demos) {
    const existing = await db
      .select({ id: workflows.id })
      .from(workflows)
      .where(and(eq(workflows.userId, owner.id), eq(workflows.name, demo.name)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(workflows)
        .set({
          description: demo.description,
          version: 1,
          nodes: demo.nodes,
          edges: demo.edges,
          layout: demo.layout,
          updatedAt: new Date(),
        })
        .where(eq(workflows.id, existing[0].id));
      console.log(`updated: ${demo.name}`);
      continue;
    }

    await db.insert(workflows).values({
      userId: owner.id,
      version: 1,
      name: demo.name,
      description: demo.description,
      nodes: demo.nodes,
      edges: demo.edges,
      layout: demo.layout,
    });
    console.log(`created: ${demo.name}`);
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
