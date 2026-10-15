import { Workflow } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md',
        className,
      )}
    >
      <Workflow className="size-3.5" strokeWidth={2.25} />
    </span>
  );
}

export function Logo({
  href = '/',
  showWordmark = true,
  className,
}: {
  href?: string;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'text-foreground focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-3',
        className,
      )}
    >
      <LogoMark />
      {showWordmark ? <span>DevFlow</span> : <span className="sr-only">DevFlow</span>}
    </Link>
  );
}
