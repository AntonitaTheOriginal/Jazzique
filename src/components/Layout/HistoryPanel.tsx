import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Clock } from 'lucide-react';
import { getSessions, deleteSession, clearSessions } from '../../utils/sessionStorage';
import type { Session } from '../../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (isOpen) setSessions(getSessions());
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteSession(id);
    setSessions(getSessions());
  };

  const handleClear = () => {
    clearSessions();
    setSessions([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
            style={{ background: '#0A0A0F', borderLeft: '1px solid rgba(201,168,76,0.15)' }}
          >
            <div className="sticky top-0 p-6 flex items-center justify-between" style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <Clock size={18} style={{ color: '#C9A84C' }} />
                <h2 className="font-display text-lg font-semibold" style={{ color: '#E8E0D0' }}>Session History</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg" style={{ color: '#6A6458' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎵</div>
                  <div className="text-sm" style={{ color: '#4A4840' }}>No sessions saved yet</div>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <button onClick={handleClear} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ color: '#6A6458', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Trash2 size={12} /> Clear all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map((session, i) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-medium capitalize" style={{ color: '#C0B090' }}>
                              {session.instrument} session
                            </div>
                            <div className="text-xs font-mono mt-0.5" style={{ color: '#4A4840' }}>
                              {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button onClick={() => handleDelete(session.id)} className="p-1.5 rounded-lg" style={{ color: '#4A4840' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#4A4840')}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {session.key && (
                            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                              <div className="text-xs" style={{ color: '#4A4840' }}>Key</div>
                              <div className="text-sm font-mono" style={{ color: '#C9A84C' }}>{session.key.key}</div>
                            </div>
                          )}
                          {session.bpm && session.bpm.bpm > 0 && (
                            <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                              <div className="text-xs" style={{ color: '#4A4840' }}>BPM</div>
                              <div className="text-sm font-mono" style={{ color: '#C9A84C' }}>{session.bpm.bpm}</div>
                            </div>
                          )}
                          <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <div className="text-xs" style={{ color: '#4A4840' }}>Notes</div>
                            <div className="text-sm font-mono" style={{ color: '#C9A84C' }}>{session.notes.length}</div>
                          </div>
                        </div>
                        {session.chords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {session.chords.slice(0, 4).map(c => (
                              <span key={c.name} className="note-pill text-xs">{c.name}</span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
