import { useState, useEffect } from 'react';
import type { Edge, EdgeDirection } from '../../types';
import { updateEdge, deleteEdge } from '../../api/client';

interface Props {
  edge: Edge | null;
  graphId: string;
  onClose: () => void;
  onSaved: (edge: Edge) => void;
  onDeleted: (edgeId: string) => void;
}

const DIRECTIONS: { value: EdgeDirection; label: string }[] = [
  { value: 'none', label: '— No direction' },
  { value: 'forward', label: '→ Forward (source → target)' },
  { value: 'backward', label: '← Backward (target → source)' },
  { value: 'both', label: '↔ Bidirectional' },
];

export default function EdgePanel({ edge, graphId, onClose, onSaved, onDeleted }: Props) {
  const [direction, setDirection] = useState<EdgeDirection>('none');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (edge) {
      setDirection(edge.direction);
      setLabel(edge.label ?? '');
    }
  }, [edge]);

  if (!edge) return null;

  async function handleSave() {
    if (!edge) return;
    setSaving(true);
    try {
      const updated = await updateEdge(graphId, edge.id, { direction, label: label.trim() || undefined });
      onSaved(updated);
      onClose();
    } catch {
      alert('Failed to save connection.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!edge) return;
    try {
      await deleteEdge(graphId, edge.id);
      onDeleted(edge.id);
      onClose();
    } catch {
      alert('Failed to delete connection.');
    }
  }

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <span>Edit connection</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="side-panel-body">
        <label className="field-label">Direction</label>
        <div className="direction-options">
          {DIRECTIONS.map((d) => (
            <label key={d.value} className={`direction-option ${direction === d.value ? 'direction-option--active' : ''}`}>
              <input
                type="radio"
                name="direction"
                value={d.value}
                checked={direction === d.value}
                onChange={() => setDirection(d.value)}
              />
              {d.label}
            </label>
          ))}
        </div>
        <label className="field-label">Label <span className="field-hint">(2D only, optional)</span></label>
        <input
          className="text-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Describe the connection…"
          maxLength={120}
        />
      </div>
      <div className="side-panel-footer">
        <button className="danger-btn" onClick={handleDelete}>Delete</button>
        <button className="primary-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
