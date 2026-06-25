import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import PracticeMode from '../components/NoteDisplay/PracticeMode';
import NoteDisplay from '../components/NoteDisplay/NoteDisplay';
import PianoVisualizer from '../components/PianoVisualizer/PianoVisualizer';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { synthService } from '../services/synthService';
import type { Instrument } from '../types';

interface PracticePageProps {
  instrument: Instrument;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function PracticePage({ instrument }: PracticePageProps) {
  const { notes, currentNote, start, stop, clearNotes, setInstrument } = usePitchDetection();
  const [targetNote, setTargetNote] = useState<string | null>(null);

  useEffect(() => {
    synthService.setInstrument(instrument);
    setInstrument(instrument);
  }, [instrument, setInstrument]);

  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <p className="card-label mb-1">Interactive Training</p>
        <h1 className="page-title">Practice Academy</h1>
        <p className="mt-2 text-sm" style={{ color: '#6A6458', maxWidth: '480px' }}>
          Match target notes by singing, humming, or playing your instrument. The piano highlights every note you hit.
        </p>
      </motion.div>

      {/* ── Top Section: 3-column dashboard ─────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
        className="three-col-grid"
      >
        {/* Column 1: Recording */}
        <div>
          <AudioRecorder
            onStreamReady={(input) => { clearNotes(); start(input, instrument); }}
            onStreamStop={stop}
            onAudioReady={clearNotes}
          />
        </div>

        {/* Column 2: Lesson / Target Note Trainer */}
        <div>
          <PracticeMode currentNote={currentNote} onTargetNoteChange={setTargetNote} />
        </div>

        {/* Column 3: Live Note Monitor */}
        <div>
          <NoteDisplay notes={notes} currentNote={currentNote} />
        </div>
      </motion.div>

      {/* ── Full-width Interactive Piano ──────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
        style={{ marginTop: 'var(--section-gap)' }}
      >
        {/* Piano section label */}
        <div className="mb-4">
          <p className="card-label mb-0.5">Instrument</p>
          <h2 className="text-lg font-semibold" style={{ color: '#E8E0D0' }}>Interactive Piano Roll</h2>
        </div>
        <PianoVisualizer currentNote={currentNote} notes={notes} targetNote={targetNote} />
      </motion.div>

    </div>
  );
}
