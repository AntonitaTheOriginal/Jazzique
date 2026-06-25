import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Sliders, ChevronRight } from 'lucide-react';
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

  const chartHeight = 110;
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-100">
            Acoustic Song Matcher
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">Contour matching engine</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {notes.length < 4 ? (
          <div className="text-center py-8 rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2.5 mx-auto">
              <Music size={16} />
            </div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-400">Hum any melody</h4>
            <p className="text-[10px] text-zinc-600 mt-1 max-w-[260px] mx-auto leading-relaxed">
              Hum or sing at least 4 notes of a melody to check candidate matches in our canonical song database.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 rounded-2xl bg-zinc-950/20 border border-zinc-800 text-xs text-zinc-500">
            No candidate song matched this exact interval sequence. Try a classic theme!
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-3">Database Match Candidate list</span>
              <div className="grid grid-cols-1 gap-2.5">
                {matches.map((match, i) => (
                  <motion.div
                    key={match.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3.5 rounded-xl transition-all border"
                    style={{
                      background: i === 0 ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: i === 0 ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-black font-mono"
                        style={{
                          background: i === 0 ? 'linear-gradient(135deg, #C9A84C, #9A7A2E)' : 'rgba(255,255,255,0.04)',
                          borderColor: i === 0 ? '#C9A84C' : 'rgba(255,255,255,0.05)',
                          color: i === 0 ? '#000' : '#8A8880'
                        }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: i === 0 ? '#C9A84C' : '#E8E0D0' }}>
                          {match.title}
                        </div>
                        {match.artist && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">{match.artist}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="text-xs font-bold font-mono" style={{ color: i === 0 ? '#C9A84C' : '#8A8880' }}>
                          {match.confidence}% match
                        </div>
                        <div className="w-14 h-1 bg-zinc-900 rounded-full overflow-hidden mt-1">
                          <div className="h-full rounded-full" style={{ width: `${match.confidence}%`, background: i === 0 ? '#C9A84C' : '#4A4840' }} />
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-zinc-600" />
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
                className="p-4 rounded-xl border border-white/5 bg-zinc-950/40"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <Sliders size={12} className="text-gold" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    Contour Deviation Graph: {topMatch.title}
                  </span>
                </div>

                <div className="overflow-x-auto py-1">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[300px] overflow-visible">
                    <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                    {targetPath && (
                      <path d={targetPath} fill="none" stroke="rgba(201,168,76,0.3)" strokeDasharray="4 4" strokeWidth="1.5" />
                    )}
                    {userPath && (
                      <path d={userPath} fill="none" stroke="#C9A84C" strokeWidth="2.5" />
                    )}
                    {targetIntervals.map((val, idx) => {
                      const x = (idx / (targetIntervals.length - 1 || 1)) * (chartWidth - 60) + 30;
                      const y = mapY(val);
                      return <circle key={`t-${idx}`} cx={x} cy={y} r="2.5" fill="rgba(201,168,76,0.4)" />;
                    })}
                    {userIntervals.map((val, idx) => {
                      const x = (idx / (userIntervals.length - 1 || 1)) * (chartWidth - 60) + 30;
                      const y = mapY(val);
                      return (
                        <g key={`u-${idx}`}>
                          <circle cx={x} cy={y} r="3.5" fill="#C9A84C" stroke="#000" strokeWidth="1.5" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
