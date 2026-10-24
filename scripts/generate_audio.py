#!/usr/bin/env python3
"""
HorrorFiles: Case 001 — Devgarh
Audio Generation Script
========================
Generates all dialogue MP3s via Fish Audio TTS API and all BGM tracks procedurally.

Requirements:
    pip install requests python-dotenv numpy

Run from project root:
    python scripts/generate_audio.py

Options:
    --dialogue-only   Only generate dialogue clips
    --bgm-only        Only generate BGM tracks
    --dry-run         Print what would be generated, skip API calls
"""

import argparse
import json
import os
import sys

# Windows PowerShell may use cp1252 — force UTF-8 output
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import struct
import time
import wave
from pathlib import Path

# ── Dependency check ────────────────────────────────────────────────────────

missing = []
try:
    import requests
except ImportError:
    missing.append("requests")
try:
    import numpy as np
except ImportError:
    missing.append("numpy")
try:
    from dotenv import load_dotenv
except ImportError:
    missing.append("python-dotenv")

if missing:
    print(f"[ERROR] Missing packages: {', '.join(missing)}")
    print(f"        Install with: pip install {' '.join(missing)}")
    sys.exit(1)

# ── Config ──────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
load_dotenv(ENV_FILE)

API_KEY      = os.getenv("FISH_AUDIO_API_KEY", "")
MODEL        = os.getenv("FISH_AUDIO_MODEL", "drama-3")
FISH_TTS_URL = "https://api.fish.audio/v1/tts"

VOICE_IDS = {
    "meera":       os.getenv("FISH_AUDIO_VOICE_MEERA",       "2a06753e3e974cdb885efa1516fc7473"),
    "keeper":      os.getenv("FISH_AUDIO_VOICE_KEEPER",      "2d45d2ac1b0846adbf89f268fa6c3872"),
    "protagonist": os.getenv("FISH_AUDIO_VOICE_PROTAGONIST", "b49fbb232991427ea7196162045169b3"),
    "narrator":    os.getenv("FISH_AUDIO_VOICE_NARRATOR",    "8f01a73eba7947219fd7eb789885deaf"),
}

AUDIO_OUT = PROJECT_ROOT / "public" / "audio"
BGM_OUT   = AUDIO_OUT / "bgm"
AUDIO_OUT.mkdir(parents=True, exist_ok=True)
BGM_OUT.mkdir(parents=True, exist_ok=True)

# ── Dialogue Script ──────────────────────────────────────────────────────────

