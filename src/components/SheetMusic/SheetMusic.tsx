import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import type { DetectedNote } from '../../types';
import { Download } from 'lucide-react';

interface SheetMusicProps {
  notes: DetectedNote[];
  instrument: string;
}

const ACCIDENTALS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
const VEX_NOTE_MAP: Record<string, string> = {
  'C': 'c', 'C#': 'c', 'D': 'd', 'D#': 'd', 'E': 'e', 'F': 'f',
  'F#': 'f', 'G': 'g', 'G#': 'g', 'A': 'a', 'A#': 'a', 'B': 'b'
};

function getDurationCode(durationSec: number): string {
  if (durationSec > 1.5) return 'w';      // Whole note
  if (durationSec > 0.75) return 'h';     // Half note
  if (durationSec > 0.375) return 'q';    // Quarter note
  if (durationSec > 0.187) return '8';    // Eighth note
  return '16';                            // Sixteenth note
}

export default function SheetMusic({ notes, instrument }: SheetMusicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    if (notes.length === 0) return;

    // Calculate durations from timestamps
    const notesWithDurations = notes.map((n, idx) => {
      const next = notes[idx + 1];
      const durationSec = next ? next.timestamp - n.timestamp : 0.5;
      return {
        ...n,
        durationSec,
        durationCode: getDurationCode(durationSec),
      };
    });

    // Build the vexNotes array, inserting rests for gaps
    const vexNotes: StaveNote[] = [];
    const clef = instrument === 'bass' ? 'bass' : 'treble';

    for (let i = 0; i < notesWithDurations.length; i++) {
      const n = notesWithDurations[i];
      const vexName = VEX_NOTE_MAP[n.note] || 'c';
      
      // Auto range shift: bass clef notes are usually lower
      let oct = n.octave;
      if (clef === 'bass' && oct > 4) oct = 3;
      if (clef === 'treble' && oct < 4) oct = 4;
      oct = Math.max(2, Math.min(6, oct));

      const noteStr = `${vexName}/${oct}`;
      
      try {
        const staveNote = new StaveNote({
          keys: [noteStr],
          duration: n.durationCode,
          clef,
          autoStem: true,
        });

        if (ACCIDENTALS.has(n.note)) {
          staveNote.addModifier(new Accidental('#'));
        }

        staveNote.setStyle({ fillStyle: '#C9A84C', strokeStyle: '#C9A84C' });
        vexNotes.push(staveNote);

        // Check for rest insertion (silence > 1s)
        const next = notesWithDurations[i + 1];
        if (next) {
          const gap = next.timestamp - (n.timestamp + n.durationSec);
          if (gap > 1.0) {
            const restDuration = gap > 2.0 ? 'h' : 'q';
            const restKey = clef === 'bass' ? 'd/3' : 'b/4';
            const restNote = new StaveNote({
              keys: [restKey],
              duration: `${restDuration}r`,
              clef,
            });
            restNote.setStyle({ fillStyle: 'rgba(192, 176, 144, 0.4)', strokeStyle: 'rgba(192, 176, 144, 0.4)' });
            vexNotes.push(restNote);
          }
        }
      } catch (e) {
        console.error("VexFlow note parsing error:", e);
      }
    }

    // Ensure we have at least 4 elements
    const defaultRestKey = clef === 'bass' ? 'd/3' : 'b/4';
    while (vexNotes.length < 4) {
      vexNotes.push(new StaveNote({ keys: [defaultRestKey], duration: 'qr', clef }));
    }

    try {
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      // Auto-growing width for horizontal scroll
      const width = Math.max(800, vexNotes.length * 75 + 150);
      renderer.resize(width, 160);

      const context = renderer.getContext();
      context.setFillStyle('#C0B090');
      context.setStrokeStyle('#C0B090');

      const stave = new Stave(10, 20, width - 20);
      stave.addClef(clef).addTimeSignature('4/4');
      stave.setStyle({ strokeStyle: 'rgba(201,168,76,0.4)', fillStyle: '#C9A84C' });
      stave.setContext(context).draw();

      const voice = new Voice({ numBeats: vexNotes.length, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickables(vexNotes);

      new Formatter().joinVoices([voice]).format([voice], width - 100);
      voice.draw(context, stave);

      // Recolor output elements
      el.querySelectorAll('path, rect, line, polygon').forEach(e => {
        const svgEl = e as SVGElement;
        if (!svgEl.style.fill || svgEl.style.fill === 'black' || svgEl.style.fill === '#000000') {
          svgEl.style.fill = '#C0B090';
        }
        if (!svgEl.style.stroke || svgEl.style.stroke === 'black') {
          svgEl.style.stroke = 'rgba(201,168,76,0.5)';
        }
      });
      el.querySelectorAll('text').forEach(t => {
        (t as SVGTextElement).style.fill = '#C0B090';
      });

      // Auto-scroll to end of staves
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    } catch (e) {
      console.error('VexFlow render error:', e);
    }
  }, [notes, instrument]);

  const downloadSheet = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jazzique-performance.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
            Interactive Sheet Music
          </h3>
          <p className="text-xs" style={{ color: '#6A6458' }}>
            Clef auto-matched to {instrument} · Real-time durations & rests
          </p>
        </div>
        {notes.length > 0 && (
          <button
            onClick={downloadSheet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C' }}
          >
            <Download size={12} />
            Download SVG
          </button>
        )}
      </div>

      <div ref={scrollContainerRef} className="rounded-xl overflow-x-auto p-4 scroll-smooth" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', minHeight: '180px' }}>
        {notes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#3A3830' }}>
            Sheet music will render continuously as notes are detected...
          </div>
        ) : (
          <div ref={containerRef} className="w-max" />
        )}
      </div>
    </div>
  );
}
