import type { DetectedNote, ChordMatch, KeyResult } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chord templates: intervals from root
const CHORD_TEMPLATES: Record<string, number[]> = {
  'Major': [0, 4, 7],
  'Minor': [0, 3, 7],
  'Dominant 7': [0, 4, 7, 10],
  'Major 7': [0, 4, 7, 11],
  'Minor 7': [0, 3, 7, 10],
  'Dominant 9': [0, 4, 7, 10, 14],
  'Major 9': [0, 4, 7, 11, 14],
  'Minor 9': [0, 3, 7, 10, 14],
  'Diminished': [0, 3, 6],
  'Diminished 7': [0, 3, 6, 9],
  'Half-Diminished 7': [0, 3, 6, 10],
  'Augmented': [0, 4, 8],
  'Sus2': [0, 2, 7],
  'Sus4': [0, 5, 7],
  'Add9': [0, 4, 7, 14],
};

// Key profiles (Krumhansl-Schmuckler)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function noteToIndex(note: string): number {
  return NOTE_NAMES.indexOf(note);
}

function correlate(profile: number[], chroma: number[]): number {
  const n = profile.length;
  const meanP = profile.reduce((a, b) => a + b, 0) / n;
  const meanC = chroma.reduce((a, b) => a + b, 0) / n;
  let num = 0, denP = 0, denC = 0;
  for (let i = 0; i < n; i++) {
    num += (profile[i] - meanP) * (chroma[i] - meanC);
    denP += (profile[i] - meanP) ** 2;
    denC += (chroma[i] - meanC) ** 2;
  }
  return num / Math.sqrt(denP * denC + 1e-10);
}

export function detectKey(notes: DetectedNote[]): KeyResult {
  if (notes.length === 0) return { key: 'C', mode: 'major', confidence: 50 };

  // Build chroma vector
  const chroma = new Array(12).fill(0);
  notes.forEach(n => {
    const idx = noteToIndex(n.note);
    if (idx >= 0) chroma[idx] += n.confidence / 100;
  });

  let bestKey = 'C', bestMode: 'major' | 'minor' = 'major', bestCorr = -Infinity;

  for (let i = 0; i < 12; i++) {
    const rotated = [...chroma.slice(i), ...chroma.slice(0, i)];
    const majCorr = correlate(MAJOR_PROFILE, rotated);
    const minCorr = correlate(MINOR_PROFILE, rotated);
    if (majCorr > bestCorr) { bestCorr = majCorr; bestKey = NOTE_NAMES[i]; bestMode = 'major'; }
    if (minCorr > bestCorr) { bestCorr = minCorr; bestKey = NOTE_NAMES[i]; bestMode = 'minor'; }
  }

  return {
    key: bestKey,
    mode: bestMode,
    confidence: Math.round(Math.min(99, Math.max(40, bestCorr * 100 + 50))),
  };
}

