import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Upload, RotateCcw, Award, Flame, Star } from 'lucide-react';
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
  
  // HOLD timer states
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100%
  const [totalScore, setTotalScore] = useState(0);
  const lastActiveTimeRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetNote = songNotes[targetIdx] || 'C4';
  const targetNoteName = targetNote.slice(0, -1);
  const targetOctave = parseInt(targetNote.slice(-1)) || 4;

  // Determine user level based on score
  const getLevel = (score: number) => {
    if (score < 500) return 'Novice';
    if (score < 1500) return 'Intermediate';
    if (score < 3000) return 'Advanced';
    return 'Maestro';
  };

  useEffect(() => {
    onTargetNoteChange?.(targetNote);
    return () => onTargetNoteChange?.(null);
  }, [targetNote, onTargetNoteChange]);

  useEffect(() => {
    if (!currentNote) {
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
    const isMatched = acc >= 80;

    if (isMatched) {
      setFeedback('✓ Target Match! Hold tone...');
      
      setHoldProgress((prev) => {
        const next = prev + 12;
        if (next >= 100) {
          setStreak((s) => s + 1);
          setTotalScore((prevScore) => prevScore + acc);
          setFeedback('✓ Completed!');

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
        setFeedback('↓ Flat (pitch too high)');
      } else {
        setFeedback('↑ Sharp (pitch too low)');
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
          setFeedback('Lesson loaded!');
        } else {
          alert('Invalid format. JSON array of strings expected.');
        }
      } catch (err) {
        alert('Error parsing file');
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

  const accuracyColor = accuracy === null ? '#6A6458' : accuracy >= 80 ? '#10b981' : accuracy >= 55 ? '#f59e0b' : '#ef4444';

  return (
    <div className="glass-card p-6 flex flex-col justify-between" style={{ minHeight: '360px' }}>
      {/* Header & Gamified stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-100">
            Practice Academy
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">Lesson Trainer</p>
        </div>
        
        {/* Streak, Score, Level Badges */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20" title="Daily Streak">
            <Flame size={12} className="fill-current" />
            <span>{streak}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" title="Score">
            <Star size={12} className="fill-current" />
            <span>{totalScore}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" title="Level">
            <Award size={12} />
            <span>{getLevel(totalScore)}</span>
          </div>
        </div>
      </div>

      {/* Target Note Block */}
      <div className="relative text-center p-4 rounded-2xl bg-zinc-950/40 border border-white/5 overflow-hidden">
        {/* Tone hold timer bar */}
        <div 
          className="absolute bottom-0 left-0 h-1 transition-all duration-75"
          style={{ width: `${holdProgress}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C870)', boxShadow: '0 0 10px #C9A84C' }}
        />

        <span className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-1">Play reference target note</span>
        <div className="font-display font-black text-6xl text-gold-gradient flex items-center justify-center gap-3 leading-none">
          <span>{targetNoteName}</span>
          <button
            onClick={async () => {
              await synthService.init();
              synthService.playNote(targetNote);
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-gold-light hover:bg-zinc-800 transition-all cursor-pointer"
            title="Play Tone"
          >
            <Volume2 size={16} />
          </button>
        </div>
        <span className="text-[10px] font-mono text-zinc-600 block mt-2">
          Octave {targetOctave} · {Math.round(noteToFrequency(targetNoteName, targetOctave))} Hz
        </span>
      </div>

      {/* Accuracy strip */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold">
          <span className="text-zinc-500">Pitch Accuracy</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={feedback}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: accuracyColor }}
            >
              {feedback || 'Ready for note signal...'}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="h-2 rounded-full overflow-hidden bg-zinc-950/50">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${accuracy ?? 0}%` }}
            style={{ background: accuracyColor }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      {/* Progress track */}
      <div>
        <div className="flex gap-1.5">
          {songNotes.map((_note, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all"
              style={{
                background: i < targetIdx ? '#C9A84C' : i === targetIdx ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2 text-center">
          Note {targetIdx + 1} of {songNotes.length}
        </div>
      </div>

      {/* Control panel buttons */}
      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer bg-zinc-950/20"
          style={{ borderColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
        >
          <Upload size={13} />
          Load Lesson JSON
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />

        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl border flex items-center justify-center cursor-pointer bg-zinc-950/20"
          style={{ borderColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
          title="Reset Lesson"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
