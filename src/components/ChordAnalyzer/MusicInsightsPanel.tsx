import { motion } from 'framer-motion';
import { Lightbulb, Music, Guitar, BookOpen } from 'lucide-react';
import type { MusicInsight } from '../../types';

interface MusicInsightsPanelProps {
  insights: MusicInsight;
  hasNotes: boolean;
}

export default function MusicInsightsPanel({ insights, hasNotes }: MusicInsightsPanelProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb size={18} style={{ color: '#C9A84C' }} />
        <h3 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>
          Music Insights
        </h3>
      </div>

      {!hasNotes ? (
        <div className="text-center py-8 text-sm" style={{ color: '#4A4840' }}>
          Insights will appear after notes are detected
        </div>
      ) : (
        <div className="space-y-5">
          {/* Key & Scale */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <div className="flex items-center gap-2">
              <Music size={14} style={{ color: '#C9A84C' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: '#6A6458' }}>Key & Scale</span>
            </div>
            <p className="text-sm" style={{ color: '#C0B090' }}>
              This melody strongly resembles a <span style={{ color: '#C9A84C' }}>{insights.scale}</span> scale.
            </p>
            {insights.scaleSuggestions && insights.scaleSuggestions.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider block" style={{ color: '#6A6458' }}>Recommended Improvisation Scales:</span>
                <div className="flex flex-wrap gap-1.5">
                  {insights.scaleSuggestions.map((scale, sIdx) => (
                    <span key={sIdx} className="text-xs px-2 py-0.5 rounded bg-zinc-950/40 text-gold-light border border-white/5">
                      {scale}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chord progression */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Guitar size={14} style={{ color: '#9A9080' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: '#6A6458' }}>Suggested Progression</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {insights.progression.map((chord, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="px-3 py-1.5 rounded-lg text-sm font-mono font-medium"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C' }}
                >
                  {chord}
                </motion.span>
              ))}
              <span className="text-sm self-center" style={{ color: '#4A4840' }}>→ repeat</span>
            </div>
          </div>

          {/* Practice tips */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: '#9A9080' }} />
              <span className="text-xs uppercase tracking-widest" style={{ color: '#6A6458' }}>Practice Tips</span>
            </div>
            <ul className="space-y-2">
              {insights.practiceTips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-2 text-sm"
                  style={{ color: '#8A8078' }}
                >
                  <span style={{ color: '#C9A84C', flexShrink: 0 }}>·</span>
                  {tip}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Improv tips */}
          <div>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6A6458' }}>Improvisation</div>
            <ul className="space-y-2">
              {insights.improvTips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 + 0.2 }}
                  className="flex gap-2 text-sm"
                  style={{ color: '#8A8078' }}
                >
                  <span style={{ color: '#9A7A2E', flexShrink: 0 }}>✦</span>
                  {tip}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