DIALOGUE_LINES = [
    {
        "id":        "meera_whisper_recording",
        "character": "meera",
        "file":      "meera_whisper_recording.mp3",
        "text": "If anyone finds this… please tell my family I'm here. I don't know where. I just…",
        "tagged_text": "[whispering] If anyone finds this… please tell my family I'm here. [pause] I don't know where. [gasp] I just…",
    },
    {
        "id":        "keeper_discovery_threat",
        "character": "keeper",
        "file":      "keeper_discovery_threat.mp3",
        "text": "What the hell are you doing? Were you recording me? That was the last mistake of your life. I'll kill you once I get that damn payment. Just… fifteen more minutes.",
        "tagged_text": "[angry] What the hell are you doing? Were you recording me? [chuckle] That was the last mistake of your life. [cold] I'll kill you once I get that damn payment. [pause] Just… fifteen more minutes.",
    },
    {
        "id":        "protagonist_scrambled_image",
        "character": "protagonist",
        "file":      "protagonist_scrambled_image.mp3",
        "text": "The image is a mess. If I can put it back together… maybe I'll recognize the place.",
        "tagged_text": "[quiet] The image is a mess. [pause] If I can put it back together… maybe I'll recognize the place.",
    },
    {
        "id":        "kabir_archive_match",
        "character": "protagonist",
        "file":      "kabir_archive_match.mp3",
        "text": "The three-leaf emblem. The carved lattice above the arch. That's Devgarh Haveli. The family estate. She's there.",
        "tagged_text": "[focused] The three-leaf emblem. The carved lattice above the arch. [pause] That's Devgarh Haveli. The family estate. [breath] She's there.",
    },
    {
        "id":        "kabir_cipher_clue",
        "character": "protagonist",
        "file":      "kabir_cipher_clue.mp3",
        "text": "Three leaves. Three steps back. A Caesar shift. Shift back three. North Gallery. The old plan is behind a loose panel.",
        "tagged_text": "[reading] Three leaves. Three steps back. [pause] A Caesar shift. Shift back three. [quiet] North Gallery. The old plan is behind a loose panel.",
    },
    {
        "id":        "kabir_blueprint_find",
        "character": "protagonist",
        "file":      "kabir_blueprint_find.mp3",
        "text": "The restoration plan cuts off here. But the original… the original shows a chamber. Behind the western wall. They walled it off.",
        "tagged_text": "[low] The restoration plan cuts off here. [pause] But the original… the original shows a chamber. [urgent] Behind the western wall. They walled it off.",
    },
    {
        "id":        "narrator_case_intro",
        "character": "narrator",
        "file":      "narrator_case_intro.mp3",
        "text": "Case 001: Devgarh. A damaged distress recording was recovered from Meera's phone. Distorted by fear... and cut short by someone inside the estate.",
        "tagged_text": "[calm, dark] Case zero zero one: Devgarh. A damaged distress recording was recovered from Meera's phone. Distorted by fear... [whisper] and cut short by someone inside the estate.",
    },
    {
        "id":        "narrator_ending",
        "character": "narrator",
        "file":      "narrator_ending.mp3",
        "text": "Meera was recovered alive from the concealed chamber beneath Devgarh Haveli's north gallery. The Keeper disappeared into the estate grounds before police arrived. The messages found on his discarded phone suggest he was acting on instructions. Whoever gave those instructions… knew the haveli's secrets as well as the family did.",
        "tagged_text": "[calm, dark] Meera was recovered alive from the concealed chamber beneath Devgarh Haveli's north gallery. The Keeper disappeared into the estate grounds before police arrived. The messages found on his discarded phone suggest he was acting on instructions. [eerie] Whoever gave those instructions… knew the haveli's secrets as well as the family did.",
    },
]

# ── BGM Specs ────────────────────────────────────────────────────────────────

BGM_TRACKS = [
    {"id": "bgm_title",          "file": "bgm/title_drone.mp3",      "duration": 60,  "desc": "Title screen: deep drone 55+82+110Hz, slow LFO", "spec": {"type": "drone",          "freqs": [55, 82.5, 110], "lfo_rate": 0.25}},
    {"id": "bgm_act1_recording", "file": "bgm/act1_recording.mp3",   "duration": 30,  "desc": "Act I: tape hiss + oppressive low pulse",         "spec": {"type": "tense_pulse",    "pulse_freq": 1.2, "noise_level": 0.035}},
    {"id": "bgm_act2_haveli",    "file": "bgm/act2_haveli.mp3",      "duration": 90,  "desc": "Act II: ominous strings pad, D minor",           "spec": {"type": "strings_pad",    "root": 293.66}},
    {"id": "bgm_act3_cipher",    "file": "bgm/act3_cipher.mp3",      "duration": 90,  "desc": "Act III: dry mechanical ticks + tremolo bass",    "spec": {"type": "mechanical",     "tick_rate": 2.5, "bass_freq": 65.4}},
    {"id": "bgm_act4_blueprint", "file": "bgm/act4_blueprint.mp3",   "duration": 90,  "desc": "Act IV: rising tension pad, distant wind",       "spec": {"type": "rising_tension", "start_freq": 80, "end_freq": 160}},
    {"id": "bgm_climax",         "file": "bgm/climax.mp3",           "duration": 30,  "desc": "Climax: emotional swell, resolve",               "spec": {"type": "swell",          "root": 440}},
]

# ── Fish Audio TTS ───────────────────────────────────────────────────────────

