const { performance } = require('perf_hooks');

// Self-contained YinDetector for Node benchmarking
class YinDetector {
  constructor(sampleRate, threshold = 0.15) {
    this.sampleRate = sampleRate;
    this.threshold = threshold;
  }

  preprocess(buffer) {
    const size = buffer.length;
    const output = new Float32Array(size);
    let sum = 0;
    for (let i = 0; i < size; i++) sum += buffer[i];
    const mean = sum / size;
    for (let i = 0; i < size; i++) {
      const dcCorrected = buffer[i] - mean;
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
      output[i] = dcCorrected * hann;
    }
    return output;
  }

  calculateRms(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    return Math.sqrt(sum / buffer.length);
  }

  detect(rawBuffer) {
    const rms = this.calculateRms(rawBuffer);
    if (rms < 0.01) return { frequency: -1, confidence: 0 };

    const buffer = this.preprocess(rawBuffer);
    const size = buffer.length;
    const halfSize = Math.floor(size / 2);
    
    const yinBuffer = new Float32Array(halfSize);
    for (let tau = 0; tau < halfSize; tau++) {
      let diff = 0;
      for (let i = 0; i < halfSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        diff += delta * delta;
      }
      yinBuffer[tau] = diff;
    }

    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfSize; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / (runningSum || 1);
    }

    let tauCandidate = -1;
    for (let tau = 1; tau < halfSize; tau++) {
      if (yinBuffer[tau] < this.threshold) {
        tauCandidate = tau;
        break;
      }
    }

    let minVal = yinBuffer[0];
    if (tauCandidate === -1) {
      let minTau = 1;
      minVal = Infinity;
      for (let tau = 1; tau < halfSize; tau++) {
        if (yinBuffer[tau] < minVal) {
          minVal = yinBuffer[tau];
          minTau = tau;
        }
      }
      tauCandidate = minTau;
    } else {
      minVal = yinBuffer[tauCandidate];
    }

    if (minVal > 0.4) return { frequency: -1, confidence: 0 };

    let betterTau = tauCandidate;
    if (tauCandidate > 0 && tauCandidate < halfSize - 1) {
      const alpha = yinBuffer[tauCandidate - 1];
      const beta = yinBuffer[tauCandidate];
      const gamma = yinBuffer[tauCandidate + 1];
      const denominator = alpha - 2 * beta + gamma;
      if (denominator !== 0) {
        betterTau = tauCandidate + (alpha - gamma) / (2 * denominator);
      }
    }

    const frequency = this.sampleRate / betterTau;
    const yinConfidence = Math.max(0, 1 - minVal);
    const volumeScalar = Math.min(1, rms / 0.05);
    const confidence = yinConfidence * volumeScalar;

    return { frequency, confidence };
  }
}

// Self-contained HmmTracker for Node benchmarking
class HmmTracker {
  constructor() {
    this.lastMidi = -1;
    this.consecutiveFrames = 0;
    this.stableMidi = -1;
  }

  track(freq, confidence) {
    if (freq <= 0 || confidence < 0.35) {
      this.consecutiveFrames = 0;
      return -1;
    }

    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(freq / A4)) + 69;

    if (this.lastMidi === -1) {
      this.lastMidi = semitones;
      this.stableMidi = semitones;
      this.consecutiveFrames = 1;
      return freq;
    }

    const diff = Math.abs(semitones - this.stableMidi);
    if ((diff === 12 || diff === 24) && confidence < 0.8) {
      const octaveShift = (semitones > this.stableMidi) ? -1 * (diff / 12) : 1 * (diff / 12);
      return freq * Math.pow(2, octaveShift);
    }

    if (semitones === this.lastMidi) {
      this.consecutiveFrames++;
    } else {
      this.consecutiveFrames = 1;
      this.lastMidi = semitones;
    }

    if (this.consecutiveFrames >= 2) {
      this.stableMidi = semitones;
    }

    return freq;
  }

  reset() {
    this.lastMidi = -1;
    this.stableMidi = -1;
    this.consecutiveFrames = 0;
  }
}

// Helpers
function freqToMidi(freq) {
  return 12 * Math.log2(freq / 440) + 69;
}

