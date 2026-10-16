import {
  isShareToken,
  workflowSchema,
  type Workflow,
  type WorkflowListInput,
  type WorkflowSaveInput,
} from '@devflow/shared';
import { TRPCError } from '@trpc/server';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
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

export function createShareToken() {
  return `df_${randomBytes(16).toString('base64url')}`;
}

export async function enableShare(userId: string, id: string) {
  const [existing] = await db
    .select({ shareToken: workflows.shareToken })
    .from(workflows)
    .where(ownedBy(userId, id))
    .limit(1);

  if (!existing) throw notFound(id);
  if (existing.shareToken) return { token: existing.shareToken };

  for (let attempt = 0; attempt < 3; attempt++) {
    const token = createShareToken();
    try {
      const [row] = await db
        .update(workflows)
        .set({ shareToken: token })
        .where(and(ownedBy(userId, id), isNull(workflows.shareToken)))
        .returning({ token: workflows.shareToken });

      if (row?.token) return { token: row.token };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }

    const [again] = await db
      .select({ shareToken: workflows.shareToken })
      .from(workflows)
      .where(ownedBy(userId, id))
      .limit(1);
    if (again?.shareToken) return { token: again.shareToken };
  }

  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create a share link' });
}

export async function revokeShare(userId: string, id: string) {
  const [row] = await db
    .update(workflows)
    .set({ shareToken: null })
    .where(ownedBy(userId, id))
    .returning({ id: workflows.id });

  if (!row) throw notFound(id);
  return row;
}

export async function getSharedWorkflow(token: string): Promise<Workflow | null> {
  if (!isShareToken(token)) return null;

  const [row] = await db
    .select({
      version: workflows.version,
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      nodes: workflows.nodes,
      edges: workflows.edges,
      layout: workflows.layout,
    })
    .from(workflows)
    .where(eq(workflows.shareToken, token))
    .limit(1);

  if (!row || row.version !== 1) return null;

  const parsed = workflowSchema.safeParse({
    version: 1,
    id: row.id,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    nodes: row.nodes,
    edges: row.edges,
    layout: row.layout,
  });

  return parsed.success ? parsed.data : null;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && error.code === '23505') return true;
  if ('cause' in error) return isUniqueViolation(error.cause);
  return false;
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
