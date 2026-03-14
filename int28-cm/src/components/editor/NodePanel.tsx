import { useState, useEffect } from 'react';
import type { GraphNode } from '../../types';

interface Props {
  node: GraphNode | null;
  onClose: () => void;
  onSaved: (node: GraphNode) => void;
  onDeleted: (nodeId: string) => void;
}

export default function NodePanel({ node, onClose, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setBody(node.body ?? '');
    }
  }, [node]);

  if (!node) return null;

  function handleSave() {
    if (!node || !title.trim()) return;
    onSaved({ ...node, title: title.trim(), body: body.trim() || undefined });
  }

  function handleDelete() {
    if (!node || !confirm('Delete this node and all its connections?')) return;
    onDeleted(node.id);
  }

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <span>Edit node</span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="side-panel-body">
        <label className="field-label">Title</label>
        <input
          className="text-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <label className="field-label">Body <span className="field-hint">(optional)</span></label>
        <textarea
          className="text-area"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="Write anything…"
        />
      </div>
      <div className="side-panel-footer">
        <button className="danger-btn" onClick={handleDelete}>Delete</button>
        <button className="primary-btn" onClick={handleSave} disabled={!title.trim()}>
          Save
        </button>
      </div>
    </div>
  );
}
