# Horror Files — Case 001: The Missing Signal

An interactive Indian-gothic mystery built with Fish Audio.

A damaged recording leads Kabir through a missing-person investigation: reconstruct a recovered photograph, cross-reference an estate archive, decipher a concealed inscription, and expose what was hidden behind an old wall.

## Experience

- Fish Audio voice performances for Meera, the Keeper, Kabir, and the narrator
- Scene-specific atmospheric music that ducks under dialogue
- Three playable investigation puzzles: photograph reconstruction and archive matching, a Caesar cipher, and a floor-plan comparator
- Cinematic subtitles, replayable dialogue, tactile sound effects, and a non-punitive case timer
- Responsive desktop and mobile layout, keyboard support for the Act II investigation, reduced-motion support, and a custom Horror Files site icon

## Story premise

Meera has disappeared. Her recovered phone contains a terrified recording, cut short by an unidentified captor.

Following the evidence, Kabir must determine where she is being held before the trail disappears. The case gradually reveals an old estate, a coded message, and a concealed chamber—but the person who orchestrated the kidnapping remains unknown.

## Run locally

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
npm run preview
```

## Deploy to Vercel

This is a static Vite application. Generated audio is served from `public/audio`, so no runtime environment variables are required.

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected settings: **Framework Preset: Vite**, **Build Command: `npm run build`**, **Output Directory: `dist`**.
4. Deploy.

Use a browser with sound enabled. The first **Open Case File** click enables playback in line with browser autoplay rules.

## Audio generation

The reproducible local-generation utilities are retained in `scripts/`:

- `generate_audio.py` — Fish Audio dialogue generation and procedural music generation
- `generate-audio.mjs` — Node.js generation pipeline and comparison tools
- `generate-takes.mjs` — alternate voice-take generation
- `dialogue-catalog.json` — source dialogue and performance direction

Copy `.env.example` to `.env` and supply Fish Audio credentials before running a generation script. Never commit `.env` or API keys.

## Project structure

- `src/App.tsx` — narrative flow, scenes, dialogue, and music routing
- `src/hooks/useAudioEngine.ts` — dialogue playback, sound mixing, music ducking, and interaction audio
- `src/components/` — cinematic panels and investigation puzzles
- `src/data/dialogueCatalog.ts` — dialogue and music metadata
- `public/audio/` — Fish Audio dialogue, score, and sound effects
- `public/horrorfiles-icon.svg` — site and browser icon

## Built with

React, TypeScript, Vite, Web Audio API, and Fish Audio.
