import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { synthService } from '../../services/synthService';
import type { ChordMatch, KeyResult, TempoResult } from '../../types';
import { getRomanNumerals } from '../../services/chordDetection';
import ChordVoicing from './ChordVoicing';

interface ChordAnalyzerProps {
  chords: ChordMatch[];
  keyResult: KeyResult;
  tempo: TempoResult;
  instrument: string;
}

export default function ChordAnalyzer({ chords, keyResult, tempo, instrument }: ChordAnalyzerProps) {
  const [selectedChordName, setSelectedChordName] = useState<string | null>(null);

  useEffect(() => {
    if (chords.length > 0) {
      // Auto-select first chord if current selection is invalid
      if (!selectedChordName || !chords.some(c => c.name === selectedChordName)) {
        setSelectedChordName(chords[0].name);
      }
    } else {
      setSelectedChordName(null);
    }
  }, [chords, selectedChordName]);

  const playChord = async (notes: string[]) => {
    if (!notes || notes.length === 0) return;
    await synthService.init();
    notes.forEach((noteName) => {
      const noteWithOctave = /\d$/.test(noteName) ? noteName : `${noteName}4`;
      synthService.playNoteWithDuration(noteWithOctave, 0.7);
    });
  };

  const romanNumerals = getRomanNumerals(chords, keyResult);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 space-y-6">
        {/* Key */}
        <div>
          <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#E8E0D0' }}>
            Key Signature
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div>
              <div className="font-display text-3xl font-bold text-gold-gradient">
                {keyResult.key} {keyResult.mode === 'major' ? 'Major' : 'Minor'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#6A6458' }}>
                {keyResult.mode === 'major' ? 'Ionian mode' : 'Aeolian mode'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs mb-1" style={{ color: '#6A6458' }}>Confidence</div>
              <div className="font-mono text-2xl" style={{ color: '#C9A84C' }}>{keyResult.confidence}%</div>
              <div className="mt-1 h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${keyResult.confidence}%`, background: 'linear-gradient(90deg, #C9A84C, #E8C870)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tempo */}
        <div>
          <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#E8E0D0' }}>
            Tempo
          </h3>
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="relative flex-shrink-0">
              <motion.div
                animate={tempo.bpm > 0 ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                } : { scale: 1, opacity: 0.3 }}
                transition={tempo.bpm > 0 ? {
                  duration: 60 / tempo.bpm,
                  repeat: Infinity,
                  ease: 'easeInOut',
                } : {}}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.15)', border: '2px solid rgba(201,168,76,0.3)' }}
              >
                <span style={{ color: '#C9A84C', fontSize: '20px' }}>♩</span>
              </motion.div>
            </div>
            <div className="flex-1">
              <div className="font-display text-3xl font-bold text-gold-gradient">
                {tempo.bpm > 0 ? `${tempo.bpm} BPM` : '— BPM'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#6A6458' }}>
                {tempo.bpm > 0 ? getBpmLabel(tempo.bpm) : 'Not enough data'}
              </div>
            </div>
            {tempo.bpm > 0 && (
              <div className="text-right">
                <div className="font-mono text-sm" style={{ color: '#6A6458' }}>{tempo.confidence}% conf.</div>
              </div>
            )}
          </div>
        </div>

        {/* Chords */}
        <div>
          <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#E8E0D0' }}>
            Detected Chords & Roman Analysis
          </h3>
          {chords.length === 0 ? (
            <div className="text-center py-6 text-sm rounded-xl" style={{ background: 'rgba(0,0,0,0.2)', color: '#4A4840' }}>
              Chords will appear as you play more notes
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {chords.map((chord, i) => {
                const numeral = romanNumerals[i];
                const isSelected = selectedChordName === chord.name;

                return (
                  <motion.button
                    key={chord.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setSelectedChordName(chord.name);
                      playChord(chord.notes);
                    }}
                    className="p-3 rounded-xl text-left cursor-pointer hover:bg-white/5 transition-all group flex flex-col justify-between"
                    style={{
                      background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(0,0,0,0.2)',
                      border: isSelected ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-baseline gap-2">
                        <div className="font-display font-bold text-base" style={{ color: isSelected ? '#C9A84C' : '#C0B090' }}>
                          {chord.name}
                        </div>
                        {numeral && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-white/5" style={{ color: '#8A8880' }}>
                            {numeral}
                          </span>
                        )}
                      </div>
                      <Volume2 size={14} className="text-gold-light opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center justify-between mt-2 w-full">
                      <span className="text-xs font-mono" style={{ color: '#6A6458' }}>{chord.notes.join(' ')}</span>
                      <span className="text-xs font-mono" style={{ color: '#C9A84C' }}>{chord.confidence}%</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Voicing Diagram */}
      {selectedChordName && (
        <ChordVoicing chordName={selectedChordName} instrument={instrument} />
      )}
    </div>
  );
}

function getBpmLabel(bpm: number): string {
  if (bpm < 60) return 'Largo — very slow';
  if (bpm < 80) return 'Andante — walking pace';
  if (bpm < 100) return 'Moderato — moderate';
  if (bpm < 120) return 'Allegretto — moderately fast';
  if (bpm < 160) return 'Allegro — fast';
  if (bpm < 200) return 'Presto — very fast';
  return 'Prestissimo — extremely fast';
}
