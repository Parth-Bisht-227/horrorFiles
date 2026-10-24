import { useRef, useCallback, useEffect, useState } from 'react';

export interface AmbientTrack {
  id: string;
  url: string;
  volume: number;
  loop: boolean;
}

// Free-to-use ambient sound URLs (placeholder — user will supply real ones)
// For now we synthesize ambient via Web Audio API oscillators
export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const ambientNodesRef = useRef<Map<string, { source: AudioBufferSourceNode | OscillatorNode; gain: GainNode }>>(new Map());
  const dialogueAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isDialoguePlaying, setIsDialoguePlaying] = useState(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = masterVolume;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return { ctx: audioCtxRef.current, masterGain: gainNodeRef.current! };
  }, [masterVolume]);

  // Synthesize eerie ambient drone using oscillators
  const startAmbientDrone = useCallback(() => {
    const { ctx, masterGain } = getCtx();

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
    osc1Gain.connect(masterGain);

    // Detuned harmonic for eeriness
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 82.5; // Slightly sharp E
    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.04;
    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);

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
    osc3Gain.connect(masterGain);

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

  // Play dialogue audio file
  const playDialogue = useCallback((url: string, onEnd?: () => void): Promise<void> => {
    return new Promise((resolve) => {
      if (dialogueAudioRef.current) {
        dialogueAudioRef.current.pause();
        dialogueAudioRef.current.src = '';
      }

      const audio = new Audio(url);
      dialogueAudioRef.current = audio;
      audio.volume = isMuted ? 0 : masterVolume;

      setIsDialoguePlaying(true);

      audio.onended = () => {
        setIsDialoguePlaying(false);
        onEnd?.();
        resolve();
      };

      audio.onerror = () => {
        setIsDialoguePlaying(false);
        console.warn('Dialogue audio failed:', url);
        onEnd?.();
        resolve();
      };

      audio.play().catch(err => {
        console.warn('Playback blocked:', err);
        setIsDialoguePlaying(false);
        resolve();
      });
    });
  }, [isMuted, masterVolume]);

  const stopDialogue = useCallback(() => {
    if (dialogueAudioRef.current) {
      dialogueAudioRef.current.pause();
      dialogueAudioRef.current.src = '';
      setIsDialoguePlaying(false);
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = next ? 0 : masterVolume;
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
    if (gainNodeRef.current && !isMuted) {
      gainNodeRef.current.gain.value = vol;
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
