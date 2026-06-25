import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { synthService } from '../../services/synthService';
import type { DetectedNote } from '../../types';

interface PianoVisualizerProps {
  currentNote: DetectedNote | null;
  notes: DetectedNote[];
  targetNote?: string | null;
}

// Two octaves: C3-B4
const OCTAVES = [3, 4];
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
        <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
          Piano Visualizer
        </h3>
        <span className="text-xs font-mono" style={{ color: '#6A6458' }}>
          Click keys or play using your keyboard [A-S-D-F...]
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="relative inline-flex" style={{ minWidth: '400px' }}>
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
                  >
                    <motion.div
                      animate={lit ? { scaleY: 1.03 } : { scaleY: 1 }}
                      transition={{ duration: 0.1 }}
                      onMouseDown={() => handleMouseDown(note, octave)}
                      onMouseUp={() => handleMouseUpOrLeave(note, octave)}
                      onMouseLeave={() => handleMouseUpOrLeave(note, octave)}
                      className="rounded-b-md cursor-pointer select-none flex flex-col items-center justify-end pb-2 relative"
                      style={{
                        width: '36px',
                        height: '140px',
                        background: lit
                          ? 'linear-gradient(180deg, #E8C870 0%, #C9A84C 100%)'
                          : active
                          ? 'rgba(201,168,76,0.4)'
                          : '#E8E0D0',
                        border: '1px solid rgba(0,0,0,0.2)',
                        boxShadow: lit ? '0 0 20px rgba(201,168,76,0.6)' : '2px 4px 8px rgba(0,0,0,0.3)',
                        transformOrigin: 'top',
                      }}
                    >
                      {target && (
                        <>
                          <div className="absolute top-2 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_10px_#ef4444] pointer-events-none" />
                          <div className="absolute top-2 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444] pointer-events-none" />
                        </>
                      )}
                      <span className="text-xs font-mono leading-none" style={{ color: lit ? '#050507' : '#6A6458', fontSize: '10px' }}>
                        {note}{octave}
                      </span>
                      {shortcut && (
                        <span className="font-mono leading-none mt-1" style={{ color: lit ? 'rgba(5,5,7,0.5)' : '#A09888', fontSize: '8px' }}>
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
                  if (!blackNote) return <div key={i} style={{ width: '36px' }} />;
                  const lit = `${blackNote}${octave}` === activeNote || isPlayed(blackNote, octave);
                  const active = isActive(blackNote, octave);
                  const shortcut = getShortcutKey(blackNote, octave);
                  const target = isTarget(blackNote, octave);
                  return (
                    <div key={i} className="relative" style={{ width: '36px' }}>
                      <motion.div
                        animate={lit ? { scaleY: 1.04 } : { scaleY: 1 }}
                        transition={{ duration: 0.1 }}
                        onMouseDown={() => handleMouseDown(blackNote, octave)}
                        onMouseUp={() => handleMouseUpOrLeave(blackNote, octave)}
                        onMouseLeave={() => handleMouseUpOrLeave(blackNote, octave)}
                        className="absolute rounded-b-sm pointer-events-auto cursor-pointer flex flex-col items-center pt-2 relative"
                        style={{
                          width: '22px',
                          height: '90px',
                          left: '22px',
                          top: 0,
                          background: lit
                            ? 'linear-gradient(180deg, #C9A84C, #9A7A2E)'
                            : active
                            ? '#4A4030'
                            : '#1A1814',
                          boxShadow: lit ? '0 0 15px rgba(201,168,76,0.7)' : '2px 4px 6px rgba(0,0,0,0.5)',
                          transformOrigin: 'top',
                        }}
                      >
                        {target && (
                          <>
                            <div className="absolute bottom-2 w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_#ef4444] pointer-events-none" />
                            <div className="absolute bottom-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444] pointer-events-none" />
                          </>
                        )}
                        {shortcut && (
                          <span className="font-mono text-center pointer-events-none" style={{ fontSize: '8px', color: lit ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)' }}>
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
          <span>Current / User note</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(201,168,76,0.3)' }} />
          <span>Recent notes</span>
        </div>
        {targetNote && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
            <span>Target Note (Practice)</span>
          </div>
        )}
      </div>
    </div>
  );
}
