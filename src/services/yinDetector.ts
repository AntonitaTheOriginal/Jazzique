export class YinDetector {
  private threshold: number;
  private sampleRate: number;

  constructor(sampleRate: number, threshold = 0.15) {
    this.sampleRate = sampleRate;
    this.threshold = threshold;
  }

  /**
   * Applies DC Offset removal and a Hann window to the input signal.
   * Modifies the buffer in-place or returns a new windowed copy.
   */
  private preprocess(buffer: Float32Array): Float32Array {
    const size = buffer.length;
    const output = new Float32Array(size);

    // 1. DC Offset Removal
    let sum = 0;
    for (let i = 0; i < size; i++) {
      sum += buffer[i];
    }
    const mean = sum / size;

    // 2. Apply Hann Window
    for (let i = 0; i < size; i++) {
      const dcCorrected = buffer[i] - mean;
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
      output[i] = dcCorrected * hann;
    }

    return output;
  }

  /**
   * Calculates Root Mean Square (RMS) energy of the signal.
   */
  private calculateRms(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Performs YIN pitch detection on the input buffer.
   * @param rawBuffer The raw time-domain audio samples.
   * @returns An object containing the frequency in Hz and the confidence score.
   */
  public detect(rawBuffer: Float32Array): { frequency: number; confidence: number } {
    const rms = this.calculateRms(rawBuffer);
    
    // Silence threshold: If the signal energy is too quiet, do not attempt to detect
    if (rms < 0.01) {
      return { frequency: -1, confidence: 0 };
    }

    const buffer = this.preprocess(rawBuffer);
    const size = buffer.length;
    const halfSize = Math.floor(size / 2);
    
    // Step 1: Difference Function
    const yinBuffer = new Float32Array(halfSize);
    for (let tau = 0; tau < halfSize; tau++) {
      let diff = 0;
      for (let i = 0; i < halfSize; i++) {
        const delta = buffer[i] - buffer[i + tau];
        diff += delta * delta;
      }
      yinBuffer[tau] = diff;
    }

    // Step 2: Cumulative Mean Normalized Difference Function
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfSize; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] *= tau / (runningSum || 1);
    }

    // Step 3: Absolute Thresholding
    let tauCandidate = -1;
    for (let tau = 1; tau < halfSize; tau++) {
      if (yinBuffer[tau] < this.threshold) {
        tauCandidate = tau;
        break;
      }
    }

    // Fallback: If no value falls below threshold, choose the absolute minimum
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

    // If the best minimum is still too noisy (high error), declare unvoiced
    if (minVal > 0.4) {
      return { frequency: -1, confidence: 0 };
    }

    // Step 4: Parabolic Interpolation for sub-sample accuracy
    let betterTau = tauCandidate as number;
    if (tauCandidate > 0 && tauCandidate < halfSize - 1) {
      const alpha = yinBuffer[tauCandidate - 1];
      const beta = yinBuffer[tauCandidate];
      const gamma = yinBuffer[tauCandidate + 1];
      
      const denominator = alpha - 2 * beta + gamma;
      if (denominator !== 0) {
        betterTau = tauCandidate + (alpha - gamma) / (2 * denominator);
      }
    }

    // Convert period to frequency
    const frequency = this.sampleRate / betterTau;
    
    // Confidence calculation: derived from YIN error at candidate period and signal RMS
    const yinConfidence = Math.max(0, 1 - minVal);
    // Combine YIN confidence with a soft volume threshold confidence scaling
    const volumeScalar = Math.min(1, rms / 0.05);
    const confidence = yinConfidence * volumeScalar;

    if (frequency >= 50 && frequency <= 4000) {
      return { frequency, confidence };
    }

    return { frequency: -1, confidence: 0 };
  }
}
