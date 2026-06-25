import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Upload, RotateCcw } from 'lucide-react';
import { noteToFrequency } from '../../services/pitchDetection';
import { synthService } from '../../services/synthService';
import type { DetectedNote } from '../../types';

const DEFAULT_PRACTICE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

interface PracticeModeProps {
  currentNote: DetectedNote | null;
  onTargetNoteChange?: (note: string | null) => void;
}

export default function PracticeMode({ currentNote, onTargetNoteChange }: PracticeModeProps) {
  const [songNotes, setSongNotes] = useState<string[]>(DEFAULT_PRACTICE_NOTES);
  const [targetIdx, setTargetIdx] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('');
  
  // HOLD timer states (for timing and gating stability)
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [totalScore, setTotalScore] = useState(0);
  const lastActiveTimeRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetNote = songNotes[targetIdx] || 'C4';
  const targetNoteName = targetNote.slice(0, -1);
  const targetOctave = parseInt(targetNote.slice(-1)) || 4;

  // Notify parent of target note changes
  useEffect(() => {
    onTargetNoteChange?.(targetNote);
    return () => onTargetNoteChange?.(null);
  }, [targetNote, onTargetNoteChange]);

  useEffect(() => {
    if (!currentNote) {
      // Decay hold progress slowly if no note is detected
      const decay = setInterval(() => {
        setHoldProgress((p) => Math.max(0, p - 8));
      }, 100);
      return () => clearInterval(decay);
    }

    const targetFreq = noteToFrequency(targetNoteName, targetOctave);
    const detectedFreq = currentNote.frequency;
    const centsDiff = 1200 * Math.log2(detectedFreq / targetFreq);
    const acc = Math.max(0, Math.round(100 - Math.abs(centsDiff) / 2));

    setAccuracy(acc);

    const now = performance.now();
    const isMatched = acc >= 80; // 80% accuracy threshold

    if (isMatched) {
      setFeedback('✓ Perfect! Hold it...');
      
      // Accumulate hold duration
      setHoldProgress((prev) => {
        const next = prev + 12; // about 1 second of holding
        if (next >= 100) {
          // Note completed!
          setStreak((s) => s + 1);
          setTotalScore((prevScore) => prevScore + acc);
          setFeedback('✓ Completed!');

          // Move to next note
          setTimeout(() => {
            setTargetIdx((i) => (i + 1) % songNotes.length);
            setAccuracy(null);
            setHoldProgress(0);
            setFeedback('');
          }, 800);
          return 100;
        }
        return next;
      });
    } else {
      setHoldProgress((p) => Math.max(0, p - 6));
      if (centsDiff > 0) {
        setFeedback('↓ Too sharp');
      } else {
        setFeedback('↑ Too flat');
      }
    }
    lastActiveTimeRef.current = now;
  }, [currentNote, targetNote, songNotes]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.every((n) => typeof n === 'string')) {
          setSongNotes(parsed);
          setTargetIdx(0);
          setStreak(0);
          setTotalScore(0);
          setHoldProgress(0);
          setFeedback('Custom song loaded!');
        } else {
          alert('Invalid format. Please upload a JSON array of strings e.g. ["C4", "E4", "G4"]');
        }
      } catch (err) {
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setTargetIdx(0);
    setStreak(0);
    setTotalScore(0);
    setHoldProgress(0);
    setAccuracy(null);
    setFeedback('');
    setSongNotes(DEFAULT_PRACTICE_NOTES);
  };

  const accuracyColor = accuracy === null ? '#6A6458' : accuracy >= 80 ? '#34D399' : accuracy >= 55 ? '#FBBF24' : '#ef4444';

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
            🎯 Practice & Timing Trainer
          </h3>
          <p className="text-xs" style={{ color: '#6A6458' }}>
            Score: <span className="text-gold-light font-bold font-mono text-sm">{totalScore}</span> points
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
            🔥 {streak} Streak
          </span>
        </div>
      </div>

      {/* Target note */}
      <div className="text-center p-6 rounded-xl relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)' }}>
        {/* Hold progress bar background overlay */}
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-75"
          style={{ width: `${holdProgress}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C870)', boxShadow: '0 0 10px #C9A84C' }}
        />

        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6A6458' }}>Sing/play and hold this note</div>
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
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span style={{ color: '#6A6458' }}>Intonation Accuracy</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={feedback}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ color: accuracyColor }}
            >
              {feedback || 'Play the note to begin...'}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${accuracy ?? 0}%` }}
            style={{ background: `linear-gradient(90deg, ${accuracyColor}, ${accuracyColor}AA)` }}
            transition={{ duration: 0.15 }}
          />
        </div>

        <div className="text-center">
          <span className="font-mono text-2xl font-bold" style={{ color: accuracyColor }}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </span>
        </div>
      </div>

      {/* Progress timeline */}
      <div>
        <div className="flex gap-1">
          {songNotes.map((_note, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full"
              style={{
                background: i < targetIdx ? '#C9A84C' : i === targetIdx ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.06)',
              }}
            />
          ))}
        </div>
        <div className="text-xs mt-2 text-center" style={{ color: '#4A4840' }}>
          Note {targetIdx + 1} of {songNotes.length}
        </div>
      </div>

      {/* Practice Tools Footer */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}
        >
          <Upload size={14} />
          Import JSON Song
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />

        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl border flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}
          title="Reset Lesson"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
