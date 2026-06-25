import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchDetectionService } from '../services/pitchDetection';
import type { DetectedNote, Instrument } from '../types';

export function usePitchDetection() {
  const [notes, setNotes] = useState<DetectedNote[]>([]);
  const [currentNote, setCurrentNote] = useState<DetectedNote | null>(null);
  const [freqData, setFreqData] = useState<Float32Array | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [noiseFloor, setNoiseFloor] = useState(0.01);
  const serviceRef = useRef<PitchDetectionService | null>(null);

  const lastNoteRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);
  const noteHistoryRef = useRef<string[]>([]);
  const stableNoteRef = useRef<string>('');

  const start = useCallback(async (input: MediaStream | HTMLAudioElement, instrument: Instrument = 'generic') => {
    serviceRef.current = new PitchDetectionService();
    await serviceRef.current.initialize(input, instrument);

    serviceRef.current.start(
      (note) => {
        const noteKey = `${note.note}${note.octave}`;
        
        // Rolling buffer of the last 5 detected frames
        const history = [...noteHistoryRef.current, noteKey].slice(-5);
        noteHistoryRef.current = history;

        // Compute frequency of each note in the history window
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let mostFrequent = '';
        for (const k of history) {
          counts[k] = (counts[k] || 0) + 1;
          if (counts[k] > maxCount) {
            maxCount = counts[k];
            mostFrequent = k;
          }
        }

        // Only transition to a new note if it persists for at least 3 out of 5 frames
        if (maxCount >= 3 && mostFrequent !== stableNoteRef.current) {
          stableNoteRef.current = mostFrequent;
          setCurrentNote(note);

          const now = note.timestamp;
          if (mostFrequent !== lastNoteRef.current || now - lastTimeRef.current > 0.3) {
            lastNoteRef.current = mostFrequent;
            lastTimeRef.current = now;
            setNotes(prev => [...prev.slice(-99), note]);
          }
        }
      },
      (data) => setFreqData(new Float32Array(data))
    );
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    serviceRef.current?.stop();
    serviceRef.current = null;
    setIsActive(false);
    setCurrentNote(null);
    noteHistoryRef.current = [];
    stableNoteRef.current = '';
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
    lastNoteRef.current = '';
    noteHistoryRef.current = [];
    stableNoteRef.current = '';
  }, []);

  const calibrate = useCallback(() => {
    if (!serviceRef.current) return;
    setIsCalibrating(true);
    serviceRef.current.startCalibration((floor) => {
      setNoiseFloor(floor);
      setIsCalibrating(false);
    });
  }, []);

  const setInstrument = useCallback((instrument: Instrument) => {
    serviceRef.current?.setInstrumentFilter(instrument);
  }, []);

  const triggerNote = useCallback((note: DetectedNote) => {
    setCurrentNote(note);
    const noteKey = `${note.note}${note.octave}`;
    if (noteKey !== lastNoteRef.current || note.timestamp - lastTimeRef.current > 0.3) {
      lastNoteRef.current = noteKey;
      lastTimeRef.current = note.timestamp;
      setNotes(prev => [...prev.slice(-99), note]);
    }
  }, []);

  useEffect(() => () => { serviceRef.current?.stop(); }, []);

  return {
    notes,
    currentNote,
    freqData,
    isActive,
    isCalibrating,
    noiseFloor,
    start,
    stop,
    clearNotes,
    calibrate,
    setInstrument,
    triggerNote
  };
}
