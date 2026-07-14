export default function Home() {
  return (
    <main className="bg-background text-foreground flex flex-1 flex-col items-center justify-center gap-3 px-6">
      <p className="text-primary font-heading text-4xl font-semibold tracking-tight">DevFlow</p>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        Internal developer onboarding — define a workflow once, run it everywhere.
      </p>
    </main>
  );
}
