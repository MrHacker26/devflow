'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Search, Trash2, Workflow } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { pageContainer } from '@/lib/layout';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/trpc/client';

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function formatUpdatedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return 'just now';
  if (abs < 3600) return relativeTime.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relativeTime.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 7) return relativeTime.format(Math.round(seconds / 86400), 'day');

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

export function WorkflowsDashboard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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
    <div className="flex min-h-full flex-col">
      <AppNav />

      <main className={cn(pageContainer, 'flex flex-1 flex-col gap-6 py-10')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground text-sm">
              Onboarding and setup workflows for your machines.
            </p>
          </div>
          <Button asChild>
            <Link href="/builder">
              <Plus data-icon="inline-start" />
              New workflow
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows…"
              aria-label="Search workflows"
            />
          </InputGroup>
          {!listQuery.isLoading && !listQuery.isError ? (
            <p className="text-muted-foreground shrink-0 text-sm tabular-nums">
              {workflows.length === 1 ? '1 workflow' : `${workflows.length} workflows`}
            </p>
          ) : null}
        </div>

        {listQuery.isError ? (
          <Card className="border-destructive/40 text-destructive px-5 text-sm">
            {listQuery.error.message}
          </Card>
        ) : null}

        {listQuery.isLoading ? (
          <Card className="gap-0 divide-y py-0">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </Card>
        ) : null}

        {isEmpty ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Workflow />
              </EmptyMedia>
              <EmptyTitle>
                {deferredSearch ? 'No matching workflows' : 'No workflows yet'}
              </EmptyTitle>
              <EmptyDescription>
                {deferredSearch
                  ? `Nothing matches “${deferredSearch}”. Try a different name or description.`
                  : 'Create your first onboarding workflow and run it on any machine.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {deferredSearch ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/builder">
                    <Plus data-icon="inline-start" />
                    New workflow
                  </Link>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : null}

        {workflows.length > 0 ? (
          <Card className="gap-0 py-0">
            <ul className="divide-y">
              {workflows.map((workflow) => (
                <li
                  key={workflow.id}
                  className="group hover:bg-accent/50 relative flex items-center gap-4 px-5 py-4 transition-colors"
                >
                  <span className="bg-accent text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg border">
                    <Workflow className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      href={`/builder?id=${workflow.id}`}
                      className="truncate text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                    >
                      {workflow.name}
                    </Link>
                    <p className="text-muted-foreground truncate text-sm">
                      {workflow.description || 'No description'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-muted-foreground hidden font-mono sm:inline-flex"
                  >
                    v{workflow.version}
                  </Badge>
                  <span className="text-muted-foreground hidden w-28 shrink-0 text-right text-sm md:block">
                    {formatUpdatedAt(workflow.updatedAt)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="relative z-10"
                        aria-label={`Actions for ${workflow.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/builder?id=${workflow.id}`}>
                          <Pencil />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteTarget({ id: workflow.id, name: workflow.name })}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </Card>
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