def generate_dialogue(line: dict, dry_run: bool = False) -> bool:
    out_path = AUDIO_OUT / line["file"]

    if out_path.exists():
        print(f"  [SKIP] {line['file']} already exists ({out_path.stat().st_size:,} bytes)")
        return True

    voice_id = VOICE_IDS.get(line["character"], "")
    if not voice_id:
        print(f"  [WARN] No voice ID for '{line['character']}', skipping.")
        return False

    print(f"  [GEN]  {line['id']} ({line['character']}) → {line['file']}")

    if dry_run:
        print(f"         [DRY RUN] voice={voice_id}")
        return True

    payload = {
        "text": line["tagged_text"],
        "reference_id": voice_id,
        "format": "mp3",
        "mp3_bitrate": 128,
        "normalize": True,
        "latency": "normal",
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "model": MODEL,
    }

    try:
        resp = requests.post(FISH_TTS_URL, json=payload, headers=headers, timeout=90)
        if resp.status_code == 200:
            out_path.write_bytes(resp.content)
            print(f"         Saved {len(resp.content):,} bytes → {out_path.name}")
            return True
        else:
            print(f"  [ERROR] {resp.status_code}: {resp.text[:400]}")
            return False
    except requests.RequestException as e:
        print(f"  [ERROR] {e}")
        return False

# ── Procedural BGM ───────────────────────────────────────────────────────────

SR = 22050  # sample rate for BGM

def _sine(freq, t, amp=1.0):
    return amp * np.sin(2 * np.pi * freq * t)

def _reverb(sig, decay=0.45):
    delay = int(SR * 0.035)
    out = sig.copy()
    for d in [delay, delay * 2, delay * 3]:
        if d < len(out):
            out[d:] += sig[:-d] * (decay ** (d / delay))
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.85
    return out.astype(np.float32)

def _fade(sig, fi_s=2.0, fo_s=4.0):
    s = sig.copy()
    fi = min(int(SR * fi_s), len(s) // 4)
    fo = min(int(SR * fo_s), len(s) // 4)
    s[:fi] *= np.linspace(0, 1, fi)
    s[-fo:] *= np.linspace(1, 0, fo)
    return s

def _save(sig, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    peak = np.max(np.abs(sig)) or 1.0
    i16 = (sig / peak * 0.9 * 32767).astype(np.int16)
    wav = out_path.with_suffix(".wav")
    with wave.open(str(wav), "w") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
        wf.writeframes(i16.tobytes())

    # try ffmpeg WAV→MP3
    import subprocess
    try:
        r = subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "128k", str(out_path)],
            capture_output=True, timeout=30
        )
        wav.unlink(missing_ok=True)
        if r.returncode == 0:
            return out_path
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # fallback: keep WAV
    final = out_path.with_suffix(".wav")
    wav.rename(final)
    print(f"         (ffmpeg not found — saved as WAV: {final.name})")
    return final


def gen_drone(spec, dur):
    t = np.linspace(0, dur, dur * SR, endpoint=False)
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * spec.get("lfo_rate", 0.2) * t)
    sig = np.zeros(len(t))
    for f in spec.get("freqs", [55, 82.5]):
        sig += _sine(f, t, 0.1) * lfo
    sig += np.random.normal(0, 0.007, len(t))
    return _reverb(sig, 0.6)

def gen_tense_pulse(spec, dur):
    t = np.linspace(0, dur, dur * SR, endpoint=False)
    env = np.maximum(0, np.sin(2 * np.pi * spec.get("pulse_freq", 1.2) * t)) ** 8
    sig = _sine(40, t, 0.18) * env
    sig += np.random.normal(0, spec.get("noise_level", 0.035), len(t))
    return _reverb(sig, 0.45)

def gen_strings_pad(spec, dur):
    t = np.linspace(0, dur, dur * SR, endpoint=False)
    root = spec.get("root", 293.66)
    ratios = [1, 9/8, 6/5, 4/3, 3/2]
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.08 * t)
    sig = np.zeros(len(t))
    for i, r in enumerate(ratios):
        f = root * r / 2
        a = 0.07 if i == 0 else 0.04
        sig += _sine(f * 1.002, t, a) * lfo + _sine(f * 0.998, t, a * 0.6)
    sig += _sine(root * 2, t, 0.018) * lfo
    return _reverb(sig, 0.8)

def gen_mechanical(spec, dur):
    t = np.linspace(0, dur, dur * SR, endpoint=False)
    bass = _sine(spec.get("bass_freq", 65.4), t, 0.15)
    trem = 0.5 + 0.5 * np.sin(2 * np.pi * 4.0 * t)
    sig = bass * trem
    tr = spec.get("tick_rate", 2.5)
    tick_len = int(SR * 0.012)
    for idx in np.arange(0, len(t), SR / tr).astype(int):
        end = min(idx + tick_len, len(t))
        env = np.linspace(1, 0, end - idx) ** 2
        sig[idx:end] += _sine(1800, t[idx:end] - t[idx], 0.055) * env
    return _reverb(sig, 0.4)

