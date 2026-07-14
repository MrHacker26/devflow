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

const SHORTCUTS = [
  { action: 'Command palette', keys: '⌘ / Ctrl + K' },
  { action: 'Save', keys: '⌘ / Ctrl + S' },
  { action: 'Undo', keys: '⌘ / Ctrl + Z' },
  { action: 'Redo', keys: '⌘ / Ctrl + Shift + Z' },
  { action: 'Duplicate', keys: '⌘ / Ctrl + D' },
  { action: 'Delete', keys: 'Delete' },
  { action: 'Fit View', keys: 'Toolbar → Fit' },
  { action: 'Quick Add Node', keys: 'Double-click canvas' },
  { action: 'Search Nodes', keys: 'Palette search' },
  { action: 'Shortcuts', keys: '?' },
] as const;

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
            Productivity shortcuts for the builder. Press Esc to close.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="flex flex-col gap-2 py-1">
          {SHORTCUTS.map((item) => (
            <li key={item.action} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{item.action}</span>
              <kbd className="border-border bg-muted/50 text-foreground rounded-md border px-2 py-0.5 font-mono text-[11px]">
                {item.keys}
              </kbd>
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
