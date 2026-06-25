import { useMemo } from 'react';

interface ChordVoicingProps {
  chordName: string;
  instrument: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Voicings definition
const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],      // Major
  'm': [0, 3, 7],     // Minor
  '7': [0, 4, 7, 10], // Dom7
  'Maj7': [0, 4, 7, 11],
  'm7': [0, 3, 7, 10],
  'dim': [0, 3, 6],
  'aug': [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
};

export default function ChordVoicing({ chordName, instrument }: ChordVoicingProps) {
  // Parse chordName (e.g. "C#m7" -> root: "C#", suffix: "m7")
  const parsedChord = useMemo(() => {
    if (!chordName) return null;
    let root = '';
    let suffix = '';
    
    if (chordName[1] === '#' || chordName[1] === 'b') {
      root = chordName.slice(0, 2);
      suffix = chordName.slice(2);
    } else {
      root = chordName.slice(0, 1);
      suffix = chordName.slice(1);
    }

    // Clean up spelling discrepancies (e.g., standardizing suffixes)
    if (suffix === ' Major') suffix = '';
    if (suffix === ' Minor') suffix = 'm';
    if (suffix === ' Dominant 7') suffix = '7';
    if (suffix === ' Major 7') suffix = 'Maj7';
    if (suffix === ' Minor 7') suffix = 'm7';
    if (suffix === ' Diminished') suffix = 'dim';
    if (suffix === ' Augmented') suffix = 'aug';
    if (suffix === ' Sus2') suffix = 'sus2';
    if (suffix === ' Sus4') suffix = 'sus4';

    const rootIdx = NOTE_NAMES.indexOf(root);
    const intervals = CHORD_INTERVALS[suffix] || [0, 4, 7];
    const notes = intervals.map(interval => NOTE_NAMES[(rootIdx + interval) % 12]);

    return { root, suffix, notes, rootIdx };
  }, [chordName]);

  // Render Piano Keyboard Voicing
  const renderPiano = () => {
    if (!parsedChord) return null;
    const { notes } = parsedChord;
    
    // We render 17 keys (C4 to E5)
    const keys = [
      { name: 'C', black: false }, { name: 'C#', black: true }, { name: 'D', black: false },
      { name: 'D#', black: true }, { name: 'E', black: false }, { name: 'F', black: false },
      { name: 'F#', black: true }, { name: 'G', black: false }, { name: 'G#', black: true },
      { name: 'A', black: false }, { name: 'A#', black: true }, { name: 'B', black: false },
      { name: 'C', black: false }, { name: 'C#', black: true }, { name: 'D', black: false },
      { name: 'D#', black: true }, { name: 'E', black: false }
    ];

    return (
      <div className="flex justify-center relative w-full h-24 mt-2 px-2 bg-zinc-950/40 rounded-lg p-2 border border-white/5">
        <div className="flex relative h-full">
          {keys.map((key, idx) => {
            const isHighlighted = notes.includes(key.name);
            const isRoot = key.name === parsedChord.root && notes.indexOf(key.name) === 0;

            if (key.black) {
              // Position black keys over white keys
              const leftOffset = (idx * 16) - 8;
              return (
                <div
                  key={idx}
                  className="absolute z-10 w-4 h-12 rounded-b cursor-default transition-all"
                  style={{
                    left: `${leftOffset}px`,
                    background: isHighlighted ? (isRoot ? '#E8C870' : '#C9A84C') : '#0c0a09',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              );
            } else {
              return (
                <div
                  key={idx}
                  className="w-6 h-20 border-r border-b rounded-b border-zinc-800 transition-all"
                  style={{
                    background: isHighlighted ? (isRoot ? 'rgba(232, 200, 112, 0.2)' : 'rgba(201, 168, 76, 0.2)') : 'rgba(255,255,255,0.03)',
                    borderLeft: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    borderColor: isHighlighted ? '#C9A84C' : 'rgba(255,255,255,0.05)',
                  }}
                />
              );
            }
          })}
        </div>
      </div>
    );
  };

  // Render Guitar Fretboard Voicing (simplistic finger shape reference)
  const renderGuitar = () => {
    if (!parsedChord) return null;
    const { notes } = parsedChord;

    // Hardcode some simple guitar shapes for visualization
    const strings = ['E', 'A', 'D', 'G', 'B', 'E']; // 6 strings
    // Render 5 frets
    return (
      <div className="flex flex-col items-center mt-2 w-full">
        <div className="relative w-40 h-24 border border-zinc-700 bg-zinc-950/30 rounded p-1 flex flex-col justify-between">
          {[0, 1, 2, 3, 4, 5].map((sIndex) => (
            <div key={sIndex} className="relative w-full h-px bg-zinc-600">
              {/* Frets separator */}
              <div className="absolute left-1/4 h-3 -top-1.5 w-px bg-zinc-800" />
              <div className="absolute left-2/4 h-3 -top-1.5 w-px bg-zinc-800" />
              <div className="absolute left-3/4 h-3 -top-1.5 w-px bg-zinc-800" />
              
              {/* Dot if note spelling matches string note */}
              {notes.includes(strings[sIndex]) && (
                <div
                  className="absolute -top-1.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold"
                  style={{ left: '10%', background: '#C9A84C', color: '#000' }}
                >
                  {strings[sIndex]}
                </div>
              )}
            </div>
          ))}
          <div className="absolute -left-2 top-0 h-full w-1.5 bg-yellow-600/30 rounded" /> {/* Nut */}
        </div>
        <div className="text-[10px] mt-1.5 text-zinc-500">Simple Open String Highlights</div>
      </div>
    );
  };

  if (!chordName) return null;

  return (
    <div className="glass-card p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A8880' }}>
          Chord Shape
        </h4>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
          {chordName}
        </span>
      </div>

      {instrument === 'piano' || instrument === 'generic' ? renderPiano() : renderGuitar()}
    </div>
  );
}
