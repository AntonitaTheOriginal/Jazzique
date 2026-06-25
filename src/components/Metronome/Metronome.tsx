import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [beat, setBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0.0); // When the next note is due
  const current16thBeatRef = useRef(0); // 0-15
  const lookahead = 25.0; // How frequently to call scheduler (in ms)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in s)

  const bpmRef = useRef(bpm);
  const mutedRef = useRef(muted);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playClick = (time: number, beatIndex: number) => {
    if (!audioCtxRef.current || mutedRef.current) return;

    // Create oscillator and gain node
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    // Accent beat 1 (every 4 beats)
    const isAccent = beatIndex % 4 === 0;
    osc.frequency.setValueAtTime(isAccent ? 1000 : 600, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.1);
  };

  const scheduler = () => {
    if (!audioCtxRef.current) return;

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + scheduleAheadTime) {
      const beatIndex = current16thBeatRef.current;
      
      // We only click on quarter notes (every 4 sixteenth notes)
      if (beatIndex % 4 === 0) {
        const quarterBeatNum = Math.floor(beatIndex / 4);
        
        // Schedule audio click
        playClick(nextNoteTimeRef.current, quarterBeatNum);

        // Update visual state at exact playback time
        const absoluteTime = nextNoteTimeRef.current;
        const delay = (absoluteTime - audioCtxRef.current.currentTime) * 1000;
        
        setTimeout(() => {
          setBeat((quarterBeatNum % 4) + 1);
        }, Math.max(0, delay));
      }

      // Advance to next 16th note
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += 0.25 * secondsPerBeat; // Add 1/4 of beat (16th note)
      current16thBeatRef.current = (current16thBeatRef.current + 1) % 16;
    }

    timerIdRef.current = window.setTimeout(scheduler, lookahead);
  };

  const startStop = () => {
    if (isPlaying) {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
      setIsPlaying(false);
      setBeat(0);
    } else {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
      current16thBeatRef.current = 0;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current);
    };
  }, []);

  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex-1 mr-4">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-display text-sm font-semibold" style={{ color: '#E8E0D0' }}>
            Metronome
          </h3>
          <span className="font-mono text-xs font-semibold text-gold-light">{bpm} BPM</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C9A84C]"
          />
        </div>
      </div>

      {/* Visual Beats Indicator */}
      <div className="flex items-center gap-1.5 mr-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-all duration-75"
            style={{
              backgroundColor: beat === i ? '#C9A84C' : 'rgba(255,255,255,0.06)',
              boxShadow: beat === i ? '0 0 6px #C9A84C' : 'none',
            }}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMuted(!muted)}
          className="p-2 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.03)', color: muted ? '#EF4444' : '#8A8880' }}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          onClick={startStop}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          style={{
            background: isPlaying ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #C9A84C, #9A7A2E)',
            color: isPlaying ? '#EF4444' : '#050507',
            border: isPlaying ? '1px solid rgba(239,68,68,0.3)' : 'none',
          }}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          {isPlaying ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
}
