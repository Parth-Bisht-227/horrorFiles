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

interface ArchiveProperty {
  id: 'devgarh' | 'ranikot' | 'bhanpur';
  name: string;
  location: string;
  emblemMotif: string;
  masonryStyle: string;
  archivalNotes: string;
  isCorrect: boolean;
  discrepancyNote?: string;
}

const ARCHIVE_PROPERTIES: ArchiveProperty[] = [
  {
    id: 'ranikot',
    name: 'Ranikot Manor',
    location: 'Northern Foothills',
    emblemMotif: 'Five-petal lotus crest',
    masonryStyle: 'Open pillared colonnade, uncarved stone arches',
    archivalNotes: 'Commissioned as an administrative estate. Notable for its five-petal lotus family crest above the carriage gate and open, uncarved stone colonnade.',
    isCorrect: false,
    discrepancyNote: 'Ranikot Manor is recorded with an open pillared colonnade and a five-petal lotus crest. The reconstructed photograph clearly shows a three-leaf emblem and intricate geometric stone lattice.',
  },
  {
    id: 'devgarh',
    name: 'Devgarh Haveli',
    location: 'Devgarh Ridge',
    emblemMotif: 'Three-leaf ancestral emblem',
    masonryStyle: 'Carved sandstone lattice (jali) screen walls',
    archivalNotes: 'Private ancestral residence. Lintel entrance marked by the hereditary three-leaf emblem and intricate geometric sandstone lattice (jali) across the façade. Archive Record: "Three leaves. Three steps back."',
    isCorrect: true,
  },
  {
    id: 'bhanpur',
    name: 'Bhanpur Palace',
    location: 'Eastern Valley',
    emblemMotif: 'Archway crest with radiating sunburst',
    masonryStyle: 'Fluted stucco arches with solid stone balustrades',
    archivalNotes: 'Ceremonial estate. Front façade features fluted arches crowned by a prominent archway crest and enclosed smooth balustrades.',
    isCorrect: false,
    discrepancyNote: 'Bhanpur Palace features fluted stucco archways and a radiating sunburst crest. The photograph displays the three-leaf emblem and carved sandstone lattice, ruling out Bhanpur.',
  },
];

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
 * Step 2: Compare the three-leaf emblem and carved lattice against 3 family archive properties to deduce Devgarh.
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

  // Archive deduction state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [archiveFeedback, setArchiveFeedback] = useState<string | null>(null);
  const [isPropertyConfirmed, setIsPropertyConfirmed] = useState(false);

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

  // Archive property selection handler
  const handleSelectProperty = (property: ArchiveProperty) => {
    setSelectedPropertyId(property.id);

    if (property.isCorrect) {
      setArchiveFeedback(null);
      setIsPropertyConfirmed(true);
      onTileClick?.(true);
    } else {
      setIsPropertyConfirmed(false);
      setArchiveFeedback(property.discrepancyNote || 'This property features different architectural motifs.');
      onTileClick?.(false);
    }
  };

  const tileSize = containerSize / gridSize;

  return (
    <div className="puzzle-scramble" ref={containerRef}>
      <div className="puzzle-header">
        <h3 className="puzzle-title">
          {isImageReconstructed ? '📁 Cross-Reference Archive Property' : '🔍 Reconstruct Façade Photograph'}
        </h3>
        <p className="puzzle-instruction">
          {!isImageReconstructed ? (
            'Click a tile to select it, then click another to swap positions. Reconstruct the image to inspect the façade features.'
          ) : (
            'The façade is reconstructed. Compare the three-leaf emblem and carved stone lattice with the family property archives below.'
          )}
        </p>

        <div className="puzzle-workflow" aria-label="Façade reconstruction workflow">
          <div className={`workflow-step ${!isImageReconstructed ? 'current' : 'complete'}`}>
            <span>1</span>
            <div><strong>Repair the photograph</strong><small>Select two tiles to swap them.</small></div>
          </div>
          <div className={`workflow-step ${isImageReconstructed ? 'current' : ''} ${isPropertyConfirmed ? 'complete' : ''}`}>
            <span>2</span>
            <div><strong>Cross-reference the archive</strong><small>Match the emblem and lattice to one estate.</small></div>
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
            ✦ PHOTOGRAPH RECONSTRUCTED — INSPECT ARCHIVES BELOW ✦
          </span>
        </div>
      )}

      {/* Archival Deduction Dossier (Rendered once photograph is assembled) */}
      {isImageReconstructed && (
        <div className="scramble-evidence-dossier">
          <div className="evidence-card-header">
            <span className="evidence-stamp">FAMILY ARCHIVES</span>
            <h4>Identify Matching Property</h4>
          </div>

          <p className="evidence-subtext" style={{ fontSize: '0.92rem', color: 'var(--text-sub)', marginBottom: '14px' }}>
            Which ancestral property matches the <strong>three-leaf emblem</strong> and <strong>carved stone lattice</strong> visible in the photograph?
          </p>

          <div className="archive-properties-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ARCHIVE_PROPERTIES.map((prop) => {
              const isSelected = selectedPropertyId === prop.id;
              const isConfirmed = isSelected && prop.isCorrect;
              const isError = isSelected && !prop.isCorrect;

              return (
                <div
                  key={prop.id}
                  className={`archive-property-card ${isSelected ? 'selected' : ''} ${isConfirmed ? 'confirmed' : ''} ${isError ? 'error' : ''}`}
                  onClick={() => handleSelectProperty(prop)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectProperty(prop);
                    }
                  }}
                  style={{
                    background: isConfirmed
                      ? 'rgba(34, 197, 94, 0.12)'
                      : isError
                      ? 'rgba(239, 68, 68, 0.12)'
                      : isSelected
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(15, 23, 42, 0.65)',
                    border: `1.5px solid ${
                      isConfirmed
                        ? '#4ade80'
                        : isError
                        ? '#ef4444'
                        : isSelected
                        ? 'var(--gold-400)'
                        : 'rgba(255, 255, 255, 0.12)'
                    }`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: isConfirmed ? '#4ade80' : 'var(--gold-300)', fontSize: '1rem' }}>
                      {prop.name}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{prop.location}</span>
                  </div>

                  <div style={{ fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: '1.4', marginBottom: '6px' }}>
                    <div><strong>Motif:</strong> {prop.emblemMotif}</div>
                    <div><strong>Masonry:</strong> {prop.masonryStyle}</div>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)', margin: 0, fontStyle: 'italic' }}>
                    "{prop.archivalNotes}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* Contextual Discrepancy Feedback */}
          {archiveFeedback && (
            <div
              className="archive-discrepancy-feedback"
              style={{
                marginTop: '14px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                borderLeft: '3px solid #ef4444',
                borderRadius: '4px',
                color: '#fca5a5',
                fontSize: '0.88rem',
                lineHeight: '1.5',
              }}
            >
              <strong>Discrepancy:</strong> {archiveFeedback}
            </div>
          )}

          {/* Confirmation & Continue */}
          {isPropertyConfirmed && (
            <div className="archive-confirmed-box" style={{ marginTop: '16px' }}>
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  borderLeft: '3px solid #4ade80',
                  borderRadius: '4px',
                  color: '#86efac',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  marginBottom: '14px',
                }}
              >
                <strong>Match Confirmed:</strong> Both the three-leaf ancestral emblem and the carved stone lattice match Devgarh Haveli's archives.
                <br />
                Archive Clue: <em>"Three leaves. Three steps back."</em>
              </div>

              <button
                className="continue-btn haveli-confirm-btn"
                onClick={onSolve}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <span>Travel to Devgarh Haveli →</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
