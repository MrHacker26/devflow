import { WorkflowBuilder } from '@/components/builder/workflow-builder';

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkflowBuilder workflowId={params.id} />
    </div>
  );
}
