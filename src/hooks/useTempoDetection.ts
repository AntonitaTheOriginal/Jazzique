import { useMemo } from 'react';
import type { DetectedNote, TempoResult } from '../types';

export function useTempoDetection(notes: DetectedNote[]): TempoResult {
  return useMemo(() => {
    if (notes.length < 4) return { bpm: 0, confidence: 0 };

    const timestamps = notes.map(n => n.timestamp);
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      const diff = timestamps[i] - timestamps[i - 1];
      if (diff > 0.1 && diff < 2.0) intervals.push(diff);
    }

    if (intervals.length < 2) return { bpm: 0, confidence: 0 };

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60 / avgInterval);

    // Confidence based on variance
    const variance = intervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.round(Math.max(0, Math.min(99, (1 - stdDev / avgInterval) * 100)));

    const clampedBpm = Math.max(40, Math.min(240, bpm));
    return { bpm: clampedBpm, confidence };
  }, [notes]);
}
