import { motion } from 'framer-motion';
import type { Instrument } from '../../types';

interface InstrumentSelectorProps {
  selected: Instrument;
  onChange: (i: Instrument) => void;
}

const INSTRUMENTS: { id: Instrument; label: string; emoji: string; desc: string }[] = [
  { id: 'voice', label: 'Voice', emoji: '🎤', desc: 'Singing & humming' },
  { id: 'violin', label: 'Violin', emoji: '🎻', desc: 'With fingering tips' },
  { id: 'piano', label: 'Piano', emoji: '🎹', desc: 'Key visualization' },
  { id: 'guitar', label: 'Guitar', emoji: '🎸', desc: 'Chord shapes' },
  { id: 'flute', label: 'Flute', emoji: '🎵', desc: 'Breath control' },
  { id: 'ukulele', label: 'Ukulele', emoji: '🪕', desc: '4-string chords' },
  { id: 'bass', label: 'Bass', emoji: '🎸', desc: 'Low frequency' },
  { id: 'saxophone', label: 'Saxophone', emoji: '🎷', desc: 'Jazz & blues' },
  { id: 'trumpet', label: 'Trumpet', emoji: '🎺', desc: 'Brass analysis' },
  { id: 'generic', label: 'Generic', emoji: '🎼', desc: 'Any instrument' },
];

export default function InstrumentSelector({ selected, onChange }: InstrumentSelectorProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold mb-1" style={{ color: '#E8E0D0' }}>
        Select Your Instrument
      </h3>
      <p className="text-sm mb-5" style={{ color: '#6A6458' }}>
        Optimizes detection and provides instrument-specific suggestions
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {INSTRUMENTS.map((inst, i) => {
          const isSelected = selected === inst.id;
          return (
            <motion.button
              key={inst.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onChange(inst.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-left transition-all duration-200"
              style={{
                background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 0 20px rgba(201,168,76,0.15)' : 'none',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-2xl">{inst.emoji}</span>
              <div>
                <div className="text-sm font-medium text-center" style={{ color: isSelected ? '#C9A84C' : '#C0B090' }}>
                  {inst.label}
                </div>
                <div className="text-xs text-center mt-0.5" style={{ color: '#6A6458' }}>{inst.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
