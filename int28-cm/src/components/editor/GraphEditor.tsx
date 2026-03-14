import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ConnectionMode,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { GraphNode as AppNode, Edge as AppEdge, EdgeDirection } from '../../types';
import { useUserStore } from '../../store/userStore';
import { createNode, createEdge, updateNode, deleteNode, deleteEdge, markVisit } from '../../api/client';
import CustomNode from './CustomNode';
import NodePanel from './NodePanel';
import EdgePanel from './EdgePanel';
import LayerControls from './LayerControls';
import FirstTimeOverlay from './FirstTimeOverlay';

const nodeTypes = { custom: CustomNode };

function directionToMarkers(dir: EdgeDirection) {
  if (dir === 'forward') return { markerEnd: { type: MarkerType.ArrowClosed } };
  if (dir === 'backward') return { markerStart: { type: MarkerType.ArrowClosed } };
  if (dir === 'both') return {
    markerEnd: { type: MarkerType.ArrowClosed },
    markerStart: { type: MarkerType.ArrowClosed },
  };
  return {};
}

interface UserColors { [userId: string]: string }

interface Props {
  graphId: string;
  initialNodes: AppNode[];
  initialEdges: AppEdge[];
  userColors: UserColors;
  isFirstTime: boolean;
  onFirstTimeDone: () => void;
  onOpen3D: () => void;
  onBack: () => void;
  onNodesChange?: (nodes: AppNode[]) => void;
  onEdgesChange?: (edges: AppEdge[]) => void;
}

// Pending operations queue for auto-save
type PendingOp =
  | { type: 'createNode'; node: AppNode }
  | { type: 'updateNode'; nodeId: string; data: Partial<Pick<AppNode, 'title' | 'body' | 'pos_x' | 'pos_y'>> }
  | { type: 'deleteNode'; nodeId: string }
  | { type: 'createEdge'; edge: AppEdge }
  | { type: 'deleteEdge'; graphId: string; edgeId: string };

// Snapshot for undo
type Snapshot = { nodes: AppNode[]; edges: AppEdge[] };

