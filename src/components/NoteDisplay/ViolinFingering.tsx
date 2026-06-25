import { motion, AnimatePresence } from 'framer-motion';
import { getViolinFingering, getFingerName } from '../../utils/violinFingering';
import type { DetectedNote } from '../../types';

interface ViolinFingeringProps {
  currentNote: DetectedNote | null;
}

export default function ViolinFingering({ currentNote }: ViolinFingeringProps) {
  const fingering = currentNote ? getViolinFingering(currentNote.note, currentNote.octave) : null;
  const strings = ['E', 'A', 'D', 'G'] as const;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold mb-5" style={{ color: '#E8E0D0' }}>
        🎻 Violin Fingering
      </h3>

      <AnimatePresence mode="wait">
        {fingering ? (
          <motion.div
            key={`${fingering.string}-${fingering.finger}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div className="text-xs mb-1" style={{ color: '#6A6458' }}>String</div>
                <div className="font-display text-2xl font-bold text-gold-gradient">{fingering.string}</div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div className="text-xs mb-1" style={{ color: '#6A6458' }}>Finger</div>
                <div className="font-display text-2xl font-bold text-gold-gradient">{fingering.finger}</div>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <div className="text-xs mb-1" style={{ color: '#6A6458' }}>Position</div>
                <div className="text-sm font-medium" style={{ color: '#C9A84C' }}>{fingering.position}</div>
              </div>
            </div>

            <div className="text-sm" style={{ color: '#8A8078' }}>
              {getFingerName(fingering.finger)} on the {fingering.string} string, {fingering.position}
            </div>

            {/* Visual fretboard strings */}
            <div className="space-y-2 mt-3">
              {strings.map(str => (
                <div key={str} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-4 text-right" style={{ color: str === fingering.string ? '#C9A84C' : '#4A4840' }}>{str}</span>
                  <div className="flex-1 h-0.5 relative" style={{ background: str === fingering.string ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)' }}>
                    {str === fingering.string && (
                      <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ left: `${fingering.finger * 22}%`, background: '#C9A84C', color: '#050507', fontSize: '10px' }}>
                        {fingering.finger}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-6 text-sm" style={{ color: '#4A4840' }}>
            Play a note to see fingering suggestions
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
