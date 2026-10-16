import { isShareToken, workflowSchema, type Workflow } from '@devflow/shared';

export { isShareToken };

export async function fetchSharedWorkflow(
  token: string,
  options?: { baseUrl?: string; fetchImpl?: (url: string) => Promise<Response> },
): Promise<Workflow> {
  if (!isShareToken(token)) {
    throw new Error('Shared workflow not found.');
  }

  const baseUrl = (options?.baseUrl ?? process.env.DEVFLOW_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const fetchImpl = options?.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/api/share/${token}`);
  } catch {
    throw new Error(`Could not reach ${baseUrl}.`);
  }

  if (response.status === 404) throw new Error('Shared workflow not found.');
  if (!response.ok) throw new Error(`Could not fetch the shared workflow (${response.status}).`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('The server returned an unreadable workflow.');
  }

  const parsed = workflowSchema.safeParse(body);
  if (!parsed.success) throw new Error('The shared workflow is invalid.');
  return parsed.data;
}
