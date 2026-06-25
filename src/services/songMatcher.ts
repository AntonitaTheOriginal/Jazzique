import type { DetectedNote, SongMatch } from '../types';

interface MelodySong {
  title: string;
  artist?: string;
  // Relative intervals between consecutive notes (semitones)
  intervals: number[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToSemitone(note: string, octave: number): number {
  return NOTE_NAMES.indexOf(note) + octave * 12;
}

function getIntervals(notes: DetectedNote[]): number[] {
  const semitones = notes.map(n => noteToSemitone(n.note, n.octave));
  return semitones.slice(1).map((s, i) => s - semitones[i]);
}

// Melody database — relative intervals
export const MELODY_DATABASE: MelodySong[] = [
  { title: 'Twinkle Twinkle Little Star', intervals: [7, 2, -2, -2, -2, -3, 2, 2, -2, -2, -2] },
  { title: 'Happy Birthday', intervals: [2, -2, 5, -5, 7, 5, -7, 2, -2, 5, -5, 9, -9] },
  { title: 'Ode to Joy', intervals: [0, 2, 2, -2, -2, 2, 2, -4, 0, 2, 2, -2, -2, 2, -3] },
  { title: 'Jingle Bells', intervals: [0, 0, -3, 5, 0, 0, -3, 5, 0, 5, -5, -2, -1, -1, 0] },
  { title: 'Mary Had a Little Lamb', intervals: [-2, -2, 2, 2, -2, -2, -2, 0, -2, 2] },
  { title: 'Amazing Grace', intervals: [5, 3, -3, 2, -2, -2, -3, 5, 3, -3, 2, -2, 0] },
  { title: 'Fur Elise', intervals: [-1, 1, -1, 1, -1, 5, -3, 2, -5, 4, -4, 1] },
  { title: 'Smoke on the Water', intervals: [3, 2, -5, 3, 2, 1, -1, 3, 2, -3, -2] },
  { title: 'Seven Nation Army', intervals: [7, -2, -3, -2, -5, -3, 5, 7, -2, -3] },
  { title: 'Yesterday', intervals: [-2, 2, 3, -3, 2, 2, 2, 0, -2, -3, 1, -2] },
  { title: 'Let It Be', intervals: [2, 2, -2, -2, 5, -5, 2, 2, -2, 5, -3, -2] },
  { title: 'Canon in D', intervals: [2, -2, -2, 2, 2, 2, -2, -2, -2, 2, 2, 2] },
  { title: 'Greensleeves', intervals: [3, 2, 1, -3, -3, 1, -1, -2, 3, 2, 1, -3] },
  { title: 'Moonlight Sonata', intervals: [-4, 3, -3, 4, -4, 3, -3, 4, -4, 3, -3, 4] },
  { title: 'Oh When the Saints', intervals: [0, 2, 4, 5, 0, 2, 4, 5, 0, 2, 4, 5, -3, -3] },
];

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  const dotProduct = a.slice(0, len).reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.slice(0, len).reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.slice(0, len).reduce((s, v) => s + v * v, 0));
  return dotProduct / (magA * magB + 1e-10);
}

export function matchSong(notes: DetectedNote[]): SongMatch[] {
  if (notes.length < 4) return [];

  const userIntervals = getIntervals(notes);
  if (userIntervals.length < 3) return [];

  const matches = MELODY_DATABASE.map(song => {
    const sim = cosineSimilarity(userIntervals, song.intervals);
    const confidence = Math.round(Math.max(0, Math.min(99, sim * 80 + 10)));
    return { title: song.title, artist: song.artist, confidence };
  });

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 5).filter(m => m.confidence > 20);
}
