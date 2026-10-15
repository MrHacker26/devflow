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
  { id: 'start', label: 'Start', tone: 'teal' },
  { id: 'install', label: 'Install', tone: 'mint' },
  { id: 'verify', label: 'Verify', tone: 'amber' },
  { id: 'ready', label: 'Ready', tone: 'teal' },
] as const;

const TONE_CLASS = {
  teal: 'border-[color-mix(in_srgb,var(--primary)_40%,transparent)]',
  mint: 'border-[color-mix(in_srgb,var(--success)_35%,transparent)]',
  amber: 'border-[color-mix(in_srgb,var(--secondary)_40%,transparent)]',
} as const;

function BuilderHeroVisual() {
  return (
    <motion.div
      variants={fadeUp}
      className="relative mt-auto w-full flex-1 pt-12 sm:pt-16"
      aria-hidden
    >
      <div className="relative mx-auto flex h-full min-h-[200px] w-full max-w-4xl items-center justify-center px-6 sm:min-h-[260px]">
        <div className="flex w-full max-w-3xl items-center gap-2 sm:gap-4">
          {DEMO_NODES.map((node, index) => (
            <div key={node.id} className="contents">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.14, duration: 0.45, ease: easeOut }}
                className={cn(
                  'bg-surface/80 w-[5.5rem] shrink-0 rounded-xl border px-3 py-3 text-center backdrop-blur-sm sm:w-28 sm:px-4 sm:py-4',
                  TONE_CLASS[node.tone],
                )}
              >
                <p className="text-foreground text-sm font-medium tracking-tight sm:text-base">
                  {node.label}
                </p>
              </motion.div>

              {index < DEMO_NODES.length - 1 ? (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.55 + index * 0.14, duration: 0.4, ease: easeOut }}
                  className="bg-primary/30 h-px min-w-6 flex-1 origin-left"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
    </motion.div>
  );
}

export function HomeHero() {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <main className="blueprint-atmosphere relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-40" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[-8%] left-1/2 h-[26rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <header className="relative z-20 flex items-center justify-between px-5 py-3 sm:px-8">
        <span className="text-primary/80 font-heading inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="bg-primary/15 inline-flex size-6 items-center justify-center rounded-md">
            <Workflow className="size-3" />
          </span>
          DevFlow
        </span>
        <UserMenu />
      </header>

      <motion.div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pt-16 text-center sm:pt-24">
          <motion.p
            variants={fadeUp}
            className="text-primary font-heading text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl"
          >
            DevFlow
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="text-muted-foreground mt-5 max-w-md text-base leading-relaxed sm:text-lg"
          >
            Define an onboarding workflow once. Run it everywhere.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="rounded-xl px-6 shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
            >
              <Link href="/workflows">
                <FolderKanban data-icon="inline-start" />
                {user ? 'Your workflows' : 'Get started'}
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
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
        </div>

        <BuilderHeroVisual />
      </motion.div>
    </main>
  );
}
