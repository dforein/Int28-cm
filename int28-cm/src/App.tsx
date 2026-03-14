import { useState } from 'react';
import AuthGate from './components/auth/AuthGate';
import GraphsGrid from './components/graphs/GraphsGrid';
import GraphEditor from './components/editor/GraphEditor';
import Graph3DView from './components/graph3d/Graph3DView';
import { useGraph } from './hooks/useGraph';
import { useUserStore } from './store/userStore';
import type { GraphNode, Edge } from './types';

type View = 'grid' | 'editor' | '3d';

function GraphLoader({
  graphId,
  view,
  onOpen3D,
  onBack,
  onBack3D,
}: {
  graphId: string;
  view: View;
  onOpen3D: () => void;
  onBack: () => void;
  onBack3D: () => void;
}) {
  const { graph, nodes: fetchedNodes, edges: fetchedEdges, userColors, isFirstTime, loading, error, reload } = useGraph(graphId);
  const currentUser = useUserStore((s) => s.user);

  const [liveNodes, setLiveNodes] = useState<GraphNode[] | null>(null);
  const [liveEdges, setLiveEdges] = useState<Edge[] | null>(null);

  if (loading) return <div className="fullscreen-center">Loading graph…</div>;
  if (error || !graph) return <div className="fullscreen-center error-msg">{error || 'Not found'}</div>;

  const nodes = liveNodes ?? fetchedNodes;
  const edges = liveEdges ?? fetchedEdges;

  return (
    <>
      <div style={{ display: view === 'editor' ? 'contents' : 'none' }}>
        <GraphEditor
          graphId={graphId}
          initialNodes={fetchedNodes}
          initialEdges={fetchedEdges}
          userColors={userColors}
          isFirstTime={isFirstTime}
          onFirstTimeDone={reload}
          onOpen3D={onOpen3D}
          onBack={onBack}
          onNodesChange={setLiveNodes}
          onEdgesChange={setLiveEdges}
        />
      </div>
      {view === '3d' && (
        <Graph3DView
          nodes={nodes}
          edges={edges}
          userColors={userColors}
          currentUserId={currentUser?.id ?? ''}
          onBack={onBack3D}
        />
      )}
    </>
  );
}

export default function App() {
  const [view, setView] = useState<View>('grid');
  const [activeGraphId, setActiveGraphId] = useState<string | null>(null);

  function openGraph(id: string) {
    setActiveGraphId(id);
    setView('editor');
  }

  return (
    <AuthGate>
      {view === 'grid' && <GraphsGrid onSelect={openGraph} />}
      {(view === 'editor' || view === '3d') && activeGraphId && (
        <GraphLoader
          graphId={activeGraphId}
          view={view}
          onOpen3D={() => setView('3d')}
          onBack={() => setView('grid')}
          onBack3D={() => setView('editor')}
        />
      )}
    </AuthGate>
  );
}
