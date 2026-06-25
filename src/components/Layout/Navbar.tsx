import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Menu, X, Mic, History, Layers, User, Settings, Moon } from 'lucide-react';
import type { AppMode } from '../../types';

interface NavbarProps {
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onHistoryOpen: () => void;
}

export default function Navbar({ mode, onModeChange, onHistoryOpen }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { label: string; value: AppMode; icon: React.ReactNode }[] = [
    { label: 'Studio Analyzer', value: 'analyze', icon: <Layers size={15} /> },
    { label: 'Practice Academy', value: 'practice', icon: <Mic size={15} /> },
    { label: 'Hum Matcher', value: 'hum', icon: <Music size={15} /> },
  ];

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-7xl">
      {/* Floating Glassmorphic Container */}
      <div 
        className="px-6 h-16 flex items-center justify-between rounded-2xl border transition-all duration-300"
        style={{
          background: 'rgba(10, 10, 15, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderColor: 'rgba(201, 168, 76, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 20px rgba(201, 168, 76, 0.03)',
        }}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onModeChange('analyze')}>
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:rotate-6" 
            style={{ 
              background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)',
              boxShadow: '0 0 10px rgba(201,168,76,0.3)'
            }}
          >
            <Music size={18} className="text-zinc-950 font-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-black tracking-wider text-gold-gradient">JAZZIQUE</span>
            <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 -mt-1">Studio Suite</span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-1.5 bg-zinc-950/40 p-1.5 rounded-xl border border-white/5">
          {navItems.map(item => {
            const isActive = mode === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onModeChange(item.value)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer"
                style={{
                  color: isActive ? '#C9A84C' : '#8A8880',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 rounded-lg border"
                    style={{
                      background: 'rgba(201,168,76,0.06)',
                      borderColor: 'rgba(201,168,76,0.2)',
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

        {/* Utilities & Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onHistoryOpen}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 transition-all text-zinc-400 cursor-pointer"
          >
            <History size={14} />
            <span>History</span>
          </button>

          <button 
            className="p-2 rounded-xl border border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-gold-light hover:bg-zinc-900/60 transition-all cursor-pointer"
            title="Theme: Studio Dark"
          >
            <Moon size={14} />
          </button>

          <button 
            className="p-2 rounded-xl border border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-gold-light hover:bg-zinc-900/60 transition-all cursor-pointer"
            title="Settings"
          >
            <Settings size={14} />
          </button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* User Profile placeholder */}
          <div 
            className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center bg-zinc-900 cursor-pointer overflow-hidden transition-transform hover:scale-105"
            title="Studio Profile"
          >
            <User size={14} className="text-gold" />
          </div>

          <button className="md:hidden p-2 rounded-xl border border-white/5 bg-zinc-950/40 text-gold-light" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mt-2 rounded-2xl border p-4 flex flex-col gap-2 z-40 overflow-hidden"
            style={{ 
              borderColor: 'rgba(201, 168, 76, 0.15)', 
              background: 'rgba(10,10,15,0.96)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
            }}
          >
            {navItems.map(item => (
              <button
                key={item.value}
                onClick={() => { onModeChange(item.value); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-left transition-all"
                style={{
                  background: mode === item.value ? 'rgba(201,168,76,0.08)' : 'transparent',
                  color: mode === item.value ? '#C9A84C' : '#9A9080',
                  border: mode === item.value ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { onHistoryOpen(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-left text-zinc-400 hover:bg-white/5 transition-all"
            >
              <History size={15} />
              Session History
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
