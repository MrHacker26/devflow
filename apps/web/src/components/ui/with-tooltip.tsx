'use client';

import type { ReactElement } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function WithTooltip({
  label,
  side = 'bottom',
  children,
}: {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={6} className="z-[1200]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
