'use client';

import {
  ChevronLeft,
  Check,
  LoaderCircle,
  LogIn,
  LogOut,
  MoreHorizontal,
  Play,
  Save,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';

import {
  BuilderSettingsPopover,
  type BuilderPreferences,
} from './builder-settings';
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
  onRename,
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
  onRename: () => void;
  onDeleteWorkflow: () => void;
  onOpenShortcuts: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const returnTo =
    typeof window !== 'undefined' ? `${pathname}${window.location.search}` : pathname;
  const isSaving = saveStatus === 'saving';
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?';

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    window.addEventListener('mousedown', onPointer);
    return () => window.removeEventListener('mousedown', onPointer);
  }, [menuOpen]);

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <div className="shrink-0">
      <motion.header
        className="blueprint-panel flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/workflows"
            className="text-primary font-heading inline-flex items-center gap-2 text-base font-bold tracking-tight hover:opacity-90"
          >
            <span className="bg-primary/15 inline-flex size-7 items-center justify-center rounded-lg">
              <Workflow className="size-3.5" />
            </span>
            DevFlow
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground rounded-lg">
            <Link href="/workflows">
              <ChevronLeft data-icon="inline-start" className="size-3.5" />
              Back to Workflows
            </Link>
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <Label htmlFor="workflow-name" className="text-muted-foreground text-[11px]">
              Workflow name
            </Label>
            <Input
              id="workflow-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Mac onboarding"
              title={workflowId ? `ID: ${workflowId}` : undefined}
              className="bg-background/40 h-8 rounded-lg"
            />
          </div>
          <div className="flex min-w-[220px] flex-[1.4] flex-col gap-1">
            <Label htmlFor="workflow-description" className="text-muted-foreground text-[11px]">
              Description
            </Label>
            <Input
              id="workflow-description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Optional"
              className="bg-background/40 h-8 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-muted-foreground hidden max-w-[160px] truncate text-xs md:inline">
                {user.email}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => void signOut()}
              >
                <LogOut data-icon="inline-start" />
                Sign out
              </Button>
              <span
                className="bg-primary/15 text-primary inline-flex size-8 items-center justify-center rounded-full text-[11px] font-semibold"
                title={user.email}
                aria-label={user.email}
              >
                {initials}
              </span>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild className="rounded-lg">
              <Link href={loginHref(returnTo)}>
                <LogIn data-icon="inline-start" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </motion.header>

      <div className="border-border bg-surface/40 flex flex-wrap items-center gap-2 border-b px-3 py-1.5">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ValidationBadge status={validationStatus} />
          <span
            className="text-muted-foreground hidden min-w-[6.5rem] items-center gap-1 text-[11px] sm:inline-flex"
            aria-live="polite"
          >
            {saveStatus === 'saving' ? (
              <>
                <LoaderCircle className="size-3 animate-spin" />
                Saving…
              </>
            ) : saveStatus === 'unsaved' ? (
              'Unsaved Changes'
            ) : saveStatus === 'saved-just-now' ? (
              <>
                <Check className="text-success size-3" />
                Saved just now
              </>
            ) : (
              <>
                <Check className="text-success size-3" />
                Saved
              </>
            )}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={onPreviewExecution}
            title="Preview execution path"
          >
            <Play data-icon="inline-start" className="size-3.5" />
            Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={onSimulate}
            disabled={isSimulating}
            title="Visually simulate execution"
          >
            <Sparkles data-icon="inline-start" className="size-3.5" />
            {isSimulating ? 'Simulating…' : 'Simulate'}
          </Button>

          <BuilderSettingsPopover value={preferences} onChange={onPreferencesChange} />

          <div className="relative" ref={menuRef}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg px-2"
              title="More actions"
              aria-label="More actions"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="size-4" />
            </Button>
            {menuOpen ? (
              <div
                role="menu"
                className="border-border bg-popover absolute top-full right-0 z-40 mt-1 w-56 rounded-xl border p-1.5 shadow-lg"
              >
                <MenuAction
                  label="Export JSON"
                  onClick={() => {
                    onExportJson();
                    setMenuOpen(false);
                  }}
                />
                <MenuAction label="Import JSON" disabled hint="Soon" />
                <MenuAction
                  label="Duplicate Workflow"
                  onClick={() => {
                    onDuplicateWorkflow();
                    setMenuOpen(false);
                  }}
                />
                <MenuAction
                  label="Rename"
                  onClick={() => {
                    onRename();
                    setMenuOpen(false);
                  }}
                />
                <MenuAction
                  label="Delete"
                  danger
                  disabled={!workflowId}
                  onClick={() => {
                    onDeleteWorkflow();
                    setMenuOpen(false);
                  }}
                />
                <div className="border-border my-1 border-t" />
                <MenuAction
                  label="Keyboard shortcuts"
                  hint="?"
                  onClick={() => {
                    onOpenShortcuts();
                    setMenuOpen(false);
                  }}
                />
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !name.trim()}
            title="Save (Ctrl/Cmd+S)"
            className="rounded-lg"
          >
            {isSaving ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {saveError ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-destructive border-border border-b px-4 py-2 text-sm"
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
            className="text-muted-foreground border-border border-b px-4 py-1.5 text-xs"
          >
            You’re exploring freely —{' '}
            <Link href={loginHref(returnTo)} className="text-primary hover:underline">
              sign in
            </Link>{' '}
            to save this workflow.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuAction({
  label,
  hint,
  disabled,
  danger,
  onClick,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={
        disabled
          ? 'text-muted-foreground flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs opacity-50'
          : danger
            ? 'text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs'
            : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs'
      }
    >
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-muted-foreground/50 font-mono text-[10px]">{hint}</span> : null}
    </button>
  );
}
