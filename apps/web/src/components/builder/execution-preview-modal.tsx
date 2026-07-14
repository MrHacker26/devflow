'use client';

import { ChevronDown } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { getExecutionPath, nodeDisplayLabel } from './node-meta';
import type { BuilderEdge, BuilderNode } from './workflow-serialize';

export function ExecutionPreviewModal({
  open,
  onOpenChange,
  nodes,
  edges,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}) {
  const path = getExecutionPath(nodes, edges);
  const labels =
    path.nodes.length > 0
      ? path.nodes.map((node) => nodeDisplayLabel(node))
      : ['Start', 'Next Nodes', 'End'];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Preview Execution</AlertDialogTitle>
          <AlertDialogDescription>
            Visual order along the happy path. Commands are not executed yet.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex max-h-[50vh] flex-col items-center gap-2 overflow-y-auto py-2">
          {labels.map((label, index) => (
            <div key={`${label}-${index}`} className="flex flex-col items-center gap-2">
              <StepPill>{label}</StepPill>
              {index < labels.length - 1 ? (
                <ChevronDown className="text-muted-foreground size-4" />
              ) : null}
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StepPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-border bg-muted/50 text-foreground inline-flex min-w-[8rem] items-center justify-center rounded-full border px-3 py-1.5 text-sm">
      {children}
    </span>
  );
}
