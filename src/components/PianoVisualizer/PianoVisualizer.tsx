import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { synthService } from '../../services/synthService';
import type { DetectedNote } from '../../types';

interface PianoVisualizerProps {
  currentNote: DetectedNote | null;
  notes: DetectedNote[];
  targetNote?: string | null;
}

// 7 Octaves from C1 to B7
const OCTAVES = [1, 2, 3, 4, 5, 6, 7];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS: Record<string, number> = { 'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 6 };

const KEY_MAP: Record<string, { note: string; octave: number }> = {
  // White keys (Octave 3)
  'a': { note: 'C', octave: 3 },
  's': { note: 'D', octave: 3 },
  'd': { note: 'E', octave: 3 },
  'f': { note: 'F', octave: 3 },
  'g': { note: 'G', octave: 3 },
  'h': { note: 'A', octave: 3 },
  'j': { note: 'B', octave: 3 },
  // White keys (Octave 4)
  'k': { note: 'C', octave: 4 },
  'l': { note: 'D', octave: 4 },
  ';': { note: 'E', octave: 4 },
  '\'': { note: 'F', octave: 4 },

  // Black keys (Octave 3)
  'w': { note: 'C#', octave: 3 },
  'e': { note: 'D#', octave: 3 },
  't': { note: 'F#', octave: 3 },
  'y': { note: 'G#', octave: 3 },
  'u': { note: 'A#', octave: 3 },
  // Black keys (Octave 4)
  'o': { note: 'C#', octave: 4 },
  'p': { note: 'D#', octave: 4 },
};

const getShortcutKey = (note: string, octave: number) => {
  const entry = Object.entries(KEY_MAP).find(
    ([, val]) => val.note === note && val.octave === octave
  );
  return entry ? entry[0].toUpperCase() : '';
};

export default function PianoVisualizer({ currentNote, notes, targetNote }: PianoVisualizerProps) {
  const [playedNotes, setPlayedNotes] = useState<Set<string>>(new Set());
  const recentNotes = new Set(notes.slice(-8).map(n => `${n.note}${n.octave}`));
  const activeNote = currentNote ? `${currentNote.note}${currentNote.octave}` : null;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isActive = (note: string, octave: number) => {
    const key = `${note}${octave}`;
    return key === activeNote || recentNotes.has(key) || playedNotes.has(key);
  };

  const isPlayed = (note: string, octave: number) => {
    return playedNotes.has(`${note}${octave}`);
  };

  const isTarget = (note: string, octave: number) => {
    return targetNote === `${note}${octave}`;
  };

  // Keyboard controls
  useEffect(() => {
    const activeKeys = new Set<string>();

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const noteInfo = KEY_MAP[key];
      if (noteInfo) {
        const noteName = `${noteInfo.note}${noteInfo.octave}`;
        activeKeys.add(noteName);
        setPlayedNotes(new Set(activeKeys));
        await synthService.init();
        synthService.playNote(noteName);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const noteInfo = KEY_MAP[key];
      if (noteInfo) {
        const noteName = `${noteInfo.note}${noteInfo.octave}`;
        activeKeys.delete(noteName);
        setPlayedNotes(new Set(activeKeys));
        synthService.releaseNote(noteName);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      activeKeys.forEach(noteName => synthService.releaseNote(noteName));
    };
  }, []);

  // Auto-scroll active/target note into view
  useEffect(() => {
    const scrollTarget = activeNote || targetNote;
    if (scrollTarget && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(`[data-note="${scrollTarget}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeNote, targetNote]);

  const handleMouseDown = async (note: string, octave: number) => {
    const noteName = `${note}${octave}`;
    setPlayedNotes(prev => {
      const next = new Set(prev);
      next.add(noteName);
      return next;
    });
    await synthService.init();
    synthService.playNote(noteName);
  };

  const handleMouseUpOrLeave = (note: string, octave: number) => {
    const noteName = `${note}${octave}`;
    setPlayedNotes(prev => {
      const next = new Set(prev);
      next.delete(noteName);
      return next;
    });
    synthService.releaseNote(noteName);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-100">
            Interactive Piano Roll
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Full 7-Octave Keyboard (C1 - B7) · Click keys or play using your keyboard [A-S-D-F...]
          </p>
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto pb-4 scroll-smooth">
        <div className="relative inline-flex" style={{ minWidth: '100%' }}>
          {OCTAVES.map(octave => (
            <div key={octave} className="relative flex">
              {/* White keys */}
              {WHITE_KEYS.map((note) => {
                const active = isActive(note, octave);
                const lit = `${note}${octave}` === activeNote || isPlayed(note, octave);
                const shortcut = getShortcutKey(note, octave);
                const target = isTarget(note, octave);
                return (
                  <div
                    key={`${note}${octave}`}
                    className="relative"
                    style={{ zIndex: 1 }}
                    data-note={`${note}${octave}`}
                  >
                    <motion.div
                      animate={lit ? { scaleY: 0.98, y: 2 } : { scaleY: 1, y: 0 }}
                      transition={{ duration: 0.08 }}
                      onMouseDown={() => handleMouseDown(note, octave)}
                      onMouseUp={() => handleMouseUpOrLeave(note, octave)}
                      onMouseLeave={() => handleMouseUpOrLeave(note, octave)}
                      className="rounded-b-md cursor-pointer select-none flex flex-col items-center justify-end pb-2.5 relative transition-all"
                      style={{
                        width: '32px',
                        height: '140px',
                        background: lit
                          ? 'linear-gradient(180deg, #E8C870 0%, #C9A84C 100%)'
                          : active
                          ? 'rgba(201,168,76,0.3)'
                          : '#FFFFFF',
                        borderLeft: '1px solid rgba(255,255,255,0.05)',
                        borderRight: '1px solid rgba(0,0,0,0.25)',
                        borderBottom: lit ? '1px solid rgba(0,0,0,0.1)' : '4px solid rgba(0,0,0,0.35)',
                        boxShadow: lit 
                          ? '0 6px 15px rgba(201,168,76,0.5), inset 0 3px 8px rgba(0,0,0,0.1)' 
                          : '0 4px 6px rgba(0,0,0,0.25), inset 0 -3px 4px rgba(0,0,0,0.06)',
                        transformOrigin: 'top',
                      }}
                    >
                      {target && (
                        <>
                          <div className="absolute top-2.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_#ef4444] pointer-events-none" />
                          <div className="absolute top-2.5 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444] pointer-events-none" />
                        </>
                      )}
                      <span className="text-[9px] font-mono font-bold leading-none" style={{ color: lit ? '#050507' : '#6A6458' }}>
                        {note}{octave}
                      </span>
                      {shortcut && (
                        <span className="font-mono leading-none mt-1 font-semibold" style={{ color: lit ? 'rgba(5,5,7,0.45)' : '#A09888', fontSize: '8px' }}>
                          [{shortcut}]
                        </span>
                      )}
                    </motion.div>
                  </div>
                );
              })}

              {/* Black keys overlay */}
              <div className="absolute top-0 left-0 flex pointer-events-none" style={{ zIndex: 2 }}>
                {WHITE_KEYS.map((_wk, i) => {
                  const blackNote = Object.entries(BLACK_KEYS).find(([, pos]) => pos === i + 1)?.[0];
                  if (!blackNote) return <div key={i} style={{ width: '32px' }} />;
                  const lit = `${blackNote}${octave}` === activeNote || isPlayed(blackNote, octave);
                  const active = isActive(blackNote, octave);
                  const shortcut = getShortcutKey(blackNote, octave);
                  const target = isTarget(blackNote, octave);
                  return (
                    <div key={i} className="relative" style={{ width: '32px' }} data-note={`${blackNote}${octave}`}>
                      <motion.div
                        animate={lit ? { scaleY: 0.98, y: 1 } : { scaleY: 1, y: 0 }}
                        transition={{ duration: 0.08 }}
                        onMouseDown={() => handleMouseDown(blackNote, octave)}
                        onMouseUp={() => handleMouseUpOrLeave(blackNote, octave)}
                        onMouseLeave={() => handleMouseUpOrLeave(blackNote, octave)}
                        className="absolute rounded-b pointer-events-auto cursor-pointer flex flex-col items-center pt-2 relative transition-all"
                        style={{
                          width: '18px',
                          height: '92px',
                          left: '23px',
                          top: 0,
                          background: lit
                            ? 'linear-gradient(180deg, #C9A84C, #9A7A2E)'
                            : active
                            ? '#3a3225'
                            : '#09090b',
                          borderBottom: lit ? '1px solid rgba(0,0,0,0.1)' : '3px solid rgba(0,0,0,0.6)',
                          boxShadow: lit 
                            ? '0 4px 10px rgba(201,168,76,0.6), inset 0 2px 4px rgba(0,0,0,0.2)' 
                            : '1px 3px 5px rgba(0,0,0,0.4), inset 0 -2px 3px rgba(255,255,255,0.05)',
                          transformOrigin: 'top',
                        }}
                      >
                        {target && (
                          <>
                            <div className="absolute bottom-2.5 w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_#ef4444] pointer-events-none" />
                            <div className="absolute bottom-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444] pointer-events-none" />
                          </>
                        )}
                        {shortcut && (
                          <span className="font-mono text-center pointer-events-none" style={{ fontSize: '8px', color: lit ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.45)' }}>
                            {shortcut}
                          </span>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: '#6A6458' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: '#C9A84C' }} />
          <span>Active Input Note</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(201,168,76,0.3)' }} />
          <span>Melodic History</span>
        </div>
        {targetNote && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
            <span>Target Lesson Note</span>
          </div>
        )}
      </div>
    </div>
  );
}
