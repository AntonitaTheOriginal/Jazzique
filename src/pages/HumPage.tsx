import { motion } from 'framer-motion';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import SongMatcher from '../components/NoteDisplay/SongMatcher';
import NoteDisplay from '../components/NoteDisplay/NoteDisplay';
import FrequencyGraph from '../components/FrequencyGraph/FrequencyGraph';
import { usePitchDetection } from '../hooks/usePitchDetection';

export default function HumPage() {
  const { notes, currentNote, freqData, isActive, start, stop } = usePitchDetection();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <h2 className="font-display text-4xl font-bold text-gold-gradient mb-3">Hum a Song</h2>
        <p className="text-base" style={{ color: '#6A6458' }}>
          Hum or sing a melody — we'll try to identify it from our song database
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {['Twinkle Twinkle', 'Happy Birthday', 'Ode to Joy', 'Fur Elise', 'Mary Had a Little Lamb'].map(s => (
            <span key={s} className="note-pill text-xs">{s}</span>
          ))}
          <span className="note-pill text-xs" style={{ color: '#6A6458', borderColor: 'rgba(255,255,255,0.08)' }}>+10 more</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AudioRecorder onStreamReady={start} onStreamStop={stop} />
        <NoteDisplay notes={notes} currentNote={currentNote} />
      </div>

      <FrequencyGraph freqData={freqData} isActive={isActive} />

      <SongMatcher notes={notes} />
    </div>
  );
}
