import type { WorkflowSaveInput } from '@devflow/shared';
import {
  workflowListInputSchema,
  workflowSaveInputSchema,
} from '@devflow/shared';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { match, P } from 'ts-pattern';
import * as z from 'zod';

import { workflows } from '@/db/schema';
import { db } from '@/lib/db';

export type WorkflowListInput = z.infer<typeof workflowListInputSchema>;
export type { WorkflowSaveInput };

const workflowIdSchema = z.object({
  id: z.string().uuid(),
});

export async function listWorkflows(input: WorkflowListInput) {
  const search = input.search?.trim();

  const rows = await db
    .select({
      id: workflows.id,
      version: workflows.version,
      name: workflows.name,
      description: workflows.description,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(
      search
        ? or(
            ilike(workflows.name, `%${search}%`),
            ilike(workflows.description, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(desc(workflows.updatedAt));

  return rows;
}

export async function getWorkflowById(id: string) {
  const [row] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);

  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Workflow ${id} not found` });
  }

  return row;
}

async function createWorkflow(input: WorkflowSaveInput) {
  const [row] = await db
    .insert(workflows)
    .values({
      version: input.version,
      name: input.name,
      description: input.description,
      nodes: input.nodes,
      edges: input.edges,
      layout: input.layout,
    })
    .returning();

  if (!row) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create workflow' });
  }

  return row;
}

async function updateWorkflow(id: string, input: WorkflowSaveInput) {
  const [row] = await db
    .update(workflows)
    .set({
      version: input.version,
      name: input.name,
      description: input.description,
      nodes: input.nodes,
      edges: input.edges,
      layout: input.layout,
      updatedAt: sql`now()`,
    })
    .where(eq(workflows.id, id))
    .returning();

  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Workflow ${id} not found` });
  }

  return row;
}

export async function saveWorkflow(input: WorkflowSaveInput) {
  return match(input.id)
    .with(P.string.minLength(1), (id) => updateWorkflow(id, input))
    .otherwise(() => createWorkflow(input));
}

export async function deleteWorkflow(id: string) {
  const [row] = await db.delete(workflows).where(eq(workflows.id, id)).returning({
    id: workflows.id,
  });

  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Workflow ${id} not found` });
  }

  return row;
}

export { workflowIdSchema };
