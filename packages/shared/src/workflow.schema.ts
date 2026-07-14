import * as z from 'zod';

export const WorkflowNodeType = z.enum([
  'start',
  'command',
  'gitClone',
  'install',
  'sshKey',
  'verify',
  'wait',
  'env',
  'prompt',
  'if',
  'end',
]);
export type WorkflowNodeType = z.infer<typeof WorkflowNodeType>;

const baseNode = z.object({
  id: z.string(),
});

// nodes that actually run a shell command share these fields —
// pulled into one base to avoid repeating skipIfCommand/requiresSudo everywhere
const executableNode = baseNode.extend({
  skipIfCommand: z.string().optional(), // if this exits 0, the step is skipped
  requiresSudo: z.boolean().default(false),
});

export const startNodeSchema = baseNode.extend({
  type: z.literal('start'),
  data: z.object({ label: z.string() }),
});

export const commandNodeSchema = executableNode.extend({
  type: z.literal('command'),
  data: z.object({
    label: z.string(),
    command: z.string(),
    platform: z.enum(['mac', 'linux', 'windows', 'all']).default('all'),
  }),
});

export const gitCloneNodeSchema = executableNode.extend({
  type: z.literal('gitClone'),
  data: z.object({
    label: z.string(),
    repoUrl: z.string().url(),
    targetDir: z.string().optional(),
  }),
});

// generic install node — covers apt/brew/npm/bun packages,
// brew casks (GUI apps like VS Code), vscode extensions, and
// fully custom per-OS install commands (e.g. Caddy)
export const installNodeSchema = executableNode.extend({
  type: z.literal('install'),
  data: z.object({
    label: z.string(),
    packageManager: z.enum([
      'npm',
      'bun',
      'brew',
      'apt',
      'cask', // brew --cask, for GUI apps like VS Code
      'vscode-extension', // code --install-extension
      'custom', // arbitrary shell command, used when nothing else fits
    ]),
    packages: z.array(z.string()).default([]), // package names / extension ids
    customCommand: z.string().optional(), // required when packageManager === "custom"
  }),
});

export const sshKeyNodeSchema = executableNode.extend({
  type: z.literal('sshKey'),
  data: z.object({
    label: z.string(),
    email: z.string().email(),
    keyType: z.enum(['ed25519', 'rsa']).default('ed25519'),
  }),
});

// runs a command after a step and checks it against an expected exit code —
// catches silent failures (e.g. "docker --version" should exit 0)
export const verifyNodeSchema = baseNode.extend({
  type: z.literal('verify'),
  data: z.object({
    label: z.string(),
    command: z.string(),
    expectedExitCode: z.number().default(0),
    failureMessage: z.string().optional(), // shown to user if verification fails
  }),
});

export const waitNodeSchema = baseNode.extend({
  type: z.literal('wait'),
  data: z.object({ label: z.string(), seconds: z.number() }),
});

export const envNodeSchema = baseNode.extend({
  type: z.literal('env'),
  data: z.object({
    label: z.string(),
    key: z.string(),
    defaultValue: z.string().optional(),
  }),
});

export const promptNodeSchema = baseNode.extend({
  type: z.literal('prompt'),
  data: z.object({
    label: z.string(),
    question: z.string(),
    variableName: z.string(), // downstream steps reference via {{variableName}}
  }),
});

export const ifNodeSchema = baseNode.extend({
  type: z.literal('if'),
  data: z.object({
    label: z.string(),
    condition: z.string(), // e.g. "node --version"
  }),
});

export const endNodeSchema = baseNode.extend({
  type: z.literal('end'),
  data: z.object({ label: z.string() }),
});

export const flowNodeSchema = z.discriminatedUnion('type', [
  startNodeSchema,
  commandNodeSchema,
  gitCloneNodeSchema,
  installNodeSchema,
  sshKeyNodeSchema,
  verifyNodeSchema,
  waitNodeSchema,
  envNodeSchema,
  promptNodeSchema,
  ifNodeSchema,
  endNodeSchema,
]);
export type FlowNode = z.infer<typeof flowNodeSchema>;

export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.enum(['always', 'on-success', 'on-failure']).default('always'),
});
export type FlowEdge = z.infer<typeof flowEdgeSchema>;

// Layout: separates editor/UI position data from execution data.
// The CLI never needs this - only the React Flow canvas does.
export const workflowLayoutSchema = z.record(
  z.string(), // nodeId
  z.object({ x: z.number(), y: z.number() }),
);
export type WorkflowLayout = z.infer<typeof workflowLayoutSchema>;

export const workflowSchema = z.object({
  version: z.literal(1), // bump this + write a migration when the shape changes
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  layout: workflowLayoutSchema,
});
export type Workflow = z.infer<typeof workflowSchema>;

export const workflowListInputSchema = z.object({
  search: z.string().optional(),
});
export type WorkflowListInput = z.infer<typeof workflowListInputSchema>;

export const workflowSaveInputSchema = workflowSchema.omit({ id: true }).extend({
  id: z.string().optional(), // absent = create new, present = update
});
export type WorkflowSaveInput = z.infer<typeof workflowSaveInputSchema>;
