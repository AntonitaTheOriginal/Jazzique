import { motion } from 'framer-motion';
import type { Instrument } from '../../types';

interface InstrumentSelectorProps {
  selected: Instrument;
  onChange: (i: Instrument) => void;
}

const INSTRUMENTS: { id: Instrument; label: string; emoji: string; desc: string }[] = [
  { id: 'voice', label: 'Voice', emoji: '🎤', desc: 'Vocal / Hum' },
  { id: 'violin', label: 'Violin', emoji: '🎻', desc: 'Fretless bow' },
  { id: 'piano', label: 'Piano', emoji: '🎹', desc: 'Keys display' },
  { id: 'guitar', label: 'Guitar', emoji: '🎸', desc: 'Fret shapes' },
  { id: 'flute', label: 'Flute', emoji: '🎵', desc: 'Woodwind pitch' },
  { id: 'ukulele', label: 'Ukulele', emoji: '🪕', desc: '4-string tabs' },
  { id: 'bass', label: 'Bass', emoji: '🎸', desc: 'Low frequency' },
  { id: 'saxophone', label: 'Saxophone', emoji: '🎷', desc: 'Reed harmonics' },
  { id: 'trumpet', label: 'Trumpet', emoji: '🎺', desc: 'Brass analysis' },
  { id: 'generic', label: 'Generic', emoji: '🎼', desc: 'Chromatics' },
];

export default function InstrumentSelector({ selected, onChange }: InstrumentSelectorProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="font-display text-base font-bold uppercase tracking-wider text-zinc-100">
            Studio DSP Engine
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Select an instrument to optimize frequency bandpass filters and visualizations.
          </p>
        </div>
      </div>

      {/* Horizontal Instrument Scrollable Rack */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth">
        {INSTRUMENTS.map((inst, i) => {
          const isSelected = selected === inst.id;
          return (
            <motion.button
              key={inst.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onChange(inst.id)}
              className="flex-shrink-0 flex items-center gap-3.5 px-5 py-4 rounded-xl transition-all duration-300 cursor-pointer text-left"
              style={{
                background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1.5px solid #C9A84C' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isSelected ? '0 0 20px rgba(201,168,76,0.18)' : 'none',
              }}
              whileHover={{ scale: 1.03, borderColor: isSelected ? '#C9A84C' : 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform"
                style={{ 
                  background: isSelected ? 'linear-gradient(135deg, #C9A84C, #9A7A2E)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <span className={isSelected ? 'scale-110' : ''}>{inst.emoji}</span>
              </div>
              <div className="flex flex-col pr-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isSelected ? '#C9A84C' : '#E8E0D0' }}>
                  {inst.label}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 whitespace-nowrap">{inst.desc}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
