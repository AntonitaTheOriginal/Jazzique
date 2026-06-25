import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Activity } from 'lucide-react';
import { synthService } from '../../services/synthService';
import type { DetectedNote } from '../../types';

interface NoteDisplayProps {
  notes: DetectedNote[];
  currentNote: DetectedNote | null;
}

const NOTE_COLORS: Record<string, string> = {
  C: '#C9A84C', 'C#': '#E8C870', D: '#38bdf8', 'D#': '#0284c7',
  E: '#60a5fa', F: '#c084fc', 'F#': '#a855f7', G: '#fb923c',
  'G#': '#f59e0b', A: '#34d399', 'A#': '#10b981', B: '#f472b6',
};

function getPitchRating(cents: number | undefined): { label: string; color: string } {
  if (cents === undefined) return { label: 'In Tune', color: '#10B981' };
  const abs = Math.abs(cents);
  if (abs <= 5) return { label: 'Perfect', color: '#10B981' }; // Emerald Green
  if (abs <= 15) return cents > 0 ? { label: 'Slightly Sharp', color: '#f59e0b' } : { label: 'Slightly Flat', color: '#f59e0b' }; // Orange
  return cents > 0 ? { label: 'Too Sharp', color: '#ef4444' } : { label: 'Too Flat', color: '#ef4444' }; // Red
}

export default function NoteDisplay({ notes, currentNote }: NoteDisplayProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(-1);

  useEffect(() => {
    if (listRef.current && !isPlaying) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notes, isPlaying]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  const playNext = (index: number) => {
    if (index >= sortedNotes.length) {
      setIsPlaying(false);
      setPlaybackIndex(-1);
      return;
    }

    setPlaybackIndex(index);
    const note = sortedNotes[index];
    const nextNote = sortedNotes[index + 1];
    const duration = note.duration || (nextNote ? Math.max(0.1, nextNote.timestamp - note.timestamp) : 0.3);
    synthService.playNoteWithDuration(`${note.note}${note.octave}`, duration);

    const delay = nextNote ? (nextNote.timestamp - note.timestamp) * 1000 : 500;
    timeoutRef.current = setTimeout(() => playNext(index + 1), delay);
  };

  const handlePlayPause = async () => {
    if (sortedNotes.length === 0) return;
    if (isPlaying) {
      setIsPlaying(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      synthService.releaseAll();
    } else {
      setIsPlaying(true);
      await synthService.init();
      const startIdx = playbackIndex === -1 || playbackIndex >= sortedNotes.length ? 0 : playbackIndex;
      playNext(startIdx);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setPlaybackIndex(-1);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    synthService.releaseAll();
  };

  const playSingleNote = async (note: DetectedNote) => {
    await synthService.init();
    synthService.playNoteWithDuration(`${note.note}${note.octave}`, 0.35);
  };

  // Render Horizontal Timeline strip
  const timelineNotes = notes.slice(-5);

  return (
    <div className="glass-card p-6 flex flex-col justify-between" style={{ minHeight: '360px' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-100">
            Detected Note Monitor
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">Real-Time Pitch Tracker</p>
        </div>
        
        {/* Playback Controls */}
        {notes.length > 0 && (
          <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-white/5">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-lg transition-colors cursor-pointer text-zinc-400 hover:text-gold"
              title={isPlaying ? "Pause Playback" : "Play Sequence"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={handleStop}
              disabled={playbackIndex === -1}
              className="p-2 rounded-lg transition-colors cursor-pointer text-zinc-400 hover:text-red-500 disabled:opacity-20 disabled:cursor-not-allowed"
              title="Stop Playback"
            >
              <Square size={14} />
            </button>
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        // Premium Empty / Onboarding State
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gold mb-3 animate-pulse">
            <Activity size={20} />
          </div>
          <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-300">Start playing or singing</h4>
          <p className="text-[11px] text-zinc-500 mt-2 max-w-[240px] leading-relaxed">
            Jazzique is listening. Turn on your microphone to analyze:
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3 max-w-[280px]">
            {['✓ Pitch', '✓ Key signature', '✓ Chords', '✓ BPM'].map(item => (
              <span key={item} className="text-[9px] uppercase tracking-wider font-semibold font-mono bg-zinc-950/60 px-2 py-0.5 rounded text-zinc-400 border border-white/5">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          {/* Main Grid View */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column 1: Current Note Detail */}
            <div className="bg-zinc-950/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[140px]">
              <AnimatePresence mode="wait">
                {currentNote ? (
                  <motion.div
                    key={`${currentNote.note}${currentNote.octave}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="text-center"
                  >
                    <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Current note</span>
                    <div className="font-display font-black text-6xl text-gold-gradient leading-none mt-1">
                      {currentNote.note}
                      <span className="text-3xl font-light font-sans align-super opacity-60 ml-0.5">{currentNote.octave}</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center text-zinc-600 font-display text-4xl font-black">—</div>
                )}
              </AnimatePresence>
            </div>

            {/* Column 2: DSP Stats List */}
            <div className="bg-zinc-950/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center space-y-2.5">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Detected Frequency</span>
                <span className="text-sm font-bold font-mono text-zinc-300">
                  {currentNote ? `${currentNote.frequency.toFixed(2)} Hz` : '-- Hz'}
                </span>
              </div>
              
              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Confidence</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-1.5 bg-zinc-900 rounded-full flex-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-cyan-500 rounded-full"
                      animate={{ width: currentNote ? `${currentNote.confidence}%` : '0%' }}
                      transition={{ duration: 0.15 }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {currentNote ? `${currentNote.confidence}%` : '0%'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Intonation rating</span>
                {currentNote ? (
                  (() => {
                    const rating = getPitchRating(currentNote.cents);
                    return (
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border block w-max mt-0.5"
                        style={{ background: rating.color + '12', borderColor: rating.color + '30', color: rating.color }}>
                        {rating.label}
                      </span>
                    );
                  })()
                ) : (
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-600">No Signal</span>
                )}
              </div>
            </div>
          </div>

          {/* Animated Horizontal Timeline Strip */}
          <div className="bg-zinc-950/50 p-3.5 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-2">Animated Timeline</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <AnimatePresence>
                {timelineNotes.map((note, idx) => (
                  <div key={`${note.timestamp}-${idx}`} className="flex items-center gap-2 flex-shrink-0">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => playSingleNote(note)}
                      className="px-3 py-1.5 rounded-xl border font-mono text-xs font-black cursor-pointer shadow-sm transition-all hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderColor: 'rgba(201,168,76,0.15)',
                        color: NOTE_COLORS[note.note] || '#C9A84C',
                      }}
                    >
                      {note.note}{note.octave}
                    </motion.button>
                    {idx < timelineNotes.length - 1 && (
                      <span className="text-zinc-700 font-bold text-sm">→</span>
                    )}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
