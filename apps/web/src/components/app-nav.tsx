'use client';

import { FolderKanban, Plus, Workflow } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserMenu } from '@/components/user-menu';
import { cn } from '@/lib/utils';

export function AppNav() {
  const pathname = usePathname();

  const links = [
    { href: '/workflows', label: 'Workflows', icon: FolderKanban },
    { href: '/builder', label: 'New', icon: Plus },
  ] as const;

  return (
    <header className="blueprint-panel sticky top-0 z-40 border-b px-4 py-2">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Link
          href="/"
          className="text-primary font-heading inline-flex items-center gap-2 text-sm font-bold tracking-tight hover:opacity-90"
        >
          <span className="bg-primary/15 inline-flex size-6 items-center justify-center rounded-md">
            <Workflow className="size-3" />
          </span>
          DevFlow
        </Link>

        <nav className="flex items-center gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors',
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

        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
