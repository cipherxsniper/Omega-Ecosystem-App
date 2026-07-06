import React, { useRef, useEffect, useState } from 'react';

const WORLD_FEATURES = {
  void_nexus: { shapes: 'geometry', eyeCount: 3, portalGlow: true },
  mirror_depths: { shapes: 'crystals', eyeCount: 5, portalGlow: false },
  ember_wastes: { shapes: 'embers', eyeCount: 2, portalGlow: true },
  chronos_spire: { shapes: 'clocks', eyeCount: 4, portalGlow: true },
  oracle_sanctum: { shapes: 'eye_mandala', eyeCount: 7, portalGlow: true },
};

export default function LanternCanvas({ gameState, world }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let running = true;
    const features = WORLD_FEATURES[gameState.current_world] || WORLD_FEATURES.void_nexus;

    const animate = (t) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Dark background
      ctx.fillStyle = world.color;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2 + gameState.current_x * 3;
      const cy = h / 2 + gameState.current_y * 3;
      const lanternRadius = (gameState.lantern_fuel / 100) * Math.min(w, h) * 0.4 + 30;

      // Shifting geometry
      const phase = t * 0.001;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + phase * 0.3;
        const dist = 60 + Math.sin(phase + i) * 30;
        const gx = cx + Math.cos(angle) * dist;
        const gy = cy + Math.sin(angle) * dist;
        ctx.strokeStyle = world.accent + '15';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const sides = 3 + (i % 4);
        for (let s = 0; s <= sides; s++) {
          const a = (s / sides) * Math.PI * 2 + phase * 0.5;
          const r = 15 + Math.sin(phase * 2 + i) * 8;
          const px = gx + Math.cos(a) * r;
          const py = gy + Math.sin(a) * r;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Floating eyes
      for (let i = 0; i < features.eyeCount; i++) {
        const eyeAngle = (i / features.eyeCount) * Math.PI * 2 + phase * 0.2;
        const eyeDist = 80 + Math.sin(phase * 0.5 + i * 2) * 40;
        const ex = cx + Math.cos(eyeAngle) * eyeDist;
        const ey = cy + Math.sin(eyeAngle) * eyeDist;
        const distFromLantern = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2);
        const visible = distFromLantern < lanternRadius;

        if (visible) {
          const alpha = Math.max(0, 1 - distFromLantern / lanternRadius) * 0.7;
          // Eye outer
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(ex, ey, 10, 6, 0, 0, Math.PI * 2);
          ctx.stroke();
          // Iris
          ctx.fillStyle = `rgba(56, 210, 189, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(ex, ey, 3, 0, Math.PI * 2);
          ctx.fill();
          // Pupil
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.arc(ex - 1, ey - 1, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Portal shimmer
      if (features.portalGlow) {
        const px = cx + Math.cos(phase) * 100;
        const py = cy + Math.sin(phase * 0.7) * 60;
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
        if (dist < lanternRadius) {
          const grad = ctx.createRadialGradient(px, py, 0, px, py, 15);
          grad.addColorStop(0, world.accent + '40');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, 15, 0, Math.PI * 2);
          ctx.fill();
          // Swirl
          ctx.strokeStyle = world.accent + '30';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let s = 0; s < 30; s++) {
            const sa = (s / 30) * Math.PI * 4 + phase * 3;
            const sr = s * 0.5;
            const sx = px + Math.cos(sa) * sr;
            const sy = py + Math.sin(sa) * sr;
            s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
      }

      // Lantern glow (player)
      const lanternGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, lanternRadius);
      lanternGrad.addColorStop(0, 'rgba(255, 200, 50, 0.15)');
      lanternGrad.addColorStop(0.5, 'rgba(255, 200, 50, 0.05)');
      lanternGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lanternGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, lanternRadius, 0, Math.PI * 2);
      ctx.fill();

      // Player dot
      ctx.fillStyle = '#ffc832';
      ctx.shadowColor = '#ffc832';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Darkness vignette
      const vignetteGrad = ctx.createRadialGradient(cx, cy, lanternRadius * 0.8, cx, cy, Math.max(w, h));
      vignetteGrad.addColorStop(0, 'transparent');
      vignetteGrad.addColorStop(1, world.color);
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gameState.current_world, gameState.current_x, gameState.current_y, gameState.lantern_fuel]);

  return (
    <div className="tile-card rounded-xl overflow-hidden relative">
      <canvas ref={canvasRef} className="w-full" style={{ height: '280px' }} />
      <div className="absolute bottom-2 left-3 text-[9px] font-mono text-muted-foreground/50">
        {world.name} · ({gameState.current_x}, {gameState.current_y})
      </div>
    </div>
  );
}