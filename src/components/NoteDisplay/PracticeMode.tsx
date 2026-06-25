import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { noteToFrequency } from '../../services/pitchDetection';
import { synthService } from '../../services/synthService';
import type { DetectedNote } from '../../types';

const PRACTICE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

interface PracticeModeProps {
  currentNote: DetectedNote | null;
  onTargetNoteChange?: (note: string | null) => void;
}

export default function PracticeMode({ currentNote, onTargetNoteChange }: PracticeModeProps) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('');

  const targetNote = PRACTICE_NOTES[targetIdx];
  const targetNoteName = targetNote.slice(0, -1);
  const targetOctave = parseInt(targetNote.slice(-1));

  // Notify parent of target note changes
  useEffect(() => {
    onTargetNoteChange?.(targetNote);
    return () => onTargetNoteChange?.(null);
  }, [targetNote, onTargetNoteChange]);

  useEffect(() => {
    if (!currentNote) return;

    const targetFreq = noteToFrequency(targetNoteName, targetOctave);
    const detectedFreq = currentNote.frequency;
    const centsDiff = 1200 * Math.log2(detectedFreq / targetFreq);
    const acc = Math.max(0, Math.round(100 - Math.abs(centsDiff) / 2));

    setAccuracy(acc);

    if (acc >= 85) {
      setFeedback('✓ Perfect!');
      setStreak(s => s + 1);
      setTimeout(() => {
        setTargetIdx(i => (i + 1) % PRACTICE_NOTES.length);
        setAccuracy(null);
        setFeedback('');
      }, 1500);
    } else if (centsDiff > 0) {
      setFeedback('↓ Too sharp');
    } else {
      setFeedback('↑ Too flat');
    }
  }, [currentNote]);

  const accuracyColor = accuracy === null ? '#6A6458' : accuracy >= 85 ? '#34D399' : accuracy >= 60 ? '#FBBF24' : '#ef4444';

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
          🎯 Practice Mode
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono"
          style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
          🔥 {streak} streak
        </div>
      </div>

      {/* Target note */}
      <div className="text-center mb-6 p-6 rounded-xl relative" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6A6458' }}>Sing or play this note</div>
        <div className="font-display font-black text-7xl text-gold-gradient flex items-center justify-center gap-4">
          <span>{targetNoteName}</span>
          <button
            onClick={async () => {
              await synthService.init();
              synthService.playNote(targetNote);
            }}
            className="p-3 rounded-full hover:bg-white/10 transition-colors text-gold-light cursor-pointer"
            title="Hear Reference Note"
          >
            <Volume2 size={24} />
          </button>
        </div>
        <div className="text-sm mt-1 font-mono" style={{ color: '#6A6458' }}>
          Octave {targetOctave} · {Math.round(noteToFrequency(targetNoteName, targetOctave))} Hz
        </div>
      </div>

      {/* Accuracy meter */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: '#6A6458' }}>Accuracy</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={feedback}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: accuracyColor }}
            >
              {feedback || 'Waiting for note…'}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${accuracy ?? 0}%` }}
            style={{ background: `linear-gradient(90deg, ${accuracyColor}, ${accuracyColor}AA)` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="text-center mt-2">
          <span className="font-mono text-2xl font-bold" style={{ color: accuracyColor }}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {PRACTICE_NOTES.map((note, i) => (
          <div
            key={note}
            className="flex-1 h-1.5 rounded-full"
            style={{
              background: i < targetIdx ? '#C9A84C' : i === targetIdx ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
      <div className="text-xs mt-2 text-center" style={{ color: '#4A4840' }}>
        {targetIdx + 1} / {PRACTICE_NOTES.length}
      </div>
    </div>
  );
}
