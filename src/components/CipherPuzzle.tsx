import React, { useState, useCallback, useMemo } from 'react';

interface CipherPuzzleProps {
  onSolve: () => void;
  onWheelStep?: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// The authoritative canon cipher lines:
// Line 1: QRUWK JDOOHUB -> NORTH GALLERY
// Line 2: ROG SODQ EHKLQG ORRVH SDQHO -> OLD PLAN BEHIND LOOSE PANEL
const CIPHER_LINES = [
  { encoded: 'QRUWK JDOOHUB', target: 'NORTH GALLERY' },
  { encoded: 'ROG SODQ EHKLQG ORRVH SDQHO', target: 'OLD PLAN BEHIND LOOSE PANEL' },
];

function caesarShift(text: string, shift: number): string {
  return text
    .split('')
    .map((ch) => {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx === -1) return ch; // Space or punctuation passthrough
      const shifted = (idx + shift + 26) % 26;
      return ch === upper ? ALPHABET[shifted] : ALPHABET[shifted].toLowerCase();
    })
    .join('');
}

/**
 * Act III Puzzle: Caesar Cipher Shift Wheel
 * Decodes haveli stone inscriptions using the family clue: "Three leaves. Three steps back."
 * Shift back 3 places (-3 modulo 26 = 23).
 */
