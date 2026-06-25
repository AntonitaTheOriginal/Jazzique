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

  const handleModeChange = (m: AppMode) => {
    setMode(m);
    setHeroVisible(false);
  };

  return (
    <div style={{ background: 'var(--black-deep)', minHeight: '100vh' }}>
      {/* Fixed Navbar — z-index 100 ensures it is always above content */}
      <Navbar
        mode={mode}
        onModeChange={handleModeChange}
        onHistoryOpen={() => setHistoryOpen(true)}
      />

      {/* Hero Section */}
      <AnimatePresence>
        {heroVisible && (
          <motion.div
            key="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45 }}
          >
            <HeroSection onStart={handleStart} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Content
          .app-main adds padding-top: var(--page-padding-top) = 108px
          so content always starts below the 76px navbar.
      */}
      <div ref={mainRef}>
        {!heroVisible && (
          <main className="app-main">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {mode === 'analyze' && (
                  <AnalyzePage instrument={instrument} onInstrumentChange={setInstrument} />
                )}
                {mode === 'practice' && <PracticePage instrument={instrument} />}
                {mode === 'hum' && <HumPage />}
              </motion.div>
            </AnimatePresence>
          </main>
        )}
      </div>

      <Footer />
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
