'use client';

import { Handle, Position, type HandleProps } from '@xyflow/react';

import { cn } from '@/lib/utils';

export function NodeHandle({
  className,
  ...props
}: Omit<HandleProps, 'className'> & { className?: string }) {
  return (
    <Handle
      {...props}
      className={cn(
        'workflow-handle !border-background !h-2.5 !w-2.5 !border-[1.5px] transition-[transform,box-shadow,background-color] duration-150',
        className,
      )}
    />
  );
}

export const handlePositions = {
  top: Position.Top,
  bottom: Position.Bottom,
};
