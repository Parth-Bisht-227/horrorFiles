import { useRef, useCallback, useEffect, useState } from 'react';

export interface AmbientTrack {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
}

/**
 * Web Audio procedural engine for HorrorFiles: Case 001 — Devgarh
 * - Procedural triple-oscillator dark ambient drone (55Hz + 82.5Hz + 440Hz tremolo)
 * - Automatic -8dB dialogue ducking sub-bus
 * - Synthesized tactile SFX for puzzles (stone tile thud, brass wheel click, paper movement)
 * - Dramatic reveal & puzzle solve stingers
 */
export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const ambientBusRef = useRef<GainNode | null>(null);
  const ambientNodesRef = useRef<Map<string, { source: AudioBufferSourceNode | OscillatorNode; gain: GainNode }>>(new Map());
  const dialogueAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isDialoguePlaying, setIsDialoguePlaying] = useState(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      masterGainRef.current = audioCtxRef.current.createGain();
      masterGainRef.current.gain.value = masterVolume;
      masterGainRef.current.connect(audioCtxRef.current.destination);

      // Sub-bus for ambient drone so we can duck it during dialogue without affecting SFX
      ambientBusRef.current = audioCtxRef.current.createGain();
      ambientBusRef.current.gain.value = 1.0;
      ambientBusRef.current.connect(masterGainRef.current);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return {
      ctx: audioCtxRef.current,
      masterGain: masterGainRef.current!,
      ambientBus: ambientBusRef.current!,
    };
  }, [masterVolume]);

  // Synthesize eerie ambient drone using oscillators
  const startAmbientDrone = useCallback(() => {
    const { ctx, ambientBus } = getCtx();

    // Stop existing drone if any
    const existing = ambientNodesRef.current.get('drone');
    if (existing) {
      try { existing.source.stop(); } catch { /* ignore */ }
    }

    // Dark low drone
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55; // Low A
    const osc1Gain = ctx.createGain();
    osc1Gain.gain.value = 0.08;
    osc1.connect(osc1Gain);
    osc1Gain.connect(ambientBus);

    // Detuned harmonic for eeriness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 82.5; // Slightly sharp E
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.04;
    osc2.connect(osc2Gain);
    osc2Gain.connect(ambientBus);

    // Ghostly high whistle
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 440;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.012;

    // Slow LFO tremolo on the whistle
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(osc3Gain.gain);
    lfo.start();

    osc3.connect(osc3Gain);
    osc3Gain.connect(ambientBus);

    osc1.start();
    osc2.start();
    osc3.start();

    ambientNodesRef.current.set('drone', { source: osc1, gain: osc1Gain });
    ambientNodesRef.current.set('drone2', { source: osc2, gain: osc2Gain });
    ambientNodesRef.current.set('drone3', { source: osc3, gain: osc3Gain });
    ambientNodesRef.current.set('lfo', { source: lfo, gain: lfoGain });
  }, [getCtx]);

  const stopAmbientDrone = useCallback(() => {
    ['drone', 'drone2', 'drone3', 'lfo'].forEach(id => {
      const node = ambientNodesRef.current.get(id);
      if (node) {
        try { node.source.stop(); } catch { /* ignore */ }
        ambientNodesRef.current.delete(id);
      }
    });
  }, []);

  // Tactile Stone Tile SFX for Puzzle 1
  const playTileClick = useCallback((isCorrect = false) => {
    const { ctx, masterGain } = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCorrect ? 'triangle' : 'sine';
    const startFreq = isCorrect ? 280 : 120;
    const endFreq = isCorrect ? 340 : 60;

    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(isCorrect ? 0.09 : 0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.07);
  }, [getCtx]);

  // Tactile Brass Wheel Ratchet Click for Puzzle 2
  const playWheelClick = useCallback(() => {
    const { ctx, masterGain } = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }, [getCtx]);

  // Tactile Parchment / Blueprint Comparator Slide for Puzzle 3
  const playPaperRustle = useCallback(() => {
    const { ctx, masterGain } = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.045);
  }, [getCtx]);

  // Suspense stinger (puzzle solve)
  const playSolveStinger = useCallback(() => {
    const { ctx, masterGain } = getCtx();

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

    const stingerGain = ctx.createGain();
    stingerGain.gain.setValueAtTime(0, ctx.currentTime);
    stingerGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    stingerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.connect(stingerGain);
    stingerGain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  }, [getCtx]);

  // Dramatic reveal stinger
  const playRevealStinger = useCallback(() => {
    const { ctx, masterGain } = getCtx();

    // Low boom
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1);

    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.2, ctx.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

    osc.connect(boomGain);
    boomGain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);

    // High shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 1200;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, ctx.currentTime);
    shimmerGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(ctx.currentTime);
    shimmer.stop(ctx.currentTime + 2.5);
  }, [getCtx]);

  // Duck ambient bus during dialogue
  const duckAmbient = useCallback(() => {
    if (ambientBusRef.current && audioCtxRef.current) {
      ambientBusRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
      ambientBusRef.current.gain.linearRampToValueAtTime(0.25, audioCtxRef.current.currentTime + 0.2);
    }
  }, []);

  // Restore ambient bus after dialogue
  const restoreAmbient = useCallback(() => {
    if (ambientBusRef.current && audioCtxRef.current) {
      ambientBusRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
      ambientBusRef.current.gain.linearRampToValueAtTime(1.0, audioCtxRef.current.currentTime + 0.8);
    }
  }, []);

  // Play dialogue audio file with automatic ducking
  const playDialogue = useCallback((url: string, onEnd?: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.onended = null;
        dialogueAudioRef.current.onerror = null;
        dialogueAudioRef.current.pause();
        dialogueAudioRef.current.src = '';
        dialogueAudioRef.current = null;
      }

      const audio = new Audio(url);
      dialogueAudioRef.current = audio;
      audio.volume = isMuted ? 0 : masterVolume;

      setIsDialoguePlaying(true);
      duckAmbient();

      audio.onended = () => {
        setIsDialoguePlaying(false);
        restoreAmbient();
        dialogueAudioRef.current = null;
        onEnd?.();
        resolve();
      };

      audio.onerror = () => {
        setIsDialoguePlaying(false);
        restoreAmbient();
        console.warn('Dialogue audio failed to load:', url);
        dialogueAudioRef.current = null;
        resolve();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name !== 'AbortError') {
            console.warn('Playback blocked or failed:', err);
          }
          setIsDialoguePlaying(false);
          restoreAmbient();
          resolve();
        });
      }
    });
  }, [isMuted, masterVolume, duckAmbient, restoreAmbient]);

  const stopDialogue = useCallback(() => {
    if (dialogueAudioRef.current) {
      dialogueAudioRef.current.onended = null;
      dialogueAudioRef.current.onerror = null;
      dialogueAudioRef.current.pause();
      dialogueAudioRef.current.src = '';
      dialogueAudioRef.current = null;
      setIsDialoguePlaying(false);
      restoreAmbient();
    }
  }, [restoreAmbient]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = next ? 0 : masterVolume;
      }
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.volume = next ? 0 : masterVolume;
      }
      return next;
    });
  }, [masterVolume]);

  // Update master volume
  const updateVolume = useCallback((vol: number) => {
    setMasterVolume(vol);
    if (masterGainRef.current && !isMuted) {
      masterGainRef.current.gain.value = vol;
    }
    if (dialogueAudioRef.current && !isMuted) {
      dialogueAudioRef.current.volume = vol;
    }
  }, [isMuted]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAmbientDrone();
      stopDialogue();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopAmbientDrone, stopDialogue]);

  return {
    startAmbientDrone,
    stopAmbientDrone,
    playTileClick,
    playWheelClick,
    playPaperRustle,
    playSolveStinger,
    playRevealStinger,
    playDialogue,
    stopDialogue,
    toggleMute,
    updateVolume,
    isMuted,
    masterVolume,
    isDialoguePlaying,
  };
}
