# DevFlow

> Define an onboarding workflow once. Run it everywhere.

DevFlow is a visual builder for developer onboarding and machine-setup workflows. Instead of a stale "Getting Started" wiki page, you compose a graph of steps — install Homebrew packages, generate an SSH key, clone the monorepo, verify the toolchain — and DevFlow stores it as a typed, versioned workflow definition that can later be executed on any machine.

## Status

Early development. What works today:

- Visual workflow builder (React Flow) with a node palette, inspector, command palette, keyboard shortcuts, helper lines, and validation
- Workflow dashboard with search
- Email/password auth (Better Auth)
- Save / load / delete workflows via tRPC + Postgres
- Execution **preview** of the happy path

Not built yet: the runner/CLI that actually executes a workflow on a machine.

## Node types

| Node       | Purpose                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| `start`    | Entry point                                                                    |
| `command`  | Run a shell command, optionally per platform (`mac`, `linux`, `windows`)       |
| `install`  | Install via `brew`, `cask`, `apt`, `npm`, `bun`, VS Code extension, or custom  |
| `gitClone` | Clone a repository                                                             |
| `sshKey`   | Generate an `ed25519` / `rsa` SSH key                                          |
| `verify`   | Run a command and assert its exit code                                         |
| `prompt`   | Ask the user a question; reference the answer downstream as `{{variableName}}` |
| `env`      | Set an environment variable                                                    |
| `if`       | Branch on a condition command                                                  |
| `wait`     | Pause for N seconds                                                            |
| `end`      | Exit point                                                                     |

Executable nodes support `skipIfCommand` (skip the step when it exits `0`, for idempotency) and `requiresSudo`. Edges carry a condition: `always`, `on-success`, or `on-failure`.

## Tech stack

- **Monorepo:** Turborepo + Bun workspaces
- **Web:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Motion
- **Canvas:** `@xyflow/react`
- **API:** tRPC 11 + TanStack Query
- **Data:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **Validation:** Zod 4 (shared schema between client, server, and future CLI)

## Repository layout

```
apps/
  web/              Next.js app — builder, dashboard, auth, tRPC API
packages/
  shared/           Zod workflow schema and types (@devflow/shared)
scripts/
  match-versions.ts Interactive tool to align dependency versions across workspaces
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.3+
- Node.js 18+
- PostgreSQL 15+ (local or Docker)

If you don't have Postgres running locally:

```sh
docker run -d --name devflow-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=devflow postgres:17
```

### Setup

```sh
bun install

cp apps/web/.env.example apps/web/.env
# set BETTER_AUTH_SECRET: openssl rand -base64 32

cd apps/web
bun run db:migrate   # apply migrations
cd ../..

bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up. Workflows are private to the account that created them.

To load demo workflows into your account (optional, after signing up):

```sh
cd apps/web
bun run db:seed                                   # seeds the oldest user
SEED_USER_EMAIL=you@example.com bun run db:seed   # or a specific user
```

### Environment variables

Defined in `apps/web/.env` and validated at startup by `apps/web/src/lib/env.ts`.

| Variable             | Description                                   |
| -------------------- | --------------------------------------------- |
| `DATABASE_URL`       | Postgres connection string (`postgresql://…`) |
| `BETTER_AUTH_SECRET` | Session secret, at least 32 characters        |
| `BETTER_AUTH_URL`    | Public app URL, e.g. `http://localhost:3000`  |

## Scripts

From the repo root:

| Command                  | Description                                   |
| ------------------------ | --------------------------------------------- |
| `bun run dev`            | Start all apps in dev mode                    |
| `bun run build`          | Build all apps                                |
| `bun run lint`           | Lint all workspaces                           |
| `bun run format`         | Format with Prettier                          |
| `bun run format:check`   | Check formatting                              |
| `bun run match-versions` | Align mismatched dependency versions          |
| `bun run clean`          | Remove `node_modules`, build output and cache |

App-specific scripts (database, auth) are documented in [`apps/web/README.md`](apps/web/README.md).

## Workflow format

A workflow is plain JSON validated by `workflowSchema` in [`packages/shared`](packages/shared). Execution data (`nodes`, `edges`) is kept separate from editor-only `layout`, so a runner never needs to know about canvas positions.

```json
{
  "version": 1,
  "id": "…",
  "name": "macOS engineer setup",
  "nodes": [{ "id": "start", "type": "start", "data": { "label": "Start" } }],
  "edges": [{ "id": "e1", "source": "start", "target": "end", "condition": "always" }],
  "layout": { "start": { "x": 250, "y": 40 } }
}
```
