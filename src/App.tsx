import React, { useCallback, useState, useEffect } from 'react';
import { useGameState, type GamePhase } from './hooks/useGameState';
import { useAudioEngine } from './hooks/useAudioEngine';
import { CinematicPanel, SubtitleBar, NarrativeText } from './components/CinematicPanel';
import { ScramblePuzzle } from './components/ScramblePuzzle';
import { CipherPuzzle } from './components/CipherPuzzle';
import { BlueprintPuzzle } from './components/BlueprintPuzzle';
import { CHARACTERS, SAMPLE_DIALOGUE_LINES } from './data/dialogueCatalog';

/* ═══════════════════════════════════════════════════════
   THE LAST PURNIMA — An Interactive Cinematic Thriller
   ═══════════════════════════════════════════════════════ */

// Canonical audio takes map
const AUDITION_MAP: Record<string, string> = {
  meera_whisper_recording: '/audio/voice-auditions/meera_take1_breathless_urgency.mp3',
  keeper_discovery_threat: '/audio/drama3-comparison/keeper_discovery_threat_drama3.mp3',
  protagonist_scrambled_image: '/audio/voice-auditions/kabir_take1_grounded_self_talk.mp3',
};

/* ─── Sub-components with isolated lifecycle hooks ───── */

interface Act1PlaybackViewProps {
  onComplete: () => void;
  playDialogueById: (id: string, onEnd?: () => void) => void;
}

const Act1PlaybackView: React.FC<Act1PlaybackViewProps> = ({ onComplete, playDialogueById }) => {
  useEffect(() => {
    playDialogueById('meera_whisper_recording', () => {
      setTimeout(() => onComplete(), 1800);
    });
  }, [playDialogueById, onComplete]);

  return (
    <CinematicPanel backgroundUrl="/assets/opening_recording_1.png" overlayOpacity={0.65}>
      <div className="recording-scene">
        <div className="recording-indicator">
          <div className="rec-dot" />
          <span>PLAYING RECOVERED AUDIO</span>
        </div>
        <div className="audio-waveform">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="waveform-bar"
              style={{
                animationDelay: `${(i % 6) * 0.1}s`,
                height: `${22 + ((i * 7) % 36)}px`,
              }}
            />
          ))}
        </div>
        <div className="character-tag meera-tag">
          <img src="/assets/meera_char_ref.png" alt="Meera" className="tag-avatar" />
          <div className="tag-info">
            <span className="tag-name">Meera</span>
            <span className="tag-role">Hostage — Captured at Devgarh</span>
          </div>
        </div>
      </div>
    </CinematicPanel>
  );
};

interface Act1KeeperViewProps {
  onComplete: () => void;
  playDialogueById: (id: string, onEnd?: () => void) => void;
  addClue: (id: string) => void;
  setFlag: (key: string, val: boolean) => void;
}

const Act1KeeperView: React.FC<Act1KeeperViewProps> = ({ onComplete, playDialogueById, addClue, setFlag }) => {
  useEffect(() => {
    playDialogueById('keeper_discovery_threat', () => {
      addClue('distress_recording');
      setFlag('heard_recording', true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    });
  }, [playDialogueById, addClue, setFlag, onComplete]);

  return (
    <CinematicPanel backgroundUrl="/assets/the_keeper_ref.webp" overlayOpacity={0.65}>
      <div className="recording-scene keeper-scene">
        <div className="recording-indicator danger">
          <div className="rec-dot danger-dot" />
          <span>SIGNAL COMPROMISED — INTRUDER DETECTED</span>
        </div>
        <div className="audio-waveform danger-waveform">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="waveform-bar danger-bar"
              style={{
                animationDelay: `${(i % 5) * 0.08}s`,
                height: `${28 + ((i * 11) % 40)}px`,
              }}
            />
          ))}
        </div>
        <div className="character-tag keeper-tag">
          <img src="/assets/the_keeper_ref.webp" alt="The Keeper" className="tag-avatar" />
          <div className="tag-info">
            <span className="tag-name">The Keeper</span>
            <span className="tag-role">Armed Captor — Devgarh Haveli</span>
          </div>
        </div>
      </div>
    </CinematicPanel>
  );
};

