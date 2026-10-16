'use client';

import { FolderKanban, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';
import { cn } from '@/lib/utils';

function initialsFrom(user: { name?: string | null; email?: string | null }) {
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return user.email?.slice(0, 2).toUpperCase() ?? '?';
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function SignedInMenu({
  user,
  className,
}: {
  user: { name?: string | null; email?: string | null };
  className?: string;
}) {
  const router = useRouter();
  const organizations = authClient.useListOrganizations();
  const active = authClient.useActiveOrganization();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);

  const list = organizations.data ?? [];
  const activeId = active.data?.id;

  async function signOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  async function selectOrganization(organizationId: string) {
    if (!organizationId || organizationId === activeId) return;
    setSwitchingId(organizationId);
    setMenuError(null);
    const result = await authClient.organization.setActive({ organizationId });
    setSwitchingId(null);
    if (result.error) {
      setMenuError(result.error.message ?? 'Could not switch organization.');
    }
  }

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function createOrganization(event: React.FormEvent) {
    event.preventDefault();
    const nextName = name.trim();
    const nextSlug = slug.trim();
    if (!nextName || !nextSlug) {
      setFormError('Enter a name. The slug needs letters or numbers.');
      return;
    }

    setCreating(true);
    setFormError(null);
    const result = await authClient.organization.create({
      name: nextName,
      slug: nextSlug,
    });
    setCreating(false);

    if (result.error) {
      setFormError(result.error.message ?? 'Could not create organization.');
      return;
    }

    setOpen(false);
    setName('');
    setSlug('');
    setSlugTouched(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3',
              className,
            )}
            aria-label="Account menu"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-accent text-foreground text-xs font-medium">
                {initialsFrom(user)}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[1100] w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
            <span className="text-foreground truncate text-sm font-medium">
              {user.name?.trim() || 'Account'}
            </span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
            {active.data?.name ? (
              <span className="text-muted-foreground truncate text-xs">{active.data.name}</span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Organization</DropdownMenuLabel>
          {organizations.isPending ? (
            <DropdownMenuItem disabled>Loading organizations</DropdownMenuItem>
          ) : list.length === 0 ? (
            <DropdownMenuItem disabled>No organization yet</DropdownMenuItem>
          ) : (
            <DropdownMenuRadioGroup
              value={activeId ?? ''}
              onValueChange={(organizationId) => void selectOrganization(organizationId)}
            >
              {list.map((organization) => (
                <DropdownMenuRadioItem
                  key={organization.id}
                  value={organization.id}
                  disabled={switchingId !== null}
                >
                  <span className="truncate">{organization.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
          {menuError ? <p className="text-destructive px-2 py-1.5 text-xs">{menuError}</p> : null}
          <DropdownMenuItem
            onSelect={() => {
              setFormError(null);
              setOpen(true);
            }}
          >
            <Plus />
            Create organization
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/workflows">
              <FolderKanban />
              Workflows
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setName('');
            setSlug('');
            setSlugTouched(false);
            setFormError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create organization</AlertDialogTitle>
            <AlertDialogDescription>
              You become the owner. Switch organizations from the account menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form id="create-organization" onSubmit={(event) => void createOrganization(event)}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="organization-name">Name</FieldLabel>
                <Input
                  id="organization-name"
                  value={name}
                  autoComplete="organization"
                  onChange={(event) => onNameChange(event.target.value)}
                />
              </Field>
              <Field data-invalid={Boolean(formError) || undefined}>
                <FieldLabel htmlFor="organization-slug">Slug</FieldLabel>
                <Input
                  id="organization-slug"
                  value={slug}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(slugify(event.target.value));
                  }}
                />
                {formError ? <FieldError>{formError}</FieldError> : null}
              </Field>
            </FieldGroup>
          </form>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              form="create-organization"
              disabled={!name.trim()}
              loading={creating}
            >
              Create
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function UserMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const user = session.data?.user;
  const returnTo =
    typeof window !== 'undefined' ? `${pathname}${window.location.search}` : pathname;

  if (session.isPending) {
    return <Skeleton className={cn('size-8 rounded-full', className)} />;
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild className={className}>
        <Link href={loginHref(returnTo)}>Sign in</Link>
      </Button>
    );
  }

  return <SignedInMenu user={user} className={className} />;
}
