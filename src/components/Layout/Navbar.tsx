import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Menu, X, Mic, History, Layers } from 'lucide-react';
import type { AppMode } from '../../types';

interface NavbarProps {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onHistoryOpen: () => void;
}

export default function Navbar({ mode, onModeChange, onHistoryOpen }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; value: AppMode; icon: React.ReactNode }[] = [
    { label: 'Analyze', value: 'analyze', icon: <Layers size={16} /> },
    { label: 'Practice', value: 'practice', icon: <Mic size={16} /> },
    { label: 'Hum a Song', value: 'hum', icon: <Music size={16} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(5,5,7,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)' }}>
            <Music size={18} className="text-black" />
          </div>
          <span className="font-display text-xl font-bold text-gold-gradient">Jazzique</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.value}
              onClick={() => onModeChange(item.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: mode === item.value ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: mode === item.value ? '#C9A84C' : '#9A9080',
                border: mode === item.value ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onHistoryOpen}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
            style={{ color: '#9A9080', border: '1px solid rgba(201,168,76,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)')}
          >
            <History size={16} />
            History
          </button>

          <button className="md:hidden p-2 rounded-lg" style={{ color: '#C9A84C' }} onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ borderTop: '1px solid rgba(201,168,76,0.1)', background: 'rgba(10,10,15,0.98)' }}
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navItems.map(item => (
                <button
                  key={item.value}
                  onClick={() => { onModeChange(item.value); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left"
                  style={{
                    background: mode === item.value ? 'rgba(201,168,76,0.1)' : 'transparent',
                    color: mode === item.value ? '#C9A84C' : '#9A9080',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { onHistoryOpen(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                style={{ color: '#9A9080' }}
              >
                <History size={16} />
                Session History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
