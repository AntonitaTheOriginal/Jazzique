import { useState, useRef, useCallback } from 'react';
import type { RecordingState } from '../types';

export interface AudioRecorderState {
  recordingState: RecordingState;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  stream: MediaStream | null;
  error: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    recordingState: 'idle',
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    stream: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      durationRef.current = 0;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setState(s => ({ ...s, audioBlob: blob, audioUrl: url, recordingState: 'stopped' }));
      };

      mediaRecorder.start(100);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setState(s => ({ ...s, duration: durationRef.current }));
      }, 1000);

      setState(s => ({ ...s, recordingState: 'recording', stream, error: null }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setState(s => ({ ...s, error: msg }));
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setState(s => ({ ...s, recordingState: 'paused' }));
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setState(s => ({ ...s, duration: durationRef.current }));
      }, 1000);
      setState(s => ({ ...s, recordingState: 'recording' }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    state.stream?.getTracks().forEach(t => t.stop());
  }, [state.stream]);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    state.stream?.getTracks().forEach(t => t.stop());
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    durationRef.current = 0;
    setState({
      recordingState: 'idle',
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      stream: null,
      error: null,
    });
  }, [state.stream, state.audioUrl]);

  return { ...state, startRecording, pauseRecording, resumeRecording, stopRecording, reset };
}
