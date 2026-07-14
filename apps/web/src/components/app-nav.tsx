'use client';

import { FolderKanban, LogIn, LogOut, Plus, Workflow } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  const links = [
    { href: '/workflows', label: 'Workflows', icon: FolderKanban },
    { href: '/builder', label: 'Builder', icon: Plus },
  ] as const;

  return (
    <header className="blueprint-panel sticky top-0 z-40 border-b px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-4">
        <Link
          href="/"
          className="text-primary font-heading inline-flex items-center gap-2 text-base font-bold tracking-tight hover:opacity-90"
        >
          <span className="bg-primary/15 inline-flex size-7 items-center justify-center rounded-lg">
            <Workflow className="size-3.5" />
          </span>
          DevFlow
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="text-muted-foreground hidden max-w-[180px] truncate text-xs sm:inline">
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
              <Link href={loginHref(pathname)}>
                <LogIn data-icon="inline-start" />
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
