import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { WorkflowBuilder } from '@/components/builder/workflow-builder';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/navigation';

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;

  if (params.id) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      redirect(loginHref(`/builder?id=${encodeURIComponent(params.id)}`));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkflowBuilder workflowId={params.id} />
    </div>
  );
}
