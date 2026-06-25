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
  hidden: { opacity: 0, y: 16 },
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

  const { devices } = useWebMidi(
    (midiNote) => { triggerNote(midiNote); },
    () => {}
  );

  useEffect(() => {
    setInstrument(instrument);
  }, [instrument, setInstrument]);

  return (
    <div className="page-container">

      {/* ── Page Header ──────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="card-label mb-1">AI-Powered</p>
            <h1 className="page-title">Studio Analyzer</h1>
            <p className="mt-2 text-sm" style={{ color: '#6A6458', maxWidth: '480px' }}>
              Record or upload audio to detect notes, chords, key signature, and tempo in real time.
            </p>
          </div>
          {devices.length > 0 && (
            <span className="self-center text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              {devices.length} MIDI device{devices.length > 1 ? 's' : ''} connected
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Instrument Selector ───────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="mb-6">
        <InstrumentSelector selected={instrument} onChange={onInstrumentChange} />
      </motion.div>

      {/* ── Main Studio Dashboard: 3 columns ─────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
        className="studio-grid"
      >
        {/* ────── LEFT COLUMN: Recording Controls ──────────── */}
        <div className="flex flex-col gap-6">
          {/* Microphone Recorder */}
          <AudioRecorder
            onStreamReady={(input) => { clearNotes(); start(input, instrument); }}
            onStreamStop={stop}
            onAudioReady={clearNotes}
          />

          {/* Noise Calibration */}
          <div className="glass-card">
            <p className="card-label mb-1">Noise Calibration</p>
            <p className="text-xs mb-3" style={{ color: '#8A8880', lineHeight: '1.5' }}>
              Stay quiet for 1.5 s to filter ambient noise.
              Threshold: <span className="font-mono" style={{ color: '#C9A84C' }}>{noiseFloor.toFixed(3)}</span>
            </p>
            <button
              onClick={calibrate}
              disabled={isCalibrating || !isActive}
              className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border text-center"
              style={{
                background: isCalibrating ? 'rgba(201,168,76,0.04)' : 'rgba(201,168,76,0.12)',
                borderColor: isCalibrating ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.28)',
                color: '#C9A84C',
                opacity: isActive ? 1 : 0.45,
              }}
            >
              {isCalibrating ? 'Calibrating...' : 'Calibrate Microphone'}
            </button>
          </div>

          {/* Metronome */}
          <Metronome />
        </div>

        {/* ────── CENTER COLUMN: Live Analysis ─────────────── */}
        <div className="flex flex-col gap-6">
          {/* Note Monitor */}
          <NoteDisplay notes={notes} currentNote={currentNote} />

          {/* Fine Tuner */}
          <CentsMeter
            cents={currentNote?.cents ?? 0}
            noteName={currentNote ? `${currentNote.note}${currentNote.octave}` : ''}
            frequency={currentNote?.frequency}
          />

          {/* Waveform */}
          <FrequencyGraph freqData={freqData} isActive={isActive} />
        </div>

        {/* ────── RIGHT COLUMN: Music Intelligence ─────────── */}
        <div className="flex flex-col gap-6">
          {/* Chord / Key / Tempo */}
          <ChordAnalyzer chords={chords} keyResult={key} tempo={tempo} instrument={instrument} />

          {/* AI Insights */}
          <MusicInsightsPanel insights={insights} hasNotes={notes.length > 3} />

          {/* Violin Fingering (conditional) */}
          {instrument === 'violin' && (
            <ViolinFingering currentNote={currentNote} />
          )}
        </div>
      </motion.div>

      {/* ── Full-width Piano Roll ─────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
        style={{ marginTop: 'var(--section-gap)' }}
      >
        <PianoVisualizer currentNote={currentNote} notes={notes} />
      </motion.div>

      {/* ── Sheet Music ───────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}
        style={{ marginTop: 'var(--card-gap)' }}
      >
        <SheetMusic notes={notes} instrument={instrument} />
      </motion.div>

      {/* ── Export Panel ──────────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}
        style={{ marginTop: 'var(--card-gap)' }}
      >
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
