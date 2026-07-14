import { workflowListInputSchema, workflowSaveInputSchema } from '@devflow/shared';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/trpc/init';

import {
  deleteWorkflow,
  getWorkflowById,
  listWorkflows,
  saveWorkflow,
  workflowIdSchema,
} from './workflow.service';

export const workflowRouter = createTRPCRouter({
  list: publicProcedure.input(workflowListInputSchema).query(({ input }) => listWorkflows(input)),

  getById: publicProcedure
    .input(workflowIdSchema)
    .query(({ input }) => getWorkflowById(input.id)),

  save: protectedProcedure
    .input(workflowSaveInputSchema)
    .mutation(({ input }) => saveWorkflow(input)),

  delete: protectedProcedure
    .input(workflowIdSchema)
    .mutation(({ input }) => deleteWorkflow(input.id)),
});
