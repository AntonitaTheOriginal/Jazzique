import { useMemo } from 'react';
import { detectChords, detectKey, getMusicInsights } from '../services/chordDetection';
import type { DetectedNote } from '../types';

export function useChordDetection(notes: DetectedNote[]) {
  const key = useMemo(() => detectKey(notes), [notes]);
  const chords = useMemo(() => detectChords(notes), [notes]);
  const insights = useMemo(() => getMusicInsights(notes, key), [notes, key]);

  return { key, chords, insights };
}
