import { motion, AnimatePresence } from 'framer-motion';
import AudioRecorder from '../components/AudioRecorder/AudioRecorder';
import SongMatcher from '../components/NoteDisplay/SongMatcher';
import NoteDisplay from '../components/NoteDisplay/NoteDisplay';
import FrequencyGraph from '../components/FrequencyGraph/FrequencyGraph';
import { usePitchDetection } from '../hooks/usePitchDetection';
import { Mic } from 'lucide-react';

export default function HumPage() {
  const { notes, currentNote, freqData, isActive, start, stop, clearNotes } = usePitchDetection();

  const isIdle = notes.length === 0 && !isActive;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <h2 className="font-display text-4xl font-black text-gold-gradient mb-2">Melodic Hum Matcher</h2>
        <p className="text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
          Hum, sing, or whistle a tune. Jazzique's acoustic correlation engine will resolve the melody.
        </p>

        {/* Suggestion tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {['Twinkle Twinkle', 'Happy Birthday', 'Ode to Joy', 'Fur Elise', 'Mary Had a Little Lamb'].map(s => (
            <span key={s} className="note-pill text-xs font-medium">{s}</span>
          ))}
          <span className="note-pill text-xs border-dashed text-zinc-600 bg-transparent border-zinc-800">+10 more</span>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isIdle ? (
          // Onboarding Stage: Focus on the microphone
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card max-w-xl mx-auto p-10 flex flex-col items-center justify-center text-center relative overflow-hidden"
            style={{ minHeight: '300px' }}
          >
            {/* Background glowing circle */}
            <div className="absolute w-44 h-44 rounded-full bg-gold/5 blur-3xl" />
            
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gold mb-6 relative z-10">
              <Mic size={24} className="animate-pulse" />
            </div>
            
            <h3 className="font-display text-xl font-bold text-zinc-200 relative z-10">Hum Any Melody</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-2 relative z-10 leading-relaxed">
              Launch the recorder below and hum a tune. Jazzique matches note intervals to identify song candidates.
            </p>

            <div className="w-full mt-8 relative z-10">
              <AudioRecorder
                onStreamReady={(input) => {
                  clearNotes();
                  start(input);
                }}
                onStreamStop={stop}
                onAudioReady={clearNotes}
              />
            </div>
          </motion.div>
        ) : (
          // Active Analysis Stage
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Studio Recorder */}
              <AudioRecorder
                onStreamReady={(input) => {
                  clearNotes();
                  start(input);
                }}
                onStreamStop={stop}
                onAudioReady={clearNotes}
              />

              {/* Note Monitor */}
              <NoteDisplay notes={notes} currentNote={currentNote} />
            </div>

            {/* Live Visualizer */}
            {freqData && (
              <FrequencyGraph freqData={freqData} isActive={isActive} />
            )}

            {/* Candidate Matches */}
            <SongMatcher notes={notes} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
