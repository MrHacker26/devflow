'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Plus, Search, Trash2 } from 'lucide-react';
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

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <AppNav />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Workflows</h1>
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/builder">
              <Plus data-icon="inline-start" />
              New
            </Link>
          </Button>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-surface h-9 rounded-xl border-transparent pl-9"
          />
        </div>

        {listQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <LoaderCircle className="size-4 animate-spin" />
            Loading…
          </div>
        ) : null}

        {listQuery.isError ? (
          <p className="text-destructive text-sm">{listQuery.error.message}</p>
        ) : null}

        {isEmpty ? (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
            {deferredSearch ? (
              <p>No matches.</p>
            ) : (
              <p>
                No workflows yet.{' '}
                <Link href="/builder" className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            )}
          </div>
        ) : null}

        {workflows.length > 0 ? (
          <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
            {workflows.map((workflow) => (
              <li
                key={workflow.id}
                className="hover:bg-surface-elevated/50 group flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <Link href={`/builder?id=${workflow.id}`} className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{workflow.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {workflow.description ? `${workflow.description} · ` : null}
                    {formatUpdatedAt(workflow.updatedAt)}
                  </p>
                </Link>
                {user ? (
                  <button
                    type="button"
                    aria-label={`Delete ${workflow.name}`}
                    className="text-muted-foreground hover:text-destructive rounded-lg p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    disabled={deleteMutation.isPending}
                    onClick={() => setDeleteTarget({ id: workflow.id, name: workflow.name })}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
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
