import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onStart: () => void;
}

export default function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 animate-float"
          style={{ background: 'radial-gradient(circle, #9A7A2E 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #E8C870 0%, transparent 60%)', filter: 'blur(100px)' }} />
      </div>

      {/* Staff lines decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        {[20, 28, 36, 44, 52].map(top => (
          <div key={top} className="absolute w-full h-px" style={{ top: `${top}%`, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-4xl"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-medium tracking-widest uppercase"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          AI-Powered Music Analysis
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-7xl sm:text-8xl md:text-9xl font-black leading-none mb-4">
          <span className="text-gold-gradient">Jazz</span>
          <span style={{ color: '#F5ECD7' }}>ique</span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display text-xl sm:text-2xl md:text-3xl italic mb-6 font-light"
          style={{ color: '#C0B090' }}
        >
          Turn Any Melody Into Music
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: '#6A6458' }}
        >
          Record, analyze, visualize, and transform melodies into notes, chords, sheet music, and MIDI files.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onStart}
            className="group relative px-8 py-4 rounded-xl font-semibold text-sm tracking-wide overflow-hidden transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)', color: '#050507' }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Analyzing
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>→</span>
            </span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #E8C870, #C9A84C)' }} />
          </button>

          <button
            onClick={onStart}
            className="px-8 py-4 rounded-xl font-medium text-sm tracking-wide transition-all duration-300"
            style={{ background: 'transparent', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
          >
            Watch Demo
          </button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-2 mt-12"
        >
          {['Pitch Detection', 'Key Analysis', 'Chord Suggestions', 'MIDI Export', 'Sheet Music', 'Song Matching'].map(f => (
            <span key={f} className="note-pill text-xs">{f}</span>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 flex flex-col items-center gap-2"
        style={{ color: '#4A4840' }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
        <ChevronDown size={16} className="animate-bounce" />
      </motion.div>
    </section>
  );
}
