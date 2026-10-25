import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ScramblePuzzleProps {
  imageUrl: string;
  onSolve: () => void;
  gridSize?: number;
  onTileClick?: (isCorrect?: boolean) => void;
}

interface Tile {
  id: number;
  currentPos: number;
}

function createInitialTiles(totalTiles: number): Tile[] {
  const positions = Array.from({ length: totalTiles }, (_, i) => i);
  // Controlled 4-pair shuffle so the scramble is always solvable and engaging
  const swapPairs: [number, number][] = [
    [0, 4],
    [1, 7],
    [2, 6],
    [3, 5],
  ];
  swapPairs.forEach(([a, b]) => {
    const temp = positions[a];
    positions[a] = positions[b];
    positions[b] = temp;
  });
  return positions.map((currentPos, id) => ({ id, currentPos }));
}

/**
 * Act II Puzzle: 3×3 Image Scramble & Archive Deduction
 * Step 1: Reconstruct the damaged façade photograph by swapping tiles.
 * Step 2: Use Kabir's archive deduction to identify Devgarh before moving on.
 */
export const ScramblePuzzle: React.FC<ScramblePuzzleProps> = ({
  imageUrl,
  onSolve,
  gridSize = 3,
  onTileClick,
}) => {
  const totalTiles = gridSize * gridSize;
  const [tiles, setTiles] = useState<Tile[]>(() => createInitialTiles(totalTiles));
  const [selected, setSelected] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAssistOption, setShowAssistOption] = useState(false);
  const [containerSize, setContainerSize] = useState(360);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derived image reconstruction state
  const isImageReconstructed = tiles.length > 0 && tiles.every((t) => t.currentPos === t.id);

  // Responsive container sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const maxDim = Math.min(parent.clientWidth - 40, 420);
          setContainerSize(Math.max(260, maxDim));
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Swap tiles immutably
  const handleTileClick = useCallback(
    (tileCurrentPos: number) => {
      if (isImageReconstructed) return;

      if (selected === null) {
        setSelected(tileCurrentPos);
        onTileClick?.(false);
      } else if (selected === tileCurrentPos) {
        setSelected(null);
      } else {
        const prevSelected = selected;
        setTiles((prev) =>
          prev.map((t) => {
            if (t.currentPos === prevSelected) {
              return { ...t, currentPos: tileCurrentPos };
            }
            if (t.currentPos === tileCurrentPos) {
              return { ...t, currentPos: prevSelected };
            }
            return t;
          })
        );
        setMoveCount((c) => c + 1);
        setSelected(null);
        onTileClick?.(true);
      }
    },
    [selected, isImageReconstructed, onTileClick]
  );

  // Discrete accessibility assist: strictly aligns tiles, does NOT bypass archive deduction
  const handleAssistAlignTiles = () => {
    setTiles((prev) => prev.map((t) => ({ ...t, currentPos: t.id })));
    setMoveCount((c) => c + 1);
    setSelected(null);
    onTileClick?.(true);
  };

  const tileSize = containerSize / gridSize;

  return (
    <div className="puzzle-scramble" ref={containerRef}>
      <div className="puzzle-header">
        <h3 className="puzzle-title">🔍 Reconstruct Façade Photograph</h3>
        <p className="puzzle-instruction">
          {!isImageReconstructed ? (
            'Click a tile to select it, then click another to swap positions. Reconstruct the image to inspect the façade features.'
          ) : (
            'The façade is reconstructed. Listen to Kabir’s deduction, then continue to the cipher inscription.'
          )}
        </p>

        <div className="puzzle-workflow" aria-label="Façade reconstruction workflow">
          <div className={`workflow-step ${!isImageReconstructed ? 'current' : 'complete'}`}>
            <span>1</span>
            <div><strong>Repair the photograph</strong><small>Select two tiles to swap them.</small></div>
          </div>
          <div className={`workflow-step ${isImageReconstructed ? 'current complete' : ''}`}>
            <span>2</span>
            <div><strong>Record the deduction</strong><small>Hear Kabir identify the matching estate.</small></div>
          </div>
        </div>

        <div className="puzzle-stats">
          <span className="stat-badge">Moves: {moveCount}</span>
          <button
            className="hint-toggle"
            onClick={() => setShowHint((h) => !h)}
            title="Toggle reference preview"
          >
            {showHint ? '🔒 Hide Reference' : '👁 View Reference'}
          </button>
          {!isImageReconstructed && moveCount >= 6 && (
            <button
              className="hint-toggle"
              onClick={() => setShowAssistOption((o) => !o)}
              title="Assistance options"
            >
              ⚙ Assistance
            </button>
          )}
        </div>

        {showAssistOption && !isImageReconstructed && (
          <div className="assist-panel" style={{ marginTop: '10px' }}>
            <button
              className="hint-toggle assist-btn"
              onClick={handleAssistAlignTiles}
              title="Align tiles directly"
            >
              ✦ Assist: Arrange Tiles
            </button>
          </div>
        )}
      </div>

      {showHint && (
        <div className="puzzle-hint-overlay">
          <img src={imageUrl} alt="Reference Façade" className="hint-image" />
          <p className="hint-caption">Key architectural markers: three-leaf emblem and carved stone lattice.</p>
        </div>
      )}

      {/* Grid container */}
      <div
        className={`scramble-grid ${isImageReconstructed ? 'solved' : ''}`}
        style={{
          width: containerSize,
          height: containerSize,
          position: 'relative',
        }}
      >
        {tiles.map((tile) => {
          const row = Math.floor(tile.currentPos / gridSize);
          const col = tile.currentPos % gridSize;
          const bgRow = Math.floor(tile.id / gridSize);
          const bgCol = tile.id % gridSize;
          const isSelected = selected === tile.currentPos;
          const isCorrect = tile.currentPos === tile.id;

          return (
            <div
              key={tile.id}
              className={`scramble-tile ${isSelected ? 'selected' : ''} ${isCorrect && moveCount > 0 ? 'correct' : ''}`}
              role={isImageReconstructed ? undefined : 'button'}
              tabIndex={isImageReconstructed ? -1 : 0}
              aria-label={`Photograph tile ${tile.id + 1}${isSelected ? ', selected' : ''}`}
              style={{
                width: tileSize - 2,
                height: tileSize - 2,
                position: 'absolute',
                left: col * tileSize + 1,
                top: row * tileSize + 1,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${containerSize}px ${containerSize}px`,
                backgroundPosition: `-${bgCol * tileSize}px -${bgRow * tileSize}px`,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: isImageReconstructed ? 'default' : 'pointer',
              }}
              onClick={() => handleTileClick(tile.currentPos)}
              onKeyDown={(event) => {
                if (!isImageReconstructed && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  handleTileClick(tile.currentPos);
                }
              }}
            >
              {isSelected && <div className="tile-selected-glow" />}
              {isCorrect && moveCount > 0 && !isImageReconstructed && (
                <span className="tile-check-dot">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Reconstructed Banner */}
      {isImageReconstructed && (
        <div className="scramble-status-bar" style={{ marginTop: '14px', textAlign: 'center' }}>
          <span className="evidence-stamp" style={{ background: 'rgba(74, 222, 128, 0.1)', borderColor: '#4ade80' }}>
            ✦ PHOTOGRAPH RECONSTRUCTED — DEDUCTION READY ✦
          </span>
        </div>
      )}

      {/* Kabir's deduction is the narrative payoff; no second multiple-choice quiz. */}
      {isImageReconstructed && (
        <div className="scramble-evidence-dossier">
          <div className="evidence-card-header">
            <span className="evidence-stamp">FAMILY ARCHIVES</span>
            <h4>Evidence cross-reference complete</h4>
          </div>

          <p className="evidence-subtext" style={{ fontSize: '0.92rem', color: 'var(--text-sub)', marginBottom: '14px' }}>
            The reconstructed photograph reveals a <strong>three-leaf emblem</strong> and <strong>carved stone lattice</strong>. Kabir can now match the evidence to the family archive.
          </p>
          <button className="continue-btn haveli-confirm-btn" onClick={onSolve} style={{ width: '100%', marginTop: '6px' }}>
            <span>Hear Kabir’s deduction →</span>
          </button>
        </div>
      )}
    </div>
  );
};
