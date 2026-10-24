import React, { useState, useCallback, useRef } from 'react';

interface BlueprintPuzzleProps {
  onSolve: () => void;
  onSliderMove?: () => void;
}

// Target discrepancy zone: Western Wall Partition of the North Gallery
// In percentage coordinates: X ~17%, Y ~28%, Radius ~14%
const TARGET_ZONE = { x: 17, y: 28, radius: 14 };

/**
 * Act IV Puzzle: Architectural Blueprint Comparison Slider
 * Authoritative canon:
 * - The original floor plan (retrieved from behind the loose panel in the north gallery)
 *   contains an enclosed cavity behind the western wall partition of the north gallery.
 * - The later restoration plan omits this space, depicting a solid continuous masonry wall.
 * - Player slides the comparator across the western section and clicks the discrepancy
 *   to confirm the concealed chamber location.
 */
export const BlueprintPuzzle: React.FC<BlueprintPuzzleProps> = ({ onSolve, onSliderMove }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasScannedWestRestored, setHasScannedWestRestored] = useState(false);
  const [hasScannedWestOriginal, setHasScannedWestOriginal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [foundSpot, setFoundSpot] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [hintStage, setHintStage] = useState<number>(0); // 0 = closed, 1 = clue, 2 = detail, 3 = assist
  const [showAssistHighlight, setShowAssistHighlight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Both sides of the western wall must be exposed through the comparator
  const hasComparedWesternWall = hasScannedWestRestored && hasScannedWestOriginal;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(5, Math.min(95, x));
    setSliderPos(clampedX);
    onSliderMove?.();

    // Track whether the player has slid across the western sector (around 15-25%)
    if (clampedX <= 16) {
      setHasScannedWestRestored(true);
    }
    if (clampedX >= 30) {
      setHasScannedWestOriginal(true);
    }
  }, [onSliderMove]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updateSliderPosition(e.clientX);
    },
    [isDragging, updateSliderPosition]
  );

  const handlePlanClick = useCallback(
    (e: React.MouseEvent) => {
      if (isSolved || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      // Distance to target discrepancy behind the western wall of the north gallery
      const dx = clickX - TARGET_ZONE.x;
      const dy = clickY - TARGET_ZONE.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= TARGET_ZONE.radius) {
        if (!hasComparedWesternWall) {
          setFeedbackMessage(
            'Slide the comparator divider across the western end of the North Gallery to examine both layouts before confirming.'
          );
          return;
        }

        setFeedbackMessage(null);
        setFoundSpot(true);
        setIsSolved(true);
      } else {
        // Non-revealing contextual feedback
        if (clickY > 45) {
          setFeedbackMessage(
            'The central courtyard and south wings align between both plans. Focus on structural discrepancies along the perimeter galleries.'
          );
        } else if (clickX > 45) {
          setFeedbackMessage(
            'The eastern gallery layout is identical in both drafts. Re-examine the opposite side of the gallery.'
          );
        } else {
          setFeedbackMessage(
            'Masonry boundary verified. Slide the comparator to spot where an interior space has been altered.'
          );
        }
      }
    },
    [isSolved, hasComparedWesternWall]
  );

  const handleAssistSpot = () => {
    setShowAssistHighlight(true);
    setSliderPos(25);
    setHasScannedWestRestored(true);
    setHasScannedWestOriginal(true);
  };

  return (
    <div className="puzzle-blueprint">
      <div className="puzzle-header">
        <h3 className="puzzle-title">📐 Compare Architectural Floor Plans</h3>
        <p className="puzzle-instruction">
          Compare the <strong>Original Floor Plan</strong> against the <strong>Restoration Plan</strong>.
          Drag the comparator divider to inspect structural differences along the galleries, then click the discrepancy.
        </p>

        <div className="puzzle-stats">
          <button
            className="hint-toggle"
            onClick={() => setHintStage((prev) => (prev === 0 ? 1 : 0))}
          >
            {hintStage === 0 ? '💡 Architectural Clue' : '🔒 Hide Clues'}
          </button>
          <span className="stat-badge" style={{ fontSize: '0.8rem', color: hasComparedWesternWall ? '#4ade80' : 'var(--text-muted)' }}>
            {hasComparedWesternWall ? '✓ Gallery Compared' : '↔ Slide to Compare'}
          </span>
        </div>

        {/* Progressive Hint Drawer */}
        {hintStage > 0 && (
          <div className="blueprint-hint" style={{ marginTop: '12px', textAlign: 'left' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--gold-border)', borderRadius: '6px' }}>
              <p className="hint-text" style={{ margin: '0 0 6px 0', color: 'var(--gold-200)', fontSize: '0.9rem' }}>
                <strong>Archival Observation:</strong> Compare the upper gallery between both documents.
              </p>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
                Slide the comparator divider back and forth across the North Gallery. Pay close attention to interior wall partitions that exist in the original layout but disappear in the later restoration.
              </p>

              {hintStage === 1 && (
                <button
                  className="hint-toggle"
                  onClick={() => setHintStage(2)}
                  style={{ fontSize: '0.78rem' }}
                >
                  Need more detail? (Next Clue) →
                </button>
              )}

              {hintStage >= 2 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    <strong>Western Perimeter:</strong> In the restoration plan, the western end of the North Gallery terminates at a solid wall. In the original drafting plan, a partition wall conceals an unindexed void directly behind it.
                  </p>

                  {hintStage === 2 && !isSolved && (
                    <button
                      className="hint-toggle"
                      onClick={() => setHintStage(3)}
                      style={{ fontSize: '0.78rem', marginTop: '4px' }}
                    >
                      Assistance options →
                    </button>
                  )}
                </div>
              )}

              {hintStage === 3 && !isSolved && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <button
                    className="hint-toggle assist-btn"
                    onClick={handleAssistSpot}
                    style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--gold-400)' }}
                  >
                    ✦ Assist: Highlight Discrepancy Sector
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {feedbackMessage && !isSolved && (
          <div
            className="blueprint-feedback"
            style={{
              marginTop: '10px',
              padding: '8px 14px',
              background: 'rgba(245, 158, 11, 0.15)',
              borderLeft: '3px solid var(--gold-400)',
              borderRadius: '4px',
              color: 'var(--gold-200)',
              fontSize: '0.86rem',
              lineHeight: '1.4',
            }}
          >
            {feedbackMessage}
          </div>
        )}
      </div>

      {/* Blueprint Visual Comparator */}
      <div
        ref={containerRef}
        className={`blueprint-comparator ${isSolved ? 'solved' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
        onClick={handlePlanClick}
        style={{ cursor: isSolved ? 'default' : 'crosshair' }}
      >
        {/* Layer 1 (Under): Later Restoration Plan */}
        <div className="blueprint-svg-canvas restored-layer">
          <svg viewBox="0 0 600 360" className="blueprint-svg" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-restored" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(245, 158, 11, 0.12)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0a0f1d" />
            <rect width="100%" height="100%" fill="url(#grid-restored)" />

            {/* Document Header */}
            <text x="24" y="28" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
              ESTATE RESTORATION DRAFTING PLAN — DEVGARH
            </text>

            {/* Foundation Perimeter */}
            <rect x="40" y="45" width="520" height="270" fill="none" stroke="#64748b" strokeWidth="8" />

            {/* North Gallery (Spans across upper wing) */}
            <rect x="130" y="55" width="420" height="85" fill="rgba(15, 23, 42, 0.7)" stroke="#475569" strokeWidth="2.5" />
            <text x="290" y="102" fill="#cbd5e1" fontSize="12" fontFamily="monospace" fontWeight="bold">
              NORTH GALLERY
            </text>

            {/* Western Boundary: Drawn as a solid continuous masonry wall without partitions */}
            <rect x="45" y="55" width="85" height="85" fill="rgba(30, 41, 59, 0.5)" stroke="#475569" strokeWidth="1.5" />
            <line x1="130" y1="55" x2="130" y2="140" stroke="#64748b" strokeWidth="6" />

            {/* Courtyard */}
            <rect x="200" y="155" width="280" height="150" fill="rgba(15, 23, 42, 0.5)" stroke="#475569" strokeWidth="2" />
            <text x="300" y="235" fill="#94a3b8" fontSize="11" fontFamily="monospace">Central Courtyard</text>

            {/* East Wing */}
            <rect x="50" y="155" width="135" height="150" fill="rgba(15, 23, 42, 0.5)" stroke="#475569" strokeWidth="2" />
            <text x="75" y="235" fill="#94a3b8" fontSize="11" fontFamily="monospace">East Wing</text>
          </svg>
          <span className="blueprint-label right-label">Restoration Plan</span>
        </div>

        {/* Layer 2 (Top, Clipped): Original Floor Plan (Contains the concealed cavity behind western wall) */}
        <div
          className="blueprint-svg-canvas historic-layer"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <svg viewBox="0 0 600 360" className="blueprint-svg" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-original" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
              </pattern>
              <pattern id="hatch-original" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#071226" />
            <rect width="100%" height="100%" fill="url(#grid-original)" />

            {/* Document Header */}
            <text x="24" y="28" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
              ORIGINAL ARCHITECTURAL RECORD — DEVGARH HAVELI
            </text>

            {/* Foundation Perimeter */}
            <rect x="40" y="45" width="520" height="270" fill="none" stroke="#38bdf8" strokeWidth="8" />

            {/* North Gallery */}
            <rect x="130" y="55" width="420" height="85" fill="rgba(8, 28, 60, 0.6)" stroke="#38bdf8" strokeWidth="2" />
            <text x="290" y="102" fill="#7dd3fc" fontSize="12" fontFamily="monospace" fontWeight="bold">
              NORTH GALLERY
            </text>

            {/* Western Partition & Concealed Void (Architectural Drafting Convention: False wall partition & hatched void) */}
            <rect x="48" y="55" width="75" height="85" fill="url(#hatch-original)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,3" />
            {/* Partition doorway break / recess in masonry */}
            <line x1="126" y1="55" x2="126" y2="82" stroke="#38bdf8" strokeWidth="5" />
            <line x1="126" y1="113" x2="126" y2="140" stroke="#38bdf8" strokeWidth="5" />
            <line x1="126" y1="82" x2="126" y2="113" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="60" y="100" fill="#93c5fd" fontSize="9" fontFamily="monospace" opacity="0.8">
              SEC-W
            </text>

            {/* Courtyard */}
            <rect x="200" y="155" width="280" height="150" fill="rgba(8, 28, 60, 0.4)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="300" y="235" fill="#7dd3fc" fontSize="11" fontFamily="monospace">Central Courtyard</text>

            {/* East Wing */}
            <rect x="50" y="155" width="135" height="150" fill="rgba(8, 28, 60, 0.4)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="75" y="235" fill="#7dd3fc" fontSize="11" fontFamily="monospace">East Wing</text>
          </svg>
          <span className="blueprint-label left-label">Original Plan</span>
        </div>

        {/* Draggable Divider Handle */}
        <div
          className="blueprint-slider-handle"
          style={{ left: `${sliderPos}%` }}
          aria-label="Drag to compare architectural plans"
        >
          <div className="slider-line" />
          <div className="slider-grip">
            <span>◄ ►</span>
          </div>
        </div>

        {/* Assist Highlight (if requested via assist path) */}
        {showAssistHighlight && !foundSpot && (
          <div
            style={{
              position: 'absolute',
              left: `${TARGET_ZONE.x - 7}%`,
              top: `${TARGET_ZONE.y - 7}%`,
              width: '14%',
              height: '24%',
              border: '2px dashed var(--gold-400)',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.1)',
              pointerEvents: 'none',
              animation: 'pulse 1.5s infinite',
            }}
          />
        )}

        {/* Found Target Indicator */}
        {foundSpot && (
          <div
            className="blueprint-found-marker"
            style={{
              left: `${TARGET_ZONE.x}%`,
              top: `${TARGET_ZONE.y}%`,
            }}
          >
            <div className="found-pulse" />
            <div className="found-crosshair">+</div>
          </div>
        )}
      </div>

      {/* Discrepancy Evidence Dossier (When Solved) */}
      {isSolved && (
        <div className="blueprint-evidence-dossier">
          <div className="evidence-card-header">
            <span className="evidence-stamp">DISCREPANCY VERIFIED</span>
            <h4>Concealed Chamber Located</h4>
          </div>
          <div className="evidence-narrative">
            <p>
              <strong>Omitted Chamber Identified:</strong> The original floor plan reveals an enclosed architectural space
              located directly behind the <strong>western wall partition of the North Gallery</strong>. The restoration plan completely omitted it.
            </p>
            <p className="evidence-detail alert-text">
              Meera is locked inside this concealed chamber.
            </p>
          </div>
          <button
            className="continue-btn dramatic-btn chamber-breach-btn"
            onClick={onSolve}
          >
            <span>Enter the Concealed Chamber →</span>
          </button>
        </div>
      )}
    </div>
  );
};
