import type { WorkflowListInput, WorkflowSaveInput } from '@devflow/shared';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { match, P } from 'ts-pattern';
import * as z from 'zod';

import { workflows } from '@/db/schema';
import { db } from '@/lib/db';

const workflowIdSchema = z.object({
  id: z.string().uuid(),
});

function ownedBy(userId: string, id: string) {
  return and(eq(workflows.id, id), eq(workflows.userId, userId));
}

function notFound(id: string) {
  return new TRPCError({ code: 'NOT_FOUND', message: `Workflow ${id} not found` });
}

export async function listWorkflows(userId: string, input: WorkflowListInput) {
  const search = input.search?.trim();

  return db
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
      and(
        eq(workflows.userId, userId),
        search
          ? or(ilike(workflows.name, `%${search}%`), ilike(workflows.description, `%${search}%`))
          : undefined,
      ),
    )
    .orderBy(desc(workflows.updatedAt));
}

export async function getWorkflowById(userId: string, id: string) {
  const [row] = await db.select().from(workflows).where(ownedBy(userId, id)).limit(1);

  if (!row) {
    throw notFound(id);
  }

  return row;
}

async function createWorkflow(userId: string, input: WorkflowSaveInput) {
  const [row] = await db
    .insert(workflows)
    .values({
      userId,
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

async function updateWorkflow(userId: string, id: string, input: WorkflowSaveInput) {
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
    .where(ownedBy(userId, id))
    .returning();

  if (!row) {
    throw notFound(id);
  }

  return row;
}

export async function saveWorkflow(userId: string, input: WorkflowSaveInput) {
  return match(input.id)
    .with(P.string.minLength(1), (id) => updateWorkflow(userId, id, input))
    .otherwise(() => createWorkflow(userId, input));
}

export async function deleteWorkflow(userId: string, id: string) {
  const [row] = await db.delete(workflows).where(ownedBy(userId, id)).returning({
    id: workflows.id,
  });

  if (!row) {
    throw notFound(id);
  }

  return row;
}

export { workflowIdSchema };
