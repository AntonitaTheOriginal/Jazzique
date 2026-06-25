import * as Tone from 'tone';
import type { Instrument } from '../types';

class SynthService {
  private synth: Tone.PolySynth | null = null;
  private currentInstrument: Instrument = 'generic';

  async setInstrument(inst: Instrument) {
    if (this.currentInstrument === inst && this.synth) return;
    this.currentInstrument = inst;
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    await this.init();
  }

  async init() {
    if (this.synth) {
      if (Tone.getContext().state !== 'running') {
        await Tone.getContext().resume();
      }
      return;
    }
    await Tone.start();
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume();
    }

    let synthOptions: any = {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 }
    };

    switch (this.currentInstrument) {
      case 'piano':
        synthOptions = {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.002, decay: 1.5, sustain: 0.1, release: 1.5 }
        };
        break;
      case 'violin':
        synthOptions = {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.15, decay: 0.3, sustain: 0.8, release: 0.6 }
        };
        break;
      case 'guitar':
      case 'ukulele':
        synthOptions = {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.002, decay: 0.8, sustain: 0.02, release: 0.8 }
        };
        break;
      case 'flute':
        synthOptions = {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.08, decay: 0.2, sustain: 0.9, release: 0.4 }
        };
        break;
      case 'bass':
        synthOptions = {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.02, decay: 0.6, sustain: 0.5, release: 0.6 }
        };
        break;
      case 'saxophone':
        synthOptions = {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.4 }
        };
        break;
      case 'trumpet':
        synthOptions = {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.05, decay: 0.1, sustain: 0.75, release: 0.3 }
        };
        break;
      case 'voice':
        synthOptions = {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.5 }
        };
        break;
      default:
        synthOptions = {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 }
        };
        break;
    }

    this.synth = new Tone.PolySynth(Tone.Synth, synthOptions).toDestination();

    if (this.currentInstrument === 'bass') {
      this.synth.volume.value = -3;
    } else if (this.currentInstrument === 'violin' || this.currentInstrument === 'trumpet') {
      this.synth.volume.value = -12;
    } else {
      this.synth.volume.value = -6;
    }
  }

  private adjustNote(note: string): string {
    if (!note) return note;
    try {
      if (this.currentInstrument === 'bass') {
        const match = note.match(/^([A-G]#?)(\d)$/);
        if (match) {
          const name = match[1];
          const oct = parseInt(match[2]);
          return `${name}${Math.max(1, oct - 1)}`;
        }
      }
      if (this.currentInstrument === 'ukulele' || this.currentInstrument === 'flute') {
        const match = note.match(/^([A-G]#?)(\d)$/);
        if (match) {
          const name = match[1];
          const oct = parseInt(match[2]);
          if (oct < 4) {
            return `${name}${oct + 1}`;
          }
        }
      }
    } catch (e) {
      // fallback
    }
    return note;
  }

  async playNote(note: string) {
    await this.init();
    try {
      const adjusted = this.adjustNote(note);
      this.synth?.triggerAttack(adjusted);
    } catch (e) {
      console.warn("Synth triggerAttack error", e);
    }
  }

  async playNoteWithDuration(note: string, duration: number = 0.3) {
    await this.init();
    try {
      const adjusted = this.adjustNote(note);
      this.synth?.triggerAttackRelease(adjusted, duration);
    } catch (e) {
      console.warn("Synth triggerAttackRelease error", e);
    }
  }

  releaseNote(note: string) {
    try {
      const adjusted = this.adjustNote(note);
      this.synth?.triggerRelease(adjusted);
    } catch (e) {
      console.warn("Synth triggerRelease error", e);
    }
  }

  releaseAll() {
    try {
      this.synth?.releaseAll();
    } catch (e) {
      // ignore
    }
  }
}

export const synthService = new SynthService();
