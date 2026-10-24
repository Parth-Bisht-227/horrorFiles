import React, { useCallback, useState } from 'react';
import { useGameState, type GamePhase } from './hooks/useGameState';
import { useAudioEngine } from './hooks/useAudioEngine';
import { CinematicPanel, SubtitleBar, NarrativeText } from './components/CinematicPanel';
import { ScramblePuzzle } from './components/ScramblePuzzle';
import { CipherPuzzle } from './components/CipherPuzzle';
import { BlueprintPuzzle } from './components/BlueprintPuzzle';
import { CHARACTERS, SAMPLE_DIALOGUE_LINES } from './data/dialogueCatalog';

/* ═══════════════════════════════════════════════════════
   HORRORFILES: CASE 001 — DEVGARH
   Tagline: "Every secret leaves a trace."
   ═══════════════════════════════════════════════════════ */

// Canonical audio takes map
// Meera: Approved Take 1 (breathless urgency, 1.15x)
// Kabir: Approved Take 1 (grounded self-talk, 1.05x)
// Keeper: Temporary placeholder take (explosive cold) pending new voice selection
const CANONICAL_AUDIO_MAP: Record<string, string> = {
  meera_whisper_recording: '/audio/voice-auditions/meera_take1_breathless_urgency.mp3',
  keeper_discovery_threat: '/audio/voice-auditions/keeper_take1_explosive_cold.mp3',
  protagonist_scrambled_image: '/audio/voice-auditions/kabir_take1_grounded_self_talk.mp3',
};

/* ─── Act 1 Views with Player Pacing & Replay Controls ─── */

interface Act1PlaybackViewProps {
  onComplete: () => void;
  playDialogueById: (id: string, onEnd?: () => void) => Promise<void>;
  stopDialogue: () => void;
  isDialoguePlaying: boolean;
}

