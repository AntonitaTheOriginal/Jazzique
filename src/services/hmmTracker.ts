
export class HmmTracker {
  private lastMidi = -1;
  private consecutiveFrames = 0;
  private stableMidi = -1;

  /**
   * Tracks and smooths the incoming pitch to prevent sudden jumps and octave errors.
   * @param freq The detected frequency (Hz)
   * @param confidence The confidence score (0 to 1)
   * @returns The smoothed frequency, or -1 if unvoiced
   */
  public track(freq: number, confidence: number): number {
    if (freq <= 0 || confidence < 0.35) {
      this.consecutiveFrames = 0;
      return -1;
    }

    // MIDI Note number
    const A4 = 440;
    const semitones = Math.round(12 * Math.log2(freq / A4)) + 69;

    if (this.lastMidi === -1) {
      this.lastMidi = semitones;
      this.stableMidi = semitones;
      this.consecutiveFrames = 1;
      return freq;
    }

    // Octave jump correction: if the candidate is 12 (1 octave) or 24 (2 octaves) semitones away,
    // and confidence is moderate, correct it to the stable octave.
    const diff = Math.abs(semitones - this.stableMidi);
    if ((diff === 12 || diff === 24) && confidence < 0.8) {
      const octaveShift = (semitones > this.stableMidi) ? -1 * (diff / 12) : 1 * (diff / 12);
      const correctedFreq = freq * Math.pow(2, octaveShift);
      return correctedFreq;
    }

    if (semitones === this.lastMidi) {
      this.consecutiveFrames++;
    } else {
      this.consecutiveFrames = 1;
      this.lastMidi = semitones;
    }

    // Transition threshold: requires 2 consecutive frames to switch stable note
    if (this.consecutiveFrames >= 2) {
      this.stableMidi = semitones;
    }

    return freq;
  }

  public reset() {
    this.lastMidi = -1;
    this.stableMidi = -1;
    this.consecutiveFrames = 0;
  }
}