def gen_rising_tension(spec, dur):
    t = np.linspace(0, dur, dur * SR, endpoint=False)
    freqs = np.linspace(spec.get("start_freq", 80), spec.get("end_freq", 160), len(t))
    phase = np.cumsum(2 * np.pi * freqs / SR)
    sig = np.sin(phase) * 0.12
    noise = np.random.normal(0, 0.025, len(t))
    k = np.ones(int(SR * 0.008)) / int(SR * 0.008)
    sig += np.convolve(noise, k, mode="same")
    return _reverb(sig, 0.6)

def gen_swell(spec, dur):
    t = np.linspace(0, dur, dur * SR, endpoint=False)
    root = spec.get("root", 440)
    env = np.sin(np.pi * t / dur)
    sig = np.zeros(len(t))
    for f in [root / 2, root * 5 / 8, root * 3 / 4, root]:
        sig += _sine(f, t, 0.1) * env
    return _reverb(sig, 0.9)

GEN_FNS = {
    "drone": gen_drone, "tense_pulse": gen_tense_pulse,
    "strings_pad": gen_strings_pad, "mechanical": gen_mechanical,
    "rising_tension": gen_rising_tension, "swell": gen_swell,
}

def generate_bgm(track, dry_run=False):
    out_path = AUDIO_OUT / track["file"]
    print(f"  [BGM]  {track['id']} → {track['file']}")
    print(f"         {track['desc']}")

    if out_path.exists() or out_path.with_suffix(".wav").exists():
        existing = out_path if out_path.exists() else out_path.with_suffix(".wav")
        print(f"         [SKIP] already exists ({existing.stat().st_size:,} bytes)")
        return True

    if dry_run:
        print(f"         [DRY RUN] {track['duration']}s procedural BGM")
        return True

    fn = GEN_FNS.get(track["spec"]["type"])
    if not fn:
        print(f"         [WARN] Unknown type: {track['spec']['type']}")
        return False

    try:
        sig = fn(track["spec"], track["duration"])
        sig = _fade(sig)
        saved = _save(sig, out_path)
        print(f"         Saved {saved.stat().st_size:,} bytes → {saved.name}")
        return True
    except Exception as e:
        print(f"         [ERROR] {e}")
        import traceback; traceback.print_exc()
        return False

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="HorrorFiles Audio Generator")
    parser.add_argument("--dialogue-only", action="store_true")
    parser.add_argument("--bgm-only",      action="store_true")
    parser.add_argument("--dry-run",       action="store_true")
    args = parser.parse_args()

    do_d = not args.bgm_only
    do_b = not args.dialogue_only

    print("=" * 60)
    print("HorrorFiles: Case 001 - Devgarh | Audio Generator")
    print("=" * 60)
    print(f"  Output:  {AUDIO_OUT}")
    print(f"  API Key: {'SET ✓' if API_KEY else 'MISSING ✗'}")
    print(f"  Dry run: {args.dry_run}")
    print()

    if not API_KEY and do_d and not args.dry_run:
        print("[ERROR] FISH_AUDIO_API_KEY not set. Use --bgm-only or --dry-run.")
        sys.exit(1)

    d_ok, b_ok = [], []

    if do_d:
        print("── Dialogue ────────────────────────────────────────────")
        for i, line in enumerate(DIALOGUE_LINES):
            print(f"\n[{i+1}/{len(DIALOGUE_LINES)}]")
            if generate_dialogue(line, args.dry_run):
                d_ok.append(line)
            if not args.dry_run and i < len(DIALOGUE_LINES) - 1:
                time.sleep(0.8)

    if do_b:
        print("\n── BGM ─────────────────────────────────────────────────")
        for i, track in enumerate(BGM_TRACKS):
            print(f"\n[{i+1}/{len(BGM_TRACKS)}]")
            if generate_bgm(track, args.dry_run):
                b_ok.append(track)

    print("\n" + "=" * 60)
    print(f"  Dialogue: {len(d_ok)}/{len(DIALOGUE_LINES)}")
    print(f"  BGM:      {len(b_ok)}/{len(BGM_TRACKS)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
