import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import type { DetectedNote } from '../../types';
import { Download } from 'lucide-react';

interface SheetMusicProps {
  notes: DetectedNote[];
}

const ACCIDENTALS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);
const VEX_NOTE_MAP: Record<string, string> = {
  'C': 'c', 'C#': 'c', 'D': 'd', 'D#': 'd', 'E': 'e', 'F': 'f',
  'F#': 'f', 'G': 'g', 'G#': 'g', 'A': 'a', 'A#': 'a', 'B': 'b'
};

export default function SheetMusic({ notes }: SheetMusicProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const displayNotes = notes.slice(-8);
    if (displayNotes.length === 0) return;

    try {
      const renderer = new Renderer(el, Renderer.Backends.SVG);
      const width = Math.max(400, displayNotes.length * 60 + 100);
      renderer.resize(width, 160);

      const context = renderer.getContext();
      context.setFillStyle('#C0B090');
      context.setStrokeStyle('#C0B090');

      const stave = new Stave(10, 20, width - 20);
      stave.addClef('treble').addTimeSignature('4/4');
      stave.setStyle({ strokeStyle: 'rgba(201,168,76,0.4)', fillStyle: '#C9A84C' });
      stave.setContext(context).draw();

      const vexNotes = displayNotes.map(n => {
        const vexName = VEX_NOTE_MAP[n.note] || 'c';
        const oct = Math.max(3, Math.min(6, n.octave));
        const noteStr = `${vexName}/${oct}`;
        const staveNote = new StaveNote({
          keys: [noteStr],
          duration: 'q',
          autoStem: true,
        });

        if (ACCIDENTALS.has(n.note)) {
          staveNote.addModifier(new Accidental('#'));
        }

        staveNote.setStyle({ fillStyle: '#C9A84C', strokeStyle: '#C9A84C' });
        return staveNote;
      });

      // Pad to 4 notes minimum with rests
      while (vexNotes.length < 4) {
        vexNotes.push(new StaveNote({ keys: ['b/4'], duration: 'qr' }));
      }

      const voice = new Voice({ numBeats: vexNotes.length, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickables(vexNotes);

      new Formatter().joinVoices([voice]).format([voice], width - 60);
      voice.draw(context, stave);

      // Style all SVG elements
      el.querySelectorAll('path, rect, line, polygon').forEach(el => {
        const svgEl = el as SVGElement;
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
    } catch (e) {
      console.error('VexFlow render error:', e);
    }
  }, [notes]);

  const downloadSheet = () => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jazzique-sheet.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
          Sheet Music
        </h3>
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

      <div className="rounded-xl overflow-auto p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', minHeight: '180px' }}>
        {notes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm" style={{ color: '#3A3830' }}>
            Sheet music will render as notes are detected
          </div>
        ) : (
          <div ref={containerRef} className="w-full" />
        )}
      </div>

      <p className="text-xs mt-3" style={{ color: '#4A4840' }}>
        Showing last 8 detected notes · Treble clef · 4/4 time
      </p>
    </div>
  );
}
