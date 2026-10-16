'use client';

import {
  Check,
  ChevronLeft,
  CircleDot,
  Copy,
  Download,
  Keyboard,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Play,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';

import { LogoMark } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { WithTooltip } from '@/components/ui/with-tooltip';
import { UserMenu } from '@/components/user-menu';
import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { BuilderSettingsPopover, type BuilderPreferences } from './builder-settings';
import { ShareWorkflowButton } from './share-workflow-button';
import { ValidationBadge } from './workflow-summary';
import type { ValidationStatus } from './workflow-validation';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'saved-just-now';

export function BuilderToolbar({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  saveStatus,
  saveError,
  workflowId,
  shareToken,
  onShareTokenChange,
  validationStatus,
  onPreviewExecution,
  onSimulate,
  isSimulating,
  preferences,
  onPreferencesChange,
  onExportJson,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onOpenShortcuts,
}: {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  saveStatus: SaveStatus;
  saveError: string | null;
  workflowId: string | null;
  shareToken: string | null;
  onShareTokenChange: (token: string | null) => void;
  validationStatus: ValidationStatus;
  onPreviewExecution: () => void;
  onSimulate: () => void;
  isSimulating: boolean;
  preferences: BuilderPreferences;
  onPreferencesChange: (next: BuilderPreferences) => void;
  onExportJson: () => void;
  onDuplicateWorkflow: () => void;
  onDeleteWorkflow: () => void;
  onOpenShortcuts: () => void;
}) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const user = session.data?.user;
  const nameRef = useRef<HTMLInputElement>(null);
  const [nameFlash, setNameFlash] = useState(false);
  const returnTo =
    typeof window !== 'undefined' ? `${pathname}${window.location.search}` : pathname;
  const isSaving = saveStatus === 'saving';

  function startRename() {
    window.setTimeout(() => {
      const input = nameRef.current;
      if (!input) return;
      input.focus();
      input.select();
      setNameFlash(true);
      window.setTimeout(() => setNameFlash(false), 1400);
    }, 50);
  }

  return (
    <div className="relative z-50 shrink-0">
      <header className="bg-background flex h-14 items-center gap-3 border-b px-3">
        <WithTooltip label="Back to workflows">
          <Link
            href="/workflows"
            className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/50 inline-flex h-8 items-center gap-1 rounded-lg pr-1.5 pl-1 transition-colors outline-none focus-visible:ring-3"
            aria-label="Back to workflows"
          >
            <ChevronLeft className="size-4" />
            <LogoMark />
          </Link>
        </WithTooltip>

        <Separator orientation="vertical" className="h-6!" />

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Input
            ref={nameRef}
            id="workflow-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Untitled workflow"
            title={workflowId ? `ID: ${workflowId}` : undefined}
            aria-label="Workflow name"
            className={cn(
              'hover:bg-accent/60 h-6 max-w-md min-w-0 border-transparent bg-transparent px-1.5 text-sm font-medium shadow-none',
              nameFlash && 'ring-primary/40 ring-3',
            )}
          />
          <Input
            id="workflow-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Add a description"
            aria-label="Workflow description"
            className="text-muted-foreground hover:bg-accent/60 h-5 max-w-md min-w-0 border-transparent bg-transparent px-1.5 text-xs shadow-none"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-3 pr-1.5 md:flex">
            <ValidationBadge status={validationStatus} />
            <SaveIndicator status={saveStatus} />
          </div>

          <Separator orientation="vertical" className="mx-1 hidden h-6! md:block" />

          <WithTooltip label="Preview execution path">
            <Button
              variant="ghost"
              size="icon-sm"
              icon={<Play />}
              onClick={onPreviewExecution}
              aria-label="Preview"
            />
          </WithTooltip>
          <WithTooltip label={isSimulating ? 'Simulating…' : 'Simulate run'}>
            <Button
              variant="ghost"
              size="icon-sm"
              icon={<Sparkles />}
              onClick={onSimulate}
              loading={isSimulating}
              aria-label={isSimulating ? 'Simulating' : 'Simulate'}
            />
          </WithTooltip>

          <BuilderSettingsPopover value={preferences} onChange={onPreferencesChange} />

          <DropdownMenu>
            <WithTooltip label="More actions">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  icon={<MoreHorizontal />}
                  aria-label="More actions"
                />
              </DropdownMenuTrigger>
            </WithTooltip>
            <DropdownMenuContent align="end" className="z-[1100] w-52">
              <DropdownMenuItem onSelect={startRename}>
                <Pencil />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicateWorkflow}>
                <Copy />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportJson}>
                <Download />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Upload />
                Import JSON
                <DropdownMenuShortcut>Soon</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onOpenShortcuts}>
                <Keyboard />
                Keyboard shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={!workflowId}
                onSelect={onDeleteWorkflow}
              >
                <Trash2 />
                Delete workflow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ShareWorkflowButton
            workflowId={workflowId}
            shareToken={shareToken}
            onShareTokenChange={onShareTokenChange}
          />

          <WithTooltip label={isSaving ? 'Saving…' : 'Save (⌘S)'}>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!name.trim()}
              loading={isSaving}
              className="ml-1"
            >
              Save
            </Button>
          </WithTooltip>

          <Separator orientation="vertical" className="mx-1 h-6!" />

          <UserMenu />
        </div>
      </header>

      {saveError ? (
        <p className="bg-destructive/10 text-destructive border-b px-4 py-2 text-xs">
          {saveError}{' '}
          {!user ? (
            <Link href={loginHref(returnTo)} className="font-medium underline underline-offset-2">
              Sign in to continue
            </Link>
          ) : null}
        </p>
      ) : null}
      {!user && !session.isPending && !saveError ? (
        <p className="text-muted-foreground bg-card border-b px-4 py-2 text-xs">
          You’re editing as a guest.{' '}
          <Link
            href={loginHref(returnTo)}
            className="text-foreground font-medium underline underline-offset-2"
          >
            Sign in
          </Link>{' '}
          to save this workflow.
        </p>
      ) : null}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <span
      className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
      aria-live="polite"
    >
      {status === 'saving' ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin" />
          Saving
        </>
      ) : status === 'unsaved' ? (
        <>
          <CircleDot className="text-warning size-3.5" />
          Unsaved changes
        </>
      ) : (
        <>
          <Check className="text-success size-3.5" />
          Saved
        </>
      )}
    </span>
  );
}
