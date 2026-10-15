import { workflowListInputSchema, workflowSaveInputSchema } from '@devflow/shared';

import { createTRPCRouter, protectedProcedure } from '@/trpc/init';

import {
  deleteWorkflow,
  getWorkflowById,
  listWorkflows,
  saveWorkflow,
  workflowIdSchema,
} from './workflow.service';

export const workflowRouter = createTRPCRouter({
  list: protectedProcedure
    .input(workflowListInputSchema)
    .query(({ ctx, input }) => listWorkflows(ctx.user.id, input)),

  getById: protectedProcedure
    .input(workflowIdSchema)
    .query(({ ctx, input }) => getWorkflowById(ctx.user.id, input.id)),

  save: protectedProcedure
    .input(workflowSaveInputSchema)
    .mutation(({ ctx, input }) => saveWorkflow(ctx.user.id, input)),

  delete: protectedProcedure
    .input(workflowIdSchema)
    .mutation(({ ctx, input }) => deleteWorkflow(ctx.user.id, input.id)),
});
