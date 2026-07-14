'use client';

import {
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
  UserRound,
  Workflow,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { fadeUp, scaleIn, stagger } from '@/lib/motion';
import { getSafeNextPath } from '@/lib/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'), '/workflows');

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({
            email,
            password,
            name: name || email.split('@')[0]!,
          });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? 'Authentication failed');
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="blueprint-glass relative z-10 flex w-full max-w-sm flex-col gap-5 rounded-2xl p-7"
      variants={scaleIn}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="contents">
        <motion.div variants={fadeUp}>
          <Link
            href="/"
            className="text-primary font-heading inline-flex items-center gap-2 text-lg font-bold tracking-tight hover:opacity-90"
          >
            <span className="bg-primary/15 inline-flex size-7 items-center justify-center rounded-lg">
              <Workflow className="size-3.5" />
            </span>
            DevFlow
          </Link>
          <AnimatePresence mode="wait">
            <motion.h1
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="font-heading mt-3 text-2xl font-semibold tracking-tight"
            >
              {mode === 'sign-in' ? 'Welcome back' : 'Create account'}
            </motion.h1>
          </AnimatePresence>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Sign in to save and manage onboarding workflows.
          </p>
        </motion.div>

        <AnimatePresence initial={false}>
          {mode === 'sign-up' ? (
            <motion.div
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-1.5 overflow-hidden"
            >
              <Label htmlFor="name" className="inline-flex items-center gap-1.5">
                <UserRound className="text-muted-foreground size-3.5" />
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/50 h-9 rounded-xl"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="inline-flex items-center gap-1.5">
            <Mail className="text-muted-foreground size-3.5" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/50 h-9 rounded-xl"
          />
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="inline-flex items-center gap-1.5">
            <LockKeyhole className="text-muted-foreground size-3.5" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background/50 h-9 rounded-xl"
          />
        </motion.div>

        <AnimatePresence>
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <motion.div variants={fadeUp} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" disabled={pending} className="h-9 w-full rounded-xl">
            {pending ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : mode === 'sign-in' ? (
              <LogIn data-icon="inline-start" />
            ) : (
              <UserPlus data-icon="inline-start" />
            )}
            {pending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
          </Button>
        </motion.div>

        <motion.button
          type="button"
          variants={fadeUp}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          onClick={() => setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'))}
        >
          {mode === 'sign-in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
        </motion.button>

        <motion.div variants={fadeUp}>
          <Link
            href={nextPath}
            className="text-muted-foreground hover:text-primary inline-flex w-full items-center justify-center gap-1 text-xs transition-colors"
          >
            Continue without signing in
            <ArrowRight className="size-3" />
          </Link>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <main className="blueprint-atmosphere relative flex flex-1 items-center justify-center overflow-hidden px-4">
      <div className="blueprint-grid pointer-events-none absolute inset-0" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[20%] left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Suspense
        fallback={
          <div className="blueprint-glass text-muted-foreground w-full max-w-sm rounded-2xl p-7 text-sm">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
