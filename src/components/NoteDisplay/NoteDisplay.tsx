import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Music } from 'lucide-react';
import { synthService } from '../../services/synthService';
import type { DetectedNote } from '../../types';

interface NoteDisplayProps {
  notes: DetectedNote[];
  currentNote: DetectedNote | null;
}

const NOTE_COLORS: Record<string, string> = {
  C: '#C9A84C', 'C#': '#E8C870', D: '#A8D8A8', 'D#': '#7FC8A0',
  E: '#7EC8E3', F: '#C084FC', 'F#': '#F87171', G: '#FB923C',
  'G#': '#FBBF24', A: '#34D399', 'A#': '#60A5FA', B: '#F472B6',
};

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

  // Clean up timeouts on unmount or when notes change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const uniqueNotes = Array.from(new Set(notes.map(n => n.note))).slice(-8);

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

    // Estimate duration based on next note's timestamp or fallback to 0.3s
    const duration = note.duration || (nextNote ? Math.max(0.1, nextNote.timestamp - note.timestamp) : 0.3);
    synthService.playNoteWithDuration(`${note.note}${note.octave}`, duration);

    const delay = nextNote ? (nextNote.timestamp - note.timestamp) * 1000 : 500;

    timeoutRef.current = setTimeout(() => {
      playNext(index + 1);
    }, delay);
  };

  const handlePlayPause = async () => {
    if (sortedNotes.length === 0) return;
    if (isPlaying) {
      setIsPlaying(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    synthService.releaseAll();
  };

  const playSingleNote = async (note: DetectedNote) => {
    await synthService.init();
    synthService.playNoteWithDuration(`${note.note}${note.octave}`, 0.35);
  };

  const progressPercent = sortedNotes.length > 0 && playbackIndex !== -1 
    ? ((playbackIndex + 1) / sortedNotes.length) * 100 
    : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
          Detected Notes
        </h3>
        
        {/* Playback Controls */}
        {notes.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-lg transition-colors duration-150 cursor-pointer flex items-center justify-center hover:bg-white/5"
              style={{ color: isPlaying ? '#E8E0D0' : '#C9A84C' }}
              title={isPlaying ? "Pause Playback" : "Play Detected Song"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={handleStop}
              disabled={playbackIndex === -1}
              className="p-2 rounded-lg transition-colors duration-150 cursor-pointer flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: '#ef4444' }}
              title="Stop Playback"
            >
              <Square size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Playback Progress Bar */}
      {notes.length > 0 && (playbackIndex !== -1 || isPlaying) && (
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full rounded-full transition-all duration-150" 
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C870)' }}
          />
        </div>
      )}

      {/* Current note — big display */}
      <div className="flex items-center justify-center mb-6">
        <AnimatePresence mode="wait">
          {currentNote ? (
            <motion.div
              key={`${currentNote.note}${currentNote.octave}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-center"
            >
              <div className="font-display font-black text-7xl" style={{ color: NOTE_COLORS[currentNote.note] || '#C9A84C' }}>
                {currentNote.note}
              </div>
              <div className="font-mono text-sm mt-1" style={{ color: '#6A6458' }}>
                {currentNote.octave} · {Math.round(currentNote.frequency)} Hz
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ width: '80px', background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${currentNote.confidence}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C870)' }} />
                </div>
                <span className="font-mono text-xs" style={{ color: '#9A9080' }}>{currentNote.confidence}%</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="font-display text-5xl font-black" style={{ color: '#2A2820' }}>—</div>
              <div className="text-xs mt-2" style={{ color: '#3A3830' }}>
                {isPlaying ? 'Playing song back…' : 'Listening for notes…'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unique notes bar */}
      {uniqueNotes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {uniqueNotes.map(note => (
            <motion.span
              key={note}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="note-pill"
              style={{ color: NOTE_COLORS[note] || '#C9A84C', borderColor: (NOTE_COLORS[note] || '#C9A84C') + '44' }}
            >
              {note}
            </motion.span>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div
        ref={listRef}
        className="overflow-y-auto space-y-1 pr-1"
        style={{ maxHeight: '200px' }}
      >
        {notes.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: '#3A3830' }}>
            No notes detected yet — start recording or upload audio
          </div>
        ) : (
          [...notes].reverse().slice(0, 30).map((note, i) => {
            const isCurrentlyPlaying = isPlaying && sortedNotes[playbackIndex]?.timestamp === note.timestamp;
            return (
              <motion.div
                key={`${note.timestamp}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => playSingleNote(note)}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group"
                style={{ 
                  background: isCurrentlyPlaying 
                    ? 'rgba(201,168,76,0.15)' 
                    : i === 0 && !isPlaying
                      ? 'rgba(201,168,76,0.08)' 
                      : 'transparent',
                  border: isCurrentlyPlaying ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs" style={{ color: isCurrentlyPlaying ? '#C9A84C' : '#4A4840', minWidth: '40px' }}>
                    {note.timestamp.toFixed(1)}s
                  </span>
                  <span className="font-mono font-bold text-sm" style={{ color: NOTE_COLORS[note.note] || '#C9A84C' }}>
                    {note.note}{note.octave}
                  </span>
                  <span className="text-xs" style={{ color: '#4A4840' }}>{Math.round(note.frequency)}Hz</span>
                  {isCurrentlyPlaying && (
                    <Music size={12} className="text-gold-light animate-bounce" />
                  )}
                </div>
                <span className="font-mono text-xs group-hover:text-gold-light transition-colors" style={{ color: '#4A4840' }}>
                  {isCurrentlyPlaying ? 'Playing' : `${note.confidence}%`}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
