"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    let animationId = 0;
    let particles: Particle[] = [];

    let mouseX = -1000;
    let mouseY = -1000;
    let width = 0;
    let height = 0;
    let reducedMotion = false;
    let coarsePointer = false;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    function resolveSettings() {
      const viewportArea = width * height;
      const mobile = coarsePointer || width < 768;

      return {
        particleCount: reducedMotion ? Math.max(16, Math.round(viewportArea / 135000)) : mobile ? Math.max(22, Math.round(viewportArea / 72000)) : Math.max(42, Math.round(viewportArea / 42000)),
        connectDistance: mobile ? 96 : 148,
        mouseRadius: reducedMotion || mobile ? 0 : 170,
        speedScale: reducedMotion ? 0 : mobile ? 0.2 : 0.34,
      };
    }

    function resize() {
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const settings = resolveSettings();

      particles = Array.from({ length: settings.particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * settings.speedScale,
        vy: (Math.random() - 0.5) * settings.speedScale,
        size: Math.random() * 1.6 + (coarsePointer ? 0.8 : 0.55),
        opacity: Math.random() * 0.4 + 0.12,
        pulseSpeed: Math.random() * 0.012 + 0.004,
        pulseOffset: Math.random() * Math.PI * 2,
      }));
    }

    function draw(time: number) {
      if (!ctx || !canvas) return;

      const settings = resolveSettings();
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
        }

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!reducedMotion && settings.mouseRadius > 0 && dist > 0.001 && dist < settings.mouseRadius) {
          const force = (settings.mouseRadius - dist) / settings.mouseRadius;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;

          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 0.8) {
            p.vx = (p.vx / speed) * 0.8;
            p.vy = (p.vy / speed) * 0.8;
          }
        }

        const pulse = reducedMotion ? 0.82 : Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.2 + 0.8;
        const alpha = p.opacity * pulse;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(228, 228, 231, ${alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const connDx = p.x - p2.x;
          const connDy = p.y - p2.y;
          const connDist = Math.sqrt(connDx * connDx + connDy * connDy);

          if (connDist < settings.connectDistance) {
            const lineAlpha = (1 - connDist / settings.connectDistance) * (reducedMotion ? 0.04 : 0.07) * pulse;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(228, 228, 231, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (!reducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function handleMouseLeave() {
      mouseX = -1000;
      mouseY = -1000;
    }

    function handleMediaChange() {
      reducedMotion = reducedMotionQuery.matches;
      coarsePointer = coarsePointerQuery.matches;
      resize();
      cancelAnimationFrame(animationId);
      draw(performance.now());
    }

    reducedMotion = reducedMotionQuery.matches;
    coarsePointer = coarsePointerQuery.matches;
    resize();
    draw(performance.now());

    window.addEventListener("resize", resize);
    if (!coarsePointer && !reducedMotion) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseleave", handleMouseLeave);
    }
    reducedMotionQuery.addEventListener("change", handleMediaChange);
    coarsePointerQuery.addEventListener("change", handleMediaChange);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      reducedMotionQuery.removeEventListener("change", handleMediaChange);
      coarsePointerQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ opacity: 0.68 }}
    />
  );
}
