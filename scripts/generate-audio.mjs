#!/usr/bin/env node

/**
 * The Last Purnima — Fish Audio Batch Generation Pipeline
 * 
 * Generates character dialogue audio files using Fish Audio TTS API.
 * Supports:
 *   - S2.1 models (s2.1-pro, s2.1-pro-free) with standard emotion delivery tags
 *   - Drama 3 model (drama-3) with rich inline performance directions (pauses, laughs, gasps, tremors)
 * 
 * Usage:
 *   node scripts/generate-audio.mjs                        # Generate missing clips with default model
 *   node scripts/generate-audio.mjs --sample-only           # Generate the 3 sample clips
 *   node scripts/generate-audio.mjs --test-drama3           # Generate Drama 3 comparison clips in separate dir
 *   node scripts/generate-audio.mjs --model drama-3         # Use Drama 3 model explicitly
 *   node scripts/generate-audio.mjs --force                 # Overwrite existing files
 *   node scripts/generate-audio.mjs --mock                  # Dry-run tone synthesizer
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load .env if present
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
    console.log('✓ Loaded environment variables from .env');
  } catch (err) {
    console.warn('⚠️ Could not load .env file:', err.message);
  }
}

// Parse CLI flags
const args = process.argv.slice(2);
const isForce = args.includes('--force');
const isSampleOnly = args.includes('--sample-only') || args.includes('--test-drama3');
const isDrama3Test = args.includes('--test-drama3') || args.includes('--drama3-test');
const isMock = args.includes('--mock') || args.includes('--dry-run');

const idIndex = args.indexOf('--id');
const targetId = idIndex !== -1 ? args[idIndex + 1] : null;

const modelIndex = args.indexOf('--model');
let model = modelIndex !== -1 ? args[modelIndex + 1] : (process.env.FISH_AUDIO_MODEL || 's2.1-pro');
if (isDrama3Test && modelIndex === -1) {
  model = 'drama-3';
}

const outDirIndex = args.indexOf('--out-dir');
let customOutDir = outDirIndex !== -1 ? args[outDirIndex + 1] : null;

const suffixIndex = args.indexOf('--suffix');
let customSuffix = suffixIndex !== -1 ? args[suffixIndex + 1] : '';

// Setup output directories
const defaultAudioDir = path.join(ROOT_DIR, 'public', 'audio');
const drama3ComparisonDir = path.join(ROOT_DIR, 'public', 'audio', 'drama3-comparison');

let audioOutputDir = defaultAudioDir;
let manifestPublicPath = path.join(audioOutputDir, 'manifest.json');
let manifestSrcPath = path.join(ROOT_DIR, 'src', 'data', 'audio-manifest.json');

if (isDrama3Test) {
  audioOutputDir = drama3ComparisonDir;
  customSuffix = '_drama3';
  manifestPublicPath = path.join(audioOutputDir, 'manifest.json');
  manifestSrcPath = path.join(ROOT_DIR, 'src', 'data', 'audio-manifest-drama3.json');
} else if (customOutDir) {
  audioOutputDir = path.resolve(ROOT_DIR, customOutDir);
  manifestPublicPath = path.join(audioOutputDir, 'manifest.json');
  manifestSrcPath = path.join(ROOT_DIR, 'src', 'data', `audio-manifest-${path.basename(customOutDir)}.json`);
}

// Read dialogue catalog
const catalogPath = path.join(__dirname, 'dialogue-catalog.json');
if (!fs.existsSync(catalogPath)) {
  console.error(`Error: Dialogue catalog not found at ${catalogPath}`);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Filter dialogue lines
let linesToProcess = catalog.dialogues;
if (targetId) {
  linesToProcess = linesToProcess.filter((d) => d.id === targetId);
  if (linesToProcess.length === 0) {
    console.error(`Error: Dialogue ID "${targetId}" not found in catalog.`);
    process.exit(1);
  }
} else if (isSampleOnly) {
  const sampleIds = ['meera_whisper_recording', 'keeper_discovery_threat', 'protagonist_scrambled_image'];
  linesToProcess = linesToProcess.filter((d) => sampleIds.includes(d.id));
}

// Config
const apiKey = process.env.FISH_AUDIO_API_KEY || '';

const VOICE_MAP = {
  meera: process.env.FISH_AUDIO_VOICE_MEERA || process.env.VOICE_MEERA || '',
  keeper: process.env.FISH_AUDIO_VOICE_KEEPER || process.env.VOICE_KEEPER || '',
  protagonist: process.env.FISH_AUDIO_VOICE_PROTAGONIST || process.env.VOICE_PROTAGONIST || '',
  narrator: process.env.FISH_AUDIO_VOICE_NARRATOR || process.env.VOICE_NARRATOR || '',
};

console.log('====================================================');
console.log('   The Last Purnima — Fish Audio Generation Pipeline');
console.log('====================================================');
console.log(`Target Model:      ${model} ${isDrama3Test ? '(Drama 3 Comparison Mode)' : ''}`);
console.log(`Output Directory:  ${audioOutputDir}`);
console.log(`API Key:           ${apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '(Not configured)'}`);
console.log(`Voice (Meera):     ${VOICE_MAP.meera || '(Not configured - set FISH_AUDIO_VOICE_MEERA)'}`);
console.log(`Voice (Keeper):    ${VOICE_MAP.keeper || '(Not configured - set FISH_AUDIO_VOICE_KEEPER)'}`);
console.log(`Voice (Kabir):     ${VOICE_MAP.protagonist || '(Not configured - set FISH_AUDIO_VOICE_PROTAGONIST)'}`);
console.log(`Clips to process:  ${linesToProcess.length}`);
console.log(`Force overwrite:   ${isForce}`);
console.log(`Mock mode:         ${isMock}`);
console.log('----------------------------------------------------');

// Validate credentials if not in mock mode
if (!isMock && !apiKey) {
  console.warn('\n⚠️  WARNING: FISH_AUDIO_API_KEY is not set in environment or .env file!');
  console.warn('   Please configure .env before running live generation.\n');
  process.exit(1);
}

// Ensure output directories exist
fs.mkdirSync(audioOutputDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestSrcPath), { recursive: true });

// Load existing manifest if available
let manifest = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  modelUsed: model,
  characters: {
    meera: { name: 'Meera', voiceId: VOICE_MAP.meera },
    keeper: { name: 'The Keeper', voiceId: VOICE_MAP.keeper },
    protagonist: { name: 'Kabir', voiceId: VOICE_MAP.protagonist },
    narrator: { name: 'Narrator', voiceId: VOICE_MAP.narrator },
  },
  dialogues: {},
};

if (fs.existsSync(manifestPublicPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(manifestPublicPath, 'utf8'));
    manifest.dialogues = existing.dialogues || {};
  } catch (e) {
    // start fresh
  }
}

/**
 * Creates a valid, playable test audio WAV file buffer
 */
