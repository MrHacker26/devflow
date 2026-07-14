'use client';

import { createContext, useContext } from 'react';

const SimulationNodeContext = createContext<string | null>(null);
const SimulationEdgeContext = createContext<string | null>(null);

export const SimulationNodeProvider = SimulationNodeContext.Provider;
export const SimulationEdgeProvider = SimulationEdgeContext.Provider;

export function useSimulationNodeId() {
  return useContext(SimulationNodeContext);
}

export function useSimulationEdgeId() {
  return useContext(SimulationEdgeContext);
}
