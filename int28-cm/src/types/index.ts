export interface User {
  id: string;
  name: string;
  color: string;
  created_at: number;
}

export interface Graph {
  id: string;
  name: string;
  created_by: string;
  created_at: number;
}

export interface GraphNode {
  id: string;
  graph_id: string;
  user_id: string;
  title: string;
  body?: string;
  pos_x: number;
  pos_y: number;
  layer: number;
  created_at: number;
}

export type EdgeDirection = 'none' | 'forward' | 'backward' | 'both';

export interface Edge {
  id: string;
  graph_id: string;
  source_node_id: string;
  target_node_id: string;
  user_id: string;
  direction: EdgeDirection;
  label?: string;
  layer: number;
  source_handle?: string;
  target_handle?: string;
}

export interface GraphVisit {
  user_id: string;
  graph_id: string;
  visited_at: number;
}

export interface UserCookie {
  id: string;
  name: string;
  color: string;
}

export interface NodeData extends Record<string, unknown> {
  node: GraphNode;
  userColor: string;
  isOwn: boolean;
  isFirstTime: boolean;
  isRoot?: boolean;
  isGhost?: boolean;
  onEdit: (node: GraphNode) => void;
}
