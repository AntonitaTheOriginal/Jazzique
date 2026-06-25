import { useState, useEffect, useCallback } from 'react';
import type { DetectedNote } from '../types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNote(midi: number): { note: string; octave: number; frequency: number } {
  const noteIndex = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  return { note: NOTE_NAMES[noteIndex], octave, frequency };
}

export function useWebMidi(onNoteOn?: (note: DetectedNote) => void, onNoteOff?: () => void) {
  const [devices, setDevices] = useState<string[]>([]);

  const handleMidiMessage = useCallback((e: any) => {
    if (!e || !e.data) return;
    const [status, data1, data2] = e.data;
    const command = status & 0xf0;
    
    // Command 0x90 is Note On, 0x80 is Note Off
    if (command === 0x90 && data2 > 0) {
      const { note, octave, frequency } = midiToNote(data1);
      onNoteOn?.({
        note,
        octave,
        frequency,
        confidence: 100,
        timestamp: performance.now() / 1000,
      });
    } else if (command === 0x80 || (command === 0x90 && data2 === 0)) {
      onNoteOff?.();
    }
  }, [onNoteOn, onNoteOff]);

  useEffect(() => {
    const nav = navigator as any;
    if (!nav.requestMIDIAccess) {
      console.warn("Web MIDI API not supported in this browser.");
      return;
    }

    let midiAccess: any = null;

    const onStateChange = () => {
      if (!midiAccess) return;
      const inputs = Array.from(midiAccess.inputs.values()) as any[];
      setDevices(inputs.map(input => input.name || 'Unknown MIDI Device'));
    };

    nav.requestMIDIAccess().then((access: any) => {
      midiAccess = access;
      access.onstatechange = onStateChange;
      onStateChange();

      access.inputs.forEach((input: any) => {
        input.onmidimessage = handleMidiMessage;
      });
    }).catch((err: any) => {
      console.error("Failed to access MIDI devices:", err);
    });

    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [handleMidiMessage]);

  return { devices };
}
