'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { PanelLeftClose, PanelRightClose, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <FieldSet className="gap-4">
      <FieldLegend variant="label" className="text-muted-foreground mb-3 text-xs">
        {title}
      </FieldLegend>
      <FieldGroup className="gap-4">{children}</FieldGroup>
    </FieldSet>
  );
}

function TextField({
  id,
  label,
  description,
  value,
  placeholder,
  mono,
  multiline,
  type,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  value: string | number;
  placeholder?: string;
  mono?: boolean;
  multiline?: boolean;
  type?: 'text' | 'number';
  onChange: (value: string) => void;
}) {
  const className = cn(mono && 'font-mono text-xs');
  return (
    <Field className="gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
      {description ? <FieldDescription className="text-xs">{description}</FieldDescription> : null}
    </Field>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field className="gap-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="z-[1100]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ExecutableFields({
  nodeId,
  data,
  onChange,
}: {
  nodeId: string;
  data: BuilderNodeData;
  onChange: (patch: Partial<BuilderNodeData>) => void;
}) {
  return (
    <Section title="Advanced">
      <TextField
        id={`${nodeId}-skip`}
        label="Skip if"
        description="The step is skipped when this command exits with 0."
        mono
        value={typeof data.skipIfCommand === 'string' ? data.skipIfCommand : ''}
        placeholder="command -v docker"
        onChange={(value) => onChange({ skipIfCommand: value || undefined })}
      />
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor={`${nodeId}-sudo`}>Requires sudo</FieldLabel>
          <FieldDescription className="text-xs">
            Prompt for an admin password before running.
          </FieldDescription>
        </FieldContent>
        <Switch
          id={`${nodeId}-sudo`}
          checked={Boolean(data.requiresSudo)}
          onCheckedChange={(checked) => onChange({ requiresSudo: checked })}
        />
      </Field>
    </Section>
  );
}

const PLATFORM_OPTIONS = [
  { value: 'all', label: 'All platforms' },
  { value: 'mac', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'windows', label: 'Windows' },
];

const PACKAGE_MANAGER_OPTIONS = [
  { value: 'brew', label: 'Homebrew' },
  { value: 'cask', label: 'Homebrew Cask' },
  { value: 'apt', label: 'apt' },
  { value: 'npm', label: 'npm' },
  { value: 'bun', label: 'Bun' },
  { value: 'vscode-extension', label: 'VS Code extension' },
  { value: 'custom', label: 'Custom command' },
];

const KEY_TYPE_OPTIONS = [
  { value: 'ed25519', label: 'Ed25519 (recommended)' },
  { value: 'rsa', label: 'RSA' },
];

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
      <aside className="bg-sidebar flex w-12 shrink-0 flex-col items-center border-l py-2">
        <WithTooltip label="Expand panel" side="left">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Expand panel"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose className="rotate-180" />
          </Button>
        </WithTooltip>
      </aside>
    );
  }

  return (
    <aside
      className="bg-sidebar relative flex shrink-0 flex-col overflow-hidden border-l"
      style={{ width }}
      aria-label="Inspector panel"
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        title="Drag to resize"
        className="hover:bg-primary/40 absolute top-0 bottom-0 left-0 z-20 w-1 cursor-col-resize bg-transparent transition-colors"
        onMouseDown={(event) => {
          event.preventDefault();
          draggingRef.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      />

      <div className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-3">
        <Tabs
          value={node ? tab : 'summary'}
          onValueChange={(value) => setTab(value as 'summary' | 'inspector')}
          className="flex-1"
        >
          <TabsList>
            <TabsTrigger value="summary" className="px-3">
              Summary
            </TabsTrigger>
            <TabsTrigger value="inspector" className="px-3" disabled={!node}>
              Node
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <WithTooltip label="Collapse panel" side="left">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse panel"
            onClick={onToggleCollapsed}
          >
            <PanelRightClose />
          </Button>
        </WithTooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'summary' || !node ? (
          <WorkflowSummaryPanel
            nodes={nodes}
            edges={edges}
            version={version}
            lastSavedAt={lastSavedAt}
            validation={validation}
            workflowName={workflowName}
            onFocusNode={onFocusNode}
          />
        ) : (
          <InspectorForm key={node.id} node={node} onChange={onChange} onDelete={onDelete} />
        )}
      </div>
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
  const id = node.id;
  const patch = (partial: Partial<BuilderNodeData>) => {
    onChange(node.id, { ...node.data, ...partial });
  };
  const str = (key: string) => String(node.data[key] ?? '');

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
            nodeIconToneClass(type),
          )}
        >
          <NodeTypeIcon type={type} className="size-4" strokeWidth={2.1} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-muted-foreground text-xs">{nodeTypeLabel(type)}</span>
          <span className="truncate text-sm font-medium">{node.data.label || 'Untitled'}</span>
        </div>
        {type !== 'start' && type !== 'end' ? (
          <WithTooltip label="Delete node (Del)" side="left">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(node.id)}
              aria-label="Delete node"
            >
              <Trash2 />
            </Button>
          </WithTooltip>
        ) : null}
      </div>

      <Section title="General">
        <TextField
          id={`${id}-label`}
          label="Name"
          description="Shown on the canvas and in run output."
          value={node.data.label}
          onChange={(value) => patch({ label: value })}
        />
      </Section>

      {type !== 'start' && type !== 'end' ? <FieldSeparator /> : null}

      {match(type)
        .with('command', () => (
          <>
            <Section title="Execution">
              <TextField
                id={`${id}-command`}
                label="Command"
                description="Runs in the user’s default shell."
                multiline
                mono
                value={str('command')}
                onChange={(value) => patch({ command: value })}
              />
              <SelectField
                id={`${id}-platform`}
                label="Platform"
                value={String(node.data.platform ?? 'all')}
                options={PLATFORM_OPTIONS}
                onChange={(value) => patch({ platform: value })}
              />
            </Section>
            <FieldSeparator />
            <ExecutableFields nodeId={id} data={node.data} onChange={patch} />
          </>
        ))
        .with('install', () => (
          <>
            <Section title="Execution">
              <SelectField
                id={`${id}-pm`}
                label="Package manager"
                value={String(node.data.packageManager ?? 'brew')}
                options={PACKAGE_MANAGER_OPTIONS}
                onChange={(value) => patch({ packageManager: value })}
              />
              <TextField
                id={`${id}-packages`}
                label="Packages"
                description="Separate multiple packages with commas."
                mono
                value={Array.isArray(node.data.packages) ? node.data.packages.join(', ') : ''}
                onChange={(value) =>
                  patch({
                    packages: value
                      .split(',')
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
              />
              {node.data.packageManager === 'custom' ? (
                <TextField
                  id={`${id}-custom`}
                  label="Custom command"
                  multiline
                  mono
                  value={str('customCommand')}
                  onChange={(value) => patch({ customCommand: value })}
                />
              ) : null}
            </Section>
            <FieldSeparator />
            <ExecutableFields nodeId={id} data={node.data} onChange={patch} />
          </>
        ))
        .with('if', () => (
          <Section title="Execution">
            <TextField
              id={`${id}-condition`}
              label="Condition"
              description="Exit code 0 follows the success branch; anything else follows failure."
              mono
              value={str('condition')}
              placeholder="command -v node"
              onChange={(value) => patch({ condition: value })}
            />
          </Section>
        ))
        .with('verify', () => (
          <Section title="Execution">
            <TextField
              id={`${id}-command`}
              label="Command"
              mono
              value={str('command')}
              placeholder="docker --version"
              onChange={(value) => patch({ command: value })}
            />
            <TextField
              id={`${id}-exit`}
              label="Expected exit code"
              type="number"
              value={Number(node.data.expectedExitCode ?? 0)}
              onChange={(value) => patch({ expectedExitCode: Number(value) })}
            />
            <TextField
              id={`${id}-failure`}
              label="Failure message"
              description="Shown to the user when verification fails."
              value={str('failureMessage')}
              onChange={(value) => patch({ failureMessage: value || undefined })}
            />
          </Section>
        ))
        .with('gitClone', () => (
          <>
            <Section title="Execution">
              <TextField
                id={`${id}-repo`}
                label="Repository URL"
                mono
                value={str('repoUrl')}
                placeholder="https://github.com/org/repo"
                onChange={(value) => patch({ repoUrl: value })}
              />
              <TextField
                id={`${id}-dir`}
                label="Target directory"
                mono
                value={str('targetDir')}
                placeholder="~/src/repo"
                onChange={(value) => patch({ targetDir: value || undefined })}
              />
            </Section>
            <FieldSeparator />
            <ExecutableFields nodeId={id} data={node.data} onChange={patch} />
          </>
        ))
        .with('sshKey', () => (
          <>
            <Section title="Execution">
              <TextField
                id={`${id}-email`}
                label="Email"
                value={str('email')}
                placeholder="you@company.com"
                onChange={(value) => patch({ email: value })}
              />
              <SelectField
                id={`${id}-keytype`}
                label="Key type"
                value={String(node.data.keyType ?? 'ed25519')}
                options={KEY_TYPE_OPTIONS}
                onChange={(value) => patch({ keyType: value })}
              />
            </Section>
            <FieldSeparator />
            <ExecutableFields nodeId={id} data={node.data} onChange={patch} />
          </>
        ))
        .with('wait', () => (
          <Section title="Execution">
            <TextField
              id={`${id}-seconds`}
              label="Duration (seconds)"
              type="number"
              value={Number(node.data.seconds ?? 0)}
              onChange={(value) => patch({ seconds: Number(value) })}
            />
          </Section>
        ))
        .with('env', () => (
          <Section title="Execution">
            <TextField
              id={`${id}-key`}
              label="Variable name"
              mono
              value={str('key')}
              placeholder="API_URL"
              onChange={(value) => patch({ key: value })}
            />
            <TextField
              id={`${id}-default`}
              label="Default value"
              mono
              value={str('defaultValue')}
              onChange={(value) => patch({ defaultValue: value || undefined })}
            />
          </Section>
        ))
        .with('prompt', () => (
          <Section title="Execution">
            <TextField
              id={`${id}-question`}
              label="Question"
              value={str('question')}
              placeholder="What is your GitHub email?"
              onChange={(value) => patch({ question: value })}
            />
            <TextField
              id={`${id}-var`}
              label="Variable name"
              description="Reference the answer in later steps as {{name}}."
              mono
              value={str('variableName')}
              placeholder="gitEmail"
              onChange={(value) => patch({ variableName: value })}
            />
          </Section>
        ))
        .with('start', 'end', () => (
          <p className="text-muted-foreground text-sm">
            {type === 'start'
              ? 'Every run begins here. Connect it to the first step.'
              : 'The run finishes successfully when it reaches this node.'}
          </p>
        ))
        .exhaustive()}
    </div>
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
      <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onToggle}>
        <PanelLeftClose className={collapsed ? 'rotate-180' : undefined} />
      </Button>
    </WithTooltip>
  );
}
