interface Props {
  maxLayer: number;
  visibleLayers: Set<number>;
  onToggle: (layer: number) => void;
  currentLayer: number;
  onChangeLayer: (layer: number) => void;
}

export default function LayerControls({
  maxLayer,
  visibleLayers,
  onToggle,
  currentLayer,
  onChangeLayer,
}: Props) {
  const layers = Array.from({ length: maxLayer + 2 }, (_, i) => i);

  return (
    <div className="layer-controls">
      <span className="layer-label">Layers</span>
      <div className="layer-buttons">
        {layers.map((l) => (
          <div key={l} className="layer-item">
            <button
              className={`layer-btn ${visibleLayers.has(l) ? 'layer-btn--visible' : 'layer-btn--hidden'}`}
              onClick={() => onToggle(l)}
              title={`Toggle layer ${l}`}
            >
              {l === 0 ? '⬡' : `⬡`}
              <span className="layer-num">{l}</span>
            </button>
            <button
              className={`layer-active-btn ${currentLayer === l ? 'layer-active-btn--active' : ''}`}
              onClick={() => onChangeLayer(l)}
              title={`Edit on layer ${l}`}
            >
              ✎
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
