# HorrorFiles: Case 001 — Devgarh

An interactive Indian-gothic mystery built for the Fish Audio Hackathon. Players follow Kabir through a recovered recording, visual evidence, and three puzzles to locate a concealed chamber at Devgarh Haveli.

The experience uses Fish Audio-generated voice performances for Meera, the Keeper, Kabir, and the narrator, plus scene-specific atmospheric score beds, tactile puzzle effects, subtitles, and a cinematic UI.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal. To make a release build, run `npm run build` and then `npm run preview`.

## Deploy to Vercel

This is a static Vite application. No environment variables are needed at runtime because the generated Fish Audio files are committed under `public/audio`.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected settings: **Framework Preset: Vite**, **Build Command: `npm run build`**, **Output Directory: `dist`**.
4. Deploy.

Before sharing the URL, play through the full case once on both a desktop browser and a mobile browser with sound enabled. Browsers require the initial player gesture before audio can begin; the **Begin Investigation** button provides it.

## Project layout

- `src/App.tsx` — game flow, dialogue sequencing, and scene-to-music mapping.
- `src/hooks/useAudioEngine.ts` — dialogue speed, music ducking, music playback, and Web Audio puzzle effects.
- `src/data/dialogueCatalog.ts` — story text, voice metadata, and generated music manifest.
- `public/audio/` — Fish Audio dialogue, background music, and SFX files served as static assets.
- `scripts/generate_audio.py` — local-only Fish Audio generation pipeline. It reads credentials from `.env`; never expose these in the deployed app.

## Audio direction

Background music changes with each act and automatically ducks beneath spoken dialogue. The Keeper plays at 1.17× and the narrator at 1.12× to maintain tension without altering voice pitch. Subtitles are shown for the full utterance while it plays and are cleared when the audio ends.
