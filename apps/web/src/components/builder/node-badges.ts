import type { WorkflowNodeType } from '@devflow/shared';

export function getNodeBadges(
  type: WorkflowNodeType,
  data: Record<string, unknown>,
): string[] {
  const badges: string[] = [];

  if (type === 'verify') badges.push('verify');
  if (type === 'prompt') badges.push('prompt');
  if (type === 'install' && data.packageManager) {
    badges.push(String(data.packageManager));
  }
  if (data.requiresSudo) badges.push('sudo');
  if (typeof data.skipIfCommand === 'string' && data.skipIfCommand.trim()) {
    badges.push('skip');
  }

  return badges.slice(0, 3);
}
