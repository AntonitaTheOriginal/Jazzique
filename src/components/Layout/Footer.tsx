import { Music, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-24 py-10" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9A84C, #9A7A2E)' }}>
            <Music size={13} className="text-black" />
          </div>
          <span className="font-display text-base font-bold text-gold-gradient">Jazzique</span>
        </div>
        <p className="text-sm flex items-center gap-1" style={{ color: '#4A4840' }}>
          Built with <Heart size={12} fill="#C9A84C" style={{ color: '#C9A84C' }} /> for musicians everywhere
        </p>
        <p className="text-xs" style={{ color: '#3A3830' }}>© 2025 Jazzique · Turn Any Melody Into Music</p>
      </div>
    </footer>
  );
}
