import { useEffect } from 'react';
import { motion } from 'framer-motion';
import InstrumentSelector from '../components/InstrumentSelector/InstrumentSelector';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import NoteDisplay from '../components/NoteDisplay/NoteDisplay';
import CentsMeter from '../components/NoteDisplay/CentsMeter';
import ChordAnalyzer from '../components/ChordAnalyzer/ChordAnalyzer';
import PianoVisualizer from '../components/PianoVisualizer/PianoVisualizer';
import FrequencyGraph from '../components/FrequencyGraph/FrequencyGraph';
import SheetMusic from '../components/SheetMusic/SheetMusic';
import ExportPanel from '../components/ExportPanel/ExportPanel';
import MusicInsightsPanel from '../components/ChordAnalyzer/MusicInsightsPanel';
import ViolinFingering from '../components/NoteDisplay/ViolinFingering';
import Metronome from '../components/Metronome/Metronome';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { useChordDetection } from '../hooks/useChordDetection';
import { useTempoDetection } from '../hooks/useTempoDetection';
import { useWebMidi } from '../hooks/useWebMidi';
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
  const {
    notes,
    currentNote,
    freqData,
    isActive,
    isCalibrating,
    noiseFloor,
    start,
    stop,
    clearNotes,
    calibrate,
    setInstrument,
    triggerNote,
  } = usePitchDetection();

  const { key, chords, insights } = useChordDetection(notes);
  const tempo = useTempoDetection(notes);

  // MIDI input support
  const { devices } = useWebMidi(
    (midiNote) => {
      triggerNote(midiNote);
    },
    () => {}
  );

  useEffect(() => {
    setInstrument(instrument);
  }, [instrument, setInstrument]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      {/* Instrument selector */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <InstrumentSelector selected={instrument} onChange={onInstrumentChange} />
      </motion.div>

      {/* Settings & Tools Panel */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.12 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Noise calibration */}
        <div className="glass-card p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-sm font-semibold" style={{ color: '#E8E0D0' }}>
                Ambient Noise Calibration
              </h3>
              {devices.length > 0 && (
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  MIDI connected ({devices.length})
                </span>
              )}
            </div>
            <p className="text-xs" style={{ color: '#8A8880' }}>
              Filter out background fan or room hum. Stay quiet for 1.5 seconds during calibration. Current threshold: <span className="font-mono text-gold-light">{noiseFloor.toFixed(3)}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={calibrate}
              disabled={isCalibrating || !isActive}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border w-full text-center"
              style={{
                background: isCalibrating ? 'rgba(201,168,76,0.05)' : 'rgba(201,168,76,0.15)',
                borderColor: isCalibrating ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.3)',
                color: '#C9A84C',
                opacity: isActive ? 1 : 0.4,
              }}
            >
              {isCalibrating ? 'Calibrating...' : 'Calibrate Mic'}
            </button>
          </div>
        </div>

        {/* Metronome component */}
        <Metronome />
      </motion.div>

      {/* Two-column: recorder + note display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
          <AudioRecorder
            onStreamReady={(input) => {
              clearNotes();
              start(input, instrument);
            }}
            onStreamStop={stop}
            onAudioReady={clearNotes}
          />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="space-y-6">
          <NoteDisplay notes={notes} currentNote={currentNote} />
          <CentsMeter cents={currentNote?.cents ?? 0} noteName={currentNote ? `${currentNote.note}${currentNote.octave}` : ''} frequency={currentNote?.frequency} />
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
          <ChordAnalyzer chords={chords} keyResult={key} tempo={tempo} instrument={instrument} />
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
        <SheetMusic notes={notes} instrument={instrument} />
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
