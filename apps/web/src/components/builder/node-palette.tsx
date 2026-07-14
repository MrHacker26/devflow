'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import { Blocks } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';
import { fadeUp, stagger } from '@/lib/motion';

import { nodeIconToneClass, nodeTypeLabel } from './nodes/base-node';
import { getNodeIcon } from './nodes/node-icons';
import { paletteNodeTypes } from './nodes/node-types';

export function NodePalette({
  onAdd,
}: {
  onAdd: (type: WorkflowNodeType) => void;
}) {
  return (
    <aside className="blueprint-panel flex w-52 shrink-0 flex-col gap-3 border-r p-3">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-2"
      >
        <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-6 items-center justify-center rounded-md">
          <Blocks className="size-3.5" />
        </span>
        <div>
          <p className="text-foreground text-xs font-semibold tracking-wide">Add node</p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">Click to place on canvas</p>
        </div>
      </motion.div>
      <motion.div
        className="flex flex-col gap-0.5"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {paletteNodeTypes.map((type) => {
          const Icon = getNodeIcon(type);
          return (
            <motion.button
              key={type}
              type="button"
              variants={fadeUp}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAdd(type)}
              className={cn(
                'hover:bg-surface-elevated group flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors',
                'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105',
                  nodeIconToneClass(type),
                )}
              >
                <Icon className="size-3.5" strokeWidth={2.1} />
              </span>
              {nodeTypeLabel(type)}
            </motion.button>
          );
        })}
      </motion.div>
    </aside>
  );
}