export function detectChords(notes: DetectedNote[]): ChordMatch[] {
  if (notes.length < 3) return [];

  const noteSet = new Set(notes.map(n => n.note));
  const matches: ChordMatch[] = [];

  for (let root = 0; root < 12; root++) {
    for (const [chordName, intervals] of Object.entries(CHORD_TEMPLATES)) {
      const chordNotes = intervals.map(i => NOTE_NAMES[(root + i) % 12]);
      const matchCount = chordNotes.filter(n => noteSet.has(n)).length;
      const confidence = Math.round((matchCount / chordNotes.length) * 100);

      if (confidence >= 60) {
        const suffix = chordName === 'Major' ? '' : chordName === 'Minor' ? 'm' : ` ${chordName}`;
        matches.push({
          name: `${NOTE_NAMES[root]}${suffix}`,
          notes: chordNotes,
          confidence,
        });
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

export function getRomanNumerals(chords: ChordMatch[], keyResult: KeyResult): string[] {
  const rootIndex = NOTE_NAMES.indexOf(keyResult.key);
  if (rootIndex === -1) return [];

  const MAJOR_NUMERALS = ['I', 'bII', 'ii', 'bIII', 'iii', 'IV', '#IV', 'V', 'bVI', 'vi', 'bVII', 'vii°'];
  const MINOR_NUMERALS = ['i', 'bII', 'ii°', 'III', 'iv', 'v', 'VI', 'vii°', 'VII', 'bVIII', 'vII', 'vii'];

  return chords.map(c => {
    let root = '';
    const isMinor = c.name.includes('m') && !c.name.includes('Maj');
    const isDim = c.name.includes('dim') || c.name.includes('°') || c.name.includes('m7b5');
    
    if (c.name[1] === '#' || c.name[1] === 'b') {
      root = c.name.slice(0, 2);
    } else {
      root = c.name.slice(0, 1);
    }

    const cRootIdx = NOTE_NAMES.indexOf(root);
    if (cRootIdx === -1) return c.name;

    const interval = (cRootIdx - rootIndex + 12) % 12;
    let numeral = keyResult.mode === 'major' ? MAJOR_NUMERALS[interval] : MINOR_NUMERALS[interval];

    if (isMinor) numeral = numeral.toLowerCase();
    if (isDim) numeral += '°';

    return numeral;
  });
}

export function getMusicInsights(_notes: DetectedNote[], key: KeyResult) {
  const keyName = `${key.key} ${key.mode === 'major' ? 'Major' : 'Minor'}`;
  const rootIndex = NOTE_NAMES.indexOf(key.key);

  const progressions: Record<string, string[]> = {
    'C major': ['C', 'G', 'Am', 'F'],
    'G major': ['G', 'D', 'Em', 'C'],
    'D major': ['D', 'A', 'Bm', 'G'],
    'A major': ['A', 'E', 'F#m', 'D'],
    'F major': ['F', 'C', 'Dm', 'Bb'],
    'Bb major': ['Bb', 'F', 'Gm', 'Eb'],
  };
  const prog = progressions[`${key.key} ${key.mode}`] || [key.key, 'IV', 'V', 'vi'];

  const scaleSuggestions: string[] = [];
  if (rootIndex !== -1) {
    if (key.mode === 'major') {
      scaleSuggestions.push(`${key.key} Ionian (Major Scale)`);
      scaleSuggestions.push(`${NOTE_NAMES[(rootIndex + 9) % 12]} Aeolian (Natural Minor)`);
      scaleSuggestions.push(`${NOTE_NAMES[(rootIndex + 2) % 12]} Dorian (good for ii-V-I progressions)`);
      scaleSuggestions.push(`${NOTE_NAMES[(rootIndex + 7) % 12]} Mixolydian (for dominant chords)`);
    } else {
      scaleSuggestions.push(`${key.key} Aeolian (Natural Minor)`);
      scaleSuggestions.push(`${key.key} Harmonic Minor (for classical or jazz fusion)`);
      scaleSuggestions.push(`${NOTE_NAMES[(rootIndex + 3) % 12]} Ionian (Relative Major)`);
    }
  }

  return {
    scale: keyName,
    key: keyName,
    progression: prog,
    scaleSuggestions,
    practiceTips: [
      `Practice the ${keyName} scale slowly with a metronome.`,
      `Focus on smooth transitions between ${prog[0]} and ${prog[1]}.`,
      `Try playing the ${prog.join(' → ')} chord progression.`,
      `Record yourself and listen back for timing inconsistencies.`,
    ],
    improvTips: [
      `Use the ${keyName} pentatonic scale for a smooth, reliable sound.`,
      `Try adding chromatic passing tones between scale degrees.`,
      `Experiment with the ${key.mode === 'major' ? 'relative minor' : 'relative major'} for contrast.`,
      `Play with rhythmic variation — the same notes, different rhythm.`,
    ],
  };
}
