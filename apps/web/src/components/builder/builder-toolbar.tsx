'use client';

import {
  Check,
  FolderKanban,
  LoaderCircle,
  LogIn,
  LogOut,
  Save,
  Workflow,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';

export function BuilderToolbar({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSave,
  isSaving,
  saveError,
  saveSuccess,
  workflowId,
}: {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  workflowId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;
  const returnTo =
    typeof window !== 'undefined'
      ? `${pathname}${window.location.search}`
      : pathname;

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <motion.header
      className="blueprint-panel flex flex-wrap items-end gap-3 border-b px-4 py-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href="/workflows"
        className="text-primary font-heading mb-1 inline-flex items-center gap-2 text-base font-bold tracking-tight hover:opacity-90"
      >
        <span className="bg-primary/15 inline-flex size-7 items-center justify-center rounded-lg">
          <Workflow className="size-3.5" />
        </span>
        DevFlow
      </Link>

      <Button variant="ghost" size="sm" asChild className="mb-1 rounded-xl">
        <Link href="/workflows">
          <FolderKanban data-icon="inline-start" />
          Workflows
        </Link>
      </Button>

      <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        <Label htmlFor="workflow-name" className="text-muted-foreground text-xs">
          Workflow name
        </Label>
        <Input
          id="workflow-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Mac onboarding"
          className="bg-background/40 h-9 rounded-xl"
        />
      </div>
      <div className="flex min-w-[240px] flex-[2] flex-col gap-1.5">
        <Label htmlFor="workflow-description" className="text-muted-foreground text-xs">
          Description
        </Label>
        <Input
          id="workflow-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional"
          className="bg-background/40 h-9 rounded-xl"
        />
      </div>
      <div className="flex items-center gap-2 pb-0.5">
        {workflowId ? (
          <motion.span
            key={workflowId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-muted-foreground/70 rounded-md bg-black/25 px-2 py-1 font-mono text-[11px]"
          >
            {workflowId.slice(0, 8)}
          </motion.span>
        ) : null}
        {user ? (
          <>
            <span className="text-muted-foreground hidden max-w-[120px] truncate text-xs lg:inline">
              {user.email}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => void signOut()}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link href={loginHref(returnTo)}>
              <LogIn data-icon="inline-start" />
              Sign in
            </Link>
          </Button>
        )}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || !name.trim()}
            className="rounded-xl shadow-[0_0_20px_-8px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
          >
            {isSaving ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : saveSuccess ? (
              <Check data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            {isSaving ? 'Saving…' : saveSuccess ? 'Saved' : 'Save'}
          </Button>
        </motion.div>
      </div>
      <AnimatePresence>
        {saveError ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-destructive w-full text-sm"
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
            className="text-muted-foreground w-full text-xs"
          >
            You’re exploring freely —{' '}
            <Link href={loginHref(returnTo)} className="text-primary hover:underline">
              sign in
            </Link>{' '}
            to save this workflow.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
