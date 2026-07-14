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
        'workflow-handle !h-3 !w-3 !border-[1.5px] !border-background transition-[transform,box-shadow,background-color] duration-150',
        className,
      )}
    />
  );
}

export const handlePositions = {
  top: Position.Top,
  bottom: Position.Bottom,
};
