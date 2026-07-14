import type { WorkflowNodeType } from '@devflow/shared';
import {
  CircleCheck,
  CircleDot,
  CircleStop,
  Clock3,
  GitBranch,
  KeyRound,
  MessageSquareText,
  Package,
  Split,
  Terminal,
  Variable,
  type LucideIcon,
} from 'lucide-react';

const nodeIcons: Record<WorkflowNodeType, LucideIcon> = {
  start: CircleDot,
  end: CircleStop,
  command: Terminal,
  install: Package,
  gitClone: GitBranch,
  sshKey: KeyRound,
  verify: CircleCheck,
  wait: Clock3,
  env: Variable,
  prompt: MessageSquareText,
  if: Split,
};

export function getNodeIcon(type: WorkflowNodeType): LucideIcon {
  return nodeIcons[type];
}
