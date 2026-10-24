import React, { useState, useCallback, useMemo } from 'react';

interface CipherPuzzleProps {
  cipherText: string;    // The encoded message
  plainText: string;     // The decoded answer
  correctShift: number;  // Should be -3 (or 23 for right shift)
  onSolve: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function caesarShift(text: string, shift: number): string {
  return text
    .split('')
    .map((ch) => {
      const upper = ch.toUpperCase();
      const idx = ALPHABET.indexOf(upper);
      if (idx === -1) return ch; // Non-alpha passthrough
      const shifted = (idx + shift + 26) % 26;
      return ch === upper ? ALPHABET[shifted] : ALPHABET[shifted].toLowerCase();
    })
    .join('');
}

/**
 * Act III Puzzle: Caesar Cipher Shift Wheel
 * Player rotates through shift values to decode a message found at the haveli entrance.
 */
export const CipherPuzzle: React.FC<CipherPuzzleProps> = ({
  cipherText,
  plainText,
  correctShift,
  onSolve,
}) => {
  const [currentShift, setCurrentShift] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const decodedText = useMemo(() => caesarShift(cipherText, currentShift), [cipherText, currentShift]);

  const normalizeShift = (s: number) => ((s % 26) + 26) % 26;

  const handleShiftChange = useCallback(
    (newShift: number) => {
      if (isSolved) return;
      const normalized = normalizeShift(newShift);
      setCurrentShift(normalized);

      // Check if solved
      const targetNorm = normalizeShift(correctShift);
      if (normalized === targetNorm) {
        setIsSolved(true);
        setTimeout(() => onSolve(), 1800);
      }
    },
    [correctShift, isSolved, onSolve]
  );

  const incrementShift = () => handleShiftChange(currentShift + 1);
  const decrementShift = () => handleShiftChange(currentShift - 1);

  // Generate wheel positions for visual display
  const wheelLetters = useMemo(() => {
    return ALPHABET.split('').map((letter, i) => {
      const shifted = ALPHABET[(i + currentShift) % 26];
      return { original: letter, shifted };
    });
  }, [currentShift]);

  return (
    <div className="puzzle-cipher">
      <div className="puzzle-header">
        <h3 className="puzzle-title">🔐 Decode the Cipher</h3>
        <p className="puzzle-instruction">
          An encrypted note was found at the haveli entrance. Rotate the cipher wheel
          to find the correct shift and reveal the hidden message.
        </p>
        {showHint && (
          <div className="cipher-hint">
            <p className="hint-text">
              💡 The inscription reads: <em>"Three steps back reveal the path forward"</em>
            </p>
          </div>
        )}
        <button
          className="hint-toggle"
          onClick={() => setShowHint((h) => !h)}
        >
          {showHint ? '🔒 Hide Hint' : '💡 Need a Hint?'}
        </button>
      </div>

      {/* Cipher Wheel */}
      <div className={`cipher-wheel-container ${isSolved ? 'solved' : ''}`}>
        <div className="cipher-wheel">
          <div className="wheel-ring outer">
            {wheelLetters.map(({ original }, i) => (
              <span
                key={`outer-${i}`}
                className="wheel-letter outer-letter"
                style={{
                  transform: `rotate(${(i * 360) / 26}deg) translateY(-120px)`,
                }}
              >
                {original}
              </span>
            ))}
          </div>
          <div
            className="wheel-ring inner"
            style={{ transform: `rotate(${(currentShift * 360) / 26}deg)` }}
          >
            {ALPHABET.split('').map((letter, i) => (
              <span
                key={`inner-${i}`}
                className="wheel-letter inner-letter"
                style={{
                  transform: `rotate(${(i * 360) / 26}deg) translateY(-80px)`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>
          <div className="wheel-center">
            <span className="shift-display">{currentShift === 0 ? '0' : currentShift <= 13 ? `+${currentShift}` : `${currentShift - 26}`}</span>
          </div>
        </div>

        <div className="cipher-controls">
          <button className="cipher-btn" onClick={decrementShift} disabled={isSolved}>
            ◄ −1
          </button>
          <span className="shift-label">Shift: {currentShift}</span>
          <button className="cipher-btn" onClick={incrementShift} disabled={isSolved}>
            +1 ►
          </button>
        </div>

        {/* Shift slider */}
        <input
          type="range"
          min={0}
          max={25}
          value={currentShift}
          onChange={(e) => handleShiftChange(parseInt(e.target.value))}
          className="cipher-slider"
          disabled={isSolved}
        />
      </div>

      {/* Decoded text display */}
      <div className="cipher-output">
        <div className="cipher-label">Encoded Message:</div>
        <div className="cipher-text encoded">{cipherText}</div>

        <div className="cipher-arrow">↓</div>

        <div className="cipher-label">Decoded Result:</div>
        <div className={`cipher-text decoded ${isSolved ? 'solved-text' : ''}`}>
          {decodedText}
        </div>
      </div>

      {isSolved && (
        <div className="solved-overlay cipher-solved">
          <div className="solved-badge">
            <span className="solved-icon">✦</span>
            <span>CIPHER CRACKED</span>
            <span className="solved-sub">{plainText}</span>
          </div>
        </div>
      )}
    </div>
  );
};
