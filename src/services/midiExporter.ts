import type { DetectedNote } from '../types';
import { noteToMidi } from './pitchDetection';

function writeVariableLength(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  bytes.unshift(v & 0x7f);
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

export function exportMidi(notes: DetectedNote[], bpm = 120): Blob {
  const ticksPerBeat = 480;
  const tempo = Math.round(60000000 / bpm); // microseconds per beat

  const header = [
    0x4d, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // chunk length = 6
    0x00, 0x00, // format 0
    0x00, 0x01, // 1 track
    (ticksPerBeat >> 8) & 0xff, ticksPerBeat & 0xff, // ticks per beat
  ];

  const trackEvents: number[] = [];

  // Tempo event
  trackEvents.push(0x00, 0xff, 0x51, 0x03,
    (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff);

  // Sort notes by timestamp
  const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  let prevTick = 0;
  for (const n of sorted) {
    const midiNote = noteToMidi(n.note, n.octave);
    const startTick = Math.round(n.timestamp * ticksPerBeat * (bpm / 60));
    const durationTick = Math.round((n.duration || 0.5) * ticksPerBeat * (bpm / 60));

    // Note on
    const deltaOn = startTick - prevTick;
    trackEvents.push(...writeVariableLength(Math.max(0, deltaOn)));
    trackEvents.push(0x90, midiNote & 0x7f, Math.round(n.confidence * 1.27) & 0x7f);
    prevTick = startTick;

    // Note off
    trackEvents.push(...writeVariableLength(durationTick));
    trackEvents.push(0x80, midiNote & 0x7f, 0x00);
    prevTick = startTick + durationTick;
  }

  // End of track
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  const trackLength = trackEvents.length;
  const track = [
    0x4d, 0x54, 0x72, 0x6b, // MTrk
    (trackLength >> 24) & 0xff, (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff, trackLength & 0xff,
    ...trackEvents,
  ];

  const buffer = new Uint8Array([...header, ...track]);
  return new Blob([buffer], { type: 'audio/midi' });
}
