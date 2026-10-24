# HorrorFiles: Case 001 — Devgarh — Project Status & Handover Documentation

**Identity:** HorrorFiles: Case 001 — Devgarh  
**Tagline:** Every secret leaves a trace.  
**Last Updated:** October 24, 2026 (Post-Audio Generation & Narrative Audit)  
**Repository:** `Parth-Bisht-227/horrorFiles` (`FishAudioHack`)  
**Current Branch:** `main`  
**Build Status:** ✅ PASSING (`tsc -b && vite build` compiles cleanly, 0 TypeScript errors)

---

## 1. Executive Summary & Handover Overview

**HorrorFiles: Case 001 — Devgarh** is an Indian Gothic psychological horror mystery game developed for the Fish Audio Hackathon. It is built with **React 19**, **TypeScript**, **Vite**, **Web Audio API**, and the **Fish Audio API** (utilizing `drama-3` for nuanced voice acting and emotion tags).

If another AI agent or developer resumes this task:
- The full interactive 4-act game loop is completely built and playable.
- All 7 story dialogue MP3s are generated and located in `public/audio/`.
- All 6 atmospheric BGM tracks are generated and located in `public/audio/bgm/`.
- Tactile Web Audio sound effects are wired into all three deduction puzzles.
- The project builds cleanly with `npm run build` and runs locally with `npm run dev`.

---

## 2. Story Canon & Narrative Consistency

All files strictly conform to the approved story canon:

1. **Premise:** Meera has been kidnapped by The Keeper, a mercenary working for an unknown mastermind. She leaves a frantic recorded distress message.
2. **Act I (The Distress Recording):** Kabir listens to Meera's audio (`meera_whisper_recording`). The recording is violently interrupted by The Keeper (`keeper_discovery_threat`), establishing a 15-minute countdown.
3. **Act II (The Ancestral Haveli):** Kabir reconstructs a damaged photo (`protagonist_scrambled_image`). The reconstructed image reveals a **three-leaf emblem** and **carved lattice arch**. Comparing with historical archive dossiers identifies **Devgarh Haveli** (`kabir_archive_match`).
4. **Act III (The Caesar Cipher Wheel):** Kabir decodes haveli masonry inscriptions (`kabir_cipher_clue`):
   - `QRUWK JDOOHUB` → `NORTH GALLERY`
   - `ROG SODQ EHKLQG ORRVH SDQHO` → `OLD PLAN BEHIND LOOSE PANEL`
   - Rule: Caesar cipher shift back 3 (+23 mod 26).
5. **Act IV (The Blueprint Comparator):** Kabir compares the original 1920s haveli layout against the 1974 restoration plan (`kabir_blueprint_find`). A concealed chamber behind the western wall of the North Gallery was intentionally walled off during restoration.
6. **Climax & Epilogue:** Kabir breaches the concealed chamber and rescues Meera. The Keeper escapes through the estate grounds. Discarded phone records reveal he was hired by someone with intimate family access, leaving the mastermind unconfirmed for future episodes.

*Rule: Never revert to legacy titles ("The Last Purnima"), full-moon tropes, foundation ravine escapes, or premature culprit confirmations.*

---

## 3. Audio Asset Inventory & Architecture

### A. Dialogue Voice Lines (`public/audio/`)
Curated from best auditions and high-performance directable takes:

| File | Character | Source / Active Take | Performance / Speed Details |
| :--- | :--- | :--- | :--- |
| `meera_whisper_recording.mp3` | Meera | `meera_take1_breathless_urgency` (98 KB) | 1.15x speed, high-urgency whisper, realistic abrupt cut at the end. |
| `keeper_discovery_threat.mp3` | The Keeper | `keeper_take1_explosive_cold` (272 KB) | 1.15x speed, explosive sudden furious shout into cold menace. |
| `protagonist_scrambled_image.mp3` | Kabir | `kabir_take1_grounded_self_talk` (86 KB) | 1.05x speed, grounded natural investigative monologue. |
| `kabir_archive_match.mp3` | Kabir | Devgarh Haveli match (121 KB) | Focused revelation upon identifying the three-leaf emblem & arch. |
| `kabir_cipher_clue.mp3` | Kabir | Caesar Cipher deduction (133 KB) | Decodes `QRUWK JDOOHUB` and `ROG SODQ...` (-3 shift). |
| `kabir_blueprint_find.mp3` | Kabir | Concealed Chamber discovery (120 KB) | Urgent realization of the walled-off western room. |
| `narrator_ending.mp3` | Narrator | Epilogue (472 KB) | Updated narrator voice ID, calm sinister wrap-up. |

### B. Background Music Tracks (`public/audio/bgm/`)
Procedurally synthesized atmospheric drone and pad compositions:
- `title_drone.mp3` — Deep 55Hz+82.5Hz sub-bass with slow LFO modulation.
- `act1_recording.mp3` — Analog tape hiss with oppressive 1.2Hz pulse.
- `act2_haveli.mp3` — Ominous D-minor sustained string pads.
- `act3_cipher.mp3` — Dry mechanical ticks (2.5Hz) over tremolo bass.
- `act4_blueprint.mp3` — Rising tension frequency ramp (80Hz → 160Hz) with wind texture.
- `climax.mp3` — Emotional harmonic swell and resolution.

### C. Sound Effects (`public/audio/sfx/`)
Preloaded into memory via Web Audio `AudioBuffer` for instant, zero-latency playback with procedural fallbacks:

| Sound File | Active In Scene | Trigger Action | Fallback |
| :--- | :--- | :--- | :--- |
| `tile_slide.wav` / `title_slide.wav` | **Act II: Puzzle 1** | Sandstone tile swap / placement | Synthesized low stone impact |
| `wheel_click.wav` | **Act III: Puzzle 2** | Brass cipher wheel rotation step | Synthesized 1.4kHz ratchet click |
| `paper_slide.wav` | **Act IV: Puzzle 3** | Blueprint comparator divider sliding (throttled) | Synthesized parchment rustle |
| `tape_start.wav` | **Act I: Tape Deck** | Mechanical tape play / replay button click | Synthesized solenoid thud |
| `tape_stop.wav` | **Act I: Tape Deck** | Mechanical tape stop button click | Synthesized plastic snap |

---

## 4. Key Scripts & Tooling

1. **Audio Generation Script:**
   - Python: `python scripts/generate_audio.py`
     - Options: `--dialogue-only`, `--bgm-only`, `--dry-run`
     - Reads `FISH_AUDIO_API_KEY` and `FISH_AUDIO_MODEL` from `.env`.
   - Node.js alternative: `node scripts/generate-audio.mjs`
2. **Environment Configuration (`.env`):**
   ```env
   FISH_AUDIO_API_KEY=your_key_here
   FISH_AUDIO_MODEL=drama-3
   FISH_AUDIO_VOICE_MEERA=2a06753e3e974cdb885efa1516fc7473
   FISH_AUDIO_VOICE_KEEPER=2d45d2ac1b0846adbf89f268fa6c3872
   FISH_AUDIO_VOICE_PROTAGONIST=b49fbb232991427ea7196162045169b3
   FISH_AUDIO_VOICE_NARRATOR=<updated_narrator_voice_id>
   ```

---

## 5. Development & Deployment Commands

```bash
# Run local development server
npm run dev

# Run type check and production bundle build
npm run build

# Run linter
npx oxlint
```

The production output is emitted to `dist/` and is ready for static deployment to Vercel, Netlify, or GitHub Pages.