const Act1PlaybackView: React.FC<Act1PlaybackViewProps> = ({
  onComplete,
  playDialogueById,
  stopDialogue,
  isDialoguePlaying,
}) => {
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = async () => {
    setHasPlayed(true);
    await playDialogueById('meera_whisper_recording');
  };

  const handleStop = () => {
    stopDialogue();
  };

  return (
    <CinematicPanel backgroundUrl="/assets/opening_recording_1.png" overlayOpacity={0.65}>
      <div className="recording-scene">
        <div className="recording-indicator">
          <div className={`rec-dot ${isDialoguePlaying ? 'active' : ''}`} />
          <span>{isDialoguePlaying ? 'PLAYING AUDIO RECOVERY [MEERA]' : 'AUDIO FILE RECOVERED (0:09)'}</span>
        </div>

        <div className="audio-waveform">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className={`waveform-bar ${isDialoguePlaying ? 'playing' : 'idle'}`}
              style={{
                animationDelay: `${(i % 6) * 0.1}s`,
                height: isDialoguePlaying ? `${20 + ((i * 7) % 36)}px` : '8px',
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

        <div className="audio-playback-actions">
          {!isDialoguePlaying ? (
            <button className="playback-btn play-btn" onClick={handlePlay}>
              <span>{hasPlayed ? '↺ Replay Recording' : '▶ Play Recovered Recording'}</span>
            </button>
          ) : (
            <button className="playback-btn pause-btn" onClick={handleStop}>
              <span>⏹ Stop Playback</span>
            </button>
          )}

          <button
            className={`continue-btn ${hasPlayed ? 'active' : 'disabled'}`}
            disabled={!hasPlayed}
            onClick={() => {
              stopDialogue();
              onComplete();
            }}
          >
            <span>Analyze Signal Interruption →</span>
          </button>
        </div>
      </div>
    </CinematicPanel>
  );
};

interface Act1KeeperViewProps {
  onComplete: () => void;
  playDialogueById: (id: string, onEnd?: () => void) => Promise<void>;
  stopDialogue: () => void;
  isDialoguePlaying: boolean;
  addClue: (id: string) => void;
  setFlag: (key: string, val: boolean) => void;
}

const Act1KeeperView: React.FC<Act1KeeperViewProps> = ({
  onComplete,
  playDialogueById,
  stopDialogue,
  isDialoguePlaying,
  addClue,
  setFlag,
}) => {
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlayThreat = async () => {
    setHasPlayed(true);
    addClue('distress_recording');
    setFlag('heard_recording', true);
    await playDialogueById('keeper_discovery_threat');
  };

  return (
    <CinematicPanel backgroundUrl="/assets/the_keeper_ref.webp" overlayOpacity={0.65}>
      <div className="recording-scene keeper-scene">
        <div className="recording-indicator danger">
          <div className={`rec-dot danger-dot ${isDialoguePlaying ? 'active' : ''}`} />
          <span>INTRUDER INTERRUPT DETECTED (0:14)</span>
        </div>

        <div className="audio-waveform danger-waveform">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className={`waveform-bar danger-bar ${isDialoguePlaying ? 'playing' : 'idle'}`}
              style={{
                animationDelay: `${(i % 5) * 0.08}s`,
                height: isDialoguePlaying ? `${26 + ((i * 11) % 40)}px` : '10px',
              }}
            />
          ))}
        </div>

        <div className="character-tag keeper-tag">
          <img src="/assets/the_keeper_ref.webp" alt="The Keeper" className="tag-avatar" />
          <div className="tag-info">
            <span className="tag-name">The Keeper</span>
            <span className="tag-role">Mercenary Captor (Temporary Voice Placeholder)</span>
          </div>
        </div>

        <div className="audio-playback-actions">
          {!isDialoguePlaying ? (
            <button className="playback-btn play-btn threat-play-btn" onClick={handlePlayThreat}>
              <span>{hasPlayed ? '↺ Replay Threat' : '▶ Play Threat Audio'}</span>
            </button>
          ) : (
            <button className="playback-btn pause-btn" onClick={stopDialogue}>
              <span>⏹ Stop Playback</span>
            </button>
          )}

          <button
            className="continue-btn haveli-next-btn"
            onClick={() => {
              stopDialogue();
              onComplete();
            }}
          >
            <span>Proceed to Act II: Façade Analysis →</span>
          </button>
        </div>
      </div>
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
  const showActIntro = useCallback((title: string, subtitle: string, duration = 2800) => {
    setActBannerText(title);
    setActBannerSub(subtitle);
    setShowActBanner(true);
    setTimeout(() => setShowActBanner(false), duration);
  }, []);

  // Advance to next phase with transition
  const advanceTo = useCallback((phase: GamePhase) => {
    audio.stopDialogue();
    game.hideSubtitle();
    game.startTransition(phase, 800);
  }, [game, audio]);

  // Play dialogue by ID and show synchronized subtitle
  const playDialogueById = useCallback(async (dialogueId: string, onEnd?: () => void) => {
    const line = SAMPLE_DIALOGUE_LINES.find(l => l.id === dialogueId);
    if (!line) {
      onEnd?.();
      return;
    }
    const character = CHARACTERS[line.character];
    const audioUrl = CANONICAL_AUDIO_MAP[dialogueId] || line.audioUrl;

    game.showSubtitle(line.text, character?.name || line.characterName, character?.color || '#f1f5f9');

    await audio.playDialogue(audioUrl, () => {
      onEnd?.();
    });
  }, [audio, game]);

  /* ─── Phase-Specific Rendering ─────────────────────── */

  // TITLE SCREEN
  const renderTitle = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.72}>
      <div className="title-screen" onClick={handleFirstInteraction}>
        <div className="title-ornament">✦ ✦ ✦</div>
        <h1 className="game-title">HorrorFiles</h1>
        <p className="game-case-subtitle">Case 001 — Devgarh</p>
        <div className="title-divider" />
        <p className="title-tagline">Every secret leaves a trace.</p>
        <p className="title-sub">An Indian Gothic investigative thriller</p>

        <button
          className="start-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleFirstInteraction();
            showActIntro('Act I', 'The Distress Recording');
            advanceTo('act1_intro');
          }}
        >
          <span className="btn-icon">▶</span>
          <span>Begin Investigation</span>
        </button>

        <div className="title-credits">
          <p>Voice Acting: Fish Audio Drama 3</p>
          <p>Devgarh Haveli Estate Archive • Click to Enable Audio</p>
        </div>
      </div>
    </CinematicPanel>
  );

  // ACT 1: THE DISTRESS RECORDING INTRO
  const renderAct1Intro = () => (
    <CinematicPanel backgroundUrl="/assets/opening_recording_1.png" overlayOpacity={0.65}>
      <NarrativeText
        lines={[
          'A damaged audio file was recovered from Meera\'s phone.',
          'The recording was captured in secret... distorted by fear.',
          'In the frame, two features are visible: a three-leaf emblem and a carved stone lattice.',
        ]}
        continueText="Listen to Recovered Audio →"
        onComplete={() => advanceTo('act1_playback')}
      />
    </CinematicPanel>
  );

  // ACT 2: SCRAMBLED IMAGE INTRO
  const renderAct2Intro = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.7}>
      <div className="act2-intro-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          className="playback-btn play-btn"
          onClick={() => playDialogueById('protagonist_scrambled_image')}
          style={{ marginBottom: '16px' }}
        >
          <span>▶ Play Kabir's Field Audio</span>
        </button>

        <NarrativeText
          lines={[
            'Recovered from the phone\'s metadata — a scrambled screenshot of the haveli façade.',
            'In the family archive, Kabir finds an old architectural clue: "Three leaves. Three steps back."',
            'Reconstructing the screenshot will allow him to compare the emblem and lattice with the archive.',
          ]}
          continueText="Begin Façade Reconstruction →"
          onComplete={() => {
            audio.stopDialogue();
            advanceTo('act2_puzzle');
          }}
        />
      </div>
    </CinematicPanel>
  );

  // ACT 2: PUZZLE
  const renderAct2Puzzle = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.82}>
      <ScramblePuzzle
        imageUrl="/assets/devgarh_haveli_ref.png"
        onTileClick={audio.playTileClick}
        onSolve={() => {
          audio.playSolveStinger();
          game.completePuzzle('scramble');
          game.addClue('haveli_identified');
          showActIntro('Act III', 'The Caesar Cipher');
          advanceTo('act3_intro');
        }}
      />
    </CinematicPanel>
  );

  // ACT 3: CAESAR CIPHER INTRO
  const renderAct3Intro = () => (
    <CinematicPanel backgroundUrl="/assets/haveli_entrance_coded_note.jpg" overlayOpacity={0.65}>
      <NarrativeText
        lines={[
          'At Devgarh Haveli, Kabir discovers a Caesar cipher carved into the masonry.',
          'The family archive clue holds the key: "Three leaves. Three steps back."',
          'Shifting the letters back three places will reveal where the old plans are hidden.',
        ]}
        continueText="Inspect Inscription & Cipher →"
        onComplete={() => advanceTo('act3_puzzle')}
      />
    </CinematicPanel>
  );

  // ACT 3: PUZZLE
  const renderAct3Puzzle = () => (
    <CinematicPanel backgroundUrl="/assets/haveli_entrance_coded_note.jpg" overlayOpacity={0.78}>
      <CipherPuzzle
        onWheelStep={audio.playWheelClick}
        onSolve={() => {
          audio.playSolveStinger();
          game.completePuzzle('cipher');
          game.addClue('north_gallery_plan');
          showActIntro('Act IV', 'The Concealed Chamber');
          advanceTo('act4_intro');
        }}
      />
    </CinematicPanel>
  );

  // ACT 4: BLUEPRINT COMPARATOR INTRO
  const renderAct4Intro = () => (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.65}>
      <NarrativeText
        lines={[
          'Behind the loose panel in the North Gallery, Kabir retrieves the original architectural floor plan.',
          'Comparing this original plan with the later restoration plan will reveal structural differences.',
          'A concealed chamber exists in the original layout that the restoration plan omits.',
        ]}
        continueText="Open Blueprint Comparator →"
        onComplete={() => advanceTo('act4_puzzle')}
      />
    </CinematicPanel>
  );

  // ACT 4: PUZZLE
  const renderAct4Puzzle = () => (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.8}>
      <BlueprintPuzzle
        onSliderMove={audio.playPaperRustle}
        onSolve={() => {
          audio.playRevealStinger();
          game.completePuzzle('blueprint');
          game.addClue('concealed_chamber_found');
          advanceTo('climax');
        }}
      />
    </CinematicPanel>
  );

  // CLIMAX: RESCUE
  const renderClimax = () => (
    <CinematicPanel backgroundUrl="/assets/concealed_chamber.jpg" overlayOpacity={0.55}>
      <NarrativeText
        lines={[
          'Behind the western wall of the North Gallery, the mortar gives way.',
          'Beyond the opening lies the concealed chamber. Inside — Meera, alive and safe.',
          'The Keeper is gone. Footprints lead toward an overgrown iron gate left ajar into the estate grounds.',
          'He fled shortly before Kabir broke through the wall.',
        ]}
        continueText="Inspect Abandoned Evidence →"
        onComplete={() => advanceTo('ending')}
      />
    </CinematicPanel>
  );

  // ENDING: THE UNCONFIRMED CONSPIRACY
  const renderEnding = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.78}>
      <div className="ending-scene">
        <div className="ending-document">
          <div className="document-header">
            <span className="doc-stamp">RECOVERED EVIDENCE</span>
            <h3>Discarded Phone — Unsent Messages</h3>
          </div>
          <div className="document-body">
            <p className="evidence-line">
              Encrypted Thread: <strong>Incoming instructions to the Keeper</strong>
            </p>
            <p className="evidence-line">
              Sender: <span className="redacted" title="Unknown Contact">UNKNOWN SENDER</span>
            </p>
            <p className="evidence-line">
              Directives: <em>"Keep her locked in the north gallery chamber. Do not harm her until papers are settled."</em>
            </p>
            <p className="evidence-line dim">
              The sender had intimate knowledge of the family's haveli, private schedule, and hidden spaces.
            </p>
            <p className="evidence-line alert-text">
              The directives suggest someone close to the family arranged this, but the culprit's true identity remains unknown.
            </p>
          </div>
        </div>

        <NarrativeText
          lines={[
            'Meera is safe. The Keeper has vanished into the surrounding estate.',
            'The recovered messages imply someone with intimate family knowledge was involved.',
            'Yet the person behind the kidnapping remains unidentified.',
            'The question lingers in the quiet halls of Devgarh.',
          ]}
          continueText="View Investigation Dossier & Credits ✦"
          onComplete={() => advanceTo('credits')}
        />
      </div>
    </CinematicPanel>
  );

  // CREDITS
  const renderCredits = () => (
    <CinematicPanel backgroundUrl="/assets/devgarh_haveli_ref.png" overlayOpacity={0.88}>
      <div className="credits-scene">
        <div className="credits-ornament">✦ ✦ ✦</div>
        <h2 className="credits-title">HorrorFiles</h2>
        <p className="credits-case-subtitle">Case 001 — Devgarh</p>
        <p className="credits-tagline">“Every secret leaves a trace.”</p>
        <div className="credits-divider" />

        <div className="credits-section">
          <h4>Story & Experience Design</h4>
          <p>Parth Bisht</p>
        </div>

        <div className="credits-section">
          <h4>Voice Performance & Audio</h4>
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
            audio.stopDialogue();
          }}
        >
          Play Again ↺
        </button>
      </div>
    </CinematicPanel>
  );

  /* ─── Phase Router ─────────────────────────────────── */
  const renderPhase = (): React.ReactNode => {
    switch (state.phase) {
      case 'title': return renderTitle();
      case 'act1_intro': return renderAct1Intro();
      case 'act1_playback':
        return (
          <Act1PlaybackView
            playDialogueById={playDialogueById}
            stopDialogue={audio.stopDialogue}
            isDialoguePlaying={audio.isDialoguePlaying}
            onComplete={() => advanceTo('act1_keeper')}
          />
        );
      case 'act1_keeper':
        return (
          <Act1KeeperView
            playDialogueById={playDialogueById}
            stopDialogue={audio.stopDialogue}
            isDialoguePlaying={audio.isDialoguePlaying}
            addClue={game.addClue}
            setFlag={game.setFlag}
            onComplete={() => {
              showActIntro('Act II', 'The Ancestral Haveli');
              advanceTo('act2_intro');
            }}
          />
        );
      case 'act2_intro': return renderAct2Intro();
      case 'act2_puzzle': return renderAct2Puzzle();
      case 'act3_intro': return renderAct3Intro();
      case 'act3_puzzle': return renderAct3Puzzle();
      case 'act4_intro': return renderAct4Intro();
      case 'act4_puzzle': return renderAct4Puzzle();
      case 'climax': return renderClimax();
      case 'ending': return renderEnding();
      case 'credits': return renderCredits();
      default: return renderTitle();
    }
  };

  return (
    <div className="game-container" onClick={handleFirstInteraction}>
      {/* Phase transition blackout overlay */}
      <div className={`transition-overlay ${state.isTransitioning ? 'active' : ''}`} />

      {/* Act Banner Modal */}
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

      {/* Current Phase Content */}
      {renderPhase()}

      {/* Subtitle Ribbon */}
      <SubtitleBar
        speaker={state.subtitleSpeaker}
        text={state.currentSubtitle}
        color={state.subtitleColor}
        visible={state.showSubtitle}
      />

      {/* HUD Bar */}
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
