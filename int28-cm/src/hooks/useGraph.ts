import { useEffect, useState } from 'react';
import { getGraph, checkVisit } from '../api/client';
import type { Graph, GraphNode, Edge } from '../types';
import { useUserStore } from '../store/userStore';

interface GraphState {
  graph: Graph | null;
  nodes: GraphNode[];
  edges: Edge[];
  userColors: { [userId: string]: string };
  isFirstTime: boolean;
  loading: boolean;
  error: string;
  reload: () => void;
}

export function useGraph(graphId: string): GraphState {
  const user = useUserStore((s) => s.user);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [userColors, setUserColors] = useState<{ [userId: string]: string }>({});
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');

    Promise.all([
      getGraph(graphId),
      checkVisit(graphId, user.id),
    ])
      .then(([data, visitData]) => {
        setGraph(data.graph);
        setNodes(data.nodes);
        setEdges(data.edges);
        setUserColors(data.userColors ?? {});
        setIsFirstTime(!visitData.visited);
      })
      .catch(() => setError('Could not load graph.'))
      .finally(() => setLoading(false));
  }, [graphId, user, tick]);

  return {
    graph,
    nodes,
    edges,
    userColors,
    isFirstTime,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}
