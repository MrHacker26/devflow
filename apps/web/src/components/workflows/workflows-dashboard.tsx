'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  FolderKanban,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  Workflow,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';

import { AppNav } from '@/components/app-nav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { easeOut, fadeUp, stagger } from '@/lib/motion';
import { useTRPC } from '@/trpc/client';

function formatUpdatedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function WorkflowsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const user = session.data?.user;
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const listQuery = useQuery(
    trpc.workflow.list.queryOptions({
      search: deferredSearch || undefined,
    }),
  );

  const deleteMutation = useMutation(
    trpc.workflow.delete.mutationOptions({
      onSuccess: async () => {
        setDeleteTarget(null);
        await queryClient.invalidateQueries(trpc.workflow.list.queryFilter());
      },
    }),
  );

  const workflows = listQuery.data ?? [];
  const isEmpty = !listQuery.isLoading && !listQuery.isError && workflows.length === 0;
  const totalLabel =
    listQuery.isLoading
      ? 'Loading…'
      : workflows.length === 1
        ? '1 workflow'
        : `${workflows.length} workflows`;

  return (
    <div className="blueprint-atmosphere relative flex min-h-0 flex-1 flex-col">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />
      <AppNav />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
        <motion.div
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-primary/10 text-primary inline-flex size-8 items-center justify-center rounded-lg">
                <FolderKanban className="size-4" />
              </span>
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
                Library
              </p>
            </div>
            <h1 className="font-heading text-foreground text-3xl font-semibold tracking-tight">
              Workflows
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              Open a flowchart to edit, or start a new onboarding path.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Button asChild className="rounded-xl shadow-[0_0_24px_-8px_color-mix(in_srgb,var(--primary)_45%,transparent)]">
              <Link href="/builder">
                <Plus data-icon="inline-start" />
                New workflow
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35, ease: easeOut }}
          className="flex flex-col gap-3"
        >
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description…"
              aria-label="Search workflows"
              className="bg-surface/80 border-border/60 h-10 rounded-xl pl-9 backdrop-blur-sm"
            />
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">{totalLabel}</p>
        </motion.div>

        {listQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
            <LoaderCircle className="size-4 animate-spin" />
            Loading workflows…
          </div>
        ) : null}

        {listQuery.isError ? (
          <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm">
            {listQuery.error.message}
          </div>
        ) : null}

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="border-border/70 bg-surface/50 flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center backdrop-blur-sm"
          >
            <span className="bg-primary/10 text-primary mb-4 inline-flex size-12 items-center justify-center rounded-2xl">
              <Workflow className="size-6" strokeWidth={1.75} />
            </span>
            {deferredSearch ? (
              <>
                <p className="text-foreground font-heading text-lg font-semibold tracking-tight">
                  No workflows found
                </p>
                <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
                  No workflow matches “{deferredSearch}”. Try another name or clear the search.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-5 rounded-xl"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <p className="text-foreground font-heading text-lg font-semibold tracking-tight">
                  Create your first workflow
                </p>
                <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-relaxed">
                  Define an onboarding path once, then run it from the CLI everywhere.
                </p>
                <Button asChild className="mt-5 rounded-xl">
                  <Link href="/builder">
                    Open builder
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </Button>
              </>
            )}
          </motion.div>
        ) : null}

        {workflows.length > 0 ? (
          <motion.ul
            className="flex flex-col gap-2"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {workflows.map((workflow) => (
              <motion.li key={workflow.id} variants={fadeUp}>
                <div className="border-border/60 bg-surface/60 hover:border-primary/25 hover:bg-surface-elevated/70 group flex items-center gap-3 rounded-xl border px-3.5 py-3.5 backdrop-blur-sm transition-all duration-150 hover:shadow-[0_12px_32px_-20px_rgb(0_0_0_/_70%)]">
                  <Link
                    href={`/builder?id=${workflow.id}`}
                    className="flex min-w-0 flex-1 items-start gap-3"
                  >
                    <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Workflow className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground group-hover:text-primary flex items-center gap-2 text-sm font-medium tracking-tight transition-colors">
                        <span className="truncate">{workflow.name}</span>
                        <ChevronRight className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      {workflow.description ? (
                        <span className="text-muted-foreground mt-0.5 block truncate text-xs leading-relaxed">
                          {workflow.description}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground/80 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                        <span className="font-mono tabular-nums">v{workflow.version}</span>
                        <span aria-hidden>·</span>
                        <span>Updated {formatUpdatedAt(workflow.updatedAt)}</span>
                      </span>
                    </span>
                  </Link>
                  {user ? (
                    <button
                      type="button"
                      aria-label={`Delete ${workflow.name}`}
                      title="Delete workflow"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring rounded-lg p-2 opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
                      disabled={deleteMutation.isPending}
                      onClick={() => setDeleteTarget({ id: workflow.id, name: workflow.name })}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </main>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.name}” will be permanently deleted. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={(e) => {
                e.preventDefault();
                if (!deleteTarget) return;
                deleteMutation.mutate({ id: deleteTarget.id });
              }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
