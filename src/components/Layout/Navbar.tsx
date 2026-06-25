import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Menu, X, Mic, History, Layers, User, Settings } from 'lucide-react';
import type { AppMode } from '../../types';

interface NavbarProps {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onHistoryOpen: () => void;
}

export default function Navbar({ mode, onModeChange, onHistoryOpen }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; value: AppMode; icon: React.ReactNode }[] = [
    { label: 'Studio Analyzer', value: 'analyze', icon: <Layers size={14} /> },
    { label: 'Practice Academy', value: 'practice', icon: <Mic size={14} /> },
    { label: 'Hum Matcher', value: 'hum', icon: <Music size={14} /> },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100]"
      style={{
        background: 'rgba(5, 5, 7, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: '1px solid rgba(201, 168, 76, 0.1)',
        boxShadow: '0 1px 0 rgba(201,168,76,0.06), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Content constrained to page-container width */}
      <div className="page-container">
        <div className="flex items-center justify-between h-[76px]">

          {/* ── Logo / Brand ─────────────────────────────── */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={() => onModeChange('analyze')}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:rotate-6"
              style={{
                background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)',
                boxShadow: '0 0 10px rgba(201,168,76,0.25)',
              }}
            >
              <Music size={17} className="text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-black tracking-wider text-gold-gradient leading-none">JAZZIQUE</span>
              <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500">Studio Suite</span>
            </div>
          </div>

          {/* ── Desktop Navigation Tabs ───────────────────── */}
          <div className="hidden md:flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-white/5">
            {navItems.map(item => {
              const isActive = mode === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => onModeChange(item.value)}
                  className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-250 cursor-pointer"
                  style={{ color: isActive ? '#C9A84C' : '#7A7470' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBg"
                      className="absolute inset-0 rounded-lg border"
                      style={{
                        background: 'rgba(201,168,76,0.07)',
                        borderColor: 'rgba(201,168,76,0.18)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {item.icon}
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Right Utilities ───────────────────────────── */}
          <div className="flex items-center gap-2">
            <button
              onClick={onHistoryOpen}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-all cursor-pointer"
              style={{ color: '#6A6460' }}
            >
              <History size={13} />
              <span>History</span>
            </button>

            <button
              className="p-2 rounded-lg border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-all cursor-pointer"
              title="Settings"
              style={{ color: '#6A6460' }}
            >
              <Settings size={14} />
            </button>

            <div className="h-5 w-px bg-white/8 mx-0.5 hidden sm:block" />

            <div
              className="w-8 h-8 rounded-full border flex items-center justify-center bg-zinc-900 cursor-pointer transition-transform hover:scale-105"
              style={{ borderColor: 'rgba(201,168,76,0.2)' }}
              title="Studio Profile"
            >
              <User size={14} style={{ color: '#C9A84C' }} />
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg border border-white/5 bg-zinc-950/40 cursor-pointer"
              style={{ color: '#C9A84C' }}
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown Menu ──────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              borderTop: '1px solid rgba(201, 168, 76, 0.08)',
              background: 'rgba(5, 5, 7, 0.98)',
              overflow: 'hidden',
            }}
          >
            <div className="page-container py-3 flex flex-col gap-1">
              {navItems.map(item => (
                <button
                  key={item.value}
                  onClick={() => { onModeChange(item.value); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                  style={{
                    background: mode === item.value ? 'rgba(201,168,76,0.08)' : 'transparent',
                    color: mode === item.value ? '#C9A84C' : '#8A8480',
                    border: mode === item.value ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { onHistoryOpen(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all hover:bg-white/5"
                style={{ color: '#6A6460' }}
              >
                <History size={14} />
                Session History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
