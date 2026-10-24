export type CharacterId = 'meera' | 'keeper' | 'protagonist' | 'narrator';

export type SceneId = 
  | 'scene_1_recording'
  | 'scene_2_scrambled_image'
  | 'scene_3_coded_note'
  | 'scene_4_concealed_chamber';

export interface CharacterMeta {
  id: CharacterId;
  name: string;
  role: string;
  description: string;
  avatarUrl: string;
  voiceEnvKey: string;
  defaultDeliveryTag: string;
  color: string;
}

export interface SceneMeta {
  id: SceneId;
  title: string;
  description: string;
  backgroundUrl: string;
}

export interface DialogueLine {
  id: string;
  character: CharacterId;
  characterName: string;
  scene: SceneId;
  sceneTitle: string;
  text: string;
  deliveryTag?: string;
  drama3Prompt?: string;
  emotionNote?: string;
  audioFilename: string;
  audioUrl: string;
}

export interface AudioManifestItem {
  id: string;
  character: CharacterId;
  characterName: string;
  scene: SceneId;
  text: string;
  deliveryTag?: string;
  drama3Prompt?: string;
  emotionNote?: string;
  voiceId: string;
  audioFilename: string;
  audioUrl: string;
  generatedAt?: string;
  fileSizeBytes?: number;
  latencyMs?: number;
  status: 'ready' | 'missing' | 'failed' | 'placeholder';
  model?: string;
  error?: string;
}

export interface AudioManifest {
  version: string;
  updatedAt: string;
  modelUsed: string;
  characters: Record<CharacterId, { name: string; voiceId: string }>;
  dialogues: Record<string, AudioManifestItem>;
}
