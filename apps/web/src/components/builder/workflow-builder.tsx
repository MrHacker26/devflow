'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@xyflow/react/dist/style.css';

import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';
import { useTRPC } from '@/trpc/client';

import { BuilderToolbar } from './builder-toolbar';
import { NodeInspector } from './node-inspector';
import { NodePalette } from './node-palette';
import { workflowNodeTypes } from './nodes/node-types';
import {
  createDefaultNodeData,
  createInitialBuilderGraph,
  fromSavedWorkflow,
  toFlowEdges,
  toFlowNodes,
  toLayout,
  type BuilderEdge,
  type BuilderNode,
  type BuilderNodeData,
} from './workflow-serialize';

export function WorkflowBuilder({ workflowId: initialWorkflowId }: { workflowId?: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;
  const initial = useMemo(() => createInitialBuilderGraph(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<BuilderEdge>(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [name, setName] = useState('Untitled workflow');
  const [description, setDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(initialWorkflowId ?? null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hydrated, setHydrated] = useState(!initialWorkflowId);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    setCanvasReady(true);
  }, []);

  const existingQuery = useQuery({
    ...trpc.workflow.getById.queryOptions({ id: initialWorkflowId! }),
    enabled: Boolean(initialWorkflowId),
  });

  useEffect(() => {
    if (!existingQuery.data || hydrated) return;

    const graph = fromSavedWorkflow({
      nodes: existingQuery.data.nodes,
      edges: existingQuery.data.edges,
      layout: existingQuery.data.layout,
    });

    setNodes(graph.nodes);
    setEdges(graph.edges);
    setName(existingQuery.data.name);
    setDescription(existingQuery.data.description ?? '');
    setWorkflowId(existingQuery.data.id);
    setHydrated(true);
  }, [existingQuery.data, hydrated, setEdges, setNodes]);

  const saveMutation = useMutation(
    trpc.workflow.save.mutationOptions({
      onSuccess: async (saved) => {
        setWorkflowId(saved.id);
        setSaveError(null);
        setSaveSuccess(true);
        await queryClient.invalidateQueries(trpc.workflow.list.queryFilter());
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/builder?id=${saved.id}`);
        }
        window.setTimeout(() => setSaveSuccess(false), 2000);
      },
      onError: (error) => {
        setSaveSuccess(false);
        setSaveError(error.message);
      },
    }),
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const condition =
        connection.sourceHandle === 'success'
          ? 'on-success'
          : connection.sourceHandle === 'failure'
            ? 'on-failure'
            : 'always';

      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            data: { condition },
            label: condition === 'always' ? undefined : condition,
          },
          current,
        ),
      );
    },
    [setEdges],
  );

  const onSelectionChange = useCallback(({ nodes: selected }: OnSelectionChangeParams) => {
    setSelectedNodeId(selected[0]?.id ?? null);
  }, []);

  const addNode = useCallback(
    (type: WorkflowNodeType) => {
      const id = crypto.randomUUID();
      const node: BuilderNode = {
        id,
        type,
        position: { x: 180 + Math.random() * 160, y: 120 + Math.random() * 160 },
        data: createDefaultNodeData(type),
      };
      setNodes((current) => [...current, node]);
      setSelectedNodeId(id);
    },
    [setNodes],
  );

  const updateNodeData = useCallback(
    (nodeId: string, data: BuilderNodeData) => {
      setNodes((current) =>
        current.map((node) => (node.id === nodeId ? { ...node, data } : node)),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      setSelectedNodeId(null);
    },
    [setEdges, setNodes],
  );

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const handleSave = () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!user) {
      const returnTo =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/builder';
      router.push(loginHref(returnTo));
      return;
    }

    saveMutation.mutate({
      id: workflowId ?? undefined,
      version: 1,
      name: name.trim(),
      description: description.trim() || undefined,
      nodes: toFlowNodes(nodes),
      edges: toFlowEdges(edges),
      layout: toLayout(nodes),
    });
  };

  if (initialWorkflowId && !hydrated && existingQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Loading workflow…
      </div>
    );
  }

  if (initialWorkflowId && existingQuery.isError) {
    return (
      <div className="text-destructive flex flex-1 items-center justify-center text-sm">
        {existingQuery.error.message}
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <BuilderToolbar
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        saveError={saveError}
        saveSuccess={saveSuccess}
        workflowId={workflowId}
      />
      <div className="flex min-h-0 flex-1">
        <NodePalette onAdd={addNode} />
        <div className="relative min-h-0 min-w-0 flex-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--primary)_7%,transparent),transparent_55%)]"
          />
          {canvasReady ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              nodeTypes={workflowNodeTypes}
              fitView
              colorMode="dark"
              proOptions={{ hideAttribution: true }}
              className="!bg-transparent"
            >
              <Background
                gap={22}
                size={1}
                color="color-mix(in srgb, var(--foreground) 6%, transparent)"
              />
              <Controls />
              <MiniMap
                pannable
                zoomable
                className="!bg-surface !border-border"
                maskColor="rgb(7 13 24 / 72%)"
                nodeColor="color-mix(in srgb, var(--primary) 45%, transparent)"
              />
            </ReactFlow>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Loading canvas…
            </div>
          )}
        </div>
        <NodeInspector node={selectedNode} onChange={updateNodeData} onDelete={deleteNode} />
      </div>
    </div>
  );
}
