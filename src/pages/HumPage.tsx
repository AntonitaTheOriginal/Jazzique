import { motion, AnimatePresence } from 'framer-motion';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import SongMatcher from '../components/NoteDisplay/SongMatcher';
import NoteDisplay from '../components/NoteDisplay/NoteDisplay';
import FrequencyGraph from '../components/FrequencyGraph/FrequencyGraph';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { Mic } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function HumPage() {
  const { notes, currentNote, freqData, isActive, start, stop, clearNotes } = usePitchDetection();

  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <p className="card-label mb-1">Song Recognition</p>
        <h1 className="page-title">Melodic Hum Matcher</h1>
        <p className="mt-2 text-sm" style={{ color: '#6A6458', maxWidth: '520px' }}>
          Hum, sing, or whistle a tune. Jazzique's acoustic correlation engine resolves the melody and identifies song candidates.
        </p>

        {/* Suggestion pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {['Twinkle Twinkle', 'Happy Birthday', 'Ode to Joy', 'Für Elise', 'Mary Had a Little Lamb'].map(s => (
            <span key={s} className="note-pill text-xs">{s}</span>
          ))}
          <span className="note-pill text-xs" style={{ borderStyle: 'dashed', color: '#5A5450', background: 'transparent' }}>+10 more</span>
        </div>
      </motion.div>

      {/* ── Main 2-column Layout ──────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
        className="hum-grid"
      >
        {/* ── LEFT: Recording Area ──────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Idle state: onboarding prompt inside a card */}
          <AnimatePresence mode="wait">
            {notes.length === 0 && !isActive ? (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card flex flex-col items-center justify-center text-center relative overflow-hidden"
                style={{ minHeight: '200px' }}
              >
                {/* Ambient glow */}
                <div
                  className="absolute w-48 h-48 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', filter: 'blur(30px)' }}
                />
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
                >
                  <Mic size={22} style={{ color: '#C9A84C' }} className="animate-pulse" />
                </div>
                <h3 className="relative z-10 text-base font-semibold mb-1" style={{ color: '#E8E0D0' }}>
                  Hum Any Melody
                </h3>
                <p className="relative z-10 text-xs leading-relaxed max-w-[260px]" style={{ color: '#6A6458' }}>
                  Start the recorder below, then hum or sing a few bars. Jazzique will match it to known songs.
                </p>
              </motion.div>
            ) : (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Note monitor visible when active */}
                <NoteDisplay notes={notes} currentNote={currentNote} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recorder — always visible */}
          <AudioRecorder
            onStreamReady={(input) => { clearNotes(); start(input); }}
            onStreamStop={stop}
            onAudioReady={clearNotes}
          />

          {/* Waveform — only when active */}
          {freqData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FrequencyGraph freqData={freqData} isActive={isActive} />
            </motion.div>
          )}
        </div>

        {/* ── RIGHT: Song Matches ───────────────────────── */}
        <div>
          <SongMatcher notes={notes} />
        </div>
      </motion.div>

    </div>
  );
}
