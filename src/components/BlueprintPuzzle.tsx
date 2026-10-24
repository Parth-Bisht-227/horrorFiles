import React, { useState, useCallback, useRef } from 'react';

interface BlueprintPuzzleProps {
  historicImageUrl: string;   // Original 1920 blueprint
  restoredImageUrl: string;   // 1980 restoration plan
  onSolve: () => void;
}

/**
 * Act IV Puzzle: Blueprint Comparison Slider
 * Player uses a comparison slider to spot the concealed chamber by comparing
 * the historic 1920 layout with the 1980 restoration plan.
 * The hidden wall is revealed when they find the discrepancy.
 */
export const BlueprintPuzzle: React.FC<BlueprintPuzzleProps> = ({
  historicImageUrl,
  restoredImageUrl,
  onSolve,
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [foundSpot, setFoundSpot] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Target zone: the concealed chamber area (percentage-based)
  const TARGET_ZONE = { x: 60, y: 55, radius: 15 }; // Center point and click radius

  const handlePointerDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(2, Math.min(98, x)));
    },
    [isDragging]
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSolved || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      // Check if click is near the target zone
      const dx = clickX - TARGET_ZONE.x;
      const dy = clickY - TARGET_ZONE.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      setClickCount(c => c + 1);

      if (distance <= TARGET_ZONE.radius) {
        setFoundSpot(true);
        setIsSolved(true);
        setTimeout(() => onSolve(), 2000);
      }
    },
    [isSolved, onSolve]
  );

  return (
    <div className="puzzle-blueprint">
      <div className="puzzle-header">
        <h3 className="puzzle-title">📐 Compare the Blueprints</h3>
        <p className="puzzle-instruction">
          Slide to compare the <strong>1920 original layout</strong> with the{' '}
          <strong>1980 restoration plan</strong>. Find the discrepancy — a wall that
          shouldn't be there — and click on it to reveal the concealed chamber.
        </p>
        {clickCount > 5 && !isSolved && (
          <div className="blueprint-hint">
            <p className="hint-text">
              💡 Look for a wall in the restoration plan that doesn't appear in the original.
              Focus on the lower-right section of the foundation.
            </p>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className={`blueprint-comparator ${isSolved ? 'solved' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
        onClick={handleImageClick}
        style={{ touchAction: 'none' }}
      >
        {/* Bottom layer: Restoration plan (1980) */}
        <div
          className="blueprint-layer restored"
          style={{
            backgroundImage: `url(${restoredImageUrl})`,
          }}
        >
          <span className="blueprint-label right-label">1980 Restoration</span>
        </div>

        {/* Top layer: Historic blueprint (1920), clipped by slider */}
        <div
          className="blueprint-layer historic"
          style={{
            backgroundImage: `url(${historicImageUrl})`,
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
        >
          <span className="blueprint-label left-label">1920 Original</span>
        </div>

        {/* Slider handle */}
        <div
          className="blueprint-slider-handle"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="slider-line" />
          <div className="slider-grip">
            <span>◄ ►</span>
          </div>
        </div>

        {/* Target highlight when found */}
        {foundSpot && (
          <div
            className="blueprint-found-marker"
            style={{
              left: `${TARGET_ZONE.x}%`,
              top: `${TARGET_ZONE.y}%`,
            }}
          >
            <div className="found-pulse" />
            <div className="found-ring" />
          </div>
        )}

        {isSolved && (
          <div className="solved-overlay blueprint-solved">
            <div className="solved-badge">
              <span className="solved-icon">✦</span>
              <span>CONCEALED CHAMBER LOCATED</span>
              <span className="solved-sub">Foundation Wall Section 7-B</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
