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
    name: 'Kabir',
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
    description: 'A damaged audio recording recovered from Meera\'s phone captures her whisper, cut short by the Keeper.',
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
 * All dialogue lines — generated via Fish Audio (speech-1.6 model).
 * Audio files live in public/audio/*.mp3
 */
export const SAMPLE_DIALOGUE_LINES: DialogueLine[] = [
  // ── ACT I: The Distress Recording ──────────────────────────────────────────
  {
    id: 'meera_whisper_recording',
    character: 'meera',
    characterName: 'Meera',
    scene: 'scene_1_recording',
    sceneTitle: 'Act I: The Distress Recording',
    emotionNote: 'frightened whisper',
    deliveryTag: '[whisper]',
    drama3Prompt: '[whispering] If anyone finds this… please tell my family I\'m here. [pause] I don\'t know where. [gasp] I just…',
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
    emotionNote: 'explosive rage then cold menace',
    deliveryTag: '[angry, cold]',
    drama3Prompt: '[angry] What the hell are you doing? Were you recording me? [chuckle] That was the last mistake of your life. [cold] I\'ll kill you once I get that damn payment. [pause] Just… fifteen more minutes.',
    text: "What the hell are you doing? Were you recording me? That was the last mistake of your life. I'll kill you once I get that damn payment. Just… fifteen more minutes.",
    audioFilename: 'keeper_discovery_threat.mp3',
    audioUrl: '/audio/keeper_discovery_threat.mp3',
  },

  // ── ACT II: The Ancestral Haveli ───────────────────────────────────────────
  {
    id: 'protagonist_scrambled_image',
    character: 'protagonist',
    characterName: 'Kabir',
    scene: 'scene_2_scrambled_image',
    sceneTitle: 'Act II: The Ancestral Haveli',
    emotionNote: 'focused self-talk',
    deliveryTag: '[focused]',
    drama3Prompt: '[quiet] The image is a mess. [pause] If I can put it back together… maybe I\'ll recognize the place.',
    text: "The image is a mess. If I can put it back together… maybe I'll recognize the place.",
    audioFilename: 'protagonist_scrambled_image.mp3',
    audioUrl: '/audio/protagonist_scrambled_image.mp3',
  },
  {
    id: 'kabir_archive_match',
    character: 'protagonist',
    characterName: 'Kabir',
    scene: 'scene_2_scrambled_image',
    sceneTitle: 'Act II: The Ancestral Haveli',
    emotionNote: 'quiet realization',
    deliveryTag: '[focused]',
    drama3Prompt: '[focused] The three-leaf emblem. The carved lattice above the arch. [pause] That\'s Devgarh Haveli. The family estate. [breath] She\'s there.',
    text: "The three-leaf emblem. The carved lattice above the arch. That's Devgarh Haveli. The family estate. She's there.",
    audioFilename: 'kabir_archive_match.mp3',
    audioUrl: '/audio/kabir_archive_match.mp3',
  },

  // ── ACT III: The Caesar Cipher ─────────────────────────────────────────────
  {
    id: 'kabir_cipher_clue',
    character: 'protagonist',
    characterName: 'Kabir',
    scene: 'scene_3_coded_note',
    sceneTitle: 'Act III: The Caesar Cipher',
    emotionNote: 'reading then deducing',
    deliveryTag: '[focused]',
    drama3Prompt: '[reading] Three leaves. Three steps back. [pause] A Caesar shift. Shift back three. [quiet] North Gallery. The old plan is behind a loose panel.',
    text: "Three leaves. Three steps back. A Caesar shift — shift back three. North Gallery. The old plan is behind a loose panel.",
    audioFilename: 'kabir_cipher_clue.mp3',
    audioUrl: '/audio/kabir_cipher_clue.mp3',
  },

  // ── ACT IV: The Concealed Chamber ─────────────────────────────────────────
  {
    id: 'kabir_blueprint_find',
    character: 'protagonist',
    characterName: 'Kabir',
    scene: 'scene_4_concealed_chamber',
    sceneTitle: 'Act IV: The Concealed Chamber',
    emotionNote: 'low deliberate urgency',
    deliveryTag: '[focused]',
    drama3Prompt: '[low] The restoration plan cuts off here. [pause] But the original… the original shows a chamber. [urgent] Behind the western wall. They walled it off.',
    text: "The restoration plan cuts off here. But the original… the original shows a chamber. Behind the western wall. They walled it off.",
    audioFilename: 'kabir_blueprint_find.mp3',
    audioUrl: '/audio/kabir_blueprint_find.mp3',
  },

  // ── ENDING ─────────────────────────────────────────────────────────────────
  {
    id: 'narrator_ending',
    character: 'narrator',
    characterName: 'Narrator',
    scene: 'scene_4_concealed_chamber',
    sceneTitle: 'Ending: The Unconfirmed Conspiracy',
    emotionNote: 'calm eerie documentary',
    deliveryTag: '[calm, eerie]',
    drama3Prompt: '[calm] Meera was recovered alive from the concealed chamber beneath Devgarh Haveli\'s north gallery. [pause] The Keeper disappeared into the estate grounds before police arrived. [pause] The messages found on his discarded phone suggest he was acting on instructions. [eerie] Whoever gave those instructions… knew the haveli\'s secrets as well as the family did.',
    text: "Meera was recovered alive from the concealed chamber beneath Devgarh Haveli's north gallery. The Keeper disappeared before police arrived. The messages on his discarded phone suggest he was acting on instructions. Whoever gave those instructions… knew the haveli's secrets as well as the family did.",
    audioFilename: 'narrator_ending.mp3',
    audioUrl: '/audio/narrator_ending.mp3',
  },
];

/**
 * BGM track manifest — files generated by scripts/generate_audio.py
 * Loaded by useAudioEngine for scene-specific ambient tracks.
 */
export const BGM_TRACKS: Record<string, string> = {
  title:          '/audio/bgm/title_drone.mp3',
  act1_recording: '/audio/bgm/act1_recording.mp3',
  act2_haveli:    '/audio/bgm/act2_haveli.mp3',
  act3_cipher:    '/audio/bgm/act3_cipher.mp3',
  act4_blueprint: '/audio/bgm/act4_blueprint.mp3',
  climax:         '/audio/bgm/climax.mp3',
};

/**
 * All dialogue lines currently registered.
 */
export const ALL_DIALOGUE_LINES: DialogueLine[] = [...SAMPLE_DIALOGUE_LINES];
