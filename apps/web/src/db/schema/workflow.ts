import type { FlowEdge, FlowNode, WorkflowLayout } from '@devflow/shared';
import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './auth';

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    version: integer('version').notNull().default(1),
    name: text('name').notNull(),
    description: text('description'),
    nodes: jsonb('nodes').$type<FlowNode[]>().notNull().default([]),
    edges: jsonb('edges').$type<FlowEdge[]>().notNull().default([]),
    layout: jsonb('layout').$type<WorkflowLayout>().notNull().default({}),
    shareToken: text('share_token').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('workflows_user_id_updated_at_idx').on(table.userId, table.updatedAt)],
);

export const workflowRelations = relations(workflows, ({ one }) => ({
  user: one(user, {
    fields: [workflows.userId],
    references: [user.id],
  }),
}));
