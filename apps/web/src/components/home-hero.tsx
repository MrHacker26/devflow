'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import {
  ArrowRight,
  Check,
  GitBranch,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  SquareTerminal,
  Variable,
} from 'lucide-react';
import Link from 'next/link';

import { nodeIconToneClass } from '@/components/builder/nodes/base-node';
import { NodeTypeIcon } from '@/components/builder/nodes/node-icons';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserMenu } from '@/components/user-menu';
import { marketingContainer } from '@/lib/layout';
import { loginHref } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const PREVIEW_STEPS: { type: WorkflowNodeType; label: string; detail: string }[] = [
  { type: 'prompt', label: 'GitHub email', detail: '{{gitEmail}}' },
  { type: 'install', label: 'Install Bun', detail: 'brew · oven-sh/bun/bun' },
  { type: 'sshKey', label: 'Generate SSH key', detail: 'ed25519' },
  { type: 'gitClone', label: 'Clone monorepo', detail: '~/src/devflow' },
  { type: 'verify', label: 'Verify toolchain', detail: 'bun --version → 0' },
];

const TERMINAL_LINES = [
  { status: 'done', text: 'GitHub email', meta: 'you@company.com' },
  { status: 'skip', text: 'Install Bun', meta: 'already installed' },
  { status: 'done', text: 'Generate SSH key', meta: '1.2s' },
  { status: 'done', text: 'Clone monorepo', meta: '8.4s' },
  { status: 'done', text: 'Verify toolchain', meta: 'exit 0' },
] as const;

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'Visual builder',
    description:
      'Drag steps onto a canvas and connect them. No YAML, no shell scripts to maintain.',
  },
  {
    icon: RefreshCw,
    title: 'Safe to re-run',
    description:
      'Each step can skip itself when it is already done, so a rerun only fixes what is missing.',
  },
  {
    icon: ShieldCheck,
    title: 'Built-in verification',
    description:
      'Assert exit codes after critical steps and show a clear message when something fails.',
  },
  {
    icon: GitBranch,
    title: 'Branching',
    description:
      'Route on success or failure, or branch on a condition like “is Docker installed?”.',
  },
  {
    icon: Variable,
    title: 'Prompts & variables',
    description: 'Ask for an email or a team once, then reuse it anywhere with {{variable}}.',
  },
  {
    icon: SquareTerminal,
    title: 'Runs from the terminal',
    description: 'Every workflow is typed JSON, ready for a single devflow run on any machine.',
  },
] as const;

const STEPS = [
  { title: 'Design', description: 'Model your setup as steps on the canvas.' },
  {
    title: 'Validate',
    description: 'Catch broken paths and missing fields before anyone runs it.',
  },
  { title: 'Run', description: 'New engineers run one command and get a working machine.' },
] as const;

export function HomeHero({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className={cn(marketingContainer, 'flex h-14 items-center gap-6')}>
          <Logo />
          <nav className="text-muted-foreground hidden items-center gap-5 text-sm sm:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <>
                <Button asChild size="sm">
                  <Link href="/workflows">Open app</Link>
                </Button>
                <UserMenu />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href={loginHref('/workflows')}>Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={loginHref('/workflows')}>Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div
            className={cn(
              marketingContainer,
              'relative grid items-center gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:py-28',
            )}
          >
            <div className="flex flex-col items-start gap-6">
              <Badge variant="outline" className="text-muted-foreground h-6 gap-1.5 px-2.5">
                <span className="bg-primary size-1.5 rounded-full" />
                Developer onboarding, automated
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Get new engineers to a working machine in minutes.
              </h1>
              <p className="text-muted-foreground max-w-lg text-lg leading-relaxed text-pretty">
                Turn your setup wiki into a workflow. Build it visually, validate it, and let every
                new hire run it with a single command.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={signedIn ? '/workflows' : loginHref('/workflows')}>
                    {signedIn ? 'Go to workflows' : 'Get started'}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/builder">Try the builder</Link>
                </Button>
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section id="features" className="scroll-mt-14 border-b">
          <div className={cn(marketingContainer, 'py-20')}>
            <SectionHeading
              eyebrow="Features"
              title="Everything a setup script should have been"
              description="Readable by anyone on the team, and reliable enough to run on day one."
            />
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-background flex flex-col gap-3 p-6">
                  <span className="bg-accent text-foreground inline-flex size-9 items-center justify-center rounded-lg border">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-14 border-b">
          <div className={cn(marketingContainer, 'py-20')}>
            <SectionHeading
              eyebrow="How it works"
              title="From wiki page to one command"
              description="Three steps, and your onboarding stops going stale."
            />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-3">
                  <span className="text-muted-foreground font-mono text-sm tabular-nums">
                    0{index + 1}
                  </span>
                  <div className="bg-border h-px w-full" />
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section>
          <div
            className={cn(
              marketingContainer,
              'flex flex-col items-start justify-between gap-6 py-20 md:flex-row md:items-center',
            )}
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Ship your first workflow today
              </h2>
              <p className="text-muted-foreground">
                Start from a blank canvas, or adapt one of the demo workflows.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href={signedIn ? '/builder' : loginHref('/builder')}>
                Create a workflow
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div
          className={cn(
            marketingContainer,
            'text-muted-foreground flex h-16 items-center justify-between text-sm',
          )}
        >
          <Logo />
          <span>© {new Date().getFullYear()} DevFlow</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="text-primary text-sm font-medium">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-balance">{title}</h2>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
    </div>
  );
}

function ProductPreview() {
  return (
    <Card className="gap-0 py-0 shadow-2xl shadow-black/40" aria-hidden>
      <div className="flex h-10 items-center gap-2 border-b px-4">
        <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
        <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
        <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
        <span className="text-muted-foreground ml-2 text-xs">macos-setup</span>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <ol className="flex flex-col gap-2 p-4">
          {PREVIEW_STEPS.map((step) => (
            <li
              key={step.label}
              className="bg-background flex items-center gap-3 rounded-lg border px-3 py-2.5"
            >
              <span
                className={cn(
                  'inline-flex size-7 shrink-0 items-center justify-center rounded-md',
                  nodeIconToneClass(step.type),
                )}
              >
                <NodeTypeIcon type={step.type} className="size-3.5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{step.label}</span>
                <span className="text-muted-foreground truncate font-mono text-xs">
                  {step.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="bg-background/60 flex flex-col gap-1.5 border-t p-4 font-mono text-xs sm:border-t-0 sm:border-l">
          <p className="text-muted-foreground">
            <span className="text-primary">$</span> devflow run macos-setup
          </p>
          <div className="h-2" />
          {TERMINAL_LINES.map((line) => (
            <p key={line.text} className="flex items-center gap-2">
              {line.status === 'done' ? (
                <Check className="text-success size-3.5 shrink-0" />
              ) : (
                <span className="text-muted-foreground w-3.5 shrink-0 text-center">–</span>
              )}
              <span className={line.status === 'skip' ? 'text-muted-foreground' : undefined}>
                {line.text}
              </span>
              <span className="text-muted-foreground ml-auto truncate">{line.meta}</span>
            </p>
          ))}
          <div className="h-2" />
          <p className="text-success">✓ Ready in 14.2s</p>
        </div>
      </div>
    </Card>
  );
}
