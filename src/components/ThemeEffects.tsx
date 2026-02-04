import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getWeatherConfig,
  createParticles,
  updateParticles,
  Particle,
} from '../themes/weather';
import { createClouds, updateCloud, Cloud } from '../themes/animations';
import type { DailyTheme, BackgroundEffect } from '../themes/dailyThemes.types';

interface ThemeEffectsProps {
  collectionTheme: DailyTheme | null;
}

// Theme effects that should be rendered by this component (NOT weather effects)
const THEME_EFFECTS: BackgroundEffect[] = [
  'fog',
  'fireflies',
  'aurora',
  'glitter',
  'sparkles',
  'stars',
  'dust',
  'leaves',
  'petals',
  'confetti',
  'hearts',
  'bubbles',
];

// Check if an effect is a theme effect (not weather)
function isThemeEffect(effect: BackgroundEffect | undefined): boolean {
  if (!effect || effect === 'none') return false;
  return THEME_EFFECTS.includes(effect);
}

export function ThemeEffects({ collectionTheme }: ThemeEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const themeEffect = collectionTheme?.backgroundEffect || 'none';
  const hasThemeEffect = isThemeEffect(themeEffect);

  // Get base config (used for overlay, etc.)
  const config = getWeatherConfig('clear');

  // Initialize particles and clouds for theme effects
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && hasThemeEffect) {
      // Create particles for theme effects
      particlesRef.current = createParticles('clear', dimensions.width, dimensions.height);

      // Create clouds for fog/aurora
      if (themeEffect === 'fog' || themeEffect === 'aurora') {
        cloudsRef.current = createClouds(themeEffect === 'fog' ? 12 : 8);
      } else {
        cloudsRef.current = [];
      }
    }
  }, [themeEffect, hasThemeEffect, dimensions.width, dimensions.height]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw fog effect
  const drawFog = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    cloudsRef.current.forEach((cloud) => {
      const baseX = (cloud.x / 100) * width;
      const verticalOffset = Math.sin(cloud.driftPhase + time * 0.0003) * 5;
      const baseY = (cloud.y / 100) * height + verticalOffset;
      const baseScale = cloud.scale * 80;

      const gradient = ctx.createRadialGradient(
        baseX, baseY, 0,
        baseX, baseY, baseScale
      );
      const alpha = cloud.opacity * 0.4;
      gradient.addColorStop(0, `rgba(200, 200, 210, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(180, 180, 195, ${alpha * 0.6})`);
      gradient.addColorStop(0.7, `rgba(160, 160, 175, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(150, 150, 165, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.ellipse(baseX, baseY, baseScale, baseScale * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Draw fireflies effect
  const drawFireflies = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      const pulse = (Math.sin(time * 0.003 + index * 0.5) + 1) * 0.5;
      const alpha = particle.opacity * (0.3 + pulse * 0.7);
      const glowSize = particle.size * (1.5 + pulse);

      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glowSize * 3
      );
      gradient.addColorStop(0, `rgba(255, 250, 150, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(200, 255, 100, ${alpha * 0.6})`);
      gradient.addColorStop(0.6, `rgba(150, 255, 50, ${alpha * 0.2})`);
      gradient.addColorStop(1, 'rgba(100, 200, 50, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, glowSize * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Draw glitter/sparkles effect
  const drawGlitter = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      const sparkle = (Math.sin(time * 0.005 + index * 1.5) + 1) * 0.5;
      if (sparkle < 0.3) return;

      const alpha = particle.opacity * sparkle;
      const size = particle.size * (0.5 + sparkle);

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(particle.x - size, particle.y);
      ctx.lineTo(particle.x + size, particle.y);
      ctx.moveTo(particle.x, particle.y - size);
      ctx.lineTo(particle.x, particle.y + size);
      const diagSize = size * 0.7;
      ctx.moveTo(particle.x - diagSize, particle.y - diagSize);
      ctx.lineTo(particle.x + diagSize, particle.y + diagSize);
      ctx.moveTo(particle.x + diagSize, particle.y - diagSize);
      ctx.lineTo(particle.x - diagSize, particle.y + diagSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.arc(particle.x, particle.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Draw aurora effect
  const drawAurora = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const waveCount = 3;
    for (let w = 0; w < waveCount; w++) {
      const yOffset = height * 0.2 + w * 30;
      const colors = [
        { r: 0, g: 255, b: 150 },
        { r: 100, g: 200, b: 255 },
        { r: 150, g: 100, b: 255 },
      ];
      const color = colors[w % colors.length];
      if (!color) continue;

      ctx.beginPath();
      ctx.moveTo(0, yOffset);

      for (let x = 0; x <= width; x += 10) {
        const wave1 = Math.sin((x + time * 0.05) * 0.01 + w) * 30;
        const wave2 = Math.sin((x + time * 0.03) * 0.02 + w * 2) * 20;
        const y = yOffset + wave1 + wave2;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, yOffset - 50, 0, height);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);
      gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }, []);

  // Draw stars effect (night sky)
  const drawStars = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      // Twinkling effect
      const twinkle = (Math.sin(time * 0.002 + index * 0.8) + 1) * 0.5;
      const alpha = particle.opacity * (0.5 + twinkle * 0.5);
      const glowSize = particle.size * (2 + twinkle);

      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glowSize
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.3, `rgba(255, 250, 240, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 250, 240, 0)');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Star core
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Draw dust effect
  const drawDust = useCallback((ctx: CanvasRenderingContext2D, width: number) => {
    const beamCenterX = width * 0.5;
    const beamWidth = width * 0.4;

    particlesRef.current.forEach(particle => {
      const distFromBeam = Math.abs(particle.x - beamCenterX);
      if (distFromBeam < beamWidth) {
        const beamFade = 1 - distFromBeam / beamWidth;
        const alpha = particle.opacity * beamFade * 0.8;

        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, `rgba(255, 250, 220, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 245, 200, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 240, 180, 0)');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, []);

  // Draw leaves effect
  const drawLeaves = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const colors = [
      { r: 205, g: 92, b: 0 },   // Dark orange
      { r: 139, g: 69, b: 19 },  // Brown
      { r: 210, g: 105, b: 30 }, // Chocolate
      { r: 178, g: 34, b: 34 },  // Firebrick red
    ];

    particlesRef.current.forEach((particle, index) => {
      const color = colors[index % colors.length];
      if (!color) return;
      const wobble = Math.sin(time * 0.002 + index) * 0.3;
      const rotation = time * 0.001 + index * 0.5;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(rotation + wobble);

      // Draw leaf shape
      ctx.beginPath();
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.opacity})`;
      const size = particle.size * 2;
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(size, 0, 0, size);
      ctx.quadraticCurveTo(-size, 0, 0, -size);
      ctx.fill();

      ctx.restore();
    });
  }, []);

  // Draw petals effect
  const drawPetals = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const colors = [
      { r: 255, g: 182, b: 193 }, // Light pink
      { r: 255, g: 192, b: 203 }, // Pink
      { r: 255, g: 240, b: 245 }, // Lavender blush
      { r: 255, g: 228, b: 225 }, // Misty rose
    ];

    particlesRef.current.forEach((particle, index) => {
      const color = colors[index % colors.length];
      if (!color) return;
      const wobble = Math.sin(time * 0.002 + index) * 0.3;
      const rotation = time * 0.0015 + index * 0.5;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(rotation + wobble);

      ctx.beginPath();
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.opacity})`;
      const size = particle.size * 1.5;
      ctx.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }, []);

  // Draw confetti effect
  const drawConfetti = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const colors = [
      { r: 255, g: 0, b: 128 },   // Hot pink
      { r: 0, g: 191, b: 255 },   // Deep sky blue
      { r: 255, g: 215, b: 0 },   // Gold
      { r: 50, g: 205, b: 50 },   // Lime green
      { r: 148, g: 0, b: 211 },   // Dark violet
    ];

    particlesRef.current.forEach((particle, index) => {
      const color = colors[index % colors.length];
      if (!color) return;
      const rotation = time * 0.003 + index;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(rotation);

      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.opacity})`;
      const size = particle.size * 1.5;
      ctx.fillRect(-size / 2, -size / 4, size, size / 2);

      ctx.restore();
    });
  }, []);

  // Draw hearts effect
  const drawHearts = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      const pulse = (Math.sin(time * 0.003 + index * 0.5) + 1) * 0.1;
      const size = particle.size * (1 + pulse);
      const alpha = particle.opacity * (0.7 + pulse * 2);

      ctx.save();
      ctx.translate(particle.x, particle.y);

      // Draw heart shape
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 100, 130, ${alpha})`;
      const scale = size * 0.8;
      ctx.moveTo(0, scale * 0.3);
      ctx.bezierCurveTo(-scale, -scale * 0.3, -scale, scale * 0.5, 0, scale);
      ctx.bezierCurveTo(scale, scale * 0.5, scale, -scale * 0.3, 0, scale * 0.3);
      ctx.fill();

      ctx.restore();
    });
  }, []);

  // Draw bubbles effect
  const drawBubbles = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      const wobble = Math.sin(time * 0.002 + index) * 2;
      const size = particle.size * 2;

      // Bubble body
      const gradient = ctx.createRadialGradient(
        particle.x + wobble - size * 0.3, particle.y - size * 0.3, 0,
        particle.x + wobble, particle.y, size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(200, 230, 255, ${particle.opacity * 0.3})`);
      gradient.addColorStop(1, `rgba(150, 200, 255, ${particle.opacity * 0.1})`);

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(particle.x + wobble, particle.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Bubble highlight
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.6})`;
      ctx.arc(particle.x + wobble - size * 0.3, particle.y - size * 0.3, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Animation loop
  useEffect(() => {
    if (!hasThemeEffect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      const deltaTime = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw background overlay if applicable
      if (config.backgroundOverlay) {
        ctx.fillStyle = config.backgroundOverlay;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      // Update particles for effects that use them
      if (['fireflies', 'glitter', 'sparkles', 'stars', 'dust', 'leaves', 'petals', 'confetti', 'hearts', 'bubbles'].includes(themeEffect)) {
        particlesRef.current = updateParticles(
          particlesRef.current,
          'clear',
          dimensions.width,
          dimensions.height,
          deltaTime
        );
      }

      // Update clouds for fog/aurora
      if (themeEffect === 'fog' || themeEffect === 'aurora') {
        cloudsRef.current = cloudsRef.current.map(cloud => updateCloud(cloud, deltaTime));
      }

      // Draw based on theme effect
      switch (themeEffect) {
        case 'fog':
          drawFog(ctx, dimensions.width, dimensions.height, time);
          break;
        case 'fireflies':
          drawFireflies(ctx, time);
          break;
        case 'glitter':
        case 'sparkles':
          drawGlitter(ctx, time);
          break;
        case 'stars':
          drawStars(ctx, time);
          break;
        case 'aurora':
          drawAurora(ctx, dimensions.width, dimensions.height, time);
          break;
        case 'dust':
          drawDust(ctx, dimensions.width);
          break;
        case 'leaves':
          drawLeaves(ctx, time);
          break;
        case 'petals':
          drawPetals(ctx, time);
          break;
        case 'confetti':
          drawConfetti(ctx, time);
          break;
        case 'hearts':
          drawHearts(ctx, time);
          break;
        case 'bubbles':
          drawBubbles(ctx, time);
          break;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [hasThemeEffect, themeEffect, dimensions, config, drawFog, drawFireflies, drawGlitter, drawStars, drawAurora, drawDust, drawLeaves, drawPetals, drawConfetti, drawHearts, drawBubbles]);

  // Don't render if no theme effect
  if (!hasThemeEffect) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 3 }}
    />
  );
}
