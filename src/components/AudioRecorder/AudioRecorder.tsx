

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Pause, Play, RotateCcw, Upload, FileAudio, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import type { RecordingState } from '../../types';

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

  // Waveform visualization (for Mic)
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

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cctx.clearRect(0, 0, canvas.width, canvas.height);

      cctx.beginPath();
      cctx.strokeStyle = '#C9A84C';
      cctx.lineWidth = 2;
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

  // Clean up Object URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset any active recording
      recorder.reset();

      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileName(file.name);
      setIsPlayingFile(false);
      setFileProgress(0);
      setFileDuration(0);

      // Notify parent that audio data is ready if callback exists
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
    if (audioRef.current) {
      setFileProgress(audioRef.current.currentTime);
    }
  };

  const handleFileLoadedMetadata = () => {
    if (audioRef.current) {
      setFileDuration(audioRef.current.duration);
    }
  };

  const handleFileEnded = () => {
    setIsPlayingFile(false);
    setFileProgress(0);
    onStreamStop();
  };

  const handleFileProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFileProgress(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleResetFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingFile(false);
    setFileProgress(0);
    setFileDuration(0);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFileName(null);
    onStreamStop();
  };

  const stateColor: Record<RecordingState, string> = {
    idle: '#6A6458',
    recording: '#ef4444',
    paused: '#f59e0b',
    stopped: '#C9A84C',
  };

  return (
    <div className="glass-card p-6">
      {fileUrl ? (
        // File Player UI
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileAudio size={18} className="text-gold-light" />
              <h3 className="font-display text-sm font-semibold truncate max-w-[200px]" style={{ color: '#E8E0D0' }}>
                {fileName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: isPlayingFile ? '#C9A84C' : '#6A6458', boxShadow: isPlayingFile ? '0 0 8px #C9A84C' : 'none' }} />
              <span className="text-xs font-mono" style={{ color: isPlayingFile ? '#C9A84C' : '#6A6458' }}>
                {isPlayingFile ? 'Analyzing' : 'Paused'}
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

          {/* Custom File Slider */}
          <div className="w-full mb-5 flex flex-col gap-2">
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

          {/* File Controls */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFilePlayPause}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)',
                color: '#050507',
              }}
            >
              {isPlayingFile ? <Pause size={18} /> : <Play size={18} />}
              {isPlayingFile ? 'Pause Analysis' : 'Start Playback'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFile}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm border cursor-pointer"
              style={{
                background: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
              }}
            >
              <Trash2 size={16} />
              Clear File
            </motion.button>
          </div>
        </div>
      ) : (
        // Standard Live Microphone Recorder UI
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
              Audio Input
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: stateColor[recorder.recordingState], boxShadow: recorder.recordingState === 'recording' ? '0 0 8px #ef4444' : 'none', animation: recorder.recordingState === 'recording' ? 'pulse-gold 1.5s ease-in-out infinite' : 'none' }} />
              <span className="text-xs font-mono capitalize" style={{ color: stateColor[recorder.recordingState] }}>
                {recorder.recordingState}
              </span>
            </div>
          </div>

          {/* Waveform */}
          <div className="w-full h-20 rounded-xl mb-5 overflow-hidden flex items-center justify-center relative"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <canvas ref={canvasRef} className="w-full h-full" />
            {recorder.recordingState === 'idle' && (
              <div className="absolute text-xs" style={{ color: '#4A4840' }}>Waveform will appear here</div>
            )}
          </div>

          {/* Timer */}
          <div className="text-center mb-5">
            <span className="font-mono text-4xl font-bold text-gold-gradient">
              {formatDuration(recorder.duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {recorder.recordingState === 'idle' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={recorder.startRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}
              >
                <Mic size={18} />
                Start Recording
              </motion.button>
            )}

            {recorder.recordingState === 'recording' && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={recorder.pauseRecording}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                  <Pause size={16} /> Pause
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={recorder.stopRecording}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  <Square size={16} /> Stop
                </motion.button>
              </>
            )}

            {recorder.recordingState === 'paused' && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={recorder.resumeRecording}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
                  <Play size={16} /> Resume
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={recorder.stopRecording}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  <Square size={16} /> Stop
                </motion.button>
              </>
            )}

            {(recorder.recordingState === 'stopped' || recorder.audioBlob) && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={recorder.reset}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm cursor-pointer"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C' }}>
                <RotateCcw size={16} /> Reset
              </motion.button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs" style={{ color: '#4A4840' }}>or upload a file</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Upload */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all duration-200 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(201,168,76,0.2)', color: '#9A9080' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)')}
          >
            <Upload size={15} />
            Upload MP3, WAV, M4A
          </button>
          <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a,audio/*" className="hidden" onChange={handleFileUpload} />

          {recorder.error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-center" style={{ color: '#ef4444' }}>
              {recorder.error}
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
}
