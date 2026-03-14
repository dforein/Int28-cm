import { useEffect, useState } from 'react';
import type { Graph } from '../../types';
import { getGraphPreview, deleteGraph } from '../../api/client';
import GraphPreview from './GraphPreview';

interface PreviewData {
  nodes: Array<{ id: string; pos_x: number; pos_y: number; user_id: string; layer: number }>;
  edges: Array<{ source_node_id: string; target_node_id: string }>;
  userColors: Record<string, string>;
}

interface Props {
  graph: Graph;
  isAdmin?: boolean;
  onClick: () => void;
  onDeleted?: (id: string) => void;
}

export default function GraphCard({ graph, isAdmin, onClick, onDeleted }: Props) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const date = new Date(graph.created_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  useEffect(() => {
    getGraphPreview(graph.id)
      .then(setPreview)
      .catch(() => {});
  }, [graph.id]);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete graph "${graph.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteGraph(graph.id);
      onDeleted?.(graph.id);
    } catch {
      alert('Failed to delete graph.');
      setDeleting(false);
    }
  }

  return (
    <div className="graph-card-wrapper">
      <button className="graph-card" onClick={onClick} disabled={deleting}>
        <div className="graph-card-preview">
          {preview ? (
            <GraphPreview
              nodes={preview.nodes}
              edges={preview.edges}
              userColors={preview.userColors}
              width={220}
              height={130}
            />
          ) : (
            <svg viewBox="0 0 220 130" xmlns="http://www.w3.org/2000/svg">
              <circle cx="110" cy="65" r="4" fill="rgba(255,255,255,0.08)" />
            </svg>
          )}
        </div>
        <div className="graph-card-info">
          <span className="graph-card-name">{graph.name}</span>
          <span className="graph-card-date">{date}</span>
        </div>
      </button>
      {isAdmin && (
        <button
          className="graph-card-delete"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete graph"
        >
          {deleting ? '…' : '✕'}
        </button>
      )}
    </div>
  );
}
