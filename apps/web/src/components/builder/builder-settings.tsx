'use client';

import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WithTooltip } from '@/components/ui/with-tooltip';

export type BuilderPreferences = {
  showGrid: boolean;
  snapToGrid: boolean;
  showMinimap: boolean;
  compactNodes: boolean;
  reduceAnimations: boolean;
};

export const defaultBuilderPreferences: BuilderPreferences = {
  showGrid: true,
  snapToGrid: false,
  showMinimap: true,
  compactNodes: false,
  reduceAnimations: false,
};

export function BuilderSettingsPopover({
  value,
  onChange,
}: {
  value: BuilderPreferences;
  onChange: (next: BuilderPreferences) => void;
}) {
  const items: {
    key: keyof BuilderPreferences;
    label: string;
    hint?: string;
    disabled?: boolean;
  }[] = [
    { key: 'showGrid', label: 'Grid visibility' },
    { key: 'snapToGrid', label: 'Snap to grid' },
    { key: 'showMinimap', label: 'Show minimap' },
    { key: 'compactNodes', label: 'Compact nodes', hint: 'Soon', disabled: true },
    { key: 'reduceAnimations', label: 'Reduce animations', hint: 'Soon', disabled: true },
  ];

  return (
    <DropdownMenu>
      <WithTooltip label="Settings">
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            icon={<Settings2 />}
            aria-label="Builder settings"
          />
        </DropdownMenuTrigger>
      </WithTooltip>
      <DropdownMenuContent align="end" className="z-[1100] w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
          Canvas
        </DropdownMenuLabel>
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.key}
            checked={value[item.key]}
            disabled={item.disabled}
            onCheckedChange={(checked) => onChange({ ...value, [item.key]: Boolean(checked) })}
          >
            <span className="flex-1">{item.label}</span>
            {item.hint ? (
              <span className="text-muted-foreground ml-2 text-xs">{item.hint}</span>
            ) : null}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
