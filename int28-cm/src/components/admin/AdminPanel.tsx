import { useState, useEffect } from 'react';
import { createGraph, deleteGraph, getGraphs, getUsers, deleteUser } from '../../api/client';
import type { Graph } from '../../types';

interface User { id: string; name: string; color: string; created_at: number }

interface Props {
  userId: string;
  onCreated: (graph: Graph) => void;
  onDeleted: (graphId: string) => void;
  onClose: () => void;
}

export default function AdminPanel({ userId, onCreated, onDeleted, onClose }: Props) {
  const [tab, setTab] = useState<'graphs' | 'users'>('graphs');

  // Graphs state
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loadingGraphs, setLoadingGraphs] = useState(true);
  const [deletingGraphId, setDeletingGraphId] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    getGraphs()
      .then((res) => setGraphs(res.graphs))
      .catch(() => setError('Failed to load graphs.'))
      .finally(() => setLoadingGraphs(false));
  }, []);

  useEffect(() => {
    if (tab !== 'users' || users.length > 0) return;
    setLoadingUsers(true);
    getUsers()
      .then((res) => setUsers(res.users))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoadingUsers(false));
  }, [tab]);

  async function handleCreateGraph() {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const graph = await createGraph(name.trim(), userId);
      setGraphs((prev) => [graph, ...prev]);
      onCreated(graph);
      setName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create graph.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGraph(graph: Graph) {
    if (!confirm(`Delete "${graph.name}"? This will permanently remove all nodes and connections.`)) return;
    setDeletingGraphId(graph.id);
    try {
      await deleteGraph(graph.id);
      setGraphs((prev) => prev.filter((g) => g.id !== graph.id));
      onDeleted(graph.id);
    } catch {
      setError('Failed to delete graph.');
    } finally {
      setDeletingGraphId(null);
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Delete user "${user.name}"? This removes all their nodes and connections permanently.`)) return;
    setDeletingUserId(user.id);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      setError('Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleCopyId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        <div className="admin-panel-header">
          <span className="admin-badge">admin</span>
          <div className="admin-tabs">
            <button
              className={`admin-tab ${tab === 'graphs' ? 'admin-tab--active' : ''}`}
              onClick={() => setTab('graphs')}
            >Graphs</button>
            <button
              className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
              onClick={() => setTab('users')}
            >Users</button>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="admin-panel-body">
          {error && <p className="error-msg">{error}</p>}

          {tab === 'graphs' && (
            <>
              <label className="field-label">New graph</label>
              <div className="admin-input-row">
                <input
                  className="text-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateGraph()}
                  placeholder="e.g. Language and Power"
                  maxLength={120}
                  autoFocus
                />
                <button
                  className="primary-btn"
                  onClick={handleCreateGraph}
                  disabled={saving || !name.trim()}
                >
                  {saving ? '…' : 'Create'}
                </button>
              </div>

              <div className="admin-graph-list">
                <p className="field-label" style={{ marginBottom: 8 }}>All graphs</p>
                {loadingGraphs && <p className="admin-hint">Loading…</p>}
                {!loadingGraphs && graphs.length === 0 && <p className="admin-hint">No graphs yet.</p>}
                {graphs.map((g) => (
                  <div key={g.id} className="admin-graph-item">
                    <span className="admin-graph-name">{g.name}</span>
                    <button
                      className="danger-btn danger-btn--small"
                      onClick={() => handleDeleteGraph(g)}
                      disabled={deletingGraphId === g.id}
                    >
                      {deletingGraphId === g.id ? '…' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'users' && (
            <div className="admin-graph-list">
              <p className="field-label" style={{ marginBottom: 8 }}>All users</p>
              {loadingUsers && <p className="admin-hint">Loading…</p>}
              {!loadingUsers && users.length === 0 && <p className="admin-hint">No users yet.</p>}
              {users.map((u) => (
                <div key={u.id} className="admin-user-item">
                  <span className="admin-user-dot" style={{ background: u.color }} />
                  <div className="admin-user-info">
                    <span className="admin-user-name">{u.name}</span>
                    <span className="admin-user-id">{u.id}</span>
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopyId(u.id)}
                    title="Copy key"
                  >
                    {copiedId === u.id ? '✓' : 'Copy'}
                  </button>
                  <button
                    className="danger-btn danger-btn--small"
                    onClick={() => handleDeleteUser(u)}
                    disabled={deletingUserId === u.id || u.id === userId}
                    title={u.id === userId ? "Can't delete yourself" : 'Delete user'}
                  >
                    {deletingUserId === u.id ? '…' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