function GraphEditorInner({
  graphId,
  initialNodes,
  initialEdges,
  userColors,
  isFirstTime: initFirstTime,
  onFirstTimeDone,
  onOpen3D,
  onBack,
  onNodesChange: notifyNodes,
  onEdgesChange: notifyEdges,
}: Props) {
  const user = useUserStore((s) => s.user)!;
  const { screenToFlowPosition } = useReactFlow();
  const [isFirstTime, setIsFirstTime] = useState(initFirstTime);
  const [overlayVisible, setOverlayVisible] = useState(initFirstTime); // hides banner, doesn't complete first-time

  // Root node id (layer 0, created with graph — first node in list)
  const rootNodeId = useMemo(
    () => initialNodes.find((n) => n.layer === -1)?.id ?? null,
    [initialNodes]
  );

  // Layer state
  const [currentLayer, setCurrentLayer] = useState(0);
  const [visibleLayers, setVisibleLayers] = useState<Set<number>>(new Set([-1, 0]));

  const maxLayer = useMemo(
    () => Math.max(0, ...initialNodes.map((n) => n.layer)),
    [initialNodes]
  );

  useEffect(() => {
    if (!isFirstTime) {
      const all = new Set([-1, ...Array.from({ length: maxLayer + 1 }, (_, i) => i)]);
      setVisibleLayers(all);
    }
  }, [isFirstTime, maxLayer]);

  // App state
  const [appNodes, setAppNodes] = useState<AppNode[]>(initialNodes);
  const [appEdges, setAppEdges] = useState<AppEdge[]>(initialEdges);
  const [editingNode, setEditingNode] = useState<AppNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<AppEdge | null>(null);

  // Refs always reflecting latest state — used in keydown to avoid stale closures
  const appNodesRef = useRef<AppNode[]>(initialNodes);
  const appEdgesRef = useRef<AppEdge[]>(initialEdges);
  const rfNodesRef  = useRef<ReturnType<typeof toRFNodes>>([]);
  const rfEdgesRef  = useRef<ReturnType<typeof toRFEdges>>([]);
  useEffect(() => { appNodesRef.current = appNodes; }, [appNodes]);
  useEffect(() => { appEdgesRef.current = appEdges; }, [appEdges]);


  // Save status
  type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingOps = useRef<PendingOp[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enqueueSave(op: PendingOp) {
    pendingOps.current.push(op);
    setSaveStatus('pending');
    clearTimeout(saveTimer.current ?? undefined);
    saveTimer.current = setTimeout(flushSave, 1500);
  }

  async function flushSave() {
    if (!pendingOps.current.length) return;
    const ops = [...pendingOps.current];
    pendingOps.current = [];
    setSaveStatus('saving');
    try {
      // Deduplicate: keep only latest updateNode per nodeId,
      // and skip updateNode for nodes that are also being deleted in the same batch
      const deletedNodeIds = new Set(
        ops.filter((op) => op.type === 'deleteNode').map((op) => (op as { type: 'deleteNode'; nodeId: string }).nodeId)
      );
      const seenUpdateNode = new Map<string, number>();
      ops.forEach((op, i) => {
        if (op.type === 'updateNode') seenUpdateNode.set(op.nodeId, i);
      });
      const deduped: PendingOp[] = [];
      ops.forEach((op, i) => {
        if (op.type === 'updateNode') {
          if (seenUpdateNode.get(op.nodeId) === i && !deletedNodeIds.has(op.nodeId)) deduped.push(op);
        } else {
          deduped.push(op);
        }
      });

      for (const op of deduped) {
        if (op.type === 'createNode') {
          // Already created live, nothing to do
        } else if (op.type === 'updateNode') {
          await updateNode(op.nodeId, op.data);
        } else if (op.type === 'deleteNode') {
          await deleteNode(op.nodeId).catch(() => null);
        } else if (op.type === 'createEdge') {
          // Already created live, nothing to do
        } else if (op.type === 'deleteEdge') {
          await deleteEdge(op.graphId, op.edgeId).catch(() => null);
        }
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      pendingOps.current = [...ops, ...pendingOps.current];
    }
  }

  // Undo stack (30 snapshots)
  const undoStack = useRef<Snapshot[]>([]);

  function pushUndo() {
    // Read from refs (always current) instead of closure (may be stale in async contexts)
    undoStack.current.push({ nodes: [...appNodesRef.current], edges: [...appEdgesRef.current] });
    if (undoStack.current.length > 30) undoStack.current.shift();
  }

  // React Flow conversion
  function toRFNodes(nodes: AppNode[]) {
    const visibleNodes = isFirstTime
      ? nodes // show all nodes in first-time mode (others as ghosts)
      : nodes.filter((n) => n.id === rootNodeId || visibleLayers.has(n.layer));

    return visibleNodes.map((n) => {
      const isOwn = n.user_id === user.id;
      const isRoot = n.id === rootNodeId;
      const isGhost = isFirstTime && !isOwn && !isRoot; // root always visible
      // Always use own color for own nodes, use stored color for others (or dim for ghosts)
      const userColor = userColors[n.user_id] ?? (isOwn ? user.color : '#555');

      return {
        id: n.id,
        type: 'custom',
        position: { x: n.pos_x, y: n.pos_y },
        draggable: isOwn && !isRoot && !isGhost,
        selectable: isOwn,
        data: {
          node: n,
          userColor,
          isOwn,
          isFirstTime,
          isRoot,
          isGhost,
          onEdit: (node: AppNode) => {
            if (!isOwn || isRoot) return;
            setEditingEdge(null);
            setEditingNode(node);
          },
        },
      };
    });
  }

  function toRFEdges(edges: AppEdge[]) {
    return edges
      .filter((e) => visibleLayers.has(e.layer))
      .map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        sourceHandle: e.source_handle ?? null,
        targetHandle: e.target_handle ?? null,
        label: e.label,
        labelStyle: { fill: '#ccc', fontSize: 11 },
        labelBgStyle: { fill: '#1a1a1f', fillOpacity: 0.85 },
        labelBgPadding: [4, 6] as [number, number],
        ...directionToMarkers(e.direction),
        data: { edge: e },
        style: { stroke: '#888', strokeWidth: 1.5, opacity: 0.65 },
      }));
  }

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(toRFNodes(initialNodes));
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(toRFEdges(initialEdges));

  // Keep rf refs in sync for keydown handler
  useEffect(() => { rfNodesRef.current = rfNodes; }, [rfNodes]);
  useEffect(() => { rfEdgesRef.current = rfEdges; }, [rfEdges]);

  // Notify parent for 3D sync
  useEffect(() => { notifyNodes?.(appNodes); }, [appNodes]);
  useEffect(() => { notifyEdges?.(appEdges); }, [appEdges]);

  // Sync RF when visibility/data changes
  useEffect(() => {
    setRfNodes(toRFNodes(appNodes));
    setRfEdges(toRFEdges(appEdges));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLayers, isFirstTime, appNodes, appEdges]);

  // Create node (double-click canvas)
  const onPaneDoubleClick = useCallback(
    async (evt: React.MouseEvent) => {
      if ((evt.target as HTMLElement).closest('.react-flow__node, .react-flow__edge')) return;
      const { x, y } = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
      try {
        pushUndo();
        const newNode = await createNode(graphId, {
          graph_id: graphId,
          user_id: user.id,
          title: 'New node',
          pos_x: x,
          pos_y: y,
          layer: currentLayer,
        });
        setAppNodes((prev) => [...prev, newNode]);
        setEditingNode(newNode);
        enqueueSave({ type: 'createNode', node: newNode });
      } catch {
        alert('Could not create node.');
      }
    },
    [graphId, user.id, currentLayer, screenToFlowPosition]
  );

  // Create edge (connect)
  const onConnect = useCallback(
    async (connection: Connection) => {
      try {
        pushUndo();
        const newEdge = await createEdge(graphId, {
          graph_id: graphId,
          source_node_id: connection.source!,
          target_node_id: connection.target!,
          user_id: user.id,
          direction: 'none',
          layer: currentLayer,
          source_handle: connection.sourceHandle ?? undefined,
          target_handle: connection.targetHandle ?? undefined,
        });
        setAppEdges((prev) => [...prev, newEdge]);
        setEditingEdge(newEdge);
        enqueueSave({ type: 'createEdge', edge: newEdge });
      } catch {
        alert('Could not create connection.');
      }
    },
    [graphId, user.id, currentLayer]
  );

  // Drag node
  const onNodeDragStop: NodeMouseHandler = useCallback(
    async (_evt: React.MouseEvent, rfNode: { id: string; position: { x: number; y: number } }) => {
      if (rfNode.id === rootNodeId) return;
      const { x, y } = rfNode.position;
      pushUndo();
      setAppNodes((prev) =>
        prev.map((n) => (n.id === rfNode.id ? { ...n, pos_x: x, pos_y: y } : n))
      );
      enqueueSave({ type: 'updateNode', nodeId: rfNode.id, data: { pos_x: x, pos_y: y } });
    },
    [rootNodeId]
  );

  // Edge click: close node panel, open edge panel
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_, rfEdge) => {
      const ae = appEdges.find((e) => e.id === rfEdge.id);
      if (ae && ae.user_id === user.id) {
        setEditingNode(null);
        setEditingEdge(ae);
      }
    },
    [appEdges, user.id]
  );

  // Delete (Canc/Backspace) + Ctrl+Z undo
  // Uses refs to avoid stale closures, always reads latest state
  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const curAppNodes = appNodesRef.current;
      const curAppEdges = appEdgesRef.current;
      const curRfNodes  = rfNodesRef.current;
      const curRfEdges  = rfEdgesRef.current;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selNodes = curRfNodes.filter((n) => n.selected && n.id !== rootNodeId);
        const selEdges = curRfEdges.filter((ed) => ed.selected);
        if (!selNodes.length && !selEdges.length) return;
        pushUndo();

        selEdges.forEach((ed) => enqueueSave({ type: 'deleteEdge', graphId, edgeId: ed.id }));
        selNodes
          .filter((n) => curAppNodes.find((a) => a.id === n.id)?.user_id === user.id)
          .forEach((n) => enqueueSave({ type: 'deleteNode', nodeId: n.id }));

        const deletedNodeIds = new Set(selNodes.map((n) => n.id));
        const deletedEdgeIds = new Set(selEdges.map((ed) => ed.id));
        setAppNodes((prev) => prev.filter((n) => !deletedNodeIds.has(n.id)));
        setAppEdges((prev) => prev.filter((ed) =>
          !deletedEdgeIds.has(ed.id) &&
          !deletedNodeIds.has(ed.source_node_id) &&
          !deletedNodeIds.has(ed.target_node_id)
        ));
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const snap = undoStack.current.pop();
        if (!snap) return;

        clearTimeout(saveTimer.current ?? undefined);
        pendingOps.current = [];

        const currentNodeIds = new Set(curAppNodes.map((n) => n.id));
        const currentEdgeIds = new Set(curAppEdges.map((ed) => ed.id));
        const snapNodeIds    = new Set(snap.nodes.map((n) => n.id));
        const snapEdgeIds    = new Set(snap.edges.map((ed) => ed.id));

        const nodesToRestore = snap.nodes.filter((n) => !currentNodeIds.has(n.id));
        const nodesToDelete  = curAppNodes.filter((n) => !snapNodeIds.has(n.id));
        const edgesToRestore = snap.edges.filter((ed) => !currentEdgeIds.has(ed.id));
        const edgesToDelete  = curAppEdges.filter((ed) => !snapEdgeIds.has(ed.id));

        setSaveStatus('saving');
        try {
          await Promise.all([
            ...nodesToDelete.map((n) => deleteNode(n.id).catch(() => null)),
            ...edgesToDelete.map((ed) => deleteEdge(graphId, ed.id).catch(() => null)),
          ]);
          const restorable = edgesToRestore.filter(
            (ed) =>
              snapNodeIds.has(ed.source_node_id) &&
              snapNodeIds.has(ed.target_node_id) &&
              !nodesToRestore.some((n) => n.id === ed.source_node_id || n.id === ed.target_node_id)
          );
          await Promise.all(
            restorable.map((ed) =>
              createEdge(graphId, {
                graph_id: graphId,
                source_node_id: ed.source_node_id,
                target_node_id: ed.target_node_id,
                user_id: ed.user_id,
                direction: ed.direction,
                label: ed.label,
                layer: ed.layer,
                source_handle: ed.source_handle,
                target_handle: ed.target_handle,
              }).catch(() => null)
            )
          );
          await Promise.all(
            snap.nodes
              .filter((sn) => {
                const cur = curAppNodes.find((n) => n.id === sn.id);
                return cur && (cur.pos_x !== sn.pos_x || cur.pos_y !== sn.pos_y);
              })
              .map((sn) => updateNode(sn.id, { pos_x: sn.pos_x, pos_y: sn.pos_y }).catch(() => null))
          );
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }

        setAppNodes(snap.nodes);
        setAppEdges(snap.edges);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId, user.id, rootNodeId]); // stable deps only — state read from refs

  // Node saved from panel
  function handleNodeSaved(updated: AppNode) {
    pushUndo();
    setAppNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    enqueueSave({ type: 'updateNode', nodeId: updated.id, data: { title: updated.title, body: updated.body } });
    setEditingNode(null);
  }

  function handleNodeDeleted(nodeId: string) {
    pushUndo();
    setAppNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setAppEdges((prev) => prev.filter((ed) => ed.source_node_id !== nodeId && ed.target_node_id !== nodeId));
    enqueueSave({ type: 'deleteNode', nodeId });
    setEditingNode(null);
  }

  function handleEdgeSaved(updated: AppEdge) {
    pushUndo();
    setAppEdges((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingEdge(null);
  }

  function handleEdgeDeleted(edgeId: string) {
    pushUndo();
    setAppEdges((prev) => prev.filter((e) => e.id !== edgeId));
    enqueueSave({ type: 'deleteEdge', graphId, edgeId });
    setEditingEdge(null);
  }

  // First time + layers
  async function handleFirstTimeDone() {
    await markVisit(graphId, user.id);
    setIsFirstTime(false);
    onFirstTimeDone();
  }

  function toggleLayer(layer: number) {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  // Save status label
  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'pending' ? 'Unsaved' :
    saveStatus === 'error'   ? 'Save error' :
    'Saved';

  const saveDot =
    saveStatus === 'saving' ? '#f0a500' :
    saveStatus === 'pending' ? '#f0a500' :
    saveStatus === 'error'   ? '#e05555' :
    '#4caf7d';

  return (
    <div className="editor-screen">
      {overlayVisible && isFirstTime && (
        <FirstTimeOverlay userName={user.name} onClose={() => setOverlayVisible(false)} />
      )}

      <div className="editor-toolbar">
        <button className="icon-btn" onClick={onBack} title="Back to graphs">←</button>
        <span className="editor-toolbar-title">Graph editor</span>
        <div className="editor-toolbar-right">
          <span className="save-status" title={saveLabel}>
            <span className="save-dot" style={{ background: saveDot }} />
            {saveLabel}
          </span>
          {isFirstTime && (
            <button className="primary-btn" onClick={handleFirstTimeDone}>
              Show →
            </button>
          )}
          {!isFirstTime && (
            <button className="secondary-btn" onClick={onOpen3D}>3D view</button>
          )}
          <button
            className={`icon-btn help-btn ${helpOpen ? 'help-btn--active' : ''}`}
            onClick={() => setHelpOpen((v) => !v)}
            title="Help"
          >?</button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-sidebar-left">
          <LayerControls
            maxLayer={maxLayer}
            visibleLayers={visibleLayers}
            onToggle={toggleLayer}
            currentLayer={currentLayer}
            onChangeLayer={setCurrentLayer}
          />
        </div>

        <div className="editor-canvas">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onEdgeClick={onEdgeClick}
            onDoubleClick={onPaneDoubleClick}
            zoomOnDoubleClick={false}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
            <Controls />
            <MiniMap nodeColor={(n) => {
              const d = n.data as { userColor: string; isRoot?: boolean };
              return d.isRoot ? '#111111' : d.userColor;
            }} />
          </ReactFlow>
        </div>

        {(editingNode || editingEdge) && (
          <div
            className="panel-backdrop"
            onClick={() => { setEditingNode(null); setEditingEdge(null); }}
          />
        )}

        {editingNode && (
          <NodePanel
            node={editingNode}
            onClose={() => setEditingNode(null)}
            onSaved={handleNodeSaved}
            onDeleted={handleNodeDeleted}
          />
        )}

        {editingEdge && !editingNode && (
          <EdgePanel
            edge={editingEdge}
            graphId={graphId}
            onClose={() => setEditingEdge(null)}
            onSaved={handleEdgeSaved}
            onDeleted={handleEdgeDeleted}
          />
        )}
        {helpOpen && (
          <div className="help-panel">
            <div className="help-panel-header">
              <span>How it works</span>
              <button className="icon-btn" onClick={() => setHelpOpen(false)}>✕</button>
            </div>
            <div className="help-panel-body">
              <p><strong>Double-click</strong> on the canvas to create a node</p>
              <p><strong>Double-click</strong> a node to edit its title and body</p>
              <p><strong>Drag</strong> from a handle (●) to connect nodes</p>
              <p><strong>Click</strong> a connection to edit direction and label</p>
              <p><strong>Delete / Backspace</strong> to remove selected nodes or connections</p>
              <p><strong>Ctrl+Z</strong> to undo the last action</p>
              <p>Use the <strong>layer controls</strong> on the left to organise nodes by depth: 
              higher layers for analysis or critique, lower layers for normal conceptual development 
              but also new development from/response to higher nodes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GraphEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner {...props} />
    </ReactFlowProvider>
  );
}
