import { createTRPCRouter } from '@/trpc/init';
import { workflowRouter } from '@/trpc/routers/workflow/workflow.router';

export const appRouter = createTRPCRouter({
  workflow: workflowRouter,
});

export type AppRouter = typeof appRouter;
