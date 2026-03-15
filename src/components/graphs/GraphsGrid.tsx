import { useEffect, useState, useRef } from 'react';
import { getGraphs, checkIsAdmin } from '../../api/client';
import type { Graph } from '../../types';
import { useUserStore } from '../../store/userStore';
import GraphCard from './GraphCard';
import PrivacyPolicy from '../PrivacyPolicy';
import AdminPanel from '../admin/AdminPanel';

interface Props {
  onSelect: (graphId: string) => void;
}

export default function GraphsGrid({ onSelect }: Props) {
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // LOCAL DEV ONLY - comment after local dev is done
    //if (import.meta.env.VITE_ADMIN_USER_ID && user.id === import.meta.env.VITE_ADMIN_USER_ID) { setIsAdmin(true); console.log("DEBUG OK"); return; }

    // Production: verify via API (uses ADMIN_USER_ID secret)
    console.log("DEBUG NOT OK" + import.meta.env.VITE_ADMIN_USER_ID)
    checkIsAdmin(user.id).then((r) => setIsAdmin(r.isAdmin)).catch(() => {});
  }, [user]);

  useEffect(() => {
    getGraphs()
      .then((res) => setGraphs(res.graphs))
      .catch(() => setError('Could not load graphs.'))
      .finally(() => setLoading(false));
  }, []);

  function handleNameClick() {
    // Triple-click opens admin for admin users
    if (!isAdmin) return;
    clickCount.current += 1;
    clearTimeout(clickTimer.current ?? undefined);
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      setShowAdmin(true);
    } else {
      clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 600);
    }
  }

  async function handleCopyId() {
    if (!user) return;
    await navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="graphs-screen">
      <header className="graphs-header">
        <button
          className="graphs-top-btn"
          onClick={handleNameClick}
          title={isAdmin ? 'Triple-click to open admin' : undefined}
        >
          <span
            className="auth-top-dot"
            style={isAdmin ? { background: '#f0a500' } : undefined}
          />
          <span className="graphs-top-text">int28-cm</span>
        </button>

        <div className="graphs-header-right">
          <button
            className="user-chip"
            style={{ '--chip-color': user?.color ?? '#6b7cff' } as React.CSSProperties}
            onClick={() => setShowUserMenu((v) => !v)}
          >
            <span className="user-chip-dot" />
            <span className="user-chip-name">{user?.name}</span>
          </button>
        </div>
      </header>

      {showUserMenu && (
        <div className="user-menu">
          <div className="user-menu-id">
            <span className="field-label" style={{ marginTop: 0 }}>Your key</span>
            <div className="id-display" style={{ marginTop: 6 }}>
              <code>{user?.id}</code>
              <button className="copy-btn" onClick={handleCopyId}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          <button
            className="danger-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { clearUser(); setShowUserMenu(false); }}
          >
            Log out
          </button>
        </div>
      )}

      <main className="graphs-main">
        <h1 className="graphs-title">Graphs</h1>
        {loading && <p className="graphs-loading">Loading…</p>}
        {error && <p className="error-msg">{error}</p>}
        {!loading && !error && graphs.length === 0 && (
          <p className="graphs-empty">No graphs yet.</p>
        )}
        <div className="graphs-grid">
          {graphs.map((g) => (
            <GraphCard
              key={g.id}
              graph={g}
              isAdmin={isAdmin}
              onClick={() => onSelect(g.id)}
              onDeleted={(id) => setGraphs((prev) => prev.filter((gr) => gr.id !== id))}
            />
          ))}
        </div>
      </main>

      <footer className="app-footer" style={{position:"sticky",textAlign:"right"}}>
        <button className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
      </footer>

      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}

      {showAdmin && isAdmin && (
        <AdminPanel
          userId={user!.id}
          onCreated={(g) => setGraphs((prev) => [g, ...prev])}
          onDeleted={(id) => setGraphs((prev) => prev.filter((g) => g.id !== id))}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
}
