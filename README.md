# DevFlow

A visual builder for developer onboarding workflows. Drag together steps like "install Homebrew packages", "generate an SSH key" and "clone the repo", and DevFlow saves them as a versioned workflow.

> Early development. The builder, dashboard, and accounts work. The CLI runs a workflow file for `start`, `command`, `install`, `gitClone`, `verify`, `wait`, and `end`.

## Quick start

You need [Bun](https://bun.sh) 1.3+ and PostgreSQL. To start Postgres with Docker:

```sh
docker run -d --name devflow-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=devflow postgres:17
```

Then:

```sh
bun install
cp apps/web/.env.example apps/web/.env   # set BETTER_AUTH_SECRET (openssl rand -base64 32)
cd apps/web && bun run db:migrate && cd ../..
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up. To add demo workflows to your account, run `SEED_USER_EMAIL=you@example.com bun run db:seed` inside `apps/web`.

## Node types

`start`, `end`, `command`, `install`, `gitClone`, `sshKey`, `verify`, `prompt`, `env`, `if`, `wait`

## Project structure

```
apps/web          Next.js app (builder, dashboard, auth, API)
apps/cli          Workflow runner (`devflow run <file>`)
packages/shared   Workflow schema and types, shared by the web app and CLI
```

Built with Next.js, React Flow, tRPC, Drizzle, Postgres, Better Auth and shadcn/ui.

## CLI

From the repo root:

```sh
bun apps/cli/src/index.ts run apps/cli/examples/toolchain.json --dry-run
bun apps/cli/src/index.ts run ./workflow.json
```

This follows the happy path (`always`, then `on-success`). `prompt`, `if`, `sshKey`, `env`, and steps that require sudo stop the run. `--dry-run` prints the commands without executing them.

More details: [`apps/web/README.md`](apps/web/README.md) and [`packages/shared/README.md`](packages/shared/README.md).
