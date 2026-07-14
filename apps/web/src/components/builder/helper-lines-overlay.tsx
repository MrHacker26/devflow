'use client';

import { useViewport } from '@xyflow/react';

import type { HelperLines } from './helper-lines';

export function HelperLinesOverlay({ lines }: { lines: HelperLines | null }) {
  const { x, y, zoom } = useViewport();

  if (!lines || (lines.horizontal == null && lines.vertical == null)) return null;

  return (
    <svg className="react-flow__helper-lines pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
      {lines.vertical != null ? (
        <line
          x1={lines.vertical * zoom + x}
          y1={0}
          x2={lines.vertical * zoom + x}
          y2="100%"
          stroke="color-mix(in srgb, var(--primary) 55%, transparent)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ) : null}
      {lines.horizontal != null ? (
        <line
          x1={0}
          y1={lines.horizontal * zoom + y}
          x2="100%"
          y2={lines.horizontal * zoom + y}
          stroke="color-mix(in srgb, var(--primary) 55%, transparent)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      ) : null}
    </svg>
  );
}
