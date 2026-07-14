'use client';

import { LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WithTooltip } from '@/components/ui/with-tooltip';
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
    return (
      <span
        className={cn('bg-muted/60 size-7 animate-pulse rounded-full', className)}
        aria-hidden
      />
    );
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild className={cn('rounded-lg', className)}>
        <Link href={loginHref(returnTo)}>
          <LogIn data-icon="inline-start" className="size-3.5" />
          Sign in
        </Link>
      </Button>
    );
  }

  const initials = initialsFrom(user);

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <WithTooltip label="Account">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'bg-primary/15 text-primary hover:bg-primary/25 focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors outline-none focus-visible:ring-2',
              className,
            )}
            aria-label="Account menu"
          >
            {initials}
          </button>
        </DropdownMenuTrigger>
      </WithTooltip>
      <DropdownMenuContent align="end" className="z-[1100] min-w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-foreground truncate text-sm font-medium">
            {user.name?.trim() || 'Account'}
          </p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
