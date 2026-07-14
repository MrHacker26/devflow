'use client';

import { createContext, useContext } from 'react';

export type BuilderNodeActions = {
  onEdit: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onCopy: (nodeId: string) => void;
};

export type BuilderEdgeActions = {
  onDeleteEdge: (edgeId: string) => void;
};

const BuilderNodeActionsContext = createContext<BuilderNodeActions | null>(null);
const BuilderEdgeActionsContext = createContext<BuilderEdgeActions | null>(null);

export const BuilderNodeActionsProvider = BuilderNodeActionsContext.Provider;
export const BuilderEdgeActionsProvider = BuilderEdgeActionsContext.Provider;

export function useBuilderNodeActions() {
  return useContext(BuilderNodeActionsContext);
}

export function useBuilderEdgeActions() {
  return useContext(BuilderEdgeActionsContext);
}
