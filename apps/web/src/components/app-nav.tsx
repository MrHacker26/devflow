'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/logo';
import { UserMenu } from '@/components/user-menu';
import { pageContainer } from '@/lib/layout';
import { cn } from '@/lib/utils';

const links = [{ href: '/workflows', label: 'Workflows' }] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className={cn(pageContainer, 'flex h-14 items-center gap-6')}>
        <Logo href="/workflows" />

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
