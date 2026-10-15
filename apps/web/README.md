# @devflow/web

The DevFlow web app: landing page, workflow dashboard, visual builder, auth, and the tRPC API.

See the [root README](../../README.md) for project overview and first-time setup.

## Routes

| Route                | Description                                   |
| -------------------- | --------------------------------------------- |
| `/`                  | Landing page                                  |
| `/workflows`         | Workflow dashboard with search                |
| `/builder`           | New workflow                                  |
| `/builder?id=<uuid>` | Edit an existing workflow                     |
| `/login`             | Sign in / sign up                             |
| `/api/trpc/*`        | tRPC endpoint                                 |
| `/api/auth/*`        | Better Auth endpoint                          |

## Scripts

| Command                 | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `bun run dev`           | Start the Next.js dev server                                   |
| `bun run build`         | Production build                                               |
| `bun run start`         | Serve the production build                                     |
| `bun run lint`          | ESLint                                                         |
| `bun run db:generate`   | Generate a migration from schema changes in `src/db/schema`    |
| `bun run db:migrate`    | Apply pending migrations                                       |
| `bun run db:studio`     | Open Drizzle Studio                                            |
| `bun run db:seed`       | Upsert demo workflows (idempotent, matched by name)            |
| `bun run auth:generate` | Regenerate `src/db/schema/auth.ts` from the Better Auth config |

## Source layout

```
src/
  app/                    Next.js routes and API handlers
  components/
    builder/              Workflow builder: canvas, nodes, edges, inspector, palette,
                          validation, serialization, hotkeys
    workflows/            Dashboard
    ui/                   shadcn/ui primitives
  db/
    schema/               Drizzle tables (auth, workflows)
    migrations/           Generated SQL migrations
  lib/                    auth, db client, env validation, helpers
  trpc/
    routers/              tRPC routers; business logic lives in *.service.ts
scripts/
  seed-demos.ts           Demo workflow seed
```

## Changing the database schema

1. Edit tables in `src/db/schema/`.
2. Run `bun run db:generate` and review the SQL in `src/db/migrations/`.
3. Run `bun run db:migrate`.

If you change the workflow JSON shape, update `@devflow/shared` and bump `version` in `workflowSchema`.

## Notes

This app uses Next.js 16, which has breaking changes from earlier versions. Check `node_modules/next/dist/docs/` before relying on older Next.js conventions.
