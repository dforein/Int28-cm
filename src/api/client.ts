const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

// Users
export const createUser = (name: string, color: string) =>
  req<{ id: string; name: string; color: string }>('/users', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });

export const getUser = (id: string) =>
  req<{ id: string; name: string; color: string }>(`/users/${id}`);

export const getUsers = () =>
  req<{ users: Array<{ id: string; name: string; color: string; created_at: number }> }>('/users');

export const deleteUser = (userId: string) =>
  req<{ ok: boolean }>(`/users/${userId}`, { method: 'DELETE' });

// Graphs
export const getGraphs = () => req<{ graphs: import('../types').Graph[] }>('/graphs');

export const createGraph = (name: string, userId: string) =>
  req<import('../types').Graph>('/graphs', {
    method: 'POST',
    body: JSON.stringify({ name, created_by: userId }),
  });

export const getGraphPreview = (id: string) =>
  req<{
    nodes: Array<{ id: string; pos_x: number; pos_y: number; user_id: string; layer: number }>;
    edges: Array<{ source_node_id: string; target_node_id: string }>;
    userColors: Record<string, string>;
  }>(`/graphs/${id}/preview`);

export const getGraph = (id: string) =>
  req<{
    graph: import('../types').Graph;
    nodes: import('../types').GraphNode[];
    edges: import('../types').Edge[];
    userColors: Record<string, string>;
  }>(`/graphs/${id}`);

export const deleteGraph = (graphId: string) =>
  req<{ ok: boolean }>(`/graphs/${graphId}`, { method: 'DELETE' });

// Visit tracking
export const checkVisit = (graphId: string, userId: string) =>
  req<{ visited: boolean }>(`/graphs/${graphId}/visit?userId=${userId}`);

export const markVisit = (graphId: string, userId: string) =>
  req<{ ok: boolean }>(`/graphs/${graphId}/visit`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

// Nodes
export const createNode = (graphId: string, data: Omit<import('../types').GraphNode, 'id' | 'created_at'>) =>
  req<import('../types').GraphNode>(`/graphs/${graphId}/nodes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateNode = (nodeId: string, data: Partial<Pick<import('../types').GraphNode, 'title' | 'body' | 'pos_x' | 'pos_y'>>) =>
  req<import('../types').GraphNode>(`/nodes/${nodeId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteNode = (nodeId: string) =>
  req<{ ok: boolean }>(`/nodes/${nodeId}`, { method: 'DELETE' });

// Edges
export const createEdge = (graphId: string, data: Omit<import('../types').Edge, 'id'>) =>
  req<import('../types').Edge>(`/graphs/${graphId}/edges`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateEdge = (graphId: string, edgeId: string, data: Partial<Pick<import('../types').Edge, 'direction' | 'label'>>) =>
  req<import('../types').Edge>(`/graphs/${graphId}/edges/${edgeId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const deleteEdge = (graphId: string, edgeId: string) =>
  req<{ ok: boolean }>(`/graphs/${graphId}/edges/${edgeId}`, { method: 'DELETE' });

export const checkIsAdmin = (userId: string) =>
  req<{ isAdmin: boolean }>('/is-admin', {
    headers: { 'x-user-id': userId },
  });