export const CipherPuzzle: React.FC<CipherPuzzleProps> = ({ onSolve, onWheelStep }) => {
  // Correct shift: shift -3 (equivalent to +23 modulo 26)
  const CORRECT_SHIFT = 23;
  const [currentShift, setCurrentShift] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [hintStage, setHintStage] = useState<number>(0); // 0 = closed, 1 = archive clue, 2 = reasoning, 3 = assist

  // Normalize shift to 0..25
  const normalizeShift = (s: number) => ((s % 26) + 26) % 26;

  // Live decoded lines
  const decodedLines = useMemo(() => {
    return CIPHER_LINES.map(line => ({
      encoded: line.encoded,
      decoded: caesarShift(line.encoded, currentShift),
      target: line.target,
    }));
  }, [currentShift]);

  const handleShiftChange = useCallback((newShift: number) => {
    const normalized = normalizeShift(newShift);
    setCurrentShift(normalized);
    onWheelStep?.();

    if (normalized === CORRECT_SHIFT) {
      setIsSolved(true);
    } else {
      setIsSolved(false);
    }
  }, [onWheelStep]);

  const incrementShift = (amount = 1) => handleShiftChange(currentShift + amount);
  const decrementShift = (amount = 1) => handleShiftChange(currentShift - amount);

  // Wheel letters for concentric visualization
  const wheelLetters = useMemo(() => {
    return ALPHABET.split('').map((letter, i) => {
      const shifted = ALPHABET[(i + currentShift) % 26];
      return { original: letter, shifted };
    });
  }, [currentShift]);

  const handleAssistanceAlign = () => {
    handleShiftChange(CORRECT_SHIFT);
  };

  return (
    <div className="puzzle-cipher">
      <div className="puzzle-header">
        <h3 className="puzzle-title">🔐 Decipher the Coded Inscription</h3>
        <p className="puzzle-instruction">
          Carved into the haveli masonry are two encrypted lines. Rotate the cipher wheel
          to decode both messages and find where the old floor plan is hidden.
        </p>

        <div className="puzzle-stats">
          <button
            className="hint-toggle"
            onClick={() => setHintStage(prev => (prev === 0 ? 1 : 0))}
          >
            {hintStage === 0 ? '💡 Family Archive Clue' : '🔒 Hide Clues'}
          </button>
        </div>

        {/* Progressive Hint System */}
        {hintStage > 0 && (
          <div className="cipher-hint" style={{ marginTop: '12px', textAlign: 'left' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--gold-border)', borderRadius: '6px' }}>
              <p className="hint-text" style={{ margin: '0 0 8px 0', color: 'var(--gold-200)', fontSize: '0.92rem' }}>
                <strong>Archive Record:</strong> <em>"Three leaves. Three steps back."</em>
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: 'var(--text-sub)', lineHeight: '1.5' }}>
                The family emblem bears three leaves. Consider how the phrase "three steps back" directs your adjustment of an alphabetical cipher wheel.
              </p>

              {hintStage === 1 && (
                <button
                  className="hint-toggle"
                  onClick={() => setHintStage(2)}
                  style={{ fontSize: '0.78rem' }}
                >
                  Need more direction? (Next Clue) →
                </button>
              )}

              {hintStage >= 2 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    <strong>Letter Shift Reasoning:</strong> Examine the first word <code>QRUWK</code>. If each letter is shifted backwards by 3 positions in the alphabet (e.g. Q counting backwards: P, O, N), an English word begins to emerge.
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
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    If you are having difficulty with wheel controls, you can use the assistance path below:
                  </p>
                  <button
                    className="hint-toggle assist-btn"
                    onClick={handleAssistanceAlign}
                    style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--gold-400)' }}
                  >
                    ✦ Assist: Set Wheel to −3
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cipher Wheel Visualization */}
      <div className={`cipher-wheel-container ${isSolved ? 'solved' : ''}`}>
        <div className="cipher-wheel">
          {/* Outer ring (Static alphabet A-Z) */}
          <div className="wheel-ring outer">
            {wheelLetters.map(({ original }, i) => (
              <span
                key={`outer-${i}`}
                className="wheel-letter outer-letter"
                style={{
                  transform: `rotate(${(i * 360) / 26}deg) translateY(-115px)`,
                }}
              >
                {original}
              </span>
            ))}
          </div>

          {/* Inner ring (Rotated cipher alphabet) */}
          <div
            className="wheel-ring inner"
            style={{ transform: `rotate(${(currentShift * 360) / 26}deg)` }}
          >
            {ALPHABET.split('').map((letter, i) => (
              <span
                key={`inner-${i}`}
                className="wheel-letter inner-letter"
                style={{
                  transform: `rotate(${(i * 360) / 26}deg) translateY(-78px)`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Center Shift Readout */}
          <div className="wheel-center">
            <span className="shift-display">
              {currentShift === 0 ? '0' : currentShift <= 13 ? `+${currentShift}` : `${currentShift - 26}`}
            </span>
          </div>
        </div>

        {/* Shift Controls */}
        <div className="cipher-controls">
          <button className="cipher-btn" onClick={() => decrementShift(5)}>−5</button>
          <button className="cipher-btn" onClick={() => decrementShift(1)}>◄ −1</button>
          <span className="shift-label">
            Offset: <strong>{currentShift === 0 ? '0' : currentShift <= 13 ? `+${currentShift}` : `${currentShift - 26}`}</strong>
          </span>
          <button className="cipher-btn" onClick={() => incrementShift(1)}>+1 ►</button>
          <button className="cipher-btn" onClick={() => incrementShift(5)}>+5</button>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min={0}
          max={25}
          value={currentShift}
          onChange={(e) => handleShiftChange(parseInt(e.target.value, 10))}
          className="cipher-slider"
          aria-label="Adjust cipher shift"
        />
      </div>

      {/* Decoded Text Display (Both Canon Lines) */}
      <div className="cipher-output">
        <div className="cipher-pair">
          <div className="cipher-label">INSCRIPTION 1:</div>
          <div className="cipher-text encoded">{decodedLines[0].encoded}</div>
          <div className="cipher-arrow">↓</div>
          <div className={`cipher-text decoded ${isSolved ? 'solved-text' : ''}`}>
            {decodedLines[0].decoded}
          </div>
        </div>

        <div className="cipher-divider-line" />

        <div className="cipher-pair">
          <div className="cipher-label">INSCRIPTION 2:</div>
          <div className="cipher-text encoded">{decodedLines[1].encoded}</div>
          <div className="cipher-arrow">↓</div>
          <div className={`cipher-text decoded ${isSolved ? 'solved-text' : ''}`}>
            {decodedLines[1].decoded}
          </div>
        </div>
      </div>

      {/* Narrative Lead to North Gallery Loose Panel (When Solved) */}
      {isSolved && (
        <div className="cipher-evidence-dossier">
          <div className="evidence-card-header">
            <span className="evidence-stamp">CIPHER DECIPHERED</span>
            <h4>Floor Plan Location Discovered</h4>
          </div>
          <div className="evidence-narrative">
            <p>
              <strong>Decoded Inscriptions:</strong>
              <br />
              ✦ <em>"NORTH GALLERY"</em>
              <br />
              ✦ <em>"OLD PLAN BEHIND LOOSE PANEL"</em>
            </p>
            <p className="evidence-detail">
              In the north gallery, a loose architectural panel gives way to reveal the original architectural floor plan of Devgarh Haveli.
            </p>
          </div>
          <button
            className="continue-btn cipher-confirm-btn"
            onClick={onSolve}
          >
            <span>Retrieve Original Floor Plan →</span>
          </button>
        </div>
      )}
    </div>
  );
};
