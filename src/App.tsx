import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import HeroSection from './components/Layout/HeroSection';
import HistoryPanel from './components/Layout/HistoryPanel';
import AnalyzePage from './pages/AnalyzePage';
import PracticePage from './pages/PracticePage';
import HumPage from './pages/HumPage';
import type { AppMode, Instrument } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('analyze');
  const [instrument, setInstrument] = useState<Instrument>('generic');
  const [heroVisible, setHeroVisible] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    setHeroVisible(false);
    setTimeout(() => mainRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--black-deep)' }}>
      <Navbar mode={mode} onModeChange={(m) => { setMode(m); setHeroVisible(false); }} onHistoryOpen={() => setHistoryOpen(true)} />

      <AnimatePresence>
        {heroVisible && (
          <motion.div
            key="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <HeroSection onStart={handleStart} />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={mainRef} className="pt-20">
        {!heroVisible && (
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {mode === 'analyze' && (
                <AnalyzePage instrument={instrument} onInstrumentChange={setInstrument} />
              )}
              {mode === 'practice' && <PracticePage instrument={instrument} />}
              {mode === 'hum' && <HumPage />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
