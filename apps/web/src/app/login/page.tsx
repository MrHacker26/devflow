'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
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
  const isSignIn = mode === 'sign-in';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = isSignIn
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">
          {isSignIn ? 'Sign in to DevFlow' : 'Create your account'}
        </CardTitle>
        <CardDescription>
          {isSignIn
            ? 'Welcome back. Enter your details to continue.'
            : 'Start building onboarding workflows in minutes.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="auth-form" onSubmit={onSubmit}>
          <FieldGroup className="gap-4">
            {!isSignIn ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                placeholder={isSignIn ? undefined : 'At least 8 characters'}
                required
                minLength={8}
                value={password}
                aria-invalid={error ? true : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Button type="submit" loading={pending} size="lg" className="mt-2 w-full">
              {isSignIn ? 'Sign in' : 'Create account'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="text-muted-foreground justify-center border-t text-sm">
        {isSignIn ? 'New to DevFlow?' : 'Already have an account?'}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-1.5"
          onClick={() => {
            setMode(isSignIn ? 'sign-up' : 'sign-in');
            setError(null);
          }}
        >
          {isSignIn ? 'Create an account' : 'Sign in'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" />
      <Logo className="relative" />
      <div className="relative flex w-full justify-center">
        <Suspense fallback={<Skeleton className="h-[26rem] w-full max-w-sm rounded-xl" />}>
          <LoginForm />
        </Suspense>
      </div>
      <Link
        href="/builder"
        className="text-muted-foreground hover:text-foreground relative text-sm transition-colors"
      >
        Try the builder without an account
      </Link>
    </main>
  );
}
