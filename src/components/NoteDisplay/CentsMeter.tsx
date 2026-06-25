import { motion } from 'framer-motion';

interface CentsMeterProps {
  cents: number;
  noteName: string;
}

export default function CentsMeter({ cents, noteName }: CentsMeterProps) {
  // Normalize cents between -50 and 50
  const normalizedCents = Math.max(-50, Math.min(50, cents));
  
  // Calculate rotation angle for needle (-60deg to +60deg)
  const angle = (normalizedCents / 50) * 60;

  // Determine color based on how close to in-tune (0 cents)
  let statusColor = '#EF4444'; // Red (very out of tune)
  let statusText = 'Out of Tune';
  
  if (Math.abs(normalizedCents) <= 5) {
    statusColor = '#10B981'; // Green (perfect)
    statusText = 'In Tune';
  } else if (Math.abs(normalizedCents) <= 15) {
    statusColor = '#FBBF24'; // Yellow (close)
    statusText = 'Slightly Off';
  }

  return (
    <div className="glass-card p-4 flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: '160px' }}>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8A8880' }}>
        Fine Tuner
      </h4>

      {/* Tuner Gauge */}
      <div className="relative w-48 h-20 flex items-end justify-center overflow-hidden">
        {/* Gauge Background Arc */}
        <svg className="w-full h-full" viewBox="0 0 100 50">
          {/* Outer circle segment */}
          <path
            d="M 10,50 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Target Zone (In-Tune segment) */}
          <path
            d="M 45,13 A 40,40 0 0,1 55,13"
            fill="none"
            stroke="rgba(16, 185, 129, 0.4)"
            strokeWidth="8"
          />
          {/* Center line */}
          <line x1="50" y1="10" x2="50" y2="16" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
        </svg>

        {/* Needle */}
        <motion.div
          className="absolute bottom-0 w-1 h-16 origin-bottom rounded-full"
          style={{
            background: `linear-gradient(to top, transparent, ${statusColor})`,
            boxShadow: `0 0 8px ${statusColor}`,
            left: 'calc(50% - 2px)',
          }}
          animate={{ rotate: angle }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />

        {/* Center hub */}
        <div className="absolute bottom-0 w-4 h-4 rounded-full border border-white/10 bg-zinc-900" />
      </div>

      {/* Note and Cents Details */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-display" style={{ color: '#E8E0D0' }}>
          {noteName || '--'}
        </span>
        <span className="text-sm font-medium" style={{ color: statusColor }}>
          {noteName ? (cents > 0 ? `+${cents}` : cents) : '--'}¢
        </span>
      </div>

      <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {noteName ? statusText : 'Play a note'}
      </div>
    </div>
  );
}
