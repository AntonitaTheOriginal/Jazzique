import { useEffect } from 'react';
import { motion } from 'framer-motion';
import InstrumentSelector from '../components/InstrumentSelector/InstrumentSelector';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import NoteDisplay from '../components/NoteDisplay/NoteDisplay';
import ChordAnalyzer from '../components/ChordAnalyzer/ChordAnalyzer';
import PianoVisualizer from '../components/PianoVisualizer/PianoVisualizer';
import FrequencyGraph from '../components/FrequencyGraph/FrequencyGraph';
import SheetMusic from '../components/SheetMusic/SheetMusic';
import ExportPanel from '../components/ExportPanel/ExportPanel';
import MusicInsightsPanel from '../components/ChordAnalyzer/MusicInsightsPanel';
import ViolinFingering from '../components/NoteDisplay/ViolinFingering';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { useChordDetection } from '../hooks/useChordDetection';
import { useTempoDetection } from '../hooks/useTempoDetection';
import { synthService } from '../services/synthService';
import type { Instrument } from '../types';

interface AnalyzePageProps {
  instrument: Instrument;
  onInstrumentChange: (i: Instrument) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AnalyzePage({ instrument, onInstrumentChange }: AnalyzePageProps) {
  const { notes, currentNote, freqData, isActive, start, stop, clearNotes } = usePitchDetection();
  const { key, chords, insights } = useChordDetection(notes);
  const tempo = useTempoDetection(notes);

  useEffect(() => {
    synthService.setInstrument(instrument);
  }, [instrument]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      {/* Instrument selector */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <InstrumentSelector selected={instrument} onChange={onInstrumentChange} />
      </motion.div>

      {/* Two-column: recorder + note display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
          <AudioRecorder
            onStreamReady={(input) => {
              clearNotes();
              start(input);
            }}
            onStreamStop={stop}
            onAudioReady={clearNotes}
          />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
          <NoteDisplay notes={notes} currentNote={currentNote} />
        </motion.div>
      </div>

      {/* Waveform */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
        <FrequencyGraph freqData={freqData} isActive={isActive} />
      </motion.div>

      {/* Piano */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
        <PianoVisualizer currentNote={currentNote} notes={notes} />
      </motion.div>

      {/* Chord / Key / Tempo analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.35 }}>
          <ChordAnalyzer chords={chords} keyResult={key} tempo={tempo} />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="space-y-6">
          <MusicInsightsPanel insights={insights} hasNotes={notes.length > 3} />
          {instrument === 'violin' && (
            <ViolinFingering currentNote={currentNote} />
          )}
        </motion.div>
      </div>

      {/* Sheet music */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.45 }}>
        <SheetMusic notes={notes} />
      </motion.div>

      {/* Export */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.5 }}>
        <ExportPanel
          notes={notes}
          instrument={instrument}
          keyResult={key}
          tempo={tempo}
          chords={chords}
          duration={notes.length > 0 ? notes[notes.length - 1].timestamp : 0}
        />
      </motion.div>
    </div>
  );
}
