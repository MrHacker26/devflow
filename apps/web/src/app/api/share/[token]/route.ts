import { getSharedWorkflow } from '@/trpc/routers/workflow/workflow.service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const workflow = await getSharedWorkflow(decodeURIComponent(token));
  if (!workflow) {
    return Response.json({ message: 'Shared workflow not found' }, { status: 404 });
  }
  return Response.json(workflow);
}
