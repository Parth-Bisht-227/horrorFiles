#!/usr/bin/env node

/**
 * The Last Purnima / HorrorFiles — Controlled Voice Performance Auditions
 * 
 * Generates alternative Drama 3 takes testing:
 *  - Meaningfully different performance directions
 *  - Calibrated prosody speed adjustments (1.15x - 1.22x)
 *  - Strict dialogue text identity (subtitles remain 100% clean)
 *  - Separate auditions directory: public/audio/voice-auditions/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
    console.log('✓ Loaded .env configuration');
  } catch (err) {
    console.warn('⚠️ Could not load .env:', err.message);
  }
}

const apiKey = process.env.FISH_AUDIO_API_KEY || '';
if (!apiKey) {
  console.error('Error: FISH_AUDIO_API_KEY is required in .env');
  process.exit(1);
}

const VOICE_MEERA = process.env.FISH_AUDIO_VOICE_MEERA || '7d62e110d5364b608912d6837890b336';
const VOICE_KEEPER = process.env.FISH_AUDIO_VOICE_KEEPER || '8cf2f4372b884ce4bf4271648067eaab';
const VOICE_KABIR = process.env.FISH_AUDIO_VOICE_PROTAGONIST || 'b49fbb232991427ea7196162045169b3';

// Audition takes definitions
const AUDITION_TAKES = [
  // ==========================================
  // MEERA AUDITIONS
  // Dialogue: "If anyone finds this… please tell my family I'm here. I don't know where. I just…"
  // ==========================================
  {
    takeId: 'meera_take1_breathless_urgency',
    character: 'meera',
    characterName: 'Meera',
    voiceId: VOICE_MEERA,
    model: 'drama-3',
    speed: 1.15,
    takeLabel: 'Take 1: Breathless Urgency (1.15x)',
    directionSummary: 'Fast, restrained panic whisper, looking around fearfully, no sensual pauses',
    apiPrompt: "[fast, breathless whisper, terrified, urgent] If anyone finds this… please tell my family I'm here. I don't know where. [restrained sob] I just…",
    cleanSubtitle: "If anyone finds this… please tell my family I'm here. I don't know where. I just…",
    outputFilename: 'meera_take1_breathless_urgency.mp3',
  },
  {
    takeId: 'meera_take2_trembling_fear',
    character: 'meera',
    characterName: 'Meera',
    voiceId: VOICE_MEERA,
    model: 'drama-3',
    speed: 1.20,
    takeLabel: 'Take 2: Stifled Tremor & Fast Alertness (1.20x)',
    directionSummary: 'Shivering, high anxiety, alert to nearby guard footsteps, hurried quiet words',
    apiPrompt: "[shivering whisper, trembling with fear, rushed and anxious] If anyone finds this… please tell my family I'm here. I don't know where. I just…",
    cleanSubtitle: "If anyone finds this… please tell my family I'm here. I don't know where. I just…",
    outputFilename: 'meera_take2_trembling_fear.mp3',
  },

  // ==========================================
  // THE KEEPER AUDITIONS
  // Dialogue: "What the hell are you doing? Were you recording me? That was the last mistake of your life. I'll kill you once I get that damn payment. Just fifteen more minutes…"
  // ==========================================
  {
    takeId: 'keeper_take1_explosive_cold',
    character: 'keeper',
    characterName: 'The Keeper',
    voiceId: VOICE_KEEPER,
    model: 'drama-3',
    speed: 1.15,
    takeLabel: 'Take 1: Explosive Snarl into Cold Menace (1.15x)',
    directionSummary: 'Violent abrupt opening bark, snapping shut into tight cold threat',
    apiPrompt: "[fast, sudden explosive shout] What the hell are you doing? Were you recording me?! [gritted teeth, low menacing] That was the last mistake of your life. I'll kill you once I get that damn payment. Just fifteen more minutes…",
    cleanSubtitle: "What the hell are you doing? Were you recording me? That was the last mistake of your life. I'll kill you once I get that damn payment. Just fifteen more minutes…",
    outputFilename: 'keeper_take1_explosive_cold.mp3',
  },
  {
    takeId: 'keeper_take2_impatient_thug',
    character: 'keeper',
    characterName: 'The Keeper',
    voiceId: VOICE_KEEPER,
    model: 'drama-3',
    speed: 1.22,
    takeLabel: 'Take 2: Volatile Impatient Street Thug (1.22x)',
    directionSummary: 'Fast rough cadence, volatile temper, quick menacing murmur at end',
    apiPrompt: "[rapid harsh bark, furious] What the hell are you doing? Were you recording me? That was the last mistake of your life. [deadpan, ice cold whisper] I'll kill you once I get that damn payment. [pause: 0.3s] Just fifteen more minutes…",
    cleanSubtitle: "What the hell are you doing? Were you recording me? That was the last mistake of your life. I'll kill you once I get that damn payment. Just fifteen more minutes…",
    outputFilename: 'keeper_take2_impatient_thug.mp3',
  },

  // ==========================================
  // KABIR (PROTAGONIST) AUDITIONS
  // Dialogue: "The image is a mess. If I can put it back together, maybe I'll recognize the place."
  // ==========================================
  {
    takeId: 'kabir_take1_grounded_self_talk',
    character: 'protagonist',
    characterName: 'Kabir',
    voiceId: VOICE_KABIR,
    model: 'drama-3',
    speed: 1.05,
    takeLabel: 'Take 1: Conversational Self-Talk (1.05x)',
    directionSummary: 'Natural, grounded private monologue, thinking aloud while examining puzzle pieces',
    apiPrompt: "[quiet, focused self-talk] The image is a mess. [pause: 0.4s] [determined] If I can put it back together, maybe I'll recognize the place.",
    cleanSubtitle: "The image is a mess. If I can put it back together, maybe I'll recognize the place.",
    outputFilename: 'kabir_take1_grounded_self_talk.mp3',
  },
];

// Target directories
const outputDir = path.join(ROOT_DIR, 'public', 'audio', 'voice-auditions');
fs.mkdirSync(outputDir, { recursive: true });
const manifestPath = path.join(outputDir, 'manifest.json');
const manifestSrcPath = path.join(ROOT_DIR, 'src', 'data', 'audio-manifest-auditions.json');

async function generateTake(take) {
  console.log(`\n======================================================`);
  console.log(`Audition: ${take.takeLabel}`);
  console.log(`Character: ${take.characterName} | Voice ID: ${take.voiceId}`);
  console.log(`Speed: ${take.speed}x | Model: ${take.model}`);
  console.log(`Prompt: "${take.apiPrompt}"`);

  const payload = {
    text: take.apiPrompt,
    format: 'mp3',
    latency: 'normal',
    reference_id: take.voiceId,
    prosody: {
      speed: take.speed,
      volume: 0,
      normalize_loudness: true,
    },
  };

  const startTime = Date.now();
  const response = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'model': take.model,
    },
    body: JSON.stringify(payload),
  });

  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    let errText = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      errText = errJson.message || JSON.stringify(errJson);
    } catch (_) {
      const text = await response.text();
      if (text) errText = text;
    }
    throw new Error(`API Error: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const outFilePath = path.join(outputDir, take.outputFilename);
  fs.writeFileSync(outFilePath, buffer);

  console.log(`✓ Saved: ${outFilePath} (${buffer.length} bytes, ${durationMs}ms)`);
  return {
    ...take,
    audioUrl: `/audio/voice-auditions/${take.outputFilename}`,
    fileSizeBytes: buffer.length,
    latencyMs: durationMs,
    generatedAt: new Date().toISOString(),
    status: 'ready',
  };
}

async function run() {
  console.log('====================================================');
  console.log('   The Last Purnima — Controlled Voice Auditions');
  console.log('====================================================');

  const results = [];
  for (const take of AUDITION_TAKES) {
    try {
      const res = await generateTake(take);
      results.push(res);
    } catch (err) {
      console.error(`✗ FAILED [${take.takeId}]:`, err.message);
      results.push({
        ...take,
        status: 'failed',
        error: err.message,
      });
    }
  }

  const manifest = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    takes: results,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(manifestSrcPath, JSON.stringify(manifest, null, 2));

  console.log('\n====================================================');
  console.log('Auditions Manifest Updated:');
  console.log(`  ${manifestPath}`);
  console.log(`  ${manifestSrcPath}`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Execution failed:', err);
  process.exit(1);
});
