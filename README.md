# 🎵 Jazzique — Turn Any Melody Into Music

A production-ready web app for musicians: record, analyze, visualize, and transform melodies into notes, chords, sheet music, and MIDI.

## Features

- 🎙️ **Live Recording** — Start/pause/resume/stop with waveform visualization
- 📁 **File Upload** — MP3, WAV, M4A support
- 🎸 **10 Instruments** — Voice, Violin, Piano, Guitar, Flute, Ukulele, Bass, Saxophone, Trumpet, Generic
- 🎵 **Real-time Pitch Detection** — Pitchy (McLeod Pitch Method) via Web Audio API
- 🎹 **Piano Visualizer** — 2-octave keyboard with animated key lighting
- 📊 **Waveform Analyzer** — Canvas API live frequency visualization
- 🔑 **Key Detection** — Krumhansl-Schmuckler profile correlation
- 🥁 **BPM Detection** — Tempo estimation with animated pulse
- 🎼 **Chord Suggestions** — 9 chord types, confidence-ranked
- 📜 **Sheet Music** — VexFlow treble clef notation, SVG download
- 💾 **MIDI Export** — Custom binary MIDI encoder (.mid download)
- 🎻 **Violin Mode** — String + finger position suggestions
- 🎯 **Practice Mode** — Real-time accuracy feedback + streaks
- 🎤 **Hum a Song** — Interval matching against 15-song melody database
- 💡 **Music Insights** — Scale, chord progression, practice + improv tips
- 🕐 **Session History** — localStorage-persisted past analyses

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173. Grant microphone access when prompted.

## Production Build

```bash
npm run build
npm run preview
```

## Requirements

- Node.js 18+
- Chrome, Firefox, or Safari (Web Audio API)

## Extending the Song Database

Add entries in `src/services/songMatcher.ts`:
```ts
{ title: 'My Song', intervals: [2, -2, 5, 3, ...] }
// intervals = semitone differences between consecutive notes
```
