'use client';

import type { WorkflowNodeType } from '@devflow/shared';
import {
  Background,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import '@xyflow/react/dist/style.css';

import { authClient } from '@/lib/auth-client';
import { loginHref } from '@/lib/navigation';
import { useTRPC } from '@/trpc/client';

import {
  BuilderEdgeActionsProvider,
  BuilderNodeActionsProvider,
} from './builder-node-actions';
import {
  BuilderContextMenu,
  type ContextMenuItem,
} from './builder-context-menu';
import {
  defaultBuilderPreferences,
  type BuilderPreferences,
} from './builder-settings';
import { BuilderToolbar, type SaveStatus } from './builder-toolbar';
import { CanvasToolbar } from './canvas-toolbar';
import { CommandPalette } from './command-palette';
import { workflowEdgeTypes } from './edges/workflow-edge';
import { ExecutionPreviewModal } from './execution-preview-modal';
import { getHelperLines, type HelperLines } from './helper-lines';
import { HelperLinesOverlay } from './helper-lines-overlay';
import { getExecutionPath } from './node-meta';
import { NodeInspector, PaletteCollapseButton } from './node-inspector';
import { NodePalette } from './node-palette';
import { QuickAddPicker } from './quick-add-picker';
import { ShortcutsModal } from './shortcuts-modal';
import { SimulationEdgeProvider, SimulationNodeProvider } from './simulation-context';
import { useBuilderHotkeys } from './use-builder-hotkeys';
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
import { nodeCategoryColor, validateWorkflow } from './workflow-validation';

type ClipboardNode = {
  type: WorkflowNodeType;
  data: BuilderNodeData;
};

let nodeClipboard: ClipboardNode | null = null;

type Snapshot = {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
};

function cloneSnapshot(nodes: BuilderNode[], edges: BuilderEdge[]): Snapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function fingerprint(input: {
  name: string;
  description: string;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
}) {
  return JSON.stringify({
    name: input.name,
    description: input.description,
    nodes: toFlowNodes(input.nodes),
    edges: toFlowEdges(input.edges),
    layout: toLayout(input.nodes),
  });
}

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
  const [version, setVersion] = useState(1);
  const [lastSavedAt, setLastSavedAt] = useState<Date | string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(!initialWorkflowId);
  const canvasReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [baseline, setBaseline] = useState<string | null>(() =>
    initialWorkflowId
      ? null
      : fingerprint({
          name: 'Untitled workflow',
          description: '',
          nodes: initial.nodes,
          edges: initial.edges,
        }),
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean;
    position: { x: number; y: number };
  }>({ open: false, position: { x: 0, y: 0 } });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [savedJustNow, setSavedJustNow] = useState(false);
  const [simStep, setSimStep] = useState<{
    nodeId: string | null;
    edgeId: string | null;
  } | null>(null);
  const [helperLines, setHelperLines] = useState<HelperLines | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [preferences, setPreferences] = useState<BuilderPreferences>(defaultBuilderPreferences);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    function apply() {
      if (mq.matches) {
        setPaletteCollapsed(true);
        setInspectorCollapsed(true);
      }
    }
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const rfRef = useRef<ReactFlowInstance<BuilderNode, BuilderEdge> | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const simTimerRef = useRef<number | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const existingQuery = useQuery({
    ...trpc.workflow.getById.queryOptions({ id: initialWorkflowId! }),
    enabled: Boolean(initialWorkflowId),
  });

  if (existingQuery.data && !hydrated) {
    const loaded = existingQuery.data;
    const graph = fromSavedWorkflow({
      nodes: loaded.nodes,
      edges: loaded.edges,
      layout: loaded.layout,
    });

    setNodes(graph.nodes);
    setEdges(graph.edges);
    setName(loaded.name);
    setDescription(loaded.description ?? '');
    setWorkflowId(loaded.id);
    setVersion(loaded.version);
    setLastSavedAt(loaded.updatedAt);
    setBaseline(
      fingerprint({
        name: loaded.name,
        description: loaded.description ?? '',
        nodes: graph.nodes,
        edges: graph.edges,
      }),
    );
    setCanUndo(false);
    setCanRedo(false);
    setHydrated(true);
  }

  const isDirty =
    baseline !== null &&
    fingerprint({ name, description, nodes, edges }) !== baseline;

  const saveMutation = useMutation(
    trpc.workflow.save.mutationOptions({
      onSuccess: async (saved, variables) => {
        setWorkflowId(saved.id);
        setVersion(saved.version);
        setLastSavedAt(saved.updatedAt);
        setSaveError(null);
        setSavedJustNow(true);
        setBaseline(
          JSON.stringify({
            name: saved.name,
            description: saved.description ?? '',
            nodes: variables.nodes,
            edges: variables.edges,
            layout: variables.layout,
          }),
        );
        await queryClient.invalidateQueries(trpc.workflow.list.queryFilter());
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/builder?id=${saved.id}`);
        }
      },
      onError: (error) => {
        setSaveError(error.message);
        setSavedJustNow(false);
      },
    }),
  );

  useEffect(() => {
    if (!savedJustNow || isDirty || saveMutation.isPending) return;
    const timer = window.setTimeout(() => setSavedJustNow(false), 3500);
    return () => window.clearTimeout(timer);
  }, [isDirty, saveMutation.isPending, savedJustNow]);

  const resolvedSaveStatus: SaveStatus = saveMutation.isPending
    ? 'saving'
    : isDirty
      ? 'unsaved'
      : savedJustNow
        ? 'saved-just-now'
        : 'saved';

  const validation = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);

  const pushHistory = useCallback(() => {
    pastRef.current.push(cloneSnapshot(nodesRef.current, edgesRef.current));
    if (pastRef.current.length > 50) pastRef.current.shift();
    futureRef.current = [];
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(cloneSnapshot(nodesRef.current, edgesRef.current));
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, [setEdges, setNodes]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(cloneSnapshot(nodesRef.current, edgesRef.current));
    setNodes(next.nodes);
    setEdges(next.edges);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, [setEdges, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
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
            type: 'workflow',
            data: { condition },
          },
          current,
        ),
      );
    },
    [pushHistory, setEdges],
  );

  const onSelectionChange = useCallback(({ nodes: selected }: OnSelectionChangeParams) => {
    setSelectedNodeId(selected[0]?.id ?? null);
  }, []);

  const addNodeAt = useCallback(
    (type: WorkflowNodeType, position: { x: number; y: number }) => {
      pushHistory();
      const id = crypto.randomUUID();
      const node: BuilderNode = {
        id,
        type,
        position,
        data: createDefaultNodeData(type),
      };
      setNodes((current) => [...current, node]);
      setSelectedNodeId(id);
      return id;
    },
    [pushHistory, setNodes],
  );

  const addNode = useCallback(
    (type: WorkflowNodeType) => {
      addNodeAt(type, {
        x: 180 + Math.random() * 160,
        y: 120 + Math.random() * 160,
      });
    },
    [addNodeAt],
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
      const target = nodesRef.current.find((node) => node.id === nodeId);
      if (!target || target.type === 'start' || target.type === 'end') return;
      pushHistory();
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      setSelectedNodeId(null);
    },
    [pushHistory, setEdges, setNodes],
  );

  const duplicateSelected = useCallback((nodeId?: string | null) => {
    const targetId = nodeId ?? selectedNodeId;
    const selected = nodesRef.current.find((node) => node.id === targetId);
    if (!selected || selected.type === 'start' || selected.type === 'end') return;
    pushHistory();
    const id = crypto.randomUUID();
    const node: BuilderNode = {
      ...structuredClone(selected),
      id,
      position: {
        x: selected.position.x + 40,
        y: selected.position.y + 40,
      },
      selected: true,
    };
    setNodes((current) => [...current.map((n) => ({ ...n, selected: false })), node]);
    setSelectedNodeId(id);
  }, [pushHistory, selectedNodeId, setNodes]);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current != null) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setSimStep(null);
  }, []);

  const startSimulation = useCallback(() => {
    stopSimulation();
    const path = getExecutionPath(nodesRef.current, edgesRef.current);
    if (path.nodes.length === 0) return;

    let index = 0;
    setSimStep({
      nodeId: path.nodes[0]!.id,
      edgeId: null,
    });

    simTimerRef.current = window.setInterval(() => {
      index += 1;
      if (index >= path.nodes.length) {
        stopSimulation();
        return;
      }
      setSimStep({
        nodeId: path.nodes[index]!.id,
        edgeId: path.edgeIds[index - 1] ?? null,
      });
    }, 900);
  }, [stopSimulation]);

  useEffect(() => () => stopSimulation(), [stopSimulation]);

  const nodeActions = useMemo(
    () => ({
      onEdit: (nodeId: string) => {
        setSelectedNodeId(nodeId);
        setInspectorCollapsed(false);
        setNodes((current) =>
          current.map((node) => ({
            ...node,
            selected: node.id === nodeId,
          })),
        );
      },
      onDuplicate: (nodeId: string) => duplicateSelected(nodeId),
      onDelete: (nodeId: string) => deleteNode(nodeId),
      onCopy: (nodeId: string) => {
        const node = nodesRef.current.find((item) => item.id === nodeId);
        if (!node || node.type === 'start' || node.type === 'end') return;
        nodeClipboard = {
          type: (node.type ?? 'command') as WorkflowNodeType,
          data: structuredClone(node.data),
        };
      },
    }),
    [deleteNode, duplicateSelected, setNodes],
  );

  const edgeActions = useMemo(
    () => ({
      onDeleteEdge: (edgeId: string) => {
        pushHistory();
        setEdges((current) => current.filter((edge) => edge.id !== edgeId));
      },
    }),
    [pushHistory, setEdges],
  );

  const focusNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setInspectorCollapsed(false);
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          selected: node.id === nodeId,
        })),
      );
      const node = nodesRef.current.find((item) => item.id === nodeId);
      if (node && rfRef.current) {
        void rfRef.current.setCenter(node.position.x + 100, node.position.y + 40, {
          zoom: rfRef.current.getZoom(),
          duration: 280,
        });
      }
    },
    [setNodes],
  );

  const pasteClipboard = useCallback(
    (position?: { x: number; y: number }) => {
      if (!nodeClipboard) return;
      pushHistory();
      const id = crypto.randomUUID();
      const node: BuilderNode = {
        id,
        type: nodeClipboard.type,
        position: position ?? {
          x: 180 + Math.random() * 160,
          y: 120 + Math.random() * 160,
        },
        data: structuredClone(nodeClipboard.data),
        selected: true,
      };
      setNodes((current) => [...current.map((n) => ({ ...n, selected: false })), node]);
      setSelectedNodeId(id);
    },
    [pushHistory, setNodes],
  );

  const exportJson = useCallback(() => {
    const payload = {
      version: 1 as const,
      name: name.trim() || 'Untitled workflow',
      description: description.trim() || undefined,
      nodes: toFlowNodes(nodes),
      edges: toFlowEdges(edges),
      layout: toLayout(nodes),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'workflow'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [description, edges, name, nodes]);

  const deleteMutation = useMutation(
    trpc.workflow.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.workflow.list.queryFilter());
        router.push('/workflows');
      },
    }),
  );

  const handleSave = useCallback(() => {
    setSaveError(null);

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
  }, [
    description,
    edges,
    name,
    nodes,
    router,
    saveMutation,
    user,
    workflowId,
  ]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useBuilderHotkeys({
    enabled: !commandOpen && !shortcutsOpen && !previewOpen && !quickAdd.open,
    commandPaletteEnabled: !shortcutsOpen && !previewOpen && !quickAdd.open,
    onSave: handleSave,
    onUndo: undo,
    onRedo: redo,
    onDuplicate: () => duplicateSelected(),
    onDelete: () => {
      if (!selectedNodeId) return;
      deleteNode(selectedNodeId);
    },
    onOpenShortcuts: () => setShortcutsOpen(true),
    onOpenCommandPalette: () => setCommandOpen((open) => !open),
  });

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

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
    <BuilderNodeActionsProvider value={nodeActions}>
    <BuilderEdgeActionsProvider value={edgeActions}>
    <SimulationNodeProvider value={simStep?.nodeId ?? null}>
    <SimulationEdgeProvider value={simStep?.edgeId ?? null}>
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <BuilderToolbar
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSave={handleSave}
        saveStatus={resolvedSaveStatus}
        saveError={saveError}
        workflowId={workflowId}
        validationStatus={validation.status}
        onPreviewExecution={() => setPreviewOpen(true)}
        onSimulate={startSimulation}
        isSimulating={simStep !== null}
        preferences={preferences}
        onPreferencesChange={setPreferences}
        onExportJson={exportJson}
        onDuplicateWorkflow={() => {
          setWorkflowId(null);
          setName((current) => (current.endsWith(' (copy)') ? current : `${current} (copy)`));
          setBaseline('__unsaved__');
          setSavedJustNow(false);
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/builder');
          }
        }}
        onDeleteWorkflow={() => {
          if (!workflowId) return;
          if (!window.confirm('Delete this workflow permanently?')) return;
          deleteMutation.mutate({ id: workflowId });
        }}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        {paletteCollapsed ? (
          <aside className="blueprint-panel flex w-10 shrink-0 flex-col items-center border-r py-3">
            <PaletteCollapseButton
              collapsed
              onToggle={() => setPaletteCollapsed(false)}
            />
          </aside>
        ) : (
          <div className="relative flex">
            <NodePalette onAdd={addNode} />
            <div className="absolute top-2 right-2 z-10">
              <PaletteCollapseButton
                collapsed={false}
                onToggle={() => setPaletteCollapsed(true)}
              />
            </div>
          </div>
        )}
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
              onNodeDragStart={() => pushHistory()}
              onNodeDrag={(_event, node) => {
                if (preferences.snapToGrid) {
                  setHelperLines(null);
                  return;
                }
                const result = getHelperLines(node, nodesRef.current);
                setHelperLines(result.lines);
                setNodes((current) =>
                  current.map((item) =>
                    item.id === node.id
                      ? { ...item, position: result.position }
                      : item,
                  ),
                );
              }}
              onNodeDragStop={() => setHelperLines(null)}
              onInit={(instance) => {
                rfRef.current = instance;
              }}
              onPaneClick={(event) => {
                setContextMenu(null);
                if (event.detail !== 2) return;
                const position =
                  rfRef.current?.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                  }) ?? { x: 200, y: 200 };
                setQuickAdd({ open: true, position });
              }}
              onNodeContextMenu={(event, node) => {
                event.preventDefault();
                const canMutate = node.type !== 'start' && node.type !== 'end';
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  items: [
                    {
                      id: 'duplicate',
                      label: 'Duplicate',
                      hint: '⌘D',
                      disabled: !canMutate,
                      onSelect: () => duplicateSelected(node.id),
                    },
                    {
                      id: 'copy',
                      label: 'Copy',
                      disabled: !canMutate,
                      onSelect: () => nodeActions.onCopy(node.id),
                    },
                    {
                      id: 'delete',
                      label: 'Delete',
                      hint: 'Del',
                      danger: true,
                      disabled: !canMutate,
                      onSelect: () => deleteNode(node.id),
                    },
                    {
                      id: 'disable',
                      label: 'Disable',
                      disabled: true,
                      hint: 'Soon',
                      onSelect: () => undefined,
                    },
                  ],
                });
              }}
              onPaneContextMenu={(event) => {
                event.preventDefault();
                const clientX = 'clientX' in event ? event.clientX : 0;
                const clientY = 'clientY' in event ? event.clientY : 0;
                const position =
                  rfRef.current?.screenToFlowPosition({ x: clientX, y: clientY }) ?? {
                    x: 200,
                    y: 200,
                  };
                setContextMenu({
                  x: clientX,
                  y: clientY,
                  items: [
                    {
                      id: 'add',
                      label: 'Add Node',
                      onSelect: () => setQuickAdd({ open: true, position }),
                    },
                    {
                      id: 'paste',
                      label: 'Paste',
                      disabled: !nodeClipboard,
                      onSelect: () => pasteClipboard(position),
                    },
                    {
                      id: 'fit',
                      label: 'Fit View',
                      onSelect: () => {
                        void rfRef.current?.fitView({ padding: 0.2, duration: 200 });
                      },
                    },
                  ],
                });
              }}
              onEdgeContextMenu={(event, edge) => {
                event.preventDefault();
                setContextMenu({
                  x: event.clientX,
                  y: event.clientY,
                  items: [
                    {
                      id: 'delete-edge',
                      label: 'Delete',
                      danger: true,
                      onSelect: () => edgeActions.onDeleteEdge(edge.id),
                    },
                  ],
                });
              }}
              zoomOnDoubleClick={false}
              snapToGrid={preferences.snapToGrid}
              snapGrid={[22, 22]}
              nodeTypes={workflowNodeTypes}
              edgeTypes={workflowEdgeTypes}
              defaultEdgeOptions={{ type: 'workflow' }}
              fitView
              colorMode="dark"
              proOptions={{ hideAttribution: true }}
              className="!bg-transparent"
              deleteKeyCode={null}
              panOnScroll
            >
              {preferences.showGrid ? (
                <Background
                  gap={22}
                  size={1}
                  color="color-mix(in srgb, var(--foreground) 6%, transparent)"
                />
              ) : null}
              <HelperLinesOverlay lines={helperLines} />
              <CanvasToolbar
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                showGrid={preferences.showGrid}
                onToggleGrid={() =>
                  setPreferences((current) => ({
                    ...current,
                    showGrid: !current.showGrid,
                  }))
                }
              />
              {preferences.showMinimap ? (
                <MiniMap
                  pannable
                  zoomable
                  className="!bg-surface !border-border hidden sm:block"
                  maskColor="rgb(7 13 24 / 68%)"
                  maskStrokeColor="#5eead4"
                  maskStrokeWidth={2}
                  nodeStrokeWidth={2}
                  nodeStrokeColor={(node) =>
                    node.selected || node.id === simStep?.nodeId ? '#5eead4' : 'transparent'
                  }
                  nodeColor={(node) =>
                    node.selected || node.id === simStep?.nodeId
                      ? '#5eead4'
                      : nodeCategoryColor(node.type)
                  }
                />
              ) : null}
            </ReactFlow>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Loading canvas…
            </div>
          )}
          {quickAdd.open ? (
            <QuickAddPicker
              onClose={() => setQuickAdd((state) => ({ ...state, open: false }))}
              onSelect={(type) => {
                addNodeAt(type, quickAdd.position);
                setQuickAdd((state) => ({ ...state, open: false }));
              }}
            />
          ) : null}
          <BuilderContextMenu
            open={Boolean(contextMenu)}
            x={contextMenu?.x ?? 0}
            y={contextMenu?.y ?? 0}
            items={contextMenu?.items ?? []}
            onClose={() => setContextMenu(null)}
          />
        </div>
        <NodeInspector
          node={selectedNode}
          onChange={updateNodeData}
          onDelete={deleteNode}
          nodes={nodes}
          edges={edges}
          version={version}
          lastSavedAt={lastSavedAt}
          validation={validation}
          workflowName={name}
          width={inspectorWidth}
          onWidthChange={setInspectorWidth}
          collapsed={inspectorCollapsed}
          onToggleCollapsed={() => setInspectorCollapsed((value) => !value)}
          onFocusNode={focusNode}
        />
      </div>

      <ExecutionPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        nodes={nodes}
        edges={edges}
      />
      <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        actions={{
          onSave: handleSave,
          onUndo: undo,
          onRedo: redo,
          onFitView: () => {
            void rfRef.current?.fitView({ padding: 0.2, duration: 200 });
          },
          onPreview: () => setPreviewOpen(true),
          onSimulate: startSimulation,
          onOpenShortcuts: () => setShortcutsOpen(true),
          onAddNode: addNode,
        }}
      />
    </div>
    </SimulationEdgeProvider>
    </SimulationNodeProvider>
    </BuilderEdgeActionsProvider>
    </BuilderNodeActionsProvider>
  );
}
