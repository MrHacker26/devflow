'use client';

import { ChevronDown, ChevronRight, FolderKanban, LogIn, Workflow } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { easeOut, fadeUp, stagger } from '@/lib/motion';
import { loginHref } from '@/lib/navigation';

const FLOW_STEPS = ['Start', 'Install', 'Clone Repo', 'Verify', 'Ready'] as const;

function WorkflowIllustration() {
  return (
    <motion.div
      variants={fadeUp}
      className="mt-10 flex flex-col items-center gap-1.5"
      aria-hidden
    >
      {FLOW_STEPS.map((step, index) => (
        <div key={step} className="flex flex-col items-center gap-1.5">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + index * 0.12, duration: 0.4, ease: easeOut }}
            className="border-border/80 bg-surface/70 text-muted-foreground inline-flex min-w-[7.5rem] items-center justify-center rounded-full border px-3 py-1 text-xs tracking-wide shadow-[0_8px_24px_-18px_rgb(0_0_0_/_70%)]"
          >
            <motion.span
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{
                delay: 0.8 + index * 0.18,
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-foreground/90"
            >
              {step}
            </motion.span>
          </motion.span>
          {index < FLOW_STEPS.length - 1 ? (
            <motion.div
              initial={{ opacity: 0, scaleY: 0.6 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.45 + index * 0.12, duration: 0.3 }}
            >
              <ChevronDown className="text-primary/50 size-3.5" />
            </motion.div>
          ) : null}
        </div>
      ))}
    </motion.div>
  );
}

export function HomeHero() {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <main className="blueprint-atmosphere relative flex flex-1 flex-col overflow-hidden">
      <div className="blueprint-grid pointer-events-none absolute inset-0" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/4 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_70%)] blur-3xl"
        animate={{
          opacity: [0.4, 0.75, 0.4],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[12%] bottom-[18%] h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--secondary)_16%,transparent),transparent_70%)] blur-2xl"
        animate={{
          opacity: [0.25, 0.5, 0.25],
          x: [0, 12, 0],
          y: [0, -8, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={fadeUp}
          className="bg-primary/10 text-primary mb-5 inline-flex size-14 items-center justify-center rounded-2xl shadow-[0_0_32px_-8px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
        >
          <Workflow className="size-7" strokeWidth={1.75} />
        </motion.div>
        <motion.p
          variants={fadeUp}
          className="text-primary font-heading text-6xl font-bold tracking-tight sm:text-7xl"
        >
          DevFlow
        </motion.p>
        <WorkflowIllustration />
        <motion.p
          variants={fadeUp}
          className="text-muted-foreground mt-6 max-w-md text-center text-base leading-relaxed sm:text-lg"
        >
          Internal developer onboarding — define a workflow once, run it everywhere.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-xl px-6 shadow-[0_0_24px_-6px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
            >
              <Link href="/workflows">
                <FolderKanban data-icon="inline-start" />
                {user ? 'Your workflows' : 'Browse workflows'}
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
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
      </motion.div>

      <motion.div
        aria-hidden
        className="via-primary/40 pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.8, ease: easeOut }}
      />
    </main>
  );
}
