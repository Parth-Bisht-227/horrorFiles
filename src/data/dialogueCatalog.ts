import type { CharacterMeta, DialogueLine, SceneMeta } from '../types/dialogue';

export const CHARACTERS: Record<string, CharacterMeta> = {
  meera: {
    id: 'meera',
    name: 'Meera',
    role: 'The Hostage',
    description: 'Meera was kidnapped and locked deep inside Devgarh Haveli. She risks everything to record proof.',
    avatarUrl: '/assets/meera_char_ref.png',
    voiceEnvKey: 'FISH_AUDIO_VOICE_MEERA',
    defaultDeliveryTag: '[whisper]',
    color: '#f06292',
  },
  keeper: {
    id: 'keeper',
    name: 'The Keeper',
    role: 'The Mercenary Captor',
    description: 'A ruthless thug hired to guard Meera until the ransom payment clears.',
    avatarUrl: '/assets/the_keeper_ref.webp',
    voiceEnvKey: 'FISH_AUDIO_VOICE_KEEPER',
    defaultDeliveryTag: '[angry, menacing]',
    color: '#e57373',
  },
  protagonist: {
    id: 'protagonist',
    name: 'Kabir (Protagonist)',
    role: 'The Family Investigator',
    description: 'Determined to find Meera, deciphering hidden clues and architectural archives.',
    avatarUrl: '/assets/devgarh_haveli_ref.png',
    voiceEnvKey: 'FISH_AUDIO_VOICE_PROTAGONIST',
    defaultDeliveryTag: '[focused]',
    color: '#4fc3f7',
  },
  narrator: {
    id: 'narrator',
    name: 'Narrator',
    role: 'Atmospheric Storyteller',
    description: 'Cinematic narrator setting the dark, eerie tone of Devgarh Haveli.',
    avatarUrl: '/assets/devgarh_haveli_ref.png',
    voiceEnvKey: 'FISH_AUDIO_VOICE_NARRATOR',
    defaultDeliveryTag: '[calm, eerie]',
    color: '#ba68c8',
  },
};

export const SCENES: Record<string, SceneMeta> = {
  scene_1_recording: {
    id: 'scene_1_recording',
    title: 'Act I: The Distress Recording',
    description: 'A damaged audio recording recovered from Meera’s phone captures her whisper, cut short by the Keeper.',
    backgroundUrl: '/assets/opening_recording_1.png',
  },
  scene_2_scrambled_image: {
    id: 'scene_2_scrambled_image',
    title: 'Act II: The Ancestral Haveli',
    description: 'Kabir reconstructs a scrambled screenshot, comparing the three-leaf emblem and carved stone lattice with the family archive to identify Devgarh Haveli.',
    backgroundUrl: '/assets/devgarh_haveli_ref.png',
  },
  scene_3_coded_note: {
    id: 'scene_3_coded_note',
    title: 'Act III: The Caesar Cipher',
    description: 'Guided by the archive clue "Three leaves. Three steps back.", Kabir decodes the cipher to locate the original floor plan concealed behind a loose panel in the north gallery.',
    backgroundUrl: '/assets/haveli_entrance_coded_note.jpg',
  },
  scene_4_concealed_chamber: {
    id: 'scene_4_concealed_chamber',
    title: 'Act IV: The Concealed Chamber',
    description: 'Comparing the original floor plan with the restoration plan reveals the concealed chamber behind the western wall of the north gallery omitted from the restoration plan.',
    backgroundUrl: '/assets/concealed_chamber.jpg',
  },
};

/**
 * Sample dialogue lines requested for Phase 2 validation.
 * Additional lines for the full game will be appended here.
 */
export const SAMPLE_DIALOGUE_LINES: DialogueLine[] = [
  {
    id: 'meera_whisper_recording',
    character: 'meera',
    characterName: 'Meera',
    scene: 'scene_1_recording',
    sceneTitle: 'Act I: The Distress Recording',
    emotionNote: 'frightened whisper',
    deliveryTag: '[whisper]',
    drama3Prompt: '[whispering, terrified] If anyone finds this… [gasp] please tell my family I\'m here. [pause: 0.8s] [whisper] I don\'t know where. I just…',
    text: "If anyone finds this… please tell my family I'm here. I don't know where. I just…",
    audioFilename: 'meera_whisper_recording.mp3',
    audioUrl: '/audio/meera_whisper_recording.mp3',
  },
  {
    id: 'keeper_discovery_threat',
    character: 'keeper',
    characterName: 'The Keeper',
    scene: 'scene_1_recording',
    sceneTitle: 'Act I: The Distress Recording',
    emotionNote: 'angry, then cold',
    deliveryTag: '[angry, cold]',
    drama3Prompt: '[angry, shouting] What the hell are you doing? Were you recording me? [harsh dry chuckle] That was the last mistake of your life. [cold, menacing] I\'ll kill you once I get that damn payment. [pause: 0.6s] Just fifteen more minutes…',
    text: "What the hell are you doing? Were you recording me? That was the last mistake of your life. I'll kill you once I get that damn payment. Just fifteen more minutes…",
    audioFilename: 'keeper_discovery_threat.mp3',
    audioUrl: '/audio/keeper_discovery_threat.mp3',
  },
  {
    id: 'protagonist_scrambled_image',
    character: 'protagonist',
    characterName: 'Kabir',
    scene: 'scene_2_scrambled_image',
    sceneTitle: 'Act II: The Ancestral Haveli',
    emotionNote: 'focused self-talk',
    deliveryTag: '[focused]',
    drama3Prompt: '[sigh, quiet self-talk] The image is a mess. [pause: 0.6s] [focused, determined] If I can put it back together, maybe I\'ll recognize the place.',
    text: "The image is a mess. If I can put it back together, maybe I'll recognize the place.",
    audioFilename: 'protagonist_scrambled_image.mp3',
    audioUrl: '/audio/protagonist_scrambled_image.mp3',
  },
];

/**
 * All dialogue lines currently registered.
 */
export const ALL_DIALOGUE_LINES: DialogueLine[] = [
  ...SAMPLE_DIALOGUE_LINES,
];
