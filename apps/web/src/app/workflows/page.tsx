import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { WorkflowsDashboard } from '@/components/workflows/workflows-dashboard';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/navigation';

export default async function WorkflowsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(loginHref('/workflows'));
  }

  return <WorkflowsDashboard />;
}
