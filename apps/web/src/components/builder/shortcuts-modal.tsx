'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

const SHORTCUTS: { action: string; keys?: string[]; hint?: string }[] = [
  { action: 'Command palette', keys: ['⌘', 'K'] },
  { action: 'Save', keys: ['⌘', 'S'] },
  { action: 'Undo', keys: ['⌘', 'Z'] },
  { action: 'Redo', keys: ['⌘', '⇧', 'Z'] },
  { action: 'Duplicate node', keys: ['⌘', 'D'] },
  { action: 'Delete node', keys: ['Del'] },
  { action: 'Keyboard shortcuts', keys: ['?'] },
  { action: 'Quick add node', hint: 'Double-click canvas' },
];

export function ShortcutsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md" aria-describedby="shortcuts-desc">
        <AlertDialogHeader>
          <AlertDialogTitle>Keyboard shortcuts</AlertDialogTitle>
          <AlertDialogDescription id="shortcuts-desc">
            Use Ctrl instead of ⌘ on Windows and Linux.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="divide-y rounded-lg border">
          {SHORTCUTS.map((item) => (
            <li
              key={item.action}
              className="flex h-10 items-center justify-between gap-4 px-3 text-sm"
            >
              <span>{item.action}</span>
              {item.keys ? (
                <KbdGroup>
                  {item.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              ) : (
                <span className="text-muted-foreground text-xs">{item.hint}</span>
              )}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
