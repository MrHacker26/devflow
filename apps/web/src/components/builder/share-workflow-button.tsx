'use client';

import { useMutation } from '@tanstack/react-query';
import { Check, Link2, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WithTooltip } from '@/components/ui/with-tooltip';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/trpc/client';

export function ShareWorkflowButton({
  workflowId,
  shareToken,
  onShareTokenChange,
}: {
  workflowId: string | null;
  shareToken: string | null;
  onShareTokenChange: (token: string | null) => void;
}) {
  const trpc = useTRPC();
  const session = authClient.useSession();
  const signedIn = Boolean(session.data?.user);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabledReason = !signedIn
    ? 'Sign in to share'
    : !workflowId
      ? 'Save the workflow before sharing'
      : null;

  const share = useMutation(
    trpc.workflow.share.mutationOptions({
      onSuccess: (result) => {
        onShareTokenChange(result.token);
        setError(null);
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  );
  const revoke = useMutation(
    trpc.workflow.revokeShare.mutationOptions({
      onSuccess: () => {
        onShareTokenChange(null);
        setCopied(false);
        setError(null);
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  );

  const command = shareToken ? `devflow run ${shareToken}` : '';
  const pending = share.isPending || revoke.isPending;

  async function copyCommand() {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <WithTooltip label={disabledReason ?? 'Share a run command'}>
        <span className="inline-flex">
          <Button
            variant="outline"
            size="sm"
            disabled={Boolean(disabledReason)}
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            <Link2 data-icon="inline-start" />
            Share
          </Button>
        </span>
      </WithTooltip>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone with this command can fetch and run the workflow without an account. It stays
              private in your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {shareToken ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input readOnly value={command} aria-label="Share command" className="font-mono" />
                <Button type="button" variant="outline" onClick={() => void copyCommand()}>
                  {copied ? <Check data-icon="inline-start" /> : null}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                The CLI uses <span className="font-mono">DEVFLOW_URL</span>, or{' '}
                <span className="font-mono">http://localhost:3000</span>.
              </p>
            </div>
          ) : (
            <Button
              type="button"
              disabled={!workflowId || pending}
              onClick={() => {
                if (workflowId) share.mutate({ id: workflowId });
              }}
            >
              {share.isPending ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              ) : null}
              Create link
            </Button>
          )}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <AlertDialogFooter>
            {shareToken ? (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  if (workflowId) revoke.mutate({ id: workflowId });
                }}
              >
                {revoke.isPending ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : null}
                Revoke link
              </Button>
            ) : null}
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
