# @devflow/shared

Source of truth for the DevFlow workflow format. Zod schemas and inferred TypeScript types shared by the web app and any future runner/CLI.

## Exports

| Export                    | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `workflowSchema`          | Full workflow: `version`, `nodes`, `edges`, `layout`     |
| `flowNodeSchema`          | Discriminated union of all node types (keyed by `type`)  |
| `flowEdgeSchema`          | Edge with `always` / `on-success` / `on-failure`         |
| `workflowLayoutSchema`    | Editor-only node positions, keyed by node id             |
| `WorkflowNodeType`        | Enum of node types                                       |
| `workflowSaveInputSchema` | API input for create (no `id`) / update (with `id`)      |
| `workflowListInputSchema` | API input for listing with optional `search`             |

## Usage

```ts
import { workflowSchema, type Workflow } from '@devflow/shared';

const workflow: Workflow = workflowSchema.parse(json);
```

## Versioning

`workflowSchema.version` is a literal. When the shape changes in a non-backward-compatible way, bump it and add a migration for stored workflows.

## Scripts

```sh
bun run typecheck
```
