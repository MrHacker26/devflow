'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { MousePointerClick, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { match } from 'ts-pattern';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { getNodeIcon } from './nodes/node-icons';
import type { BuilderNode, BuilderNodeData } from './workflow-serialize';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ExecutableFields({
  data,
  onChange,
}: {
  data: BuilderNodeData;
  onChange: (patch: Partial<BuilderNodeData>) => void;
}) {
  return (
    <>
      <Field label="Skip if command exits 0">
        <Input
          value={typeof data.skipIfCommand === 'string' ? data.skipIfCommand : ''}
          placeholder="which docker"
          onChange={(e) => onChange({ skipIfCommand: e.target.value || undefined })}
          className="bg-background/40 rounded-xl"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(data.requiresSudo)}
          onChange={(e) => onChange({ requiresSudo: e.target.checked })}
          className="accent-primary"
        />
        Requires sudo
      </label>
    </>
  );
}

export function NodeInspector({
  node,
  onChange,
  onDelete,
}: {
  node: BuilderNode | null;
  onChange: (nodeId: string, data: BuilderNodeData) => void;
  onDelete: (nodeId: string) => void;
}) {
  return (
    <aside className="blueprint-panel flex w-80 shrink-0 flex-col overflow-hidden border-l">
      <AnimatePresence mode="wait">
        {!node ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-muted-foreground flex flex-col items-start gap-3 p-5 text-sm leading-relaxed"
          >
            <span className="bg-muted inline-flex size-9 items-center justify-center rounded-xl">
              <MousePointerClick className="size-4" />
            </span>
            Select a node on the canvas to edit its settings.
          </motion.div>
        ) : (
          <InspectorForm key={node.id} node={node} onChange={onChange} onDelete={onDelete} />
        )}
      </AnimatePresence>
    </aside>
  );
}

function InspectorForm({
  node,
  onChange,
  onDelete,
}: {
  node: BuilderNode;
  onChange: (nodeId: string, data: BuilderNodeData) => void;
  onDelete: (nodeId: string) => void;
}) {
  const type = (node.type ?? 'command') as WorkflowNodeType;
  const Icon = getNodeIcon(type);
  const patch = (partial: Partial<BuilderNodeData>) => {
    onChange(node.id, { ...node.data, ...partial });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 overflow-y-auto p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${nodeIconToneClass(type)}`}
          >
            <Icon className="size-4" strokeWidth={2.1} />
          </span>
          <div>
            <p className="text-muted-foreground text-[10px] font-medium tracking-[0.12em] uppercase">
              {nodeTypeLabel(type)}
            </p>
            <p className="text-foreground mt-0.5 text-sm font-semibold tracking-tight">
              Node settings
            </p>
          </div>
        </div>
        {type !== 'start' && type !== 'end' ? (
          <button
            type="button"
            className="text-destructive/90 hover:text-destructive inline-flex items-center gap-1 text-xs transition-colors"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        ) : null}
      </div>

      <Field label="Label">
        <Input
          value={node.data.label}
          onChange={(e) => patch({ label: e.target.value })}
          className="bg-background/40 rounded-xl"
        />
      </Field>

      {match(type)
        .with('command', () => (
          <>
            <Field label="Command">
              <Textarea
                value={String(node.data.command ?? '')}
                onChange={(e) => patch({ command: e.target.value })}
                rows={3}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Platform">
              <select
                className="border-input bg-background/40 h-8 w-full rounded-xl border px-2 text-sm"
                value={String(node.data.platform ?? 'all')}
                onChange={(e) => patch({ platform: e.target.value })}
              >
                <option value="all">All</option>
                <option value="mac">macOS</option>
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
              </select>
            </Field>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('install', () => (
          <>
            <Field label="Package manager">
              <select
                className="border-input bg-background/40 h-8 w-full rounded-xl border px-2 text-sm"
                value={String(node.data.packageManager ?? 'brew')}
                onChange={(e) => patch({ packageManager: e.target.value })}
              >
                {['npm', 'bun', 'brew', 'apt', 'cask', 'vscode-extension', 'custom'].map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Packages (comma-separated)">
              <Input
                value={Array.isArray(node.data.packages) ? node.data.packages.join(', ') : ''}
                onChange={(e) =>
                  patch({
                    packages: e.target.value
                      .split(',')
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
                className="bg-background/40 rounded-xl"
              />
            </Field>
            {node.data.packageManager === 'custom' ? (
              <Field label="Custom command">
                <Textarea
                  value={String(node.data.customCommand ?? '')}
                  onChange={(e) => patch({ customCommand: e.target.value })}
                  className="bg-background/40 rounded-xl"
                />
              </Field>
            ) : null}
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('if', () => (
          <Field label="Condition command">
            <Input
              value={String(node.data.condition ?? '')}
              onChange={(e) => patch({ condition: e.target.value })}
              placeholder="command -v node"
              className="bg-background/40 rounded-xl"
            />
          </Field>
        ))
        .with('verify', () => (
          <>
            <Field label="Command">
              <Input
                value={String(node.data.command ?? '')}
                onChange={(e) => patch({ command: e.target.value })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Expected exit code">
              <Input
                type="number"
                value={Number(node.data.expectedExitCode ?? 0)}
                onChange={(e) => patch({ expectedExitCode: Number(e.target.value) })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Failure message">
              <Input
                value={String(node.data.failureMessage ?? '')}
                onChange={(e) => patch({ failureMessage: e.target.value || undefined })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
          </>
        ))
        .with('gitClone', () => (
          <>
            <Field label="Repo URL">
              <Input
                value={String(node.data.repoUrl ?? '')}
                onChange={(e) => patch({ repoUrl: e.target.value })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Target directory">
              <Input
                value={String(node.data.targetDir ?? '')}
                onChange={(e) => patch({ targetDir: e.target.value || undefined })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('sshKey', () => (
          <>
            <Field label="Email">
              <Input
                value={String(node.data.email ?? '')}
                onChange={(e) => patch({ email: e.target.value })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Key type">
              <select
                className="border-input bg-background/40 h-8 w-full rounded-xl border px-2 text-sm"
                value={String(node.data.keyType ?? 'ed25519')}
                onChange={(e) => patch({ keyType: e.target.value })}
              >
                <option value="ed25519">ed25519</option>
                <option value="rsa">rsa</option>
              </select>
            </Field>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('wait', () => (
          <Field label="Seconds">
            <Input
              type="number"
              value={Number(node.data.seconds ?? 0)}
              onChange={(e) => patch({ seconds: Number(e.target.value) })}
              className="bg-background/40 rounded-xl"
            />
          </Field>
        ))
        .with('env', () => (
          <>
            <Field label="Key">
              <Input
                value={String(node.data.key ?? '')}
                onChange={(e) => patch({ key: e.target.value })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Default value">
              <Input
                value={String(node.data.defaultValue ?? '')}
                onChange={(e) => patch({ defaultValue: e.target.value || undefined })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
          </>
        ))
        .with('prompt', () => (
          <>
            <Field label="Question">
              <Input
                value={String(node.data.question ?? '')}
                onChange={(e) => patch({ question: e.target.value })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
            <Field label="Variable name">
              <Input
                value={String(node.data.variableName ?? '')}
                onChange={(e) => patch({ variableName: e.target.value })}
                className="bg-background/40 rounded-xl"
              />
            </Field>
          </>
        ))
        .with('start', 'end', () => null)
        .exhaustive()}
    </motion.div>
  );
}