// Global phase accumulators for clean FM synthesis
let violinPhase = 0;
function synthesizeViolinSample(dt, baseFreq, t) {
  const vibratoCent = 15 * Math.sin(2 * Math.PI * 6 * t);
  const freq = baseFreq * Math.pow(2, vibratoCent / 1200);
  
  violinPhase += 2 * Math.PI * freq * dt;
  violinPhase %= 2 * Math.PI;
  
  let val = Math.sin(violinPhase);
  val += 0.8 * Math.sin(2 * violinPhase);
  val += 0.6 * Math.sin(3 * violinPhase);
  val += 0.4 * Math.sin(4 * violinPhase);
  val /= 2.8;
  
  val += (Math.random() - 0.5) * 0.05;
  return val;
}

let vocalPhase = 0;
function synthesizeVocalSlideSample(dt, startFreq, endFreq, duration, t) {
  const progress = Math.min(1, t / duration);
  const freq = startFreq + (endFreq - startFreq) * progress;
  
  vocalPhase += 2 * Math.PI * freq * dt;
  vocalPhase %= 2 * Math.PI;
  
  let val = Math.sin(vocalPhase);
  val += 0.3 * Math.sin(2 * vocalPhase);
  val += 0.1 * Math.sin(3 * vocalPhase);
  val /= 1.4;
  return val;
}

let guitarPhase = 0;
function synthesizeGuitarSample(dt, baseFreq, t, decay) {
  const amp = Math.exp(-decay * t);
  
  guitarPhase += 2 * Math.PI * baseFreq * dt;
  guitarPhase %= 2 * Math.PI;
  
  let val = Math.sin(guitarPhase);
  val += 0.2 * Math.sin(3 * guitarPhase);
  val *= amp;
  return val;
}

// Evaluator Core
function runEvaluation(scenarioName, samplesGen, fs, hopSize, bufferSize, groundTruth, resetPhases) {
  const detector = new YinDetector(fs);
  const tracker = new HmmTracker();
  
  resetPhases?.();
  
  const totalDuration = groundTruth.duration;
  const numSamples = Math.round(totalDuration * fs);
  const fullSignal = new Float32Array(numSamples);
  
  const dt = 1 / fs;
  for (let i = 0; i < numSamples; i++) {
    const t = i / fs;
    fullSignal[i] = samplesGen(dt, t);
  }

  let totalCentsError = 0;
  let errorCount = 0;
  let octaveErrors = 0;
  let detectedNotes = [];
  
  let isNoteActive = false;
  let activeMidi = -1;
  let activeStart = -1;
  let activeDuration = 0;

  for (let offset = 0; offset <= numSamples - bufferSize; offset += hopSize) {
    const frame = fullSignal.subarray(offset, offset + bufferSize);
    const { frequency: rawFreq, confidence } = detector.detect(frame);
    const frequency = tracker.track(rawFreq, confidence);
    const timeSec = (offset + bufferSize / 2) / fs;

    // Look for matching note segment in ground truth
    const gt = groundTruth.notes.find(n => timeSec >= n.start && timeSec <= n.start + n.duration);
    
    if (frequency > 0 && confidence > 0.45) {
      const midi = Math.round(freqToMidi(frequency));
      
      if (gt) {
        // Calculate cents deviation from the dynamic sliding ground-truth frequency
        let gtFreq = gt.freq;
        if (gt.endFreq) { // Vocal slide
          const progress = Math.min(1, (timeSec - gt.start) / gt.duration);
          gtFreq = gt.freq + (gt.endFreq - gt.freq) * progress;
        } else if (gt.hasVibrato) { // Violin vibrato
          const vibratoCent = 15 * Math.sin(2 * Math.PI * 6 * timeSec);
          gtFreq = gt.freq * Math.pow(2, vibratoCent / 1200);
        }

        const gtMidi = Math.round(freqToMidi(gtFreq));
        const centsError = Math.abs(1200 * Math.log2(frequency / gtFreq));
        
        if (Math.abs(midi - gtMidi) !== 0 && Math.abs(midi - gtMidi) % 12 === 0) {
          octaveErrors++;
        }
        
        totalCentsError += centsError;
        errorCount++;
      }

      if (!isNoteActive) {
        isNoteActive = true;
        activeMidi = midi;
        activeStart = timeSec;
        activeDuration = hopSize / fs;
      } else if (midi === activeMidi) {
        activeDuration += hopSize / fs;
      } else {
        detectedNotes.push({ midi: activeMidi, start: activeStart, duration: activeDuration });
        activeMidi = midi;
        activeStart = timeSec;
        activeDuration = hopSize / fs;
      }
    } else {
      if (isNoteActive) {
        detectedNotes.push({ midi: activeMidi, start: activeStart, duration: activeDuration });
        isNoteActive = false;
      }
    }
  }
  
  if (isNoteActive) {
    detectedNotes.push({ midi: activeMidi, start: activeStart, duration: activeDuration });
  }

  // Calculate Precision and Recall with tolerance
  let correctOnsets = 0;
  groundTruth.notes.forEach(gtNote => {
    const gtMidi = Math.round(freqToMidi(gtNote.freq));
    const match = detectedNotes.find(dn => 
      dn.midi === gtMidi && 
      Math.abs(dn.start - gtNote.start) <= 0.12
    );
    if (match) correctOnsets++;
  });

  const precision = detectedNotes.length > 0 ? correctOnsets / detectedNotes.length : 0;
  const recall = groundTruth.notes.length > 0 ? correctOnsets / groundTruth.notes.length : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  
  const avgCentsError = errorCount > 0 ? totalCentsError / errorCount : 0;
  const octaveErrorRate = errorCount > 0 ? (octaveErrors / errorCount) * 100 : 0;

  console.log(`### Scenario: ${scenarioName}`);
  console.log(`- **Pitch Deviation**: ${avgCentsError.toFixed(2)} cents (Target: < 10 cents)`);
  console.log(`- **Octave Error Rate**: ${octaveErrorRate.toFixed(1)}%`);
  console.log(`- **Notes Detected**: ${detectedNotes.length} (Expected: ${groundTruth.notes.length})`);
  console.log(`- **Onset Precision**: ${(precision * 100).toFixed(1)}%`);
  console.log(`- **Onset Recall**: ${(recall * 100).toFixed(1)}%`);
  console.log(`- **Note F1 Score**: ${(f1 * 100).toFixed(1)}%`);
  console.log(`-----------------------------------------------------`);
}