function createSyntheticToneWav(durationSeconds = 2.5, frequencyHz = 440) {
  const sampleRate = 22050;
  const numChannels = 1;
  const bytesPerSample = 2;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let env = 1.0;
    if (t < 0.1) env = t / 0.1;
    if (t > durationSeconds - 0.2) env = Math.max(0, (durationSeconds - t) / 0.2);

    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * 0.4 +
                   Math.sin(2 * Math.PI * (frequencyHz * 1.5) * t) * 0.2;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * env * 24000)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

/**
 * Call Fish Audio REST API (/v1/tts)
 */
async function generateFishAudioClip(line, voiceId, targetModel) {
  // Determine prompt based on model
  let promptText = line.text;
  if (targetModel === 'drama-3') {
    // Drama 3 supports rich natural-language performance direction tags (pauses, laughs, gasps)
    promptText = line.drama3Prompt || (line.deliveryTag ? `${line.deliveryTag} ${line.text}` : line.text);
  } else {
    // S2.1 models
    if (line.deliveryTag && !promptText.startsWith('[')) {
      promptText = `${line.deliveryTag} ${promptText}`;
    }
  }

  console.log(`\n→ Requesting Fish Audio TTS for [${line.id}]:`);
  console.log(`  Model:        ${targetModel}`);
  console.log(`  Character:    ${line.characterName}`);
  console.log(`  Voice ID:     ${voiceId || '(Default voice)'}`);
  console.log(`  Direction:    ${line.emotionNote || '(Standard)'}`);
  console.log(`  API Prompt:   "${promptText}"`);
  console.log(`  Clean Text:   "${line.text}"`);

  const payload = {
    text: promptText,
    format: 'mp3',
    latency: 'normal',
  };

  if (voiceId) {
    payload.reference_id = voiceId;
  }

  const startTime = Date.now();
  const response = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'model': targetModel,
    },
    body: JSON.stringify(payload),
  });

  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    let errDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.message || errJson.reason || JSON.stringify(errJson);
    } catch (_) {
      const text = await response.text();
      if (text) errDetail = text;
    }
    throw new Error(`API Error (${response.status}) on model "${targetModel}": ${errDetail}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log(`  API Latency:  ${durationMs}ms`);
  return {
    buffer: Buffer.from(arrayBuffer),
    durationMs,
    promptUsed: promptText,
  };
}

// Processing loop
async function run() {
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const results = [];

  for (const line of linesToProcess) {
    // Compute filename with optional suffix
    let filename = line.audioFilename;
    if (customSuffix) {
      const ext = path.extname(line.audioFilename);
      const base = path.basename(line.audioFilename, ext);
      filename = `${base}${customSuffix}${ext}`;
    }

    const outFile = path.join(audioOutputDir, filename);
    const relativeUrl = `/audio/${path.relative(path.join(ROOT_DIR, 'public', 'audio'), outFile).replace(/\\/g, '/')}`;
    const voiceId = VOICE_MAP[line.character] || '';
    const fileExists = fs.existsSync(outFile);

    if (fileExists && !isForce) {
      console.log(`↷ [SKIP] "${filename}" already exists in ${audioOutputDir}. (Use --force to regenerate)`);
      const stat = fs.statSync(outFile);
      manifest.dialogues[line.id] = {
        id: line.id,
        character: line.character,
        characterName: line.characterName,
        scene: line.scene,
        text: line.text,
        deliveryTag: line.deliveryTag,
        drama3Prompt: line.drama3Prompt,
        emotionNote: line.emotionNote,
        voiceId: voiceId || 'default',
        audioFilename: filename,
        audioUrl: relativeUrl,
        fileSizeBytes: stat.size,
        status: 'ready',
        model: model,
        generatedAt: stat.mtime.toISOString(),
      };
      results.push({
        id: line.id,
        character: line.characterName,
        filename,
        path: outFile,
        voiceId: voiceId || 'default',
        model,
        status: 'skipped (exists)',
        fileSizeBytes: stat.size,
      });
      skippedCount++;
      continue;
    }

    try {
      let audioBuffer;
      let promptUsed = line.text;
      let latencyMs = 0;

      if (isMock) {
        console.log(`⚙ [MOCK] Generating placeholder tone for "${line.id}" (${model})...`);
        const freqMap = { meera: 520, keeper: 220, protagonist: 380, narrator: 300 };
        const freq = freqMap[line.character] || 440;
        audioBuffer = createSyntheticToneWav(3.2, freq);
      } else {
        const genResult = await generateFishAudioClip(line, voiceId, model);
        audioBuffer = genResult.buffer;
        promptUsed = genResult.promptUsed;
        latencyMs = genResult.durationMs;
      }

      fs.writeFileSync(outFile, audioBuffer);
      console.log(`✓ [SUCCESS] Saved: ${outFile} (${audioBuffer.length} bytes)`);

      manifest.dialogues[line.id] = {
        id: line.id,
        character: line.character,
        characterName: line.characterName,
        scene: line.scene,
        text: line.text,
        deliveryTag: line.deliveryTag,
        drama3Prompt: line.drama3Prompt,
        promptSentToAPI: promptUsed,
        emotionNote: line.emotionNote,
        voiceId: voiceId || (isMock ? 'mock-synth' : 'default'),
        audioFilename: filename,
        audioUrl: relativeUrl,
        fileSizeBytes: audioBuffer.length,
        status: isMock ? 'placeholder' : 'ready',
        model,
        latencyMs,
        generatedAt: new Date().toISOString(),
      };

      results.push({
        id: line.id,
        character: line.characterName,
        filename,
        path: outFile,
        voiceId: voiceId || (isMock ? 'mock-synth' : 'default'),
        model,
        status: 'success',
        fileSizeBytes: audioBuffer.length,
        latencyMs,
      });

      successCount++;
    } catch (err) {
      console.error(`✗ [FAILED] "${line.id}" with model "${model}": ${err.message}`);
      manifest.dialogues[line.id] = {
        id: line.id,
        character: line.character,
        characterName: line.characterName,
        scene: line.scene,
        text: line.text,
        deliveryTag: line.deliveryTag,
        drama3Prompt: line.drama3Prompt,
        emotionNote: line.emotionNote,
        voiceId,
        audioFilename: filename,
        audioUrl: relativeUrl,
        status: 'failed',
        error: err.message,
        model,
      };

      results.push({
        id: line.id,
        character: line.characterName,
        filename,
        path: outFile,
        voiceId,
        model,
        status: 'failed',
        error: err.message,
      });

      failedCount++;
    }
  }

  // Update manifest timestamp and characters
  manifest.updatedAt = new Date().toISOString();
  manifest.modelUsed = model;
  manifest.characters = {
    meera: { name: 'Meera', voiceId: VOICE_MAP.meera || (isMock ? 'mock-meera' : '') },
    keeper: { name: 'The Keeper', voiceId: VOICE_MAP.keeper || (isMock ? 'mock-keeper' : '') },
    protagonist: { name: 'Kabir', voiceId: VOICE_MAP.protagonist || (isMock ? 'mock-protagonist' : '') },
    narrator: { name: 'Narrator', voiceId: VOICE_MAP.narrator || (isMock ? 'mock-narrator' : '') },
  };

  const manifestJson = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(manifestPublicPath, manifestJson);
  fs.writeFileSync(manifestSrcPath, manifestJson);

  console.log('\n----------------------------------------------------');
  console.log(`Manifest updated:   ${manifestPublicPath}`);
  console.log(`Summary:            ${successCount} generated, ${skippedCount} skipped, ${failedCount} failed`);
  console.log('====================================================\n');

  // Print results table
  console.log('Generation Summary Table:');
  console.table(results.map(r => ({
    Character: r.character,
    Model: r.model,
    VoiceID: r.voiceId,
    Status: r.status,
    Bytes: r.fileSizeBytes || 0,
    File: r.filename
  })));
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
