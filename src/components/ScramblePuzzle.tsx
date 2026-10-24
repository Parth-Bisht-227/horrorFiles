import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ScramblePuzzleProps {
  imageUrl: string;
  onSolve: () => void;
  gridSize?: number;
}

interface Tile {
  id: number;
  currentPos: number;
  correctPos: number;
}

/**
 * Act II Puzzle: 3×3 Image Scramble Reconstruction
 * Player swaps tiles to reconstruct a scrambled photograph of Devgarh Haveli.
 */
export const ScramblePuzzle: React.FC<ScramblePuzzleProps> = ({
  imageUrl,
  onSolve,
  gridSize = 3,
}) => {
  const totalTiles = gridSize * gridSize;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState(360);

  // Initialize scrambled tiles
  useEffect(() => {
    const positions = Array.from({ length: totalTiles }, (_, i) => i);

    // Fisher-Yates shuffle, ensuring it's not already solved
    let shuffled: number[];
    do {
      shuffled = [...positions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    } while (shuffled.every((val, idx) => val === idx));

    setTiles(
      shuffled.map((correctPos, currentPos) => ({
        id: correctPos,
        currentPos,
        correctPos,
      }))
    );
  }, [totalTiles]);

  // Responsive container sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const maxDim = Math.min(parent.clientWidth - 40, 450);
          setContainerSize(Math.max(240, maxDim));
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Check if solved
  useEffect(() => {
    if (tiles.length === 0) return;
    const solved = tiles.every((tile) => tile.currentPos === tile.id);
    if (solved && moveCount > 0) {
      setIsSolved(true);
      setTimeout(() => onSolve(), 1500);
    }
  }, [tiles, moveCount, onSolve]);

  const handleTileClick = useCallback(
    (posIndex: number) => {
      if (isSolved) return;

      if (selected === null) {
        setSelected(posIndex);
      } else if (selected === posIndex) {
        setSelected(null);
      } else {
        // Swap tiles
        setTiles((prev) => {
          const next = [...prev];
          const tileA = next.find((t) => t.currentPos === selected)!;
          const tileB = next.find((t) => t.currentPos === posIndex)!;
          const tempPos = tileA.currentPos;
          tileA.currentPos = tileB.currentPos;
          tileB.currentPos = tempPos;
          return next;
        });
        setMoveCount((c) => c + 1);
        setSelected(null);
      }
    },
    [selected, isSolved]
  );

  const tileSize = containerSize / gridSize;

  return (
    <div className="puzzle-scramble" ref={containerRef}>
      <div className="puzzle-header">
        <h3 className="puzzle-title">🔍 Reconstruct the Photograph</h3>
        <p className="puzzle-instruction">
          Swap tiles to reassemble the image. Click two tiles to swap them.
        </p>
        <div className="puzzle-stats">
          <span className="stat-badge">Moves: {moveCount}</span>
          <button
            className="hint-toggle"
            onClick={() => setShowHint((h) => !h)}
            title="Toggle reference image"
          >
            {showHint ? '🔒 Hide Reference' : '👁 Show Reference'}
          </button>
        </div>
      </div>

      {showHint && (
        <div className="puzzle-hint-overlay">
          <img src={imageUrl} alt="Reference" className="hint-image" />
        </div>
      )}

      <div
        className={`scramble-grid ${isSolved ? 'solved' : ''}`}
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
              style={{
                width: tileSize - 3,
                height: tileSize - 3,
                position: 'absolute',
                left: col * tileSize + 1.5,
                top: row * tileSize + 1.5,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${containerSize}px ${containerSize}px`,
                backgroundPosition: `-${bgCol * tileSize}px -${bgRow * tileSize}px`,
                transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
                cursor: isSolved ? 'default' : 'pointer',
              }}
              onClick={() => handleTileClick(tile.currentPos)}
            >
              {isSelected && <div className="tile-selected-glow" />}
            </div>
          );
        })}

        {isSolved && (
          <div className="solved-overlay">
            <div className="solved-badge">
              <span className="solved-icon">✦</span>
              <span>LOCATION IDENTIFIED</span>
              <span className="solved-sub">Devgarh Haveli</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
