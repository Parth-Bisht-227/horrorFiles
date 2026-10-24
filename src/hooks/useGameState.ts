import { useState, useCallback } from 'react';

export type GamePhase =
  | 'title'           // Opening title card
  | 'act1_intro'      // Recording discovery
  | 'act1_playback'   // Meera's recording plays
  | 'act1_keeper'     // Keeper interrupts
  | 'act2_intro'      // Scrambled image puzzle intro
  | 'act2_puzzle'     // Interactive scramble puzzle
  | 'act2_reveal'     // Haveli identified
  | 'act3_intro'      // Caesar cipher intro
  | 'act3_puzzle'     // Interactive cipher wheel
  | 'act3_reveal'     // Blueprint location decoded
  | 'act4_intro'      // Blueprint comparison intro
  | 'act4_puzzle'     // Interactive blueprint overlay
  | 'act4_reveal'     // Hidden chamber found
  | 'climax'          // Rescue sequence
  | 'ending'          // Ambiguous family conspiracy
  | 'credits';        // Credits/end

export interface GameState {
  phase: GamePhase;
  currentAct: number; // 1-4
  discoveredClues: Set<string>;
  completedPuzzles: Set<string>;
  storyFlags: Set<string>;
  dialogueQueue: string[]; // IDs of dialogues to play in sequence
  isTransitioning: boolean;
  showSubtitle: boolean;
  currentSubtitle: string;
  subtitleSpeaker: string;
  subtitleColor: string;
}

const INITIAL_STATE: GameState = {
  phase: 'title',
  currentAct: 0,
  discoveredClues: new Set(),
  completedPuzzles: new Set(),
  storyFlags: new Set(),
  dialogueQueue: [],
  isTransitioning: false,
  showSubtitle: false,
  currentSubtitle: '',
  subtitleSpeaker: '',
  subtitleColor: '#f1f5f9',
};

export function useGameState() {
  const [state, setState] = useState<GameState>({ ...INITIAL_STATE });

  const setPhase = useCallback((phase: GamePhase) => {
    setState(prev => {
      const actMap: Partial<Record<GamePhase, number>> = {
        act1_intro: 1, act1_playback: 1, act1_keeper: 1,
        act2_intro: 2, act2_puzzle: 2, act2_reveal: 2,
        act3_intro: 3, act3_puzzle: 3, act3_reveal: 3,
        act4_intro: 4, act4_puzzle: 4, act4_reveal: 4,
        climax: 4, ending: 4, credits: 4,
      };
      return {
        ...prev,
        phase,
        currentAct: actMap[phase] ?? prev.currentAct,
        isTransitioning: false,
      };
    });
  }, []);

  const startTransition = useCallback((toPhase: GamePhase, durationMs = 1200) => {
    setState(prev => ({ ...prev, isTransitioning: true }));
    setTimeout(() => setPhase(toPhase), durationMs);
  }, [setPhase]);

  const addClue = useCallback((clueId: string) => {
    setState(prev => {
      const next = new Set(prev.discoveredClues);
      next.add(clueId);
      return { ...prev, discoveredClues: next };
    });
  }, []);

  const completePuzzle = useCallback((puzzleId: string) => {
    setState(prev => {
      const next = new Set(prev.completedPuzzles);
      next.add(puzzleId);
      return { ...prev, completedPuzzles: next };
    });
  }, []);

  const setFlag = useCallback((flag: string) => {
    setState(prev => {
      const next = new Set(prev.storyFlags);
      next.add(flag);
      return { ...prev, storyFlags: next };
    });
  }, []);

  const showSubtitle = useCallback((text: string, speaker: string, color: string) => {
    setState(prev => ({
      ...prev,
      showSubtitle: true,
      currentSubtitle: text,
      subtitleSpeaker: speaker,
      subtitleColor: color,
    }));
  }, []);

  const hideSubtitle = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSubtitle: false,
      currentSubtitle: '',
      subtitleSpeaker: '',
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState({ ...INITIAL_STATE, discoveredClues: new Set(), completedPuzzles: new Set(), storyFlags: new Set(), dialogueQueue: [] });
  }, []);

  return {
    state,
    setPhase,
    startTransition,
    addClue,
    completePuzzle,
    setFlag,
    showSubtitle,
    hideSubtitle,
    resetGame,
  };
}
