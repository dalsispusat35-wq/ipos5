import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeTransitionOverlay() {
  const { transitionEffect, clearTransitionEffect } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!transitionEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const startTime = performance.now();
    const DURATION = 550; // Ultra crisp 550ms for maximum smoothness

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const isToDark = transitionEffect.toTheme === 'dark';
    const originX = transitionEffect.origin?.x ?? width - 80;
    const originY = transitionEffect.origin?.y ?? 35;

    // Pre-calculate max diagonal reach
    const maxRadius = Math.hypot(
      Math.max(originX, width - originX),
      Math.max(originY, height - originY)
    ) * 1.08;

    // 48 High-Tech Cyber Sparks ("Totol-totol Partikel")
    const particles = Array.from({ length: 48 }, (_, i) => {
      const angle = (i / 48) * Math.PI * 2 + (Math.random() * 0.25 - 0.125);
      const speed = 0.45 + Math.random() * 0.75;
      const size = 1.8 + Math.random() * 3.2;
      const glow = Math.random() > 0.4;
      const delay = Math.random() * 0.12;
      return { angle, speed, size, glow, delay };
    });

    const render = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      // Silky Smooth Quintic Ease-Out Curve
      const ease = 1 - Math.pow(1 - progress, 3.5);

      ctx.clearRect(0, 0, width, height);

      const currentRadius = ease * maxRadius;

      // ── 1. LUMINOUS WAVE RIPPLE (NEON SHOCKWAVE) ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(originX, originY, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isToDark 
        ? `rgba(56, 189, 248, ${Math.max(0, 0.7 * (1 - progress))})` 
        : `rgba(245, 158, 11, ${Math.max(0, 0.7 * (1 - progress))})`;
      ctx.lineWidth = Math.max(1, 4.5 * (1 - progress));
      ctx.shadowColor = isToDark ? '#38bdf8' : '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      // ── 2. SECONDARY SOFT ACCENT RING ──
      if (currentRadius > 30) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(originX, originY, Math.max(0, currentRadius - 28), 0, Math.PI * 2);
        ctx.strokeStyle = isToDark 
          ? `rgba(129, 140, 248, ${Math.max(0, 0.35 * (1 - progress))})` 
          : `rgba(251, 191, 36, ${Math.max(0, 0.35 * (1 - progress))})`;
        ctx.lineWidth = Math.max(0.5, 2 * (1 - progress));
        ctx.stroke();
        ctx.restore();
      }

      // ── 3. DISPERSING CYBER PARTICLES ("TOTOL-TOTOL NEON") ──
      ctx.save();
      for (const p of particles) {
        if (progress < p.delay) continue;
        const pProgress = Math.min((progress - p.delay) / (1 - p.delay), 1);
        const pEase = 1 - Math.pow(1 - pProgress, 3);
        const dist = pEase * (maxRadius * 0.9) * p.speed;
        const px = originX + Math.cos(p.angle) * dist;
        const py = originY + Math.sin(p.angle) * dist;
        const alpha = Math.sin(pProgress * Math.PI) * (p.glow ? 0.95 : 0.65);

        if (px >= 0 && px <= width && py >= 0 && py <= height && alpha > 0.02) {
          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 - pProgress * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = isToDark 
            ? `rgba(56, 189, 248, ${alpha})` 
            : `rgba(245, 158, 11, ${alpha})`;
          if (p.glow) {
            ctx.shadowColor = isToDark ? '#38bdf8' : '#fbbf24';
            ctx.shadowBlur = 10;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
      }
      ctx.restore();

      // ── 4. SUBTLE AMBIENT FLASH BLOOM ──
      const flashAlpha = Math.sin(progress * Math.PI) * 0.08;
      ctx.fillStyle = isToDark 
        ? `rgba(56, 189, 248, ${flashAlpha})` 
        : `rgba(245, 158, 11, ${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        clearTransitionEffect();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [transitionEffect, clearTransitionEffect]);

  if (!transitionEffect) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999,
        willChange: 'transform'
      }}
    />
  );
}
