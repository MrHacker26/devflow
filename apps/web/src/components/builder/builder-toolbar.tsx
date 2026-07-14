'use client';

import { Check, LoaderCircle, MoreHorizontal, Play, Save, Sparkles, Workflow } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';

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
import { UserMenu } from '@/components/user-menu';
import { WithTooltip } from '@/components/ui/with-tooltip';
import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';
import { cn } from '@/lib/utils';

import { BuilderSettingsPopover, type BuilderPreferences } from './builder-settings';
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
      <motion.header
        className="blueprint-panel flex items-center gap-3 border-b px-3 py-1.5"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link
          href="/workflows"
          className="text-primary font-heading inline-flex shrink-0 items-center gap-1.5 text-sm font-bold tracking-tight hover:opacity-90"
          title="Back to workflows"
        >
          <span className="bg-primary/15 inline-flex size-6 items-center justify-center rounded-md">
            <Workflow className="size-3" />
          </span>
          <span className="hidden sm:inline">DevFlow</span>
        </Link>

        <div className="bg-border hidden h-6 w-px shrink-0 sm:block" />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
          <Input
            ref={nameRef}
            id="workflow-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Untitled workflow"
            title={workflowId ? `ID: ${workflowId}` : undefined}
            aria-label="Workflow name"
            className={cn(
              'h-6 min-w-0 border-0 bg-transparent px-1.5 text-sm font-semibold tracking-tight shadow-none focus-visible:ring-0',
              nameFlash && 'bg-primary/10 ring-primary/40 rounded-md ring-2',
            )}
          />
          <Input
            id="workflow-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Add a short description…"
            aria-label="Workflow description"
            className="text-muted-foreground h-5 min-w-0 border-0 bg-transparent px-1.5 text-xs shadow-none placeholder:text-xs focus-visible:ring-0"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <ValidationBadge status={validationStatus} />
          <span
            className="text-muted-foreground hidden items-center gap-1 text-[11px] lg:inline-flex"
            aria-live="polite"
          >
            {saveStatus === 'saving' ? (
              <>
                <LoaderCircle className="size-3 animate-spin" />
                Saving
              </>
            ) : saveStatus === 'unsaved' ? (
              'Unsaved'
            ) : (
              <>
                <Check className="text-success size-3" />
                Saved
              </>
            )}
          </span>

          <WithTooltip label="Preview execution path">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              onClick={onPreviewExecution}
              aria-label="Preview"
            >
              <Play className="size-3.5" />
            </Button>
          </WithTooltip>
          <WithTooltip label={isSimulating ? 'Simulating…' : 'Simulate execution'}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              onClick={onSimulate}
              disabled={isSimulating}
              aria-label={isSimulating ? 'Simulating' : 'Simulate'}
            >
              <Sparkles className="size-3.5" />
            </Button>
          </WithTooltip>

          <BuilderSettingsPopover value={preferences} onChange={onPreferencesChange} />

          <DropdownMenu>
            <WithTooltip label="More actions">
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </WithTooltip>
            <DropdownMenuContent align="end" className="z-[1100] min-w-48">
              <DropdownMenuItem onClick={onExportJson}>Export JSON</DropdownMenuItem>
              <DropdownMenuItem disabled>
                Import JSON
                <DropdownMenuShortcut>Soon</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicateWorkflow}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onSelect={startRename}>Rename</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={!workflowId}
                onClick={onDeleteWorkflow}
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenShortcuts}>
                Shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <WithTooltip label={isSaving ? 'Saving…' : 'Save (⌘S)'}>
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={isSaving || !name.trim()}
              aria-label="Save"
              className="rounded-lg"
            >
              {isSaving ? (
                <LoaderCircle data-icon="inline-start" className="size-3.5 animate-spin" />
              ) : (
                <Save data-icon="inline-start" className="size-3.5" />
              )}
              Save
            </Button>
          </WithTooltip>

          <UserMenu />
        </div>
      </motion.header>

      <AnimatePresence>
        {saveError ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-destructive border-border border-b px-3 py-1.5 text-xs"
          >
            {saveError}{' '}
            {!user ? (
              <Link href={loginHref(returnTo)} className="underline underline-offset-2">
                Sign in to continue
              </Link>
            ) : null}
          </motion.p>
        ) : null}
        {!user && !saveError ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground border-border border-b px-3 py-1 text-[11px]"
          >
            <Link href={loginHref(returnTo)} className="text-primary hover:underline">
              Sign in
            </Link>{' '}
            to save this workflow.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
