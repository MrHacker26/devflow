'use client';

import { FolderKanban, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export function UserMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
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

  async function signOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
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
        </DropdownMenuLabel>
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
  );
}
