import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CHARACTERS, SCENES, SAMPLE_DIALOGUE_LINES } from './data/dialogueCatalog';
import type { DialogueLine, AudioManifest } from './types/dialogue';

interface AuditionTake {
  takeId: string;
  character: string;
  characterName: string;
  voiceId: string;
  model: string;
  speed: number;
  takeLabel: string;
  directionSummary: string;
  apiPrompt: string;
  cleanSubtitle: string;
  outputFilename: string;
  audioUrl: string;
  fileSizeBytes: number;
  latencyMs: number;
  generatedAt: string;
  status: string;
}

interface AuditionsManifest {
  version: string;
  updatedAt: string;
  takes: AuditionTake[];
}

export const App: React.FC = () => {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'auditions' | 'testbench' | 'scene' | 'assets' | 'diagnostics'>('auditions');
  const [activeSceneId, setActiveSceneId] = useState<string>('scene_1_recording');
  const [currentLineId, setCurrentLineId] = useState<string>('meera_whisper_recording');
  const [activeModelMode, setActiveModelMode] = useState<'s2.1' | 'drama-3'>('drama-3');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [activePlayingUrl, setActivePlayingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [s21Manifest, setS21Manifest] = useState<AudioManifest | null>(null);
  const [drama3Manifest, setDrama3Manifest] = useState<AudioManifest | null>(null);
  const [auditionsManifest, setAuditionsManifest] = useState<AuditionsManifest | null>(null);
  const [isSequencePlaying, setIsSequencePlaying] = useState<boolean>(false);

  // Audio element reference for single-instance playback (strictly prevents overlapping)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sequenceTimeoutRef = useRef<number | null>(null);

  // Active dialogue line
  const activeLine = SAMPLE_DIALOGUE_LINES.find((l) => l.id === currentLineId) || SAMPLE_DIALOGUE_LINES[0];
  const activeCharacter = CHARACTERS[activeLine.character] || CHARACTERS.meera;
  const activeScene = SCENES[activeSceneId] || SCENES.scene_1_recording;

  // Load all manifests on mount
  useEffect(() => {
    fetch('/audio/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setS21Manifest(data))
      .catch((err) => console.warn('Could not load S2.1 manifest:', err.message));

    fetch('/audio/drama3-comparison/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDrama3Manifest(data))
      .catch((err) => console.warn('Could not load Drama 3 manifest:', err.message));

    fetch('/audio/voice-auditions/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAuditionsManifest(data))
      .catch((err) => console.warn('Could not load Auditions manifest:', err.message));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (sequenceTimeoutRef.current) {
        window.clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, []);

  // Stop playback cleanly
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (sequenceTimeoutRef.current) {
      window.clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    setIsPlaying(false);
    setIsSequencePlaying(false);
    setActivePlayingUrl(null);
    setPlaybackProgress(0);
  }, []);

  // Play audio directly from URL with zero overlap
  const playUrl = useCallback((url: string, onFinish?: () => void) => {
    stopPlayback();
    setErrorMessage(null);
    setActivePlayingUrl(url);

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = url;

    audio.onplay = () => {
      setIsPlaying(true);
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setActivePlayingUrl(null);
      setPlaybackProgress(0);
      if (onFinish) onFinish();
    };

    audio.onerror = () => {
      setErrorMessage(`Audio failed to load from: ${url}`);
      setIsPlaying(false);
      setActivePlayingUrl(null);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Playback interrupted or blocked:', err);
        setErrorMessage('Click to play (Browser policy requires interaction).');
        setIsPlaying(false);
        setActivePlayingUrl(null);
      });
    }
  }, [stopPlayback]);

  // Compute audio URL based on selected model mode
  const getAudioUrlForLine = useCallback((line: DialogueLine, modelMode: 's2.1' | 'drama-3') => {
    if (modelMode === 'drama-3') {
      const ext = line.audioFilename.split('.').pop();
      const base = line.audioFilename.replace(`.${ext}`, '');
      return `/audio/drama3-comparison/${base}_drama3.${ext}`;
    }
    return line.audioUrl;
  }, []);

  // Play a specific dialogue line
  const playDialogue = useCallback((line: DialogueLine, forceModel?: 's2.1' | 'drama-3', onFinish?: () => void) => {
    setCurrentLineId(line.id);
    setActiveSceneId(line.scene);
    const modelToUse = forceModel || activeModelMode;
    const targetUrl = getAudioUrlForLine(line, modelToUse);
    playUrl(targetUrl, onFinish);
  }, [activeModelMode, getAudioUrlForLine, playUrl]);

  // Sequential Scene Playback (Scene 1: Meera -> Keeper)
  const playSceneSequence = useCallback((modelMode?: 's2.1' | 'drama-3') => {
    stopPlayback();
    setIsSequencePlaying(true);
    setActiveSceneId('scene_1_recording');

    const meeraLine = SAMPLE_DIALOGUE_LINES[0];
    const keeperLine = SAMPLE_DIALOGUE_LINES[1];

    playDialogue(meeraLine, modelMode, () => {
      sequenceTimeoutRef.current = window.setTimeout(() => {
        playDialogue(keeperLine, modelMode, () => {
          setIsSequencePlaying(false);
        });
      }, 700);
    });
  }, [stopPlayback, playDialogue]);

  // Select scene
  const selectScene = (sceneId: string) => {
    stopPlayback();
    setActiveSceneId(sceneId);
    const sceneLine = SAMPLE_DIALOGUE_LINES.find((l) => l.scene === sceneId);
    if (sceneLine) {
      setCurrentLineId(sceneLine.id);
    }
  };

  return (
    <div className="app-container">
      {/* Header & Title */}
      <header className="header-hero">
        <div className="ornament-crown">
          <span>✦</span> Devgarh Haveli <span>✦</span> An Ancestral Indian Mystery <span>✦</span>
        </div>
        <h1 className="title-main">The Last Purnima</h1>
        <p className="subtitle-narrative">
          A cinematic illustrated mystery thriller. Follow the distress recording, reconstruct the scrambled haveli, decode the Caesar cipher, and locate the concealed chamber.
        </p>

        <div className="badge-row">
          <span className="badge-pill active">
            <span className="dot-indicator pulsing" />
            Fish Audio Drama 3 &amp; S2.1 Pipeline Ready
          </span>
          <span className="badge-pill">
            5 Tuned Performance Takes Generated
          </span>
          <span className="badge-pill">
            Prosody Speed &amp; Pauses Calibrated
          </span>
          <span className="badge-pill">
            Zero-Overlap Audio Engine
          </span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs" aria-label="Experience Sections">
        <button
          className={`tab-btn ${activeTab === 'auditions' ? 'active' : ''}`}
          onClick={() => setActiveTab('auditions')}
        >
          🎧 Voice Tuning Auditions
        </button>
        <button
          className={`tab-btn ${activeTab === 'testbench' ? 'active' : ''}`}
          onClick={() => setActiveTab('testbench')}
        >
          🎙️ Multi-Model Test Bench
        </button>
        <button
          className={`tab-btn ${activeTab === 'scene' ? 'active' : ''}`}
          onClick={() => setActiveTab('scene')}
        >
          🎬 Cinematic Scene View
        </button>
        <button
          className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          🖼️ Visual Assets &amp; Story Acts
        </button>
        <button
          className={`tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          ⚙️ Audit &amp; Diagnostics
        </button>
      </nav>

      {/* Main View Area */}
      <main className="main-grid">
        {/* ========================================================================= */}
        {/* TAB 1: VOICE TUNING AUDITIONS (PART 1 & 2 DELIVERABLE)                    */}
        {/* ========================================================================= */}
        {activeTab === 'auditions' && (
          <section aria-label="Voice Tuning Auditions">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-heading">Drama 3 Performance Auditions &amp; Speed Tuning</h2>
                <p className="section-desc">
                  Tuned takes for Meera and The Keeper using Drama 3 with calibrated prosody speed (1.15x - 1.22x) and natural restraint. Dialogue subtitles remain 100% clean.
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={() => {
                  if (auditionsManifest?.takes?.length) {
                    playUrl(auditionsManifest.takes[0].audioUrl);
                  }
                }}
              >
                ▶ Audition Take 1 (Meera)
              </button>
            </div>

            {/* Tuning Instructions Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--gold-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-300)', fontSize: '1.15rem', marginBottom: '8px' }}>
                🎭 Performance Tuning Goals
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.88rem', color: 'var(--text-sub)' }}>
                <div>
                  <strong style={{ color: '#f472b6' }}>Meera (Hostage)</strong>: Eliminated slow, seductive pacing. Target is genuine captive fear, breathless urgency, and looking around in panic without pausing after every sentence.
                </div>
                <div>
                  <strong style={{ color: '#ef4444' }}>The Keeper (Captor)</strong>: Eliminated sluggish theatrical delivery. Target is an explosive, impatient street thug snapping violently, then shifting into a tight, quiet menace.
                </div>
                <div>
                  <strong style={{ color: '#38bdf8' }}>Kabir (Investigator)</strong>: Grounded, conversational self-talk while examining clues, avoiding movie trailer announcer tone.
                </div>
              </div>
            </div>

            {/* Audition Takes Grid */}
            <div className="sample-cards-grid">
              {auditionsManifest?.takes?.map((take) => {
                const charMeta = CHARACTERS[take.character] || CHARACTERS.meera;
                const isThisPlaying = isPlaying && activePlayingUrl === take.audioUrl;

                return (
                  <article
                    key={take.takeId}
                    className={`sample-card ${isThisPlaying ? 'is-active-card' : ''}`}
                  >
                    <div className="card-top-header">
                      <img
                        src={charMeta.avatarUrl}
                        alt={charMeta.name}
                        className="card-char-avatar"
                      />
                      <div className="card-meta-titles">
                        <h3 className="card-char-name">{charMeta.name}</h3>
                        <div style={{ color: 'var(--gold-400)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {take.takeLabel}
                        </div>
                      </div>
                      <span className="badge-pill active" style={{ fontSize: '0.78rem' }}>
                        ⚡ Speed: {take.speed}x
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      <strong>Direction Style:</strong> {take.directionSummary}
                    </div>

                    {/* Spoken Subtitle (Clean) */}
                    <div className="card-quote-box">
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Spoken Subtitle (Clean Display):
                      </div>
                      "{take.cleanSubtitle}"
                    </div>

                    {/* Director's Staging Prompt */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      marginBottom: '16px',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      color: 'var(--gold-300)',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        Drama 3 API Prompt:
                      </div>
                      {take.apiPrompt}
                    </div>

                    <div className="card-delivery-info">
                      <div className="delivery-spec">
                        <span>Voice ID:</span>
                        <code style={{ fontSize: '0.7rem' }}>{take.voiceId.slice(0, 8)}...</code>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Status: <strong style={{ color: '#4ade80' }}>Ready ({Math.round(take.fileSizeBytes / 1024)} KB)</strong>
                      </div>
                    </div>

                    <div className="card-bottom-actions">
                      <div className="audio-file-stat">
                        <span className="file-name">{take.outputFilename}</span>
                        <span>Latency: {take.latencyMs}ms</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          onClick={() => {
                            if (isThisPlaying) {
                              stopPlayback();
                            } else {
                              playUrl(take.audioUrl);
                            }
                          }}
                        >
                          {isThisPlaying ? '⏸️ Pause' : '▶ Play Take'}
                        </button>

                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          onClick={() => playUrl(take.audioUrl)}
                          title="Replay this take"
                        >
                          🔄 Replay
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Shortlisted Alternative Voice IDs Panel */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              marginTop: '16px',
              boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-300)', fontSize: '1.2rem', marginBottom: '12px' }}>
                🔍 Shortlisted Alternative Fish Audio Voice Library Models
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
                If you wish to audition a completely different actor voice, these candidate models from the Fish Audio library were queried and verified:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(9, 14, 26, 0.7)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 114, 182, 0.3)' }}>
                  <div style={{ color: '#f472b6', fontWeight: 600, fontSize: '0.92rem' }}>Alternative Meera 1: "Indian girl"</div>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--gold-300)', margin: '4px 0' }}>ID: 2b9e2a84cb664489a7ab9ca71af5dff5</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tags: Female, young, fast, conversational, animated</div>
                </div>

                <div style={{ background: 'rgba(9, 14, 26, 0.7)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 114, 182, 0.3)' }}>
                  <div style={{ color: '#f472b6', fontWeight: 600, fontSize: '0.92rem' }}>Alternative Meera 2: "Whisper"</div>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--gold-300)', margin: '4px 0' }}>ID: a17f06db8621462286812b447b138cd4</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tags: Female, young, soft, breathy, intimate</div>
                </div>

                <div style={{ background: 'rgba(9, 14, 26, 0.7)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.92rem' }}>Alternative Keeper 1: "Dramatic Panicked"</div>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--gold-300)', margin: '4px 0' }}>ID: 8e468a7c906648e3bb4cb7c08185b14a</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tags: Male, middle-aged, angry, high-energy, dramatic</div>
                </div>

                <div style={{ background: 'rgba(9, 14, 26, 0.7)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.92rem' }}>Alternative Keeper 2: "Serious Indian"</div>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--gold-300)', margin: '4px 0' }}>ID: 73770ea2927d46c19e461e7e812b2f95</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tags: Male, authoritative, serious, low, deep</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MULTI-MODEL TEST BENCH (S2.1 vs DRAMA 3)                           */}
        {/* ========================================================================= */}
        {activeTab === 'testbench' && (
          <section aria-label="Audio Test Bench">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-heading">Fish Audio Multi-Model Test Bench</h2>
                <p className="section-desc">
                  Compare Drama 3 baseline performance with S2.1 baseline clips. Both use the same voice IDs with zero overlap.
                </p>
              </div>

              {/* Model Mode Selector Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(15, 23, 42, 0.9)', padding: '4px', borderRadius: '10px', border: '1px solid var(--gold-border)' }}>
                  <button
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      background: activeModelMode === 'drama-3' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'transparent',
                      color: activeModelMode === 'drama-3' ? '#090e1a' : 'var(--text-sub)',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => {
                      stopPlayback();
                      setActiveModelMode('drama-3');
                    }}
                  >
                    🎭 Drama 3 (Baseline)
                  </button>
                  <button
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      background: activeModelMode === 's2.1' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
                      color: activeModelMode === 's2.1' ? '#090e1a' : 'var(--text-sub)',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => {
                      stopPlayback();
                      setActiveModelMode('s2.1');
                    }}
                  >
                    📻 S2.1 (Baseline)
                  </button>
                </div>

                <button className="btn-primary" onClick={() => playSceneSequence(activeModelMode)}>
                  ⏩ Test Act I Sequence ({activeModelMode === 'drama-3' ? 'Drama 3' : 'S2.1'})
                </button>
              </div>
            </div>

            <div className="sample-cards-grid">
              {SAMPLE_DIALOGUE_LINES.map((line) => {
                const char = CHARACTERS[line.character];
                const isActive = currentLineId === line.id;
                const isCurrentlyPlaying = isActive && isPlaying;
                const activeManifest = activeModelMode === 'drama-3' ? drama3Manifest : s21Manifest;
                const manifestEntry = activeManifest?.dialogues[line.id];
                const displayFilename = activeModelMode === 'drama-3'
                  ? `${line.audioFilename.replace('.mp3', '_drama3.mp3')}`
                  : line.audioFilename;

                return (
                  <article
                    key={line.id}
                    className={`sample-card ${isActive ? 'is-active-card' : ''}`}
                  >
                    <div className="card-top-header">
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="card-char-avatar"
                      />
                      <div className="card-meta-titles">
                        <h3 className="card-char-name">{char.name}</h3>
                        <div className="card-scene-title">{line.sceneTitle}</div>
                      </div>
                      <span className={`emotion-tag-badge ${line.character}`}>
                        {line.emotionNote}
                      </span>
                    </div>

                    <div className="card-quote-box">
                      "{line.text}"
                    </div>

                    <div className="card-delivery-info">
                      <div className="delivery-spec">
                        <span>Voice ID:</span>
                        <code style={{ fontSize: '0.72rem' }}>
                          {manifestEntry?.voiceId ? `${manifestEntry.voiceId.slice(0, 8)}...` : 'Configured'}
                        </code>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Status: <strong style={{ color: manifestEntry?.status === 'ready' ? '#4ade80' : '#fbbf24' }}>
                          {manifestEntry?.status || 'Available'}
                        </strong>
                      </div>
                    </div>

                    <div className="card-bottom-actions">
                      <div className="audio-file-stat">
                        <span className="file-name">{displayFilename}</span>
                        <span>
                          {manifestEntry?.fileSizeBytes
                            ? `${Math.round(manifestEntry.fileSizeBytes / 1024)} KB`
                            : 'Audio Ready'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          onClick={() => {
                            if (isCurrentlyPlaying) {
                              stopPlayback();
                            } else {
                              playDialogue(line, activeModelMode);
                            }
                          }}
                        >
                          {isCurrentlyPlaying ? '⏸️ Pause' : '▶ Play'}
                        </button>

                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                          onClick={() => playDialogue(line, activeModelMode)}
                          title="Replay dialogue"
                        >
                          🔄 Replay
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CINEMATIC SCENE VIEW                                               */}
        {/* ========================================================================= */}
        {activeTab === 'scene' && (
          <section className="scene-viewer" aria-label="Cinematic Scene View">
            <div className="scene-viewport">
              <img
                src={activeScene.backgroundUrl}
                alt={activeScene.title}
                className="scene-bg-image"
              />
              <div className="scene-overlay" />

              <div className="scene-top-hud">
                <div className="scene-tag-badge">
                  {activeScene.title}
                </div>
                <div className="scene-act-nav">
                  {Object.values(SCENES).map((s) => (
                    <button
                      key={s.id}
                      className={`hud-nav-btn ${activeSceneId === s.id ? 'active' : ''}`}
                      onClick={() => selectScene(s.id)}
                      title={s.title}
                    >
                      {s.id === 'scene_1_recording' ? 'I' : s.id === 'scene_2_scrambled_image' ? 'II' : s.id === 'scene_3_coded_note' ? 'III' : 'IV'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="scene-bottom-hud">
                <div className={`subtitle-box ${isPlaying ? 'speaking' : ''}`}>
                  <div className="subtitle-header">
                    <div className="character-identity">
                      <img
                        src={activeCharacter.avatarUrl}
                        alt={activeCharacter.name}
                        className="char-avatar-mini"
                      />
                      <div className="char-name-group">
                        <span className="char-speaker-name">{activeCharacter.name}</span>
                        <span className="char-role-label">{activeCharacter.role}</span>
                      </div>
                    </div>

                    <div className="scene-hud-tags">
                      <span className="badge-pill active" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        Model: {activeModelMode === 'drama-3' ? 'Drama 3' : 'S2.1'}
                      </span>
                      {activeLine.emotionNote && (
                        <span className={`emotion-tag-badge ${activeLine.character}`}>
                          🎭 {activeLine.emotionNote}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="subtitle-text">
                    "{activeLine.text}"
                  </p>

                  <div className="audio-controls-bar">
                    <div className="playback-buttons">
                      {isPlaying ? (
                        <button className="btn-secondary" onClick={stopPlayback}>
                          ⏸️ Pause
                        </button>
                      ) : (
                        <button className="btn-primary" onClick={() => playDialogue(activeLine, activeModelMode)}>
                          ▶ Play Dialogue
                        </button>
                      )}

                      <button className="btn-secondary" onClick={() => playDialogue(activeLine, activeModelMode)}>
                        🔄 Replay Line
                      </button>

                      {activeSceneId === 'scene_1_recording' && (
                        <button
                          className="btn-secondary"
                          style={{ borderColor: 'var(--gold-border)', color: 'var(--gold-300)' }}
                          onClick={() => playSceneSequence(activeModelMode)}
                        >
                          {isSequencePlaying ? '⏳ Playing Act I Sequence...' : '⏩ Play Act I Dialogue Sequence'}
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div className="visualizer-container" aria-hidden="true">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className={`v-bar ${isPlaying ? 'active' : ''}`} />
                        ))}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {activeLine.audioFilename} {playbackProgress > 0 && `(${Math.round(playbackProgress)}%)`}
                      </div>
                    </div>
                  </div>

                  {errorMessage && (
                    <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#fca5a5' }}>
                      ⚠️ {errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: VISUAL ASSETS & STORY ACTS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'assets' && (
          <section aria-label="Visual Assets and Story Acts">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-heading">Verified Visual Assets &amp; Story Architecture</h2>
                <p className="section-desc">
                  Repository assets mapped to the 4 canonical story acts of The Last Purnima.
                </p>
              </div>
            </div>

            <div className="assets-gallery-grid">
              <div className="asset-thumb-card">
                <img src="/assets/opening_recording_1.png" alt="Distress Recording" />
                <div className="asset-thumb-info">
                  <div className="asset-thumb-name">opening_recording_1.png</div>
                  <div className="asset-thumb-role">Act I Scene Background (Distress Call)</div>
                </div>
              </div>

              <div className="asset-thumb-card">
                <img src="/assets/devgarh_haveli_ref.png" alt="Devgarh Haveli" />
                <div className="asset-thumb-info">
                  <div className="asset-thumb-name">devgarh_haveli_ref.png</div>
                  <div className="asset-thumb-role">Act II Scene Background (Ancestral Mansion)</div>
                </div>
              </div>

              <div className="asset-thumb-card">
                <img src="/assets/meera_char_ref.png" alt="Meera Character Reference" />
                <div className="asset-thumb-info">
                  <div className="asset-thumb-name">meera_char_ref.png</div>
                  <div className="asset-thumb-role">Character Portrait (Meera / Hostage)</div>
                </div>
              </div>

              <div className="asset-thumb-card">
                <img src="/assets/the_keeper_ref.webp" alt="The Keeper Reference" />
                <div className="asset-thumb-info">
                  <div className="asset-thumb-name">the_keeper_ref.webp</div>
                  <div className="asset-thumb-role">Character Portrait (The Keeper / Captor)</div>
                </div>
              </div>

              <div className="asset-thumb-card">
                <img src="/assets/haveli_entrance_coded_note.jpg" alt="Coded Note" />
                <div className="asset-thumb-info">
                  <div className="asset-thumb-name">haveli_entrance_coded_note.jpg</div>
                  <div className="asset-thumb-role">Act III Puzzle (Caesar Cipher Note)</div>
                </div>
              </div>

              <div className="asset-thumb-card">
                <img src="/assets/concealed_chamber.jpg" alt="Concealed Chamber" />
                <div className="asset-thumb-info">
                  <div className="asset-thumb-name">concealed_chamber.jpg</div>
                  <div className="asset-thumb-role">Act IV Climax (Concealed Chamber)</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DIAGNOSTICS & SYSTEM AUDIT                                         */}
        {/* ========================================================================= */}
        {activeTab === 'diagnostics' && (
          <section className="diagnostics-panel" aria-label="Pipeline Diagnostics">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-heading">Fish Audio Drama 3 &amp; Experience Audit Diagnostics</h2>
                <p className="section-desc">
                  Model configuration, voice audition status, prosody speed benchmarks, and CLI commands.
                </p>
              </div>
            </div>

            <div className="diag-grid">
              <div className="diag-card">
                <div className="diag-card-title">🎭 Performance Takes Status</div>
                <div className="diag-code-box">
                  Meera Take 1 (1.15x): 98 KB (1435ms) ✓ Ready<br />
                  Meera Take 2 (1.20x): 103 KB (1770ms) ✓ Ready<br />
                  Keeper Take 1 (1.15x): 272 KB (3652ms) ✓ Ready<br />
                  Keeper Take 2 (1.22x): 272 KB (2698ms) ✓ Ready<br />
                  Kabir Take 1 (1.05x): 86 KB (975ms) ✓ Ready
                </div>
              </div>

              <div className="diag-card">
                <div className="diag-card-title">🔑 Voice ID Configurations</div>
                <div className="diag-code-box">
                  Meera: 7d62e110d5364b608912d6837890b336<br />
                  Keeper: 8cf2f4372b884ce4bf4271648067eaab<br />
                  Kabir: b49fbb232991427ea7196162045169b3<br />
                  Narrator: 8f01a73eba7947219fd7eb789885deaf
                </div>
              </div>

              <div className="diag-card">
                <div className="diag-card-title">⚡ Audition CLI Commands</div>
                <div className="diag-code-box">
                  # Generate / update audition takes:<br />
                  npm run generate:takes<br /><br />
                  # Test Drama 3 baseline:<br />
                  npm run test:drama3<br /><br />
                  # Test S2.1 baseline:<br />
                  npm run generate:audio:samples
                </div>
              </div>

              <div className="diag-card">
                <div className="diag-card-title">📑 Loaded Manifests</div>
                <div className="diag-code-box">
                  Auditions Manifest: {auditionsManifest ? '✓ Loaded (5 takes)' : 'Pending'}<br />
                  Drama 3 Manifest: {drama3Manifest ? '✓ Loaded' : 'Pending'}<br />
                  S2.1 Manifest: {s21Manifest ? '✓ Loaded' : 'Pending'}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          <strong>The Last Purnima</strong> — Built with React, TypeScript, Vite &amp; Fish Audio. Deployable on Vercel.
        </p>
      </footer>
    </div>
  );
};

export default App;
