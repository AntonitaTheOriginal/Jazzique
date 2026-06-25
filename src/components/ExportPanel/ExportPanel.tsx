import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileMusic, Save } from 'lucide-react';
import { exportMidi } from '../../services/midiExporter';
import type { DetectedNote, Instrument, KeyResult, TempoResult, ChordMatch } from '../../types';
import { saveSession } from '../../utils/sessionStorage';

interface ExportPanelProps {
  notes: DetectedNote[];
  instrument: Instrument;
  keyResult: KeyResult;
  tempo: TempoResult;
  chords: ChordMatch[];
  duration: number;
}

export default function ExportPanel({ notes, instrument, keyResult, tempo, chords, duration }: ExportPanelProps) {
  const [saved, setSaved] = useState(false);
  const [exported, setExported] = useState(false);

  const handleMidiExport = () => {
    if (notes.length === 0) return;
    const blob = exportMidi(notes, tempo.bpm || 120);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jazzique-melody.mid';
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleSaveSession = () => {
    if (notes.length === 0) return;
    saveSession({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      instrument,
      notes,
      key: keyResult,
      bpm: tempo,
      chords,
      duration,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const disabled = notes.length === 0;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold mb-5" style={{ color: '#E8E0D0' }}>
        Export & Save
      </h3>

      <div className="space-y-3">
        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          onClick={handleMidiExport}
          disabled={disabled}
          className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200"
          style={{
            background: disabled ? 'rgba(255,255,255,0.02)' : exported ? 'rgba(52,211,153,0.1)' : 'rgba(201,168,76,0.08)',
            border: disabled ? '1px solid rgba(255,255,255,0.06)' : exported ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(201,168,76,0.2)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-3">
            <FileMusic size={18} style={{ color: exported ? '#34D399' : '#C9A84C' }} />
            <div className="text-left">
              <div className="text-sm font-medium" style={{ color: exported ? '#34D399' : '#C0B090' }}>
                {exported ? 'MIDI Exported!' : 'Export MIDI'}
              </div>
              <div className="text-xs" style={{ color: '#6A6458' }}>{notes.length} notes → .mid file</div>
            </div>
          </div>
          <Download size={16} style={{ color: '#6A6458' }} />
        </motion.button>

        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          onClick={handleSaveSession}
          disabled={disabled}
          className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200"
          style={{
            background: disabled ? 'rgba(255,255,255,0.02)' : saved ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
            border: disabled ? '1px solid rgba(255,255,255,0.06)' : saved ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.08)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-3">
            <Save size={18} style={{ color: saved ? '#34D399' : '#9A9080' }} />
            <div className="text-left">
              <div className="text-sm font-medium" style={{ color: saved ? '#34D399' : '#C0B090' }}>
                {saved ? 'Session Saved!' : 'Save Session'}
              </div>
              <div className="text-xs" style={{ color: '#6A6458' }}>Save to local history</div>
            </div>
          </div>
        </motion.button>
      </div>

      {disabled && (
        <p className="text-xs mt-4 text-center" style={{ color: '#3A3830' }}>
          Record or upload audio to enable exports
        </p>
      )}
    </div>
  );
}
