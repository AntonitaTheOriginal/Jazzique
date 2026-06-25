import type { ViolinFingering } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard violin tuning: G3, D4, A4, E5
const VIOLIN_STRINGS: { string: 'G' | 'D' | 'A' | 'E'; openNote: string; openOctave: number }[] = [
  { string: 'G', openNote: 'G', openOctave: 3 },
  { string: 'D', openNote: 'D', openOctave: 4 },
  { string: 'A', openNote: 'A', openOctave: 4 },
  { string: 'E', openNote: 'E', openOctave: 5 },
];

function noteToSemitone(note: string, octave: number): number {
  return NOTE_NAMES.indexOf(note) + octave * 12;
}

export function getViolinFingering(note: string, octave: number): ViolinFingering | null {
  const targetSemitone = noteToSemitone(note, octave);

  for (const str of VIOLIN_STRINGS) {
    const openSemitone = noteToSemitone(str.openNote, str.openOctave);
    const diff = targetSemitone - openSemitone;

    if (diff >= 0 && diff <= 4) {
      const finger = diff as 0 | 1 | 2 | 3 | 4;
      return {
        string: str.string,
        finger,
        position: '1st Position',
      };
    } else if (diff > 4 && diff <= 8) {
      return {
        string: str.string,
        finger: (diff - 4) as 0 | 1 | 2 | 3 | 4,
        position: '2nd Position',
      };
    } else if (diff > 8 && diff <= 12) {
      return {
        string: str.string,
        finger: (diff - 8) as 0 | 1 | 2 | 3 | 4,
        position: '3rd Position',
      };
    }
  }
  return null;
}

export function getFingerName(finger: number): string {
  const names = ['Open String', '1st Finger', '2nd Finger', '3rd Finger', '4th Finger'];
  return names[finger] || 'Unknown';
}
