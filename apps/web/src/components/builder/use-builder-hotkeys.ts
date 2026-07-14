'use client';

import { useHotkeys } from 'react-hotkeys-hook';

type BuilderHotkeysOptions = {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenShortcuts: () => void;
  onOpenCommandPalette: () => void;
  /** Disable editor shortcuts (Save/Undo/…) while overlays are open. */
  enabled?: boolean;
  /** Keep ⌘K available to toggle the palette closed. */
  commandPaletteEnabled?: boolean;
};

/**
 * Builder keyboard shortcuts via react-hotkeys-hook.
 * Form fields / contenteditable are ignored by default (except ⌘K).
 */
export function useBuilderHotkeys({
  onSave,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onOpenShortcuts,
  onOpenCommandPalette,
  enabled = true,
  commandPaletteEnabled = true,
}: BuilderHotkeysOptions) {
  const options = {
    enabled,
    preventDefault: true,
    enableOnFormTags: false,
    enableOnContentEditable: false,
  } as const;

  useHotkeys('mod+s', onSave, options, [onSave]);
  useHotkeys('mod+z', onUndo, options, [onUndo]);
  useHotkeys('mod+shift+z', onRedo, options, [onRedo]);
  useHotkeys('mod+d', onDuplicate, options, [onDuplicate]);
  useHotkeys('delete, backspace', onDelete, options, [onDelete]);
  useHotkeys('shift+/', onOpenShortcuts, options, [onOpenShortcuts]);
  useHotkeys(
    'mod+k',
    onOpenCommandPalette,
    {
      enabled: commandPaletteEnabled,
      preventDefault: true,
      enableOnFormTags: true,
      enableOnContentEditable: false,
    },
    [onOpenCommandPalette],
  );
}
