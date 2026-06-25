import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Pause, Play, Upload, FileAudio, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onStreamReady: (input: MediaStream | HTMLAudioElement) => void;
  onStreamStop: () => void;
  onAudioReady?: (blob: Blob) => void;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioRecorder({ onStreamReady, onStreamStop, onAudioReady }: AudioRecorderProps) {
  const recorder = useAudioRecorder();
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // File analysis states
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPlayingFile, setIsPlayingFile] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileDuration, setFileDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Input VU level meter state
  const [vuLevel, setVuLevel] = useState(0);

  // Waveform visualization & VU meter calculation
  useEffect(() => {
    if (recorder.recordingState !== 'recording' || !recorder.stream) return;

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const src = ctx.createMediaStreamSource(recorder.stream);
    src.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cctx = canvas.getContext('2d')!;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(buf);

      // VU level estimation
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const value = (buf[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / buf.length);
      setVuLevel(Math.min(100, Math.round(rms * 400)));

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cctx.clearRect(0, 0, canvas.width, canvas.height);

      // Neon cyan waveform stroke
      cctx.beginPath();
      cctx.strokeStyle = '#06b6d4'; // Cyan accent
      cctx.lineWidth = 2.5;
      
      const sliceWidth = canvas.width / buf.length;
      let x = 0;

      for (let i = 0; i < buf.length; i++) {
        const v = buf[i] / 128;
        const y = (v * canvas.height) / 2;
        if (i === 0) cctx.moveTo(x, y);
        else cctx.lineTo(x, y);
        x += sliceWidth;
      }
      cctx.lineTo(canvas.width, canvas.height / 2);
      cctx.stroke();
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      ctx.close();
    };
  }, [recorder.recordingState, recorder.stream]);

  useEffect(() => {
    if (recorder.stream && recorder.recordingState === 'recording') {
      onStreamReady(recorder.stream);
    }
    if (recorder.recordingState === 'stopped' || recorder.recordingState === 'idle') {
      if (!fileUrl) onStreamStop();
    }
  }, [recorder.stream, recorder.recordingState, fileUrl]);

  useEffect(() => {
    if (recorder.audioBlob) onAudioReady?.(recorder.audioBlob);
  }, [recorder.audioBlob]);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      recorder.reset();
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileName(file.name);
      setIsPlayingFile(false);
      setFileProgress(0);
      setFileDuration(0);
      onAudioReady?.(file);
    }
  };

  const handleFilePlayPause = async () => {
    if (!audioRef.current) return;
    if (isPlayingFile) {
      audioRef.current.pause();
      setIsPlayingFile(false);
      onStreamStop();
    } else {
      setIsPlayingFile(true);
      await audioRef.current.play();
      onStreamReady(audioRef.current);
    }
  };

  const handleFileTimeUpdate = () => {
    if (audioRef.current) setFileProgress(audioRef.current.currentTime);
  };

  const handleFileLoadedMetadata = () => {
    if (audioRef.current) setFileDuration(audioRef.current.duration);
  };

  const handleFileEnded = () => {
    setIsPlayingFile(false);
    setFileProgress(0);
    onStreamStop();
  };

  const handleFileProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFileProgress(val);
    if (audioRef.current) audioRef.current.currentTime = val;
  };

  const handleResetFile = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingFile(false);
    setFileProgress(0);
    setFileDuration(0);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFileName(null);
    onStreamStop();
  };

  const isRecording = recorder.recordingState === 'recording';

  return (
    <div className="glass-card p-6 flex flex-col justify-between" style={{ minHeight: '360px' }}>
      {fileUrl ? (
        // File Player UI
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileAudio size={18} className="text-[#C9A84C]" />
              <h3 className="font-display text-sm font-semibold truncate max-w-[200px]" style={{ color: '#E8E0D0' }}>
                {fileName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: isPlayingFile ? '#C9A84C' : '#6A6458', boxShadow: isPlayingFile ? '0 0 8px #C9A84C' : 'none' }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: isPlayingFile ? '#C9A84C' : '#6A6458' }}>
                {isPlayingFile ? 'Analyzing File' : 'Paused'}
              </span>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={fileUrl}
            onTimeUpdate={handleFileTimeUpdate}
            onLoadedMetadata={handleFileLoadedMetadata}
            onEnded={handleFileEnded}
            crossOrigin="anonymous"
          />

          <div className="w-full mb-6 flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={fileDuration || 100}
              value={fileProgress}
              onChange={handleFileProgressChange}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C9A84C]"
            />
            <div className="flex justify-between text-xs font-mono" style={{ color: '#6A6458' }}>
              <span>{formatDuration(fileProgress)}</span>
              <span>{formatDuration(fileDuration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFilePlayPause}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)',
                color: '#050507',
              }}
            >
              {isPlayingFile ? <Pause size={15} /> : <Play size={15} />}
              {isPlayingFile ? 'Pause DSP' : 'Run Analysis'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFile}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs uppercase font-bold tracking-wider border cursor-pointer bg-zinc-950/40"
              style={{
                borderColor: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
              }}
            >
              <Trash2 size={14} />
              Clear
            </motion.button>
          </div>
        </div>
      ) : (
        // Standard Live Microphone Recorder UI
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="card-label mb-0.5">Recording Deck</p>
              <h3 className="card-heading">Studio Microphone</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isRecording ? '#ef4444' : '#10B981' }} />
                <span className="text-xs" style={{ color: '#6A6458' }}>
                  {isRecording ? '● Recording in progress' : 'Ready · Microphone connected'}
                </span>
              </div>
            </div>
          </div>

          {/* Large Studio Mic Button */}
          <div className="flex flex-col items-center justify-center py-4">
            <motion.button
              onClick={isRecording ? recorder.stopRecording : recorder.startRecording}
              className="relative w-28 h-28 rounded-full flex items-center justify-center cursor-pointer border"
              style={{
                background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(20, 20, 25, 0.65)',
                borderColor: isRecording ? '#ef4444' : 'rgba(201, 168, 76, 0.25)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulsing ring during recording */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border border-red-500/50"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center border shadow-inner"
                style={{
                  background: isRecording ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'linear-gradient(135deg, #222, #111)',
                  borderColor: isRecording ? '#ef4444' : 'rgba(255,255,255,0.08)',
                  boxShadow: isRecording ? '0 0 30px rgba(239,68,68,0.4)' : 'none'
                }}
              >
                {isRecording ? <Square size={26} className="text-white" /> : <Mic size={26} className="text-gold" />}
              </div>
            </motion.button>

            {/* Timer Display */}
            <div className="text-center mt-4">
              <span className="font-mono text-2xl font-black tracking-wider text-zinc-100">
                {formatDuration(recorder.duration)}
              </span>
            </div>
          </div>

          {/* VU / level meter and Waveform strip */}
          <div className="grid grid-cols-5 gap-3 items-center">
            {/* Waveform strip */}
            <div className="col-span-4 h-12 rounded-xl overflow-hidden flex items-center justify-center relative"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <canvas ref={canvasRef} className="w-full h-full" />
              {recorder.recordingState === 'idle' && (
                <div className="absolute text-[10px] tracking-widest" style={{ color: '#4A4840' }}>Input level</div>
              )}
            </div>

            {/* Level indicator bar */}
            <div className="h-12 bg-zinc-950/50 rounded-xl p-2.5 border border-white/5 flex flex-col justify-end">
              <div className="w-full bg-zinc-800 rounded-sm h-full overflow-hidden flex flex-col justify-end">
                <motion.div
                  className="w-full rounded-sm"
                  style={{
                    background: vuLevel > 80 ? '#ef4444' : vuLevel > 50 ? '#f59e0b' : '#06b6d4',
                    height: `${vuLevel}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                />
              </div>
            </div>
          </div>

          {/* File Upload Row */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-all duration-200 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(201,168,76,0.2)', color: '#9A9080' }}
            >
              <Upload size={14} />
              Analyze Audio File
            </button>
            <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,audio/*" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>
      )}
    </div>
  );
}
