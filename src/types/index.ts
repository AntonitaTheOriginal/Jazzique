export type Instrument =
  | 'voice'
  | 'violin'
  | 'piano'
  | 'guitar'
  | 'flute'
  | 'ukulele'
  | 'bass'
  | 'saxophone'
  | 'trumpet'
  | 'generic';

export interface DetectedNote {
  note: string;
  octave: number;
  frequency: number;
  confidence: number;
  timestamp: number;
  cents?: number;
  duration?: number;
}

export interface ChordMatch {
  name: string;
  notes: string[];
  confidence: number;
}

export interface KeyResult {
  key: string;
  mode: 'major' | 'minor';
  confidence: number;
}

export interface TempoResult {
  bpm: number;
  confidence: number;
}

export interface ViolinFingering {
  string: 'G' | 'D' | 'A' | 'E';
  finger: 0 | 1 | 2 | 3 | 4;
  position: string;
}

export interface SongMatch {
  title: string;
  artist?: string;
  confidence: number;
}

export interface Session {
  id: string;
  date: string;
  instrument: Instrument;
  notes: DetectedNote[];
  key?: KeyResult;
  bpm?: TempoResult;
  chords: ChordMatch[];
  duration: number;
}

export interface MusicInsight {
  scale: string;
  key: string;
  progression: string[];
  scaleSuggestions?: string[];
  practiceTips: string[];
  improvTips: string[];
}

export type AppMode = 'analyze' | 'practice' | 'hum';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
