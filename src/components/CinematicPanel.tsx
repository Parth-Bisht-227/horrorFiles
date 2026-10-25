import React, { useState, useEffect, useRef } from 'react';

interface CinematicPanelProps {
  backgroundUrl: string;
  children: React.ReactNode;
  overlayOpacity?: number;
  className?: string;
  showParticles?: boolean;
  transitionIn?: boolean;
}

/**
 * Cinematic full-screen panel with parallax background, particle effects,
 * and fade-in/out transitions for the illustrated thriller feel.
 */
export const CinematicPanel: React.FC<CinematicPanelProps> = ({
  backgroundUrl,
  children,
  overlayOpacity = 0.55,
  className = '',
  showParticles = true,
  transitionIn = true,
}) => {
  const [isVisible, setIsVisible] = useState(!transitionIn);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Fade in on mount
  useEffect(() => {
    if (transitionIn) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [transitionIn]);

  // Particle system (dust motes / fireflies)
  useEffect(() => {
    if (!showParticles || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
      fadeDir: number;
      hue: number;
    }

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.5 - 0.1,
      size: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.5,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
      hue: Math.random() > 0.7 ? 40 : 200, // Gold or blue-ish
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.fadeDir * 0.003;

        if (p.alpha <= 0 || p.alpha >= 0.6) p.fadeDir *= -1;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10 || p.x > canvas.width + 10) p.x = Math.random() * canvas.width;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${Math.max(0, p.alpha)})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${Math.max(0, p.alpha * 0.15)})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [showParticles]);

  return (
    <div
      className={`cinematic-panel ${className} ${isVisible ? 'visible' : 'hidden'}`}
    >
      <div
        className="panel-background"
        style={{
          backgroundImage: `url(${backgroundUrl})`,
        }}
      />
      <div
        className="panel-overlay"
        style={{ opacity: overlayOpacity }}
      />
      {showParticles && (
        <canvas ref={canvasRef} className="particle-canvas" />
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};


interface SubtitleBarProps {
  speaker: string;
  text: string;
  color: string;
  visible: boolean;
  isPlaying?: boolean;
  onSkip?: () => void;
}

/**
 * Cinematic subtitle bar — appears at bottom with speaker name and dialogue text.
 */
export const SubtitleBar: React.FC<SubtitleBarProps> = ({ speaker, text, color, visible, isPlaying = false, onSkip }) => {
  if (!visible) return null;

  return (
    <div className="subtitle-bar">
      <div className="subtitle-inner">
        <span className="subtitle-speaker" style={{ color }}>
          {speaker}
        </span>
        <span className="subtitle-text">
          {text}
        </span>
        {isPlaying && onSkip && (
          <button className="subtitle-skip-btn" onClick={onSkip} aria-label="Skip current voiceover">
            Skip voiceover <span aria-hidden="true">›</span>
          </button>
        )}
      </div>
    </div>
  );
};


interface NarrativeTextProps {
  lines: string[];
  onComplete?: () => void;
  continueText?: string;
  autoAdvance?: boolean;
  advanceDelay?: number;
}

/**
 * Narrative text block that reveals lines sequentially.
 * Pacing rule: Player stays in full control. The scene NEVER forces advancement
 * unless explicitly requested. A clear Continue action is displayed when ready.
 */
export const NarrativeText: React.FC<NarrativeTextProps> = ({
  lines,
  onComplete,
  continueText = 'Continue Investigation →',
  autoAdvance = false,
  advanceDelay = 3000,
}) => {
  const [visibleCount, setVisibleCount] = useState(1);

  // Reveal next line gradually or allow fast-forward on click
  useEffect(() => {
    if (visibleCount >= lines.length) {
      if (autoAdvance && onComplete) {
        const timer = setTimeout(onComplete, advanceDelay);
        return () => clearTimeout(timer);
      }
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount(c => Math.min(lines.length, c + 1));
    }, 1200);

    return () => clearTimeout(timer);
  }, [visibleCount, lines.length, onComplete, advanceDelay, autoAdvance]);

  // Handle player clicking anywhere on narrative box to reveal all or continue
  const handleBoxClick = () => {
    if (visibleCount < lines.length) {
      setVisibleCount(lines.length);
    }
  };

  const isAllVisible = visibleCount >= lines.length;

  return (
    <div className="narrative-text" onClick={handleBoxClick}>
      <div className="narrative-lines">
        {lines.slice(0, visibleCount).map((line, i) => (
          <p
            key={i}
            className="narrative-line"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {line}
          </p>
        ))}
      </div>

      {isAllVisible && onComplete && (
        <div className="narrative-action-bar">
          <button
            className="continue-btn narrative-continue-btn"
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
          >
            <span>{continueText}</span>
          </button>
        </div>
      )}

      {!isAllVisible && (
        <span className="narrative-tap-hint">Click to reveal more information •••</span>
      )}
    </div>
  );
};
