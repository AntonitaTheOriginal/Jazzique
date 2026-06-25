import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Sliders } from 'lucide-react';
import { matchSong, MELODY_DATABASE } from '../../services/songMatcher';
import type { DetectedNote } from '../../types';

interface SongMatcherProps {
  notes: DetectedNote[];
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToSemitone(note: string, octave: number): number {
  return NOTE_NAMES.indexOf(note) + octave * 12;
}

function getIntervals(notes: DetectedNote[]): number[] {
  const semitones = notes.map(n => noteToSemitone(n.note, n.octave));
  return semitones.slice(1).map((s, i) => s - semitones[i]);
}

export default function SongMatcher({ notes }: SongMatcherProps) {
  const matches = useMemo(() => matchSong(notes), [notes]);

  // Comparative Interval Chart Data
  const userIntervals = useMemo(() => getIntervals(notes), [notes]);
  const topMatch = matches[0];
  const targetIntervals = useMemo(() => {
    if (!topMatch) return [];
    return MELODY_DATABASE.find(s => s.title === topMatch.title)?.intervals || [];
  }, [topMatch]);

  const maxVal = useMemo(() => {
    const vals = [...userIntervals, ...targetIntervals].map(Math.abs);
    return Math.max(8, ...vals);
  }, [userIntervals, targetIntervals]);

  const chartHeight = 120;
  const chartWidth = 500;

  const mapY = (val: number) => {
    return (chartHeight / 2) - (val / maxVal) * (chartHeight / 2 - 18);
  };

  const getPointsPath = (intervals: number[]) => {
    if (intervals.length === 0) return "";
    const len = intervals.length;
    return intervals.map((val, idx) => {
      const x = (idx / (len - 1 || 1)) * (chartWidth - 60) + 30;
      const y = mapY(val);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };

  const userPath = getPointsPath(userIntervals);
  const targetPath = getPointsPath(targetIntervals);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Music2 size={18} style={{ color: '#C9A84C' }} />
        <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
          Song Matcher
        </h3>
      </div>

      <p className="text-sm mb-5" style={{ color: '#6A6458' }}>
        Hum or sing a melody — we'll compare it against known songs
      </p>

      <AnimatePresence>
        {notes.length < 4 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.06)' }}>
            <div className="text-3xl mb-2">🎵</div>
            <div className="text-sm" style={{ color: '#4A4840' }}>Sing or hum at least 4 notes to match songs</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-6 text-sm" style={{ color: '#4A4840' }}>
            No strong matches found — try a well-known melody
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6A6458' }}>Possible Matches</div>
              <div className="space-y-3">
                {matches.map((match, i) => (
                  <motion.div
                    key={match.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center justify-between p-3 rounded-xl animate-shimmer"
                    style={{
                      background: i === 0 ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
                      border: i === 0 ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm" style={{ color: '#4A4840', minWidth: '20px' }}>{i + 1}.</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: i === 0 ? '#C0B090' : '#8A8078' }}>
                          {match.title}
                        </div>
                        {match.artist && (
                          <div className="text-xs" style={{ color: '#4A4840' }}>{match.artist}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm" style={{ color: i === 0 ? '#C9A84C' : '#6A6458' }}>
                        {match.confidence}%
                      </div>
                      <div className="w-16 h-1 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${match.confidence}%`, background: i === 0 ? '#C9A84C' : '#4A4840' }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Comparison Visualizer Panel */}
            {topMatch && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl border border-white/5 bg-black/20"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Sliders size={12} className="text-gold-light" />
                  <span className="text-xs font-semibold" style={{ color: '#E8E0D0' }}>
                    Melodic Contour Comparison: {topMatch.title}
                  </span>
                </div>

                <div className="overflow-x-auto py-2">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[320px] overflow-visible">
                    {/* Centered zero line */}
                    <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                    {/* Target Song Path */}
                    {targetPath && (
                      <path d={targetPath} fill="none" stroke="rgba(201,168,76,0.25)" strokeDasharray="4 4" strokeWidth="1.5" />
                    )}

                    {/* User Hummed Path */}
                    {userPath && (
                      <path d={userPath} fill="none" stroke="#C9A84C" strokeWidth="2.5" />
                    )}

                    {/* Target Key Points */}
                    {targetIntervals.map((val, idx) => {
                      const x = (idx / (targetIntervals.length - 1 || 1)) * (chartWidth - 60) + 30;
                      const y = mapY(val);
                      return (
                        <circle key={`t-pt-${idx}`} cx={x} cy={y} r="2.5" fill="rgba(201,168,76,0.3)" />
                      );
                    })}

                    {/* User Key Points + Labels */}
                    {userIntervals.map((val, idx) => {
                      const x = (idx / (userIntervals.length - 1 || 1)) * (chartWidth - 60) + 30;
                      const y = mapY(val);
                      return (
                        <g key={`u-pt-${idx}`}>
                          <circle cx={x} cy={y} r="4" fill="#C9A84C" stroke="#0A0A0F" strokeWidth="1.5" />
                          <text x={x} y={y - 8} textAnchor="middle" fill="#E8C870" className="text-[8px] font-mono leading-none">
                            {val > 0 ? `+${val}` : val}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: '#6A6458' }}>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-px border-t-2 border-solid border-[#C9A84C]" />
                    <span>Your hummed intervals (semitones)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-px border-t border-dashed border-white/30" />
                    <span>Canonical song intervals</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
