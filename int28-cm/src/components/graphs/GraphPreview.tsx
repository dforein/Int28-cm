
interface PreviewNode {
  id: string;
  pos_x: number;
  pos_y: number;
  user_id: string;
  layer: number;
}

interface PreviewEdge {
  source_node_id: string;
  target_node_id: string;
}

interface Props {
  nodes: PreviewNode[];
  edges: PreviewEdge[];
  userColors: Record<string, string>;
  width?: number;
  height?: number;
}

function normalizePositions(
  nodes: PreviewNode[],
  w: number,
  h: number,
  padding: number
): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  if (nodes.length === 0) return map;

  if (nodes.length === 1) {
    map.set(nodes[0].id, { x: w / 2, y: h / 2 });
    return map;
  }

  const xs = nodes.map((n) => n.pos_x);
  const ys = nodes.map((n) => n.pos_y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  for (const n of nodes) {
    map.set(n.id, {
      x: padding + ((n.pos_x - minX) / rangeX) * (w - padding * 2),
      y: padding + ((n.pos_y - minY) / rangeY) * (h - padding * 2),
    });
  }
  return map;
}

export default function GraphPreview({
  nodes,
  edges,
  userColors,
  width = 220,
  height = 130,
}: Props) {
  const W = width;
  const H = height;
  const PAD = 18;
  const R = Math.max(3, Math.min(6, 80 / Math.max(nodes.length, 1)));

  const positions = normalizePositions(nodes, W, H, PAD);

  // If no real positions (all at 0,0), arrange in a circle
  const allSame = nodes.length > 1 &&
    nodes.every((n) => n.pos_x === nodes[0].pos_x && n.pos_y === nodes[0].pos_y);

  if (allSame) {
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2 - PAD;
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      positions.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
  }

  const rootId = nodes.find((n) => n.layer === -1)?.id ?? null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Edges */}
      {edges.map((e, i) => {
        const src = positions.get(e.source_node_id);
        const tgt = positions.get(e.target_node_id);
        if (!src || !tgt) return null;
        return (
          <line
            key={i}
            x1={src.x} y1={src.y}
            x2={tgt.x} y2={tgt.y}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const pos = positions.get(n.id);
        if (!pos) return null;
        const isRoot = n.id === rootId;
        const color = isRoot ? '#ffffff' : (userColors[n.user_id] ?? '#6b7cff');
        const opacity = isRoot ? 0.85 : 0.5;
        return (
          <circle
            key={n.id}
            cx={pos.x}
            cy={pos.y}
            r={isRoot ? R * 1.2 : R * 0.75}
            fill={color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}