interface ClimaxViewProps {
  onComplete: () => void;
  playRevealStinger: () => void;
}

const ClimaxView: React.FC<ClimaxViewProps> = ({ onComplete, playRevealStinger }) => {
  useEffect(() => {
    playRevealStinger();
  }, [playRevealStinger]);

  return (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.55}>
      <NarrativeText
        lines={[
          'The foundation stone shifts. Mortar crumbles into sixty years of dust.',
          'Beyond the breach — an unmapped holding chamber. Rusted chains. A phone on the floor.',
          'Meera is alive. Terrified, bruised, but breathing.',
          'The Keeper is nowhere to be found. A second exit leads down into the dry riverbed.',
          'He knew someone was coming. As if someone called him ahead of time.',
        ]}
        onComplete={() => {
          setTimeout(() => onComplete(), 2000);
        }}
        autoAdvance
        advanceDelay={4000}
      />
    </CinematicPanel>
  );
};

/* ─── Main Application Component ─────────────────────── */

export const App: React.FC = () => {
  const game = useGameState();
  const audio = useAudioEngine();
  const { state } = game;
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showActBanner, setShowActBanner] = useState(false);
  const [actBannerText, setActBannerText] = useState('');
  const [actBannerSub, setActBannerSub] = useState('');

  // Start ambient on first interaction
  const handleFirstInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      audio.startAmbientDrone();
    }
  }, [hasInteracted, audio]);

  // Act banner display
  const showActIntro = useCallback((title: string, subtitle: string, duration = 3000) => {
    setActBannerText(title);
    setActBannerSub(subtitle);
    setShowActBanner(true);
    setTimeout(() => setShowActBanner(false), duration);
  }, []);

  // Advance to next phase with cinematic transition
  const advanceTo = useCallback((phase: GamePhase) => {
    game.startTransition(phase, 1200);
  }, [game]);

  // Play dialogue by ID and show subtitle
  const playDialogueById = useCallback(async (dialogueId: string, onEnd?: () => void) => {
    const line = SAMPLE_DIALOGUE_LINES.find(l => l.id === dialogueId);
    if (!line) {
      onEnd?.();
      return;
    }
    const character = CHARACTERS[line.character];
    const audioUrl = AUDITION_MAP[dialogueId] || line.audioUrl;

    game.showSubtitle(line.text, character?.name || line.characterName, character?.color || '#f1f5f9');

    await audio.playDialogue(audioUrl, () => {
      setTimeout(() => game.hideSubtitle(), 1500);
      onEnd?.();
    });
  }, [audio, game]);

  /* ─── Phase-specific rendering ────────────────────── */

  // TITLE SCREEN
  const renderTitle = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.72}>
      <div className="title-screen" onClick={handleFirstInteraction}>
        <div className="title-ornament">✦ ✦ ✦</div>
        <h1 className="game-title">The Last Purnima</h1>
        <div className="title-divider" />
        <p className="title-tagline">A Cinematic Mystery at Devgarh Haveli</p>
        <p className="title-sub">An interactive thriller with dynamic voice performances</p>

        <button
          className="start-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleFirstInteraction();
            showActIntro('Act I', 'The Distress Recording');
            setTimeout(() => advanceTo('act1_intro'), 3200);
          }}
        >
          <span className="btn-icon">▶</span>
          <span>Begin Investigation</span>
        </button>

        <div className="title-credits">
          <p>Voice Performance: Fish Audio Drama 3</p>
          <p>Devgarh Haveli Archive • Click to Start Audio</p>
        </div>
      </div>
    </CinematicPanel>
  );

  // ACT 1: THE DISTRESS RECORDING
  const renderAct1Intro = () => (
    <CinematicPanel backgroundUrl="/assets/opening_recording_1.png" overlayOpacity={0.65}>
      <NarrativeText
        lines={[
          'A damaged audio file was recovered from Meera\'s phone.',
          'The recording was captured in secret... distorted by suffocating fear.',
          'Her voice is unmistakable. She doesn\'t know how much time is left.',
        ]}
        onComplete={() => advanceTo('act1_playback')}
        autoAdvance
        advanceDelay={1500}
      />
    </CinematicPanel>
  );

  // ACT 2: THE SCRAMBLED PHOTOGRAPH
  const renderAct2Intro = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.7}>
      <NarrativeText
        lines={[
          'Hidden in the audio file\'s EXIF metadata — an encrypted photo fragment.',
          'Kabir downloads the corrupted thumbnail. The pixels are fractured.',
          '"If I can reconstruct this façade... I will know exactly which estate she was taken to."',
        ]}
        onComplete={() => {
          playDialogueById('protagonist_scrambled_image', () => {
            advanceTo('act2_puzzle');
          });
        }}
        autoAdvance
        advanceDelay={1600}
      />
    </CinematicPanel>
  );

  const renderAct2Puzzle = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.82}>
      <ScramblePuzzle
        imageUrl="/assets/devgarh_haveli_ref.png"
        onSolve={() => {
          audio.playSolveStinger();
          game.completePuzzle('scramble');
          game.addClue('haveli_identified');
          setTimeout(() => advanceTo('act2_reveal'), 1000);
        }}
      />
    </CinematicPanel>
  );

  const renderAct2Reveal = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.5}>
      <div className="reveal-scene">
        <div className="reveal-badge">
          <span className="reveal-icon">✦</span>
          <h2>Devgarh Haveli Identified</h2>
          <p>An abandoned ancestral estate in the northern ridges</p>
          <p className="reveal-detail">Documented structural restoration: 1980</p>
        </div>
        <button
          className="continue-btn"
          onClick={() => {
            showActIntro('Act III', 'The Caesar Cipher');
            setTimeout(() => advanceTo('act3_intro'), 3200);
          }}
        >
          Travel to the Haveli →
        </button>
      </div>
    </CinematicPanel>
  );

  // ACT 3: THE CAESAR CIPHER
  const renderAct3Intro = () => (
    <CinematicPanel backgroundUrl="/assets/haveli_entrance_coded_note.jpg" overlayOpacity={0.65}>
      <NarrativeText
        lines={[
          'At the massive iron gates of Devgarh Haveli, Kabir finds an inscription.',
          'Carved into the lintel, an encoded sequence of letters.',
          'Beneath the inscription, an architectural clue: "Three steps back reveal the foundation."',
        ]}
        onComplete={() => advanceTo('act3_puzzle')}
        autoAdvance
        advanceDelay={1600}
      />
    </CinematicPanel>
  );

  const renderAct3Puzzle = () => (
    <CinematicPanel backgroundUrl="/assets/haveli_entrance_coded_note.jpg" overlayOpacity={0.78}>
      <CipherPuzzle
        cipherText="ORRN LQ WKH IRXQGDWLRQ ZDOO"
        plainText="LOOK IN THE FOUNDATION WALL"
        correctShift={23} // Shift -3 is equivalent to shift +23 mod 26
        onSolve={() => {
          audio.playSolveStinger();
          game.completePuzzle('cipher');
          game.addClue('foundation_wall_clue');
          setTimeout(() => advanceTo('act3_reveal'), 1000);
        }}
      />
    </CinematicPanel>
  );

  const renderAct3Reveal = () => (
    <CinematicPanel backgroundUrl="/assets/haveli_entrance_coded_note.jpg" overlayOpacity={0.52}>
      <div className="reveal-scene">
        <div className="reveal-badge">
          <span className="reveal-icon">🔐</span>
          <h2>"LOOK IN THE FOUNDATION WALL"</h2>
          <p>The decoded message points to a reinforced section of the lower cellar</p>
          <p className="reveal-detail">
            Comparing the 1920 survey with the 1980 blueprint will expose the secret void
          </p>
        </div>
        <button
          className="continue-btn"
          onClick={() => {
            showActIntro('Act IV', 'The Concealed Chamber');
            setTimeout(() => advanceTo('act4_intro'), 3200);
          }}
        >
          Examine the Blueprints →
        </button>
      </div>
    </CinematicPanel>
  );

  // ACT 4: THE BLUEPRINT COMPARISON
  const renderAct4Intro = () => (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.65}>
      <NarrativeText
        lines={[
          'Kabir pulls up the archival records: two surveys of the haveli basement.',
          'The 1920 Original Architectural Survey vs. the 1980 Structural Renovation.',
          'One of the perimeter walls was doubled in thickness... creating an unmapped void.',
        ]}
        onComplete={() => advanceTo('act4_puzzle')}
        autoAdvance
        advanceDelay={1600}
      />
    </CinematicPanel>
  );

  const renderAct4Puzzle = () => (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.8}>
      <BlueprintPuzzle
        historicImageUrl="/assets/concealed_chamber.jpg"
        restoredImageUrl="/assets/haveli_entrance_coded_note.jpg"
        onSolve={() => {
          audio.playRevealStinger();
          game.completePuzzle('blueprint');
          game.addClue('concealed_chamber_found');
          setTimeout(() => advanceTo('act4_reveal'), 1000);
        }}
      />
    </CinematicPanel>
  );

  const renderAct4Reveal = () => (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.48}>
      <div className="reveal-scene">
        <div className="reveal-badge dramatic">
          <span className="reveal-icon">✦</span>
          <h2>The Concealed Chamber Uncovered</h2>
          <p>A hollowed structural cavity behind the east foundation masonry</p>
          <p className="reveal-detail">Meera is held inside. There's no time to wait for police.</p>
        </div>
        <button
          className="continue-btn dramatic-btn"
          onClick={() => advanceTo('climax')}
        >
          Breach the Wall →
        </button>
      </div>
    </CinematicPanel>
  );

  // ENDING: THE AMBIGUOUS CONSPIRACY
  const renderEnding = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.78}>
      <div className="ending-scene">
        <div className="ending-document">
          <div className="document-header">
            <span className="doc-stamp">CONFIDENTIAL EVIDENCE</span>
            <h3>Recovered from the Abandoned Phone</h3>
          </div>
          <div className="document-body">
            <p className="evidence-line">
              Transaction: <strong>₹15,00,000 NEFT Transfer</strong>
            </p>
            <p className="evidence-line">
              Originating Account: <span className="redacted">████████████</span>
            </p>
            <p className="evidence-line">
              Memo: <em>"Family settlement — final tranche upon silence"</em>
            </p>
            <p className="evidence-line dim">
              The routing code matches an account within the Bisht family trust.
            </p>
            <p className="evidence-line alert-text">
              The Keeper didn't plan this alone. Someone paid him to hold her.
            </p>
          </div>
        </div>

        <NarrativeText
          lines={[
            'Meera is safe in hospital. The Keeper vanished into the night.',
            'Yet the payment was authorized from inside the family\'s own inner circle.',
            'Who signed off on the transfer? And what were they trying to silence?',
            'Some family secrets remain buried under the stones of Devgarh.',
          ]}
          onComplete={() => {}}
          advanceDelay={5000}
        />

        <button
          className="continue-btn ending-btn"
          onClick={() => advanceTo('credits')}
        >
          Epilogue & Credits ✦
        </button>
      </div>
    </CinematicPanel>
  );

  // CREDITS
  const renderCredits = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.88}>
      <div className="credits-scene">
        <div className="credits-ornament">✦ ✦ ✦</div>
        <h2 className="credits-title">The Last Purnima</h2>
        <div className="credits-divider" />

        <div className="credits-section">
          <h4>Story & Experience Design</h4>
          <p>Parth Bisht</p>
        </div>

        <div className="credits-section">
          <h4>Voice Acting & Synthesis</h4>
          <p>Powered by Fish Audio — Drama 3 Model</p>
        </div>

        <div className="credits-section">
          <h4>Cast of Characters</h4>
          <div className="credits-characters">
            {Object.values(CHARACTERS).map(c => (
              <div key={c.id} className="credit-char">
                <span style={{ color: c.color }}>●</span> {c.name} — {c.role}
              </div>
            ))}
          </div>
        </div>

        <div className="credits-section">
          <h4>Investigation Dossier</h4>
          <p>Clues Uncovered: {state.discoveredClues.size}</p>
          <p>Puzzles Decoded: {state.completedPuzzles.size} / 3</p>
        </div>

        <button
          className="start-btn restart-btn"
          onClick={() => {
            game.resetGame();
            audio.stopAmbientDrone();
          }}
        >
          Play Again ↺
        </button>
      </div>
    </CinematicPanel>
  );

  /* ─── Phase router ────────────────────────────────── */
  const renderPhase = (): React.ReactNode => {
    switch (state.phase) {
      case 'title': return renderTitle();
      case 'act1_intro': return renderAct1Intro();
      case 'act1_playback':
        return (
          <Act1PlaybackView
            playDialogueById={playDialogueById}
            onComplete={() => advanceTo('act1_keeper')}
          />
        );
      case 'act1_keeper':
        return (
          <Act1KeeperView
            playDialogueById={playDialogueById}
            addClue={game.addClue}
            setFlag={game.setFlag}
            onComplete={() => {
              showActIntro('Act II', 'The Ancestral Haveli');
              setTimeout(() => advanceTo('act2_intro'), 3200);
            }}
          />
        );
      case 'act2_intro': return renderAct2Intro();
      case 'act2_puzzle': return renderAct2Puzzle();
      case 'act2_reveal': return renderAct2Reveal();
      case 'act3_intro': return renderAct3Intro();
      case 'act3_puzzle': return renderAct3Puzzle();
      case 'act3_reveal': return renderAct3Reveal();
      case 'act4_intro': return renderAct4Intro();
      case 'act4_puzzle': return renderAct4Puzzle();
      case 'act4_reveal': return renderAct4Reveal();
      case 'climax':
        return (
          <ClimaxView
            playRevealStinger={audio.playRevealStinger}
            onComplete={() => advanceTo('ending')}
          />
        );
      case 'ending': return renderEnding();
      case 'credits': return renderCredits();
      default: return renderTitle();
    }
  };

  return (
    <div className="game-container" onClick={handleFirstInteraction}>
      {/* Phase transition overlay */}
      <div className={`transition-overlay ${state.isTransitioning ? 'active' : ''}`} />

      {/* Act banner */}
      {showActBanner && (
        <div className="act-banner">
          <div className="act-banner-inner">
            <div className="act-ornament">✦</div>
            <h2 className="act-title">{actBannerText}</h2>
            <p className="act-subtitle">{actBannerSub}</p>
            <div className="act-ornament">✦</div>
          </div>
        </div>
      )}

      {/* Main content */}
      {renderPhase()}

      {/* Subtitle bar */}
      <SubtitleBar
        speaker={state.subtitleSpeaker}
        text={state.currentSubtitle}
        color={state.subtitleColor}
        visible={state.showSubtitle}
      />

      {/* HUD */}
      <div className="game-hud">
        {state.phase !== 'title' && state.phase !== 'credits' && (
          <div className="hud-progress">
            {[1, 2, 3, 4].map((act) => (
              <div
                key={act}
                className={`hud-act-dot ${state.currentAct >= act ? 'active' : ''} ${state.currentAct === act ? 'current' : ''}`}
                title={`Act ${act}`}
              >
                {act}
              </div>
            ))}
          </div>
        )}

        <button
          className="hud-mute-btn"
          onClick={(e) => {
            e.stopPropagation();
            audio.toggleMute();
          }}
          title={audio.isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
        >
          {audio.isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
};

export default App;
