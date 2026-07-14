'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { PanelLeftClose, PanelRightClose, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WithTooltip } from '@/components/ui/with-tooltip';
import { cn } from '@/lib/utils';

import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { NodeTypeIcon } from './nodes/node-icons';
import type { BuilderEdge, BuilderNode, BuilderNodeData } from './workflow-serialize';
import type { WorkflowValidation } from './workflow-validation';
import { WorkflowSummaryPanel } from './workflow-summary';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-muted-foreground text-[10px] font-medium tracking-[0.14em] uppercase">
        {title}
      </p>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {description ? (
        <p className="text-muted-foreground/80 -mt-0.5 text-[11px] leading-relaxed">
          {description}
        </p>
      ) : null}
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
    <Section title="Advanced">
      <Field label="Skip If Command" description="Skip this node when the command exits 0.">
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
    </Section>
  );
}

const inputClass = 'bg-background/40 rounded-xl';
const selectClass = 'border-input bg-background/40 h-8 w-full rounded-xl border px-2 text-sm';

export function NodeInspector({
  node,
  onChange,
  onDelete,
  nodes,
  edges,
  version,
  lastSavedAt,
  validation,
  workflowName,
  width,
  onWidthChange,
  collapsed,
  onToggleCollapsed,
  onFocusNode,
}: {
  node: BuilderNode | null;
  onChange: (nodeId: string, data: BuilderNodeData) => void;
  onDelete: (nodeId: string) => void;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  version: number;
  lastSavedAt: Date | string | null;
  validation: WorkflowValidation;
  workflowName: string;
  width: number;
  onWidthChange: (width: number) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onFocusNode: (nodeId: string) => void;
}) {
  const draggingRef = useRef(false);
  const nodeId = node?.id ?? null;
  const [tab, setTab] = useState<'summary' | 'inspector'>(nodeId ? 'inspector' : 'summary');
  const [tabNodeId, setTabNodeId] = useState(nodeId);

  if (nodeId !== tabNodeId) {
    setTabNodeId(nodeId);
    setTab(nodeId ? 'inspector' : 'summary');
  }

  useEffect(() => {
    function onMove(event: MouseEvent) {
      if (!draggingRef.current) return;
      const next = Math.min(500, Math.max(320, window.innerWidth - event.clientX));
      onWidthChange(next);
    }
    function onUp() {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onWidthChange]);

  if (collapsed) {
    return (
      <aside className="blueprint-panel flex w-10 shrink-0 flex-col items-center border-l py-3">
        <WithTooltip label="Expand inspector" side="left">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-lg"
            aria-label="Expand inspector"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose className="size-4 rotate-180" />
          </Button>
        </WithTooltip>
      </aside>
    );
  }

  return (
    <aside
      className="blueprint-panel relative flex shrink-0 flex-col overflow-hidden border-l transition-[width] duration-200"
      style={{ width }}
      aria-label="Inspector panel"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize inspector"
        title="Drag to resize"
        className="hover:bg-primary/25 absolute top-0 bottom-0 left-0 z-20 w-1.5 cursor-col-resize bg-transparent transition-colors"
        onMouseDown={(event) => {
          event.preventDefault();
          draggingRef.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      />
      <div className="border-border flex items-center gap-1 border-b px-2 pt-2 pr-2">
        <button
          type="button"
          className={cn(
            'rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors',
            tab === 'summary'
              ? 'text-primary border-primary border-b-2'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setTab('summary')}
        >
          Summary
        </button>
        <button
          type="button"
          className={cn(
            'rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors',
            tab === 'inspector'
              ? 'text-primary border-primary border-b-2'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => setTab('inspector')}
          disabled={!node}
          title={node ? 'Node inspector' : 'Select a node to inspect'}
        >
          Inspector
        </button>
        <div className="flex-1" />
        <WithTooltip label="Collapse inspector" side="left">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="mb-1 rounded-lg"
            aria-label="Collapse inspector"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose className="size-3.5" />
          </Button>
        </WithTooltip>
      </div>
      <AnimatePresence mode="wait">
        {tab === 'summary' || !node ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <WorkflowSummaryPanel
              nodes={nodes}
              edges={edges}
              version={version}
              lastSavedAt={lastSavedAt}
              validation={validation}
              workflowName={workflowName}
              onFocusNode={onFocusNode}
            />
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
  const patch = (partial: Partial<BuilderNodeData>) => {
    onChange(node.id, { ...node.data, ...partial });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${nodeIconToneClass(type)}`}
          >
            <NodeTypeIcon type={type} className="size-4" strokeWidth={2.1} />
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
            className="text-destructive/90 hover:text-destructive focus-visible:ring-ring inline-flex items-center gap-1 rounded-md text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => onDelete(node.id)}
            title="Delete node (Delete)"
            aria-label="Delete node"
          >
            <Trash2 className="size-3.5" />
            Delete
            <span className="text-muted-foreground/60 ml-0.5 font-mono text-[10px]">Del</span>
          </button>
        ) : null}
      </div>

      <Section title="General">
        <Field label="Name" description="Shown on the canvas node.">
          <Input
            value={node.data.label}
            onChange={(e) => patch({ label: e.target.value })}
            className={inputClass}
          />
        </Field>
      </Section>

      {match(type)
        .with('command', () => (
          <>
            <Section title="Execution">
              <Field label="Command" description="Shell command to run.">
                <Textarea
                  value={String(node.data.command ?? '')}
                  onChange={(e) => patch({ command: e.target.value })}
                  rows={3}
                  className={inputClass}
                />
              </Field>
              <Field label="Platform">
                <select
                  className={selectClass}
                  value={String(node.data.platform ?? 'all')}
                  onChange={(e) => patch({ platform: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="mac">macOS</option>
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                </select>
              </Field>
            </Section>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('install', () => (
          <>
            <Section title="Execution">
              <Field label="Package Manager">
                <select
                  className={selectClass}
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
              <Field label="Packages" description="Comma-separated package names.">
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
                  className={inputClass}
                />
              </Field>
              {node.data.packageManager === 'custom' ? (
                <Field label="Custom command">
                  <Textarea
                    value={String(node.data.customCommand ?? '')}
                    onChange={(e) => patch({ customCommand: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              ) : null}
            </Section>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('if', () => (
          <Section title="Execution">
            <Field label="Condition" description="Command that decides success vs failure.">
              <Input
                value={String(node.data.condition ?? '')}
                onChange={(e) => patch({ condition: e.target.value })}
                placeholder="command -v node"
                className={inputClass}
              />
            </Field>
          </Section>
        ))
        .with('verify', () => (
          <Section title="Execution">
            <Field label="Command">
              <Input
                value={String(node.data.command ?? '')}
                onChange={(e) => patch({ command: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Expected Exit Code">
              <Input
                type="number"
                value={Number(node.data.expectedExitCode ?? 0)}
                onChange={(e) => patch({ expectedExitCode: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Failure Message" description="Optional message when verification fails.">
              <Input
                value={String(node.data.failureMessage ?? '')}
                onChange={(e) => patch({ failureMessage: e.target.value || undefined })}
                className={inputClass}
              />
            </Field>
          </Section>
        ))
        .with('gitClone', () => (
          <>
            <Section title="Execution">
              <Field label="Repo URL">
                <Input
                  value={String(node.data.repoUrl ?? '')}
                  onChange={(e) => patch({ repoUrl: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Target Directory">
                <Input
                  value={String(node.data.targetDir ?? '')}
                  onChange={(e) => patch({ targetDir: e.target.value || undefined })}
                  className={inputClass}
                />
              </Field>
            </Section>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('sshKey', () => (
          <>
            <Section title="Execution">
              <Field label="Email">
                <Input
                  value={String(node.data.email ?? '')}
                  onChange={(e) => patch({ email: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Key Type">
                <select
                  className={selectClass}
                  value={String(node.data.keyType ?? 'ed25519')}
                  onChange={(e) => patch({ keyType: e.target.value })}
                >
                  <option value="ed25519">ed25519</option>
                  <option value="rsa">rsa</option>
                </select>
              </Field>
            </Section>
            <ExecutableFields data={node.data} onChange={patch} />
          </>
        ))
        .with('wait', () => (
          <Section title="Execution">
            <Field label="Seconds">
              <Input
                type="number"
                value={Number(node.data.seconds ?? 0)}
                onChange={(e) => patch({ seconds: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          </Section>
        ))
        .with('env', () => (
          <Section title="Execution">
            <Field label="Key">
              <Input
                value={String(node.data.key ?? '')}
                onChange={(e) => patch({ key: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Default Value">
              <Input
                value={String(node.data.defaultValue ?? '')}
                onChange={(e) => patch({ defaultValue: e.target.value || undefined })}
                className={inputClass}
              />
            </Field>
          </Section>
        ))
        .with('prompt', () => (
          <Section title="Execution">
            <Field label="Question">
              <Input
                value={String(node.data.question ?? '')}
                onChange={(e) => patch({ question: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Variable Name">
              <Input
                value={String(node.data.variableName ?? '')}
                onChange={(e) => patch({ variableName: e.target.value })}
                className={inputClass}
              />
            </Field>
          </Section>
        ))
        .with('start', 'end', () => (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Flow terminals have no execution settings.
          </p>
        ))
        .exhaustive()}
    </motion.div>
  );
}

export function PaletteCollapseButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const label = collapsed ? 'Expand node palette' : 'Collapse node palette';
  return (
    <WithTooltip label={label} side="right">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        aria-label={label}
        onClick={onToggle}
      >
        <PanelLeftClose className={collapsed ? 'size-4 rotate-180' : 'size-4'} />
      </Button>
    </WithTooltip>
  );
}
