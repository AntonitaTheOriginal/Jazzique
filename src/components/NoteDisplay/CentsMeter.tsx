import { motion } from 'framer-motion';

interface CentsMeterProps {
  cents: number;
  noteName: string;
  frequency?: number;
}

export default function CentsMeter({ cents, noteName, frequency }: CentsMeterProps) {
  const normalizedCents = Math.max(-50, Math.min(50, cents));
  const angle = (normalizedCents / 50) * 70; // Map -50..50 to -70deg..70deg

  let statusColor = '#ef4444'; // Red
  let statusText = 'Out of Tune';
  
  if (Math.abs(normalizedCents) <= 4) {
    statusColor = '#10B981'; // Perfect Green
    statusText = 'In Tune';
  } else if (Math.abs(normalizedCents) <= 15) {
    statusColor = '#f59e0b'; // Amber Yellow
    statusText = 'Slightly Off';
  }

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-between" style={{ minHeight: '220px' }}>
      <div className="text-center w-full flex items-baseline justify-between mb-2">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          DSP Fine Tuner
        </h4>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-950/60 text-zinc-400 border border-white/5 uppercase">
          Continuous Sample
        </span>
      </div>

      {/* Tuner Circular / Curved Arc Gauge */}
      <div className="relative w-52 h-24 flex items-end justify-center overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 50">
          {/* Main Arc path */}
          <path
            d="M 12,48 A 38,38 0 0,1 88,48"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Intonation tolerance central arc */}
          <path
            d="M 45,12 A 38,38 0 0,1 55,12"
            fill="none"
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="5"
          />
          {/* Target marker line */}
          <line x1="50" y1="8" x2="50" y2="15" stroke={statusColor} strokeWidth="1.5" />
        </svg>

        {/* Central Hub with Glow */}
        <div 
          className="absolute bottom-0 w-5 h-5 rounded-full border border-white/10 bg-zinc-900 transition-all duration-300"
          style={{ boxShadow: `0 0 15px ${statusColor}44` }}
        />

        {/* Rotational Needle Indicator */}
        <motion.div
          className="absolute bottom-0 w-[2px] h-[78px] origin-bottom rounded-full"
          style={{
            background: `linear-gradient(to top, transparent, ${statusColor})`,
            boxShadow: `0 0 10px ${statusColor}`,
            left: 'calc(50% - 1px)',
          }}
          animate={{ rotate: angle }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        />
      </div>

      {/* Target stats display */}
      <div className="w-full grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-white/5">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Target note</span>
          <span className="text-sm font-bold font-display text-zinc-100">{noteName || '--'}</span>
        </div>
        
        <div>
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Detected</span>
          <span className="text-xs font-bold font-mono text-zinc-300">
            {frequency && frequency > 0 ? `${Math.round(frequency)}Hz` : '--Hz'}
          </span>
        </div>

        <div>
          <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Deviation</span>
          <span className="text-xs font-bold font-mono" style={{ color: statusColor }}>
            {noteName ? (cents > 0 ? `+${cents}` : cents) : '--'}¢
          </span>
        </div>
      </div>

      <div className="text-[9px] uppercase font-mono tracking-widest text-center mt-2" style={{ color: statusColor }}>
        {noteName ? statusText : 'No Signal Input'}
      </div>
    </div>
  );
}
