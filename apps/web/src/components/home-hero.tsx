'use client';

import { ChevronRight, FolderKanban, LogIn, Workflow } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { authClient } from '@/lib/auth-client';
import { easeOut, fadeUp, stagger } from '@/lib/motion';
import { loginHref } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const DEMO_NODES = [
  { id: 'start', label: 'Start', x: 6, y: 22, tone: 'teal', w: 14 },
  { id: 'install', label: 'Install tools', x: 26, y: 12, tone: 'mint', w: 18 },
  { id: 'clone', label: 'Clone repo', x: 50, y: 28, tone: 'amber', w: 16 },
  { id: 'verify', label: 'Verify setup', x: 72, y: 14, tone: 'mint', w: 18 },
  { id: 'end', label: 'Ready', x: 86, y: 36, tone: 'teal', w: 12 },
] as const;

const DEMO_EDGES = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
] as const;

const TONE_CLASS = {
  teal: 'border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]',
  mint: 'border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]',
  amber:
    'border-[color-mix(in_srgb,var(--secondary)_35%,transparent)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]',
} as const;

function BuilderHeroVisual() {
  return (
    <motion.div
      variants={fadeUp}
      className="relative mx-auto mt-10 w-full max-w-5xl flex-1 px-2 sm:mt-14 sm:px-4"
      aria-hidden
    >
      <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-t-2xl border border-b-0 border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] shadow-[0_-24px_80px_-32px_rgb(0_0_0_/_70%)] sm:min-h-[280px]">
        <div className="blueprint-grid absolute inset-0 opacity-60" />
        <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center gap-2 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] px-3">
          <span className="bg-muted-foreground/25 size-2 rounded-full" />
          <span className="bg-muted-foreground/25 size-2 rounded-full" />
          <span className="bg-muted-foreground/25 size-2 rounded-full" />
          <span className="text-muted-foreground ml-2 font-mono text-[10px] tracking-wide">
            onboarding.devflow
          </span>
        </div>

        <div className="absolute inset-0 pt-9">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 56"
            preserveAspectRatio="none"
          >
            {DEMO_EDGES.map((edge, index) => {
              const a = DEMO_NODES[edge.from]!;
              const b = DEMO_NODES[edge.to]!;
              const x1 = a.x + a.w / 2;
              const y1 = a.y + 6;
              const x2 = b.x + b.w / 2;
              const y2 = b.y + 6;
              const midX = (x1 + x2) / 2;
              return (
                <motion.path
                  key={`${a.id}-${b.id}`}
                  d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="color-mix(in srgb, var(--primary) 45%, transparent)"
                  strokeWidth="0.35"
                  strokeDasharray="1.2 1.2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.55 + index * 0.12, duration: 0.7, ease: easeOut }}
                />
              );
            })}
          </svg>

          {DEMO_NODES.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.45, ease: easeOut }}
              className={cn(
                'absolute rounded-lg border px-2.5 py-1.5 backdrop-blur-sm',
                TONE_CLASS[node.tone],
              )}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.w}%`,
                minWidth: '4.5rem',
              }}
            >
              <motion.span
                className="bg-primary absolute top-1/2 -left-1 size-1.5 -translate-y-1/2 rounded-full"
                animate={
                  index === 2 ? { opacity: [0.4, 1, 0.4], scale: [1, 1.35, 1] } : { opacity: 0.7 }
                }
                transition={
                  index === 2 ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined
                }
              />
              <p className="text-muted-foreground text-[9px] tracking-[0.12em] uppercase">
                {index === 0 || index === 4 ? 'Flow' : 'Step'}
              </p>
              <p className="text-foreground truncate text-[11px] font-medium tracking-tight sm:text-xs">
                {node.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t to-transparent" />
      </div>
    </motion.div>
  );
}

export function HomeHero() {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <main className="blueprint-atmosphere relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-70" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_68%)] blur-3xl"
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-5%] bottom-[20%] h-56 w-56 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--secondary)_14%,transparent),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.2, 0.4, 0.2], x: [0, -16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <header className="relative z-20 flex items-center justify-between px-5 py-3 sm:px-8">
        <Link
          href="/"
          className="text-primary font-heading inline-flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <span className="bg-primary/15 inline-flex size-6 items-center justify-center rounded-md">
            <Workflow className="size-3" />
          </span>
          DevFlow
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/workflows">Workflows</Link>
            </Button>
          ) : null}
          <UserMenu />
        </div>
      </header>

      <motion.div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-8 text-center sm:pt-12">
          <motion.p
            variants={fadeUp}
            className="text-primary font-heading text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl"
          >
            DevFlow
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="text-foreground/90 mt-4 max-w-lg text-base leading-relaxed sm:text-lg"
          >
            Internal developer onboarding — define a workflow once, run it everywhere.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              <Button
                asChild
                size="lg"
                className="rounded-xl px-6 shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
              >
                <Link href="/workflows">
                  <FolderKanban data-icon="inline-start" />
                  {user ? 'Your workflows' : 'Browse workflows'}
                  <ChevronRight data-icon="inline-end" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
              {user ? (
                <Button asChild variant="outline" size="lg" className="rounded-xl bg-transparent">
                  <Link href="/builder">New workflow</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="lg" className="rounded-xl bg-transparent">
                  <Link href={loginHref('/workflows')}>
                    <LogIn data-icon="inline-start" />
                    Sign in
                  </Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>

        <BuilderHeroVisual />
      </motion.div>
    </main>
  );
}
