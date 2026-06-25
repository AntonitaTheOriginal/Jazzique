import { YinDetector } from './yinDetector';
import { HmmTracker } from './hmmTracker';
import type { DetectedNote, Instrument } from '../types';

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
  private filterNode: BiquadFilterNode | null = null;
  private sourceNode: AudioNode | null = null;
  private yinDetector: YinDetector | null = null;
  private hmmTracker: HmmTracker | null = null;

  private animFrame: number | null = null;
  private onNote: ((note: DetectedNote) => void) | null = null;
  private onFreqData: ((data: Float32Array) => void) | null = null;

  private noiseFloor = 0.01;
  private isCalibrating = false;
  private calibrationSamples: number[] = [];

  async initialize(input: MediaStream | HTMLAudioElement, instrument: Instrument = 'generic') {
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    this.audioContext = sharedAudioContext;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    this.filterNode = this.audioContext.createBiquadFilter();

    if (input instanceof MediaStream) {
      const source = this.audioContext.createMediaStreamSource(input);
      source.connect(this.filterNode);
      this.filterNode.connect(this.analyser);
      this.sourceNode = source;
    } else {
      let source = (input as any)._mediaSource;
      if (!source || source.context !== this.audioContext) {
        source = this.audioContext.createMediaElementSource(input);
        (input as any)._mediaSource = source;
      }
      source.connect(this.filterNode);
      this.filterNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.sourceNode = source;
    }

    this.setInstrumentFilter(instrument);

    this.yinDetector = new YinDetector(this.audioContext.sampleRate);
    this.hmmTracker = new HmmTracker();
  }

  public setInstrumentFilter(instrument: Instrument) {
    if (!this.audioContext || !this.filterNode) return;

    const filter = this.filterNode;
    switch (instrument) {
      case 'bass':
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
        break;
      case 'violin':
      case 'flute':
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(180, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.7, this.audioContext.currentTime);
        break;
      case 'trumpet':
      case 'saxophone':
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1.0, this.audioContext.currentTime);
        break;
      case 'voice':
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
        break;
      default:
        filter.type = 'allpass';
        break;
    }
  }

  public startCalibration(onCalibrated?: (noiseFloor: number) => void) {
    this.isCalibrating = true;
    this.calibrationSamples = [];
    setTimeout(() => {
      this.isCalibrating = false;
      if (this.calibrationSamples.length > 0) {
        const avg = this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
        this.noiseFloor = Math.max(0.015, avg * 1.5);
        onCalibrated?.(this.noiseFloor);
      }
    }, 1500);
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

    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < floatBuf.length; i++) {
      sum += floatBuf[i] * floatBuf[i];
    }
    const rms = Math.sqrt(sum / floatBuf.length);

    if (this.isCalibrating) {
      this.calibrationSamples.push(rms);
    }

    if (rms < this.noiseFloor) {
      this.animFrame = requestAnimationFrame(this.detect);
      return;
    }

    const { frequency: rawFreq, confidence, cents } = this.yinDetector.detect(floatBuf);
    const frequency = this.hmmTracker.track(rawFreq, confidence);

    if (frequency > 0 && confidence > 0.45) {
      const { note, octave } = frequencyToNote(frequency);
      this.onNote?.({
        note,
        octave,
        frequency,
        confidence: Math.round(confidence * 100),
        cents,
        timestamp: this.audioContext.currentTime,
      });
    }

    this.animFrame = requestAnimationFrame(this.detect);
  };

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    try {
      this.sourceNode?.disconnect();
      this.filterNode?.disconnect();
      this.analyser?.disconnect();
    } catch (e) {
      console.warn("Error disconnecting pitch detection nodes:", e);
    }
    this.audioContext = null;
    this.sourceNode = null;
    this.filterNode = null;
    this.analyser = null;
    this.yinDetector = null;
    this.hmmTracker = null;
  }

  getAnalyser() {
    return this.analyser;
  }
}