// RUN SCENARIOS
const fs = 48000;
const bufferSize = 4096;
const hopSize = 512;

console.log(`--- Running SOTA Ground-Truth Accuracy Benchmark Testing ---`);
console.log(`System: YIN Detector + HMM Transition Tracker\n`);

// 1. Solo Violin scale (C4: 261.63Hz -> E4: 329.63Hz)
const violinGT = {
  duration: 2.0,
  notes: [
    { freq: 261.63, start: 0.1, duration: 0.8, hasVibrato: true },
    { freq: 329.63, start: 1.0, duration: 0.8, hasVibrato: true }
  ]
};
runEvaluation(
  "Solo Violin with Vibrato & Bow Noise",
  (dt, t) => {
    if (t >= 0.1 && t <= 0.9) return synthesizeViolinSample(dt, 261.63, t);
    if (t >= 1.0 && t <= 1.8) return synthesizeViolinSample(dt, 329.63, t);
    return (Math.random() - 0.5) * 0.005;
  },
  fs, hopSize, bufferSize, violinGT,
  () => { violinPhase = 0; }
);

// 2. Vocal slide
const vocalGT = {
  duration: 1.5,
  notes: [
    { freq: 220.0, endFreq: 350.0, start: 0.2, duration: 1.0 }
  ]
};
runEvaluation(
  "Vocal Slide (Portamento & Air Noise)",
  (dt, t) => {
    if (t >= 0.2 && t <= 1.2) return synthesizeVocalSlideSample(dt, 220.0, 350.0, 1.0, t - 0.2);
    return (Math.random() - 0.5) * 0.005;
  },
  fs, hopSize, bufferSize, vocalGT,
  () => { vocalPhase = 0; }
);

// 3. Guitar melody with pluck decay
const guitarGT = {
  duration: 2.0,
  notes: [
    { freq: 196.00, start: 0.1, duration: 0.7 }, // G3
    { freq: 220.00, start: 1.0, duration: 0.7 }  // A3
  ]
};
runEvaluation(
  "Acoustic Guitar Plucks (Exponential Amplitude Decay)",
  (dt, t) => {
    if (t >= 0.1 && t <= 0.8) return synthesizeGuitarSample(dt, 196.00, t - 0.1, 3.0);
    if (t >= 1.0 && t <= 1.7) return synthesizeGuitarSample(dt, 220.00, t - 1.0, 3.0);
    return (Math.random() - 0.5) * 0.005;
  },
  fs, hopSize, bufferSize, guitarGT,
  () => { guitarPhase = 0; }
);
