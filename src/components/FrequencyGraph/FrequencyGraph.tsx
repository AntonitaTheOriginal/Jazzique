import { useRef, useEffect } from 'react';

interface FrequencyGraphProps {
  freqData: Float32Array | null;
  isActive: boolean;
}

export default function FrequencyGraph({ freqData, isActive }: FrequencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dataRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    dataRef.current = freqData;
  }, [freqData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.offsetWidth * window.devicePixelRatio;
      const H = canvas.offsetHeight * window.devicePixelRatio;
      canvas.width = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);

      // Draw Grid Lines (DAW style)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      const verticalLines = 10;
      for (let i = 1; i < verticalLines; i++) {
        ctx.beginPath();
        ctx.moveTo((W / verticalLines) * i, 0);
        ctx.lineTo((W / verticalLines) * i, H);
        ctx.stroke();
      }

      // Horizontal grid lines
      const horizontalLines = 4;
      for (let i = 1; i < horizontalLines; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (H / horizontalLines) * i);
        ctx.lineTo(W, (H / horizontalLines) * i);
        ctx.stroke();
      }

      const data = dataRef.current;
      if (!data || !isActive) {
        // Flatline
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)'; // Cyan
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
        return;
      }

      // Draw dynamic Waveform
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(0, 0, W, 0);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
      gradient.addColorStop(0.5, '#06b6d4'); // Cyan accent
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5 * window.devicePixelRatio;

      const sliceWidth = W / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i]; // -1 to 1
        const y = ((v + 1) / 2) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // Translucent cyan fill under graph
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      
      const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
      fillGrad.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
      fillGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-100">
            Acoustic Signal Scope
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">Real-time time domain analyzer</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.04)', height: '120px' }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
      </div>
      
      <div className="flex justify-between mt-2.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500">
        <span>0 ms</span>
        <span>Acoustic Waveform Amplitude</span>
        <span>250 ms</span>
      </div>
    </div>
  );
}
