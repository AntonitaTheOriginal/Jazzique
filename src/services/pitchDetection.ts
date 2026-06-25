import { YinDetector } from './yinDetector';
import { HmmTracker } from './hmmTracker';
import type { DetectedNote } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const roundedSemitones = Math.round(semitones);
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12;
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4;
  const cents = (semitones - roundedSemitones) * 100;
  return { note: NOTE_NAMES[noteIndex], octave, cents };
}

export function noteToMidi(note: string, octave: number): number {
  const idx = NOTE_NAMES.indexOf(note);
  return (octave + 1) * 12 + idx;
}

export function noteToFrequency(note: string, octave: number): number {
  const A4 = 440;
  const idx = NOTE_NAMES.indexOf(note);
  const semitones = (octave - 4) * 12 + idx - 9;
  return A4 * Math.pow(2, semitones / 12);
}

let sharedAudioContext: AudioContext | null = null;

export class PitchDetectionService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: AudioNode | null = null;
  private yinDetector: YinDetector | null = null;
  private hmmTracker: HmmTracker | null = null;

  private animFrame: number | null = null;
  private onNote: ((note: DetectedNote) => void) | null = null;
  private onFreqData: ((data: Float32Array) => void) | null = null;

  async initialize(input: MediaStream | HTMLAudioElement) {
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    this.audioContext = sharedAudioContext;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    if (input instanceof MediaStream) {
      const source = this.audioContext.createMediaStreamSource(input);
      source.connect(this.analyser);
      this.sourceNode = source;
    } else {
      let source = (input as any)._mediaSource;
      if (!source || source.context !== this.audioContext) {
        source = this.audioContext.createMediaElementSource(input);
        (input as any)._mediaSource = source;
      }
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.sourceNode = source;
    }

    this.yinDetector = new YinDetector(this.audioContext.sampleRate);
    this.hmmTracker = new HmmTracker();
  }

  start(onNote: (note: DetectedNote) => void, onFreqData: (data: Float32Array) => void) {
    this.onNote = onNote;
    this.onFreqData = onFreqData;
    this.detect();
  }

  private detect = () => {
    if (!this.analyser || !this.yinDetector || !this.hmmTracker || !this.audioContext) return;

    const floatBuf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(floatBuf);

    this.onFreqData?.(floatBuf);

    const { frequency: rawFreq, confidence } = this.yinDetector.detect(floatBuf);
    const frequency = this.hmmTracker.track(rawFreq, confidence);

    if (frequency > 0 && confidence > 0.45) {
      const { note, octave } = frequencyToNote(frequency);
      this.onNote?.({
        note,
        octave,
        frequency,
        confidence: Math.round(confidence * 100),
        timestamp: this.audioContext.currentTime,
      });
    }

    this.animFrame = requestAnimationFrame(this.detect);
  };

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    try {
      this.sourceNode?.disconnect();
      this.analyser?.disconnect();
    } catch (e) {
      console.warn("Error disconnecting pitch detection nodes:", e);
    }
    this.audioContext = null;
    this.sourceNode = null;
    this.analyser = null;
    this.yinDetector = null;
    this.hmmTracker = null;
  }

  getAnalyser() {
    return this.analyser;
  }
}
