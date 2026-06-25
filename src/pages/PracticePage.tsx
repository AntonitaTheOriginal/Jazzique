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

export default function PracticePage({ instrument }: PracticePageProps) {
  const { notes, currentNote, start, stop, clearNotes } = usePitchDetection();
  const [targetNote, setTargetNote] = useState<string | null>(null);

  useEffect(() => {
    synthService.setInstrument(instrument);
  }, [instrument]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h2 className="font-display text-4xl font-bold text-gold-gradient mb-3">Practice Mode</h2>
        <p className="text-base" style={{ color: '#6A6458' }}>
          Match the target note by singing, humming, or playing your instrument
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AudioRecorder
          onStreamReady={(input) => {
            clearNotes();
            start(input);
          }}
          onStreamStop={stop}
          onAudioReady={clearNotes}
        />
        <PracticeMode currentNote={currentNote} onTargetNoteChange={setTargetNote} />
      </div>

      <PianoVisualizer currentNote={currentNote} notes={notes} targetNote={targetNote} />

      <NoteDisplay notes={notes} currentNote={currentNote} />
    </div>
  );
}
