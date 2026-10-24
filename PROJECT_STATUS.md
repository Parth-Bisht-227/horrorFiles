# HorrorFiles: Case 001 — Devgarh — Project Status & Implementation Review

**Identity:** HorrorFiles: Case 001 — Devgarh  
**Tagline:** Every secret leaves a trace.  
**Last Updated:** October 24, 2026  
**Repository:** `Parth-Bisht-227/horrorFiles` (`FishAudioHack`)  
**Current Branch:** `main` (clean build with approved Phase 1 & 2 puzzle and narrative enhancements)

---

## 1. Executive Summary

**HorrorFiles: Case 001 — Devgarh** is an Indian Gothic psychological horror investigative thriller built with React 19, TypeScript, Vite, Web Audio API, and the Fish Audio TTS API (leveraging Drama 3 and S2.1 models).

The experience follows Kabir as he races to rescue Meera, who has been kidnapped and locked deep inside the ancestral Devgarh Haveli by a ruthless mercenary known only as The Keeper. The investigation spans four interactive acts featuring illustrated cinematic scenes, voice acting, generative ambient drone audio, and three tactile investigative deduction puzzles.

---

## 2. What Has Been Implemented & Verified

### A. Full Interactive Game Loop & Act Structure
- **Title Screen (`title`):**
  - Devgarh Haveli backdrop with floating atmospheric particles.
  - Title: **HorrorFiles: Case 001 — Devgarh**
  - Tagline: *"Every secret leaves a trace."*
  - Interactive "Begin Investigation" CTA unlocking browser audio context and ambient sound.
- **Act I: The Distress Recording (`act1_intro`, `act1_playback`, `act1_keeper`):**
  - Interactive tape player interface with real-time waveform bars.
  - Meera's terrified recording playback (`meera_whisper_recording`) with custom avatar tag.
  - Abrupt intruder interruption by The Keeper (`keeper_discovery_threat`) threatening death within 15 minutes.
  - Full player pacing controls: Play, Replay, and Stop without forced auto-advancing.
- **Act II: The Ancestral Haveli & Archive Deduction (`act2_intro`, `act2_puzzle`):**
  - Narrative intro describing the damaged screenshot and archive clue (*"Three leaves. Three steps back."*).
  - **Puzzle 1 — Façade Reconstruction & 3-Property Archive Deduction (`ScramblePuzzle.tsx`):**
    - 3×3 responsive tile reconstruction puzzle with solvable permutations, move counter, and reference preview.
    - Reconstructing the photograph reveals the three-leaf emblem and carved stone lattice.
    - **Archival Dossier Deduction:** Displays 3 distinct historical properties:
      - *Ranikot Manor:* Five-petal lotus crest with open colonnade (contextual discrepancy feedback on selection).
      - *Bhanpur Palace:* Archway crest with radiating sunburst (contextual discrepancy feedback on selection).
      - *Devgarh Haveli:* Three-leaf emblem with carved sandstone lattice (verified match).
    - Selecting Devgarh confirms the match and unlocks travel to Devgarh Haveli.
    - Prominent one-click auto-solve removed; replaced with an optional discrete assistance assist strictly for tile alignment.
- **Act III: The Caesar Cipher Wheel (`act3_intro`, `act3_puzzle`):**
  - Narrative intro deciphering haveli stone masonry inscriptions.
  - **Puzzle 2 — Caesar Cipher Wheel (`CipherPuzzle.tsx`):**
    - Concentric rotating wheel with letter-by-letter live decryption.
    - Decodes `QRUWK JDOOHUB` → `NORTH GALLERY` and `ROG SODQ EHKLQG ORRVH SDQHO` → `OLD PLAN BEHIND LOOSE PANEL` using the -3 shift (+23 mod 26).
    - **Progressive Hint System:** Level 1 displays the archive clue (*"Three leaves. Three steps back."*); Level 2 guides backward alphabetical shift reasoning; Level 3 provides an optional assistance path.
    - Explicit mathematical answers (`Shift -3 / 23`) and one-click auto-solve removed from default UI.
- **Act IV: The Concealed Chamber (`act4_intro`, `act4_puzzle`):**
  - Narrative intro detailing the retrieval of the original floor plan from behind the north gallery loose panel.
  - **Puzzle 3 — Blueprint Comparator (`BlueprintPuzzle.tsx`):**
    - Interactive split-view sliding comparator comparing the original floor plan against the later restoration plan.
    - **Un-spoiled Architectural Drafting:** Direct giveaway labels (`CONCEALED CHAMBER`, `[Solid Wall] (Chamber Omitted)`) removed in favor of standard architectural drafting conventions (false partition with hatched void vs solid load-bearing wall).
    - **Comparative Inspection Requirement:** Requires the player to move the slider divider across the western wing to compare both drafts before clicking to confirm.
    - Non-revealing contextual feedback provided for clicks outside the discrepancy area.
- **Climax & Epilogue (`climax`, `ending`, `credits`):**
  - Climax narrative: Kabir breaches the western wall of the North Gallery, rescues Meera, discovering the Keeper fled through an overgrown iron gate into the estate grounds.
  - Epilogue / Unconfirmed Conspiracy: Discarded phone showing unsent instructions confirming someone with intimate knowledge of the family arranged the kidnapping, while the culprit's true identity remains unknown.
  - Full credits sequence displaying the approved project title, tagline, and cast list with "Play Again" reset function.

---

### B. Audio Engine & Sound Design (`src/hooks/useAudioEngine.ts`)
- **Procedural Ambient Drone Engine (Web Audio API):**
  - Triple-oscillator continuous drone (55 Hz + 82.5 Hz + 440 Hz tremolo LFO) providing continuous eerie atmosphere without external MP3 asset dependency.
- **Synthesized Audio Stingers:**
  - Puzzle solve stinger (rising triangle pitch sweep ramp).
  - Reveal boom (exponential low drop 80 Hz → 40 Hz + 1200 Hz shimmer decay).
- **Voice Dialogue System:**
  - HTML5 audio playback with promise resolution on completion.
  - Master gain node volume control and mute toggle.
  - `isDialoguePlaying` reactive state tracking for UI waveform sync.

---

### C. Verification & Health Summary

| Component | Status | Details |
| :--- | :--- | :--- |
| **TypeScript / Build** | **PASSING** | `npm run build` compiled clean in 390ms (`tsc -b && vite build`) |
| **Linter (Oxlint)** | **0 ERRORS** | 4 non-blocking warnings (3 unused script catch vars, 1 typewriter effect) |
| **Puzzles 1, 2, 3** | **VERIFIED** | Scramble + 3-property deduction, progressive cipher hints, un-spoiled blueprint comparator |
| **Canon Consistency** | **VERIFIED** | All occurrences of legacy title, full moon, unapproved dates, ravine, and confirmed culprit removed |

---

## 3. High-Priority Next Steps

1. **Wire Kabir's Act II Audio:**
   - Connect the already generated and approved audition take `kabir_take1_grounded_self_talk.mp3` (`protagonist_scrambled_image`) into Act II Intro playback in `App.tsx`.
2. **Keeper Permanent Voice Take Generation:**
   - Review and generate the final take for The Keeper using updated voice ID in `.env`.
3. **Dialogue Audio Ducking & Tactile SFX:**
   - Implement automatic −8dB ambient drone ducking during voice playback in `useAudioEngine.ts`.
   - Add discrete tactile click and sliding sounds for tile swaps, cipher wheel clicks, and comparator movement.
4. **Active Investigation Timer (Optional Mode):**
   - Implement `useInvestigationTimer` with automatic pause during dialogue, transitions, and evidence viewing.
