import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeData } from '../../types';

interface Props {
  data: NodeData;
  selected: boolean;
}

function getShape(layer: number) {
  if (layer <= 0) return 'circle'; // -1 (root) and 0 both circle
  if (layer === 1) return 'diamond';
  return 'rect';
}

const HANDLES = [
  { id: 'n',  position: Position.Top,    style: { left: '50%' } },
  { id: 's',  position: Position.Bottom, style: { left: '50%' } },
  { id: 'w',  position: Position.Left,   style: { top: '50%' } },
  { id: 'e',  position: Position.Right,  style: { top: '50%' } },
  { id: 'nw', position: Position.Top,    style: { left: '20%' } },
  { id: 'ne', position: Position.Top,    style: { left: '80%' } },
  { id: 'sw', position: Position.Bottom, style: { left: '20%' } },
  { id: 'se', position: Position.Bottom, style: { left: '80%' } },
];

function CustomNode({ data, selected }: Props) {
  const { node, userColor, isOwn, isFirstTime, isRoot, isGhost } = data;
  const [hovered, setHovered] = useState(false);
  const shape = getShape(node.layer);

  if (isGhost) {
    const ghostSize = isRoot ? 110 : shape === 'circle' ? 72 : shape === 'diamond' ? 64 : 60;
    const ghostStyle: React.CSSProperties = {
      width: ghostSize,
      height: ghostSize,
      background: 'rgba(255,255,255,0.04)',
      border: '1.5px dashed rgba(255,255,255,0.12)',
      borderRadius: shape === 'circle' ? '50%' : shape === 'diamond' ? 4 : 8,
      transform: shape === 'diamond' ? 'rotate(45deg)' : undefined,
      pointerEvents: 'none',
    };
    return <div style={ghostStyle} />;
  }

  const opacity = isFirstTime && !isOwn ? 0.2 : 1;

  const handleVisStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    background: userColor,
    border: '2px solid #0c0c0d',
    borderRadius: '50%',
    opacity: hovered ? 1 : 0,
    transition: 'opacity 0.15s',
    zIndex: 10,
  };

  const baseStyle: React.CSSProperties = {
    opacity,
    background: isRoot ? 'rgba(255,255,255,0.08)' : `${userColor}18`,
    border: `${isRoot ? 3 : 1.5}px solid ${isRoot ? 'rgba(255,255,255,0.7)' : userColor}`,
    color: '#f0f0f0',
    cursor: isRoot ? 'default' : (isOwn ? 'pointer' : 'default'),
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    transition: 'box-shadow 0.15s',
    ...(shape === 'circle' && {
      borderRadius: '50%',
      width: isRoot ? 110 : 72,
      height: isRoot ? 110 : 72,
      padding: 8,
      textAlign: 'center' as const,
      fontSize: isRoot ? 15 : 12,
      fontWeight: isRoot ? 700 : 500,
    }),
    ...(shape === 'diamond' && {
      borderRadius: 4,
      transform: 'rotate(45deg)',
      width: 64,
      height: 64,
      padding: 8,
      fontSize: 12,
      fontWeight: 500,
    }),
    ...(shape === 'rect' && {
      borderRadius: 8,
      minWidth: 80,
      maxWidth: 160,
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 400,
    }),
    ...(selected && !isRoot && { boxShadow: `0 0 0 2px ${userColor}88` }),
  };

  const labelStyle: React.CSSProperties = shape === 'diamond'
    ? { transform: 'rotate(-45deg)', display: 'block', maxWidth: 52, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }
    : { textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.3 };

  return (
    <div
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isRoot && isOwn) data.onEdit(node);
      }}
    >
      {HANDLES.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type="source"
          position={h.position}
          style={{ ...handleVisStyle, ...h.style }}
        />
      ))}
      <span style={labelStyle}>{node.title}</span>
      {node.layer > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 4,
          fontSize: 9, opacity: 0.45,
          ...(shape === 'diamond' && { transform: 'rotate(-45deg)' }),
        }}>L{node.layer}</span>
      )}
    </div>
  );
}

export default memo(CustomNode);
