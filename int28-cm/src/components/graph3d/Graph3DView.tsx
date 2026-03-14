import { useRef, useState, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import type { GraphNode as AppNode, Edge as AppEdge } from '../../types';

interface UserColors { [userId: string]: string }
interface Props {
  nodes: AppNode[];
  edges: AppEdge[];
  userColors: UserColors;
  currentUserId: string;
  onBack: () => void;
}
type BloomMode = 'none' | 'center' | 'own';

function buildGraphData(nodes: AppNode[], edges: AppEdge[], userColors: UserColors, currentUserId: string) {
  const rootId = nodes.find((n) => n.layer === -1)?.id ?? null;
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.title,
      userId: n.user_id,
      isOwn: n.user_id === currentUserId,
      isRoot: n.id === rootId,
      baseColor: n.id === rootId ? '#ffffff' : (userColors[n.user_id] ?? '#6688aa'),
      val: n.id === rootId ? 5 : 3,
    })),
    links: edges.map((e) => ({ source: e.source_node_id, target: e.target_node_id })),
  };
}

export default function Graph3DView({ nodes, edges, userColors, currentUserId, onBack }: Props) {
  const fgRef = useRef<any>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [repulsion, setRepulsion] = useState(150);
  const [bloomMode, setBloomMode] = useState<BloomMode>('none');
  const [selectedNode, setSelectedNode] = useState<AppNode | null>(null);
  const bloomPassRef = useRef<any>(null);

  // Refs updated synchronously before render, callbacks always read fresh values
  const bloomModeRef = useRef<BloomMode>('none');
  const showLabelsRef = useRef(true);
  // Update refs synchronously (not in useEffect) so callbacks see latest value immediately
  bloomModeRef.current = bloomMode;
  showLabelsRef.current = showLabels;

  // graphData built once at mount
  const graphDataRef = useRef<ReturnType<typeof buildGraphData> | null>(null);
  if (graphDataRef.current === null) {
    graphDataRef.current = buildGraphData(nodes, edges, userColors, currentUserId);
  }

  // Repulsion
  useEffect(() => {
    const t = setTimeout(() => {
      fgRef.current?.d3Force('charge')?.strength(-repulsion);
      fgRef.current?.d3ReheatSimulation();
    }, 100);
    return () => clearTimeout(t);
  }, [repulsion]);

  // Bloom
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    let composer: any;
    try { composer = fg.postProcessingComposer(); } catch { return; }
    if (bloomPassRef.current) {
      try { composer.removePass(bloomPassRef.current); } catch { /**/ }
      bloomPassRef.current = null;
    }
    if (bloomMode === 'none') return;
    import('three/examples/jsm/postprocessing/UnrealBloomPass.js').then(({ UnrealBloomPass }) => {
      // threshold=0.1 keeps background/links dark, MeshBasicMaterial nodes are bright enough to bloom
      // strength low enough to avoid saturation
      const pass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        bloomMode === 'center' ? 0.9 : 0.4,    // strength (subtle for own)
        0.6,                                   // radius
        0.1                                    // threshold
      );
      try { composer.addPass(pass); bloomPassRef.current = pass; } catch { /**/ }
    }).catch(() => { /**/ });
  }, [bloomMode]);

  // Refresh node objects when showLabels changes
  useEffect(() => {
    fgRef.current?.refresh?.();
  }, [showLabels]);

  // Also refresh when bloomMode changes (node colors/spheres change)
  useEffect(() => {
    fgRef.current?.refresh?.();
  }, [bloomMode]);

  // Stable callbacks, refs updated synchronously above so always current
  const nodeThreeObject = useCallback((node: any) => {
    const mode = bloomModeRef.current;
    const showLbls = showLabelsRef.current;

    // Darken non-target nodes so only targets bloom
    const color = mode === 'center'
      ? (node.isRoot ? '#ffffff' : '#2a2a4a')
      : mode === 'own'
        ? ((node.isOwn || node.isRoot) ? node.baseColor : '#2a2a4a')
        : node.baseColor;

    const group = new THREE.Group();
    const radius = node.val ?? 3;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 })
    );
    group.add(sphere);

    // Label
    if (showLbls) {
      try {
        const sprite = new SpriteText(node.name);
        sprite.color = '#ffffff';
        sprite.textHeight = 4;
        sprite.backgroundColor = 'rgba(0,0,0,0.6)';
        sprite.padding = 1.5;
        sprite.borderRadius = 2;
        sprite.center.y = -0.6;
        sprite.position.y = radius + 6;
        group.add(sprite);
      } catch { /**/ }
    }

    return group;
  }, []); // empty deps, reads from refs synchronously updated above

  const handleNodeClick = useCallback((gNode: any) => {
    const appNode = nodes.find((n) => n.id === String(gNode.id));
    if (appNode) setSelectedNode(appNode);
  }, [nodes]);

  return (
    <div className="graph3d-screen">
      <div className="graph3d-toolbar">
        <button className="icon-btn" onClick={onBack}>← 2D</button>
        <span className="graph3d-toolbar-title">3D</span>
        <div className="graph3d-controls">
          <label className="graph3d-slider-label">
            <span>Force</span>
            <input
              type="range" min={30} max={500} value={repulsion}
              onChange={(e) => setRepulsion(Number(e.target.value))}
              className="graph3d-slider"
            />
            <span className="graph3d-slider-val">{repulsion}</span>
          </label>
          <button
            className={`secondary-btn ${showLabels ? 'secondary-btn--active' : ''}`}
            onClick={() => setShowLabels((v) => !v)}
          >Labels</button>
          <button
            className={`secondary-btn ${bloomMode === 'center' ? 'secondary-btn--active' : ''}`}
            onClick={() => setBloomMode((m) => m === 'center' ? 'none' : 'center')}
          >✦ Center</button>
          <button
            className={`secondary-btn ${bloomMode === 'own' ? 'secondary-btn--active' : ''}`}
            onClick={() => setBloomMode((m) => m === 'own' ? 'none' : 'own')}
          >✦ Mine</button>
        </div>
      </div>

      <ForceGraph3D
        ref={fgRef}
        graphData={graphDataRef.current}
        nodeLabel=""
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={() => 'rgba(255,255,255,0.25)'}
        linkWidth={0.5}
        linkOpacity={1}
        backgroundColor="#000003"
        onNodeClick={handleNodeClick}
        d3VelocityDecay={0.3}
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {selectedNode && (
        <div className="node-info-panel">
          <div className="node-info-header">
            <span className="node-info-dot" style={{ background: userColors[selectedNode.user_id] ?? '#fff' }} />
            <strong>{selectedNode.title}</strong>
            <button className="icon-btn" onClick={() => setSelectedNode(null)}>✕</button>
          </div>
          {selectedNode.body
            ? <div className="node-info-body">{selectedNode.body}</div>
            : <p className="node-info-empty">No body text.</p>
          }
        </div>
      )}
    </div>
  );
}
