import type { FlowEdge, FlowNode, WorkflowLayout } from '@devflow/shared';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  description: text('description'),
  nodes: jsonb('nodes').$type<FlowNode[]>().notNull().default([]),
  edges: jsonb('edges').$type<FlowEdge[]>().notNull().default([]),
  layout: jsonb('layout').$type<WorkflowLayout>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
