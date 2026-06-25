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

      // Grid lines
      ctx.strokeStyle = 'rgba(201,168,76,0.06)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (H / 4) * i);
        ctx.lineTo(W, (H / 4) * i);
        ctx.stroke();
      }

      const data = dataRef.current;
      if (!data || !isActive) {
        // Flatline
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(201,168,76,0.2)';
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
        return;
      }

      // Waveform
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(0, 0, W, 0);
      gradient.addColorStop(0, 'rgba(201,168,76,0.3)');
      gradient.addColorStop(0.5, '#C9A84C');
      gradient.addColorStop(1, 'rgba(201,168,76,0.3)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 * window.devicePixelRatio;

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

      // Fill under
      ctx.lineTo(W, H / 2);
      ctx.lineTo(0, H / 2);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, 0, 0, H);
      fillGrad.addColorStop(0, 'rgba(201,168,76,0.08)');
      fillGrad.addColorStop(1, 'rgba(201,168,76,0)');
      ctx.fillStyle = fillGrad;
      ctx.fill();
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive]);

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold mb-5" style={{ color: '#E8E0D0' }}>
        Waveform
      </h3>
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', height: '120px' }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
      </div>
      <div className="flex justify-between mt-2 text-xs font-mono" style={{ color: '#3A3830' }}>
        <span>0 Hz</span>
        <span>Amplitude</span>
        <span>Nyquist</span>
      </div>
    </div>
  );
}
