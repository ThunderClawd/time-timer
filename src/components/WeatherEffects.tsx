import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Weather,
  getWeatherConfig,
  createParticles,
  updateParticles,
  Particle,
  Splash,
  createSplashes,
  updateSplashes,
  ShootingStar,
  createShootingStar,
  updateShootingStar,
} from '../themes/weather';
import { createClouds, updateCloud, Cloud } from '../themes/animations';
import { isNightTime } from '../themes/seasons';
import type { DailyTheme, BackgroundEffect } from '../themes/dailyThemes.types';

interface WeatherEffectsProps {
  weather: Weather;
  debugTime?: number | null;
  collectionTheme?: DailyTheme | null;
}

// Map BackgroundEffect to Weather type or 'custom' for special effects
function mapBackgroundEffectToWeather(effect: BackgroundEffect): Weather | 'custom' {
  switch (effect) {
    case 'snow':
      return 'snowy';
    case 'rain':
      return 'rainy';
    case 'fog':
    case 'dust':
    case 'aurora':
      return 'cloudy';
    case 'stars':
    case 'fireflies':
    case 'glitter':
    case 'sparkles':
      return 'clear';
    case 'leaves':
    case 'petals':
    case 'confetti':
    case 'hearts':
    case 'bubbles':
      return 'custom';
    case 'none':
    default:
      return 'clear';
  }
}

export function WeatherEffects({ weather, debugTime, collectionTheme }: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const lastShootingStarTime = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Determine effective weather/effect type
  const hasCollectionEffect = collectionTheme?.backgroundEffect && collectionTheme.backgroundEffect !== 'none';
  const effectiveWeather = hasCollectionEffect
    ? mapBackgroundEffectToWeather(collectionTheme!.backgroundEffect)
    : weather;
  const collectionEffect = collectionTheme?.backgroundEffect || 'none';

  const config = getWeatherConfig(effectiveWeather === 'custom' ? 'clear' : effectiveWeather);

  // Initialize particles, clouds, and other effects
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      // Use effective weather for particle creation
      const weatherForParticles = effectiveWeather === 'custom' ? 'clear' : effectiveWeather;
      particlesRef.current = createParticles(weatherForParticles, dimensions.width, dimensions.height);
      splashesRef.current = createSplashes();
      shootingStarsRef.current = [];

      // Create clouds for cloudy weather or fog effect
      if (effectiveWeather === 'cloudy' || collectionEffect === 'fog') {
        cloudsRef.current = createClouds(collectionEffect === 'fog' ? 12 : 8);
      } else {
        cloudsRef.current = [];
      }
    }
  }, [effectiveWeather, collectionEffect, dimensions.width, dimensions.height]);

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

  // Draw rain with splash effects
  const drawRain = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Draw rain drops by layer for depth
      for (let layer = 0; layer < 3; layer++) {
        particlesRef.current
          .filter(p => p.layer === layer)
          .forEach(particle => {
            ctx.beginPath();

            if (particle.type === 'mist') {
              // Tiny mist particles
              ctx.fillStyle = `rgba(180, 210, 230, ${particle.opacity * 0.5})`;
              ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
              ctx.fill();
            } else if (particle.type === 'large') {
              // Larger rain drops
              ctx.strokeStyle = `rgba(150, 200, 230, ${particle.opacity})`;
              ctx.lineWidth = particle.size * 1.5;
              ctx.lineCap = 'round';
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(particle.x + 3, particle.y + 18 + particle.layer * 4);
              ctx.stroke();
            } else {
              // Normal rain drops
              const alpha = particle.opacity * (0.7 + layer * 0.15);
              ctx.strokeStyle = `rgba(170, 210, 235, ${alpha})`;
              ctx.lineWidth = particle.size;
              ctx.lineCap = 'round';
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(particle.x + 2, particle.y + 12 + particle.layer * 2);
              ctx.stroke();
            }
          });
      }

      // Draw splash effects
      splashesRef.current.forEach(splash => {
        const progress = splash.life / splash.maxLife;
        const alpha = (1 - progress) * 0.6;
        const radius = splash.size * (1 + progress * 2);

        // Splash ring
        ctx.beginPath();
        ctx.strokeStyle = `rgba(180, 210, 235, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.ellipse(splash.x, splash.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Tiny droplets spraying up
        if (progress < 0.5) {
          const dropCount = 3;
          for (let i = 0; i < dropCount; i++) {
            const angle = (i / dropCount) * Math.PI - Math.PI / 2;
            const dist = radius * 0.5 * (1 - progress);
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist * 0.5 - progress * 5;
            ctx.beginPath();
            ctx.fillStyle = `rgba(200, 220, 240, ${alpha * 0.5})`;
            ctx.arc(splash.x + dx, splash.y + dy, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    },
    []
  );

  // Draw snow with layered depth effect
  const drawSnow = useCallback((ctx: CanvasRenderingContext2D) => {
    // Draw by layer for depth effect
    for (let layer = 0; layer < 3; layer++) {
      particlesRef.current
        .filter(p => p.layer === layer)
        .forEach((particle, index) => {
          // Enhanced glow size based on layer - front layer particles are more prominent
          const glowSize = particle.size * (1.8 + layer * 0.5);
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            glowSize
          );

          // More vibrant, magical glow with better visibility
          const alpha = particle.opacity * (0.7 + layer * 0.15);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          gradient.addColorStop(0.3, `rgba(230, 240, 255, ${alpha * 0.75})`);
          gradient.addColorStop(0.6, `rgba(200, 220, 255, ${alpha * 0.35})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
          ctx.fill();

          // Snowflake core - solid white center for visibility
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Determine snowflake style based on particle index for variety
          const snowflakeStyle = index % 4;

          // Mid layer: add subtle crystalline details for some flakes
          if (layer === 1 && particle.size > 4.5) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            ctx.lineWidth = 0.8;
            const coreSize = particle.size * 0.5;
            // Simple 4-point cross
            for (let i = 0; i < 4; i++) {
              const angle = (i * Math.PI) / 2;
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(
                particle.x + Math.cos(angle) * coreSize,
                particle.y + Math.sin(angle) * coreSize
              );
            }
            ctx.stroke();
          }

          // Front layer: detailed crystalline snowflakes with variety
          if (layer === 2 && particle.size > 4) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;

            if (snowflakeStyle === 0) {
              // Classic 6-point star with branches
              ctx.lineWidth = 1;
              const coreSize = particle.size * 0.7;
              const branchSize = coreSize * 0.4;
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 + particle.wobble * 0.1;
                // Main arm
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                const armEndX = particle.x + Math.cos(angle) * coreSize;
                const armEndY = particle.y + Math.sin(angle) * coreSize;
                ctx.lineTo(armEndX, armEndY);
                ctx.stroke();
                // Small branches on each arm
                const midX = particle.x + Math.cos(angle) * coreSize * 0.6;
                const midY = particle.y + Math.sin(angle) * coreSize * 0.6;
                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(
                  midX + Math.cos(angle + 0.5) * branchSize,
                  midY + Math.sin(angle + 0.5) * branchSize
                );
                ctx.moveTo(midX, midY);
                ctx.lineTo(
                  midX + Math.cos(angle - 0.5) * branchSize,
                  midY + Math.sin(angle - 0.5) * branchSize
                );
                ctx.stroke();
              }
            } else if (snowflakeStyle === 1) {
              // Simple 6-point star
              ctx.lineWidth = 1.2;
              const coreSize = particle.size * 0.6;
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(
                  particle.x + Math.cos(angle) * coreSize,
                  particle.y + Math.sin(angle) * coreSize
                );
              }
              ctx.stroke();
            } else if (snowflakeStyle === 2) {
              // Diamond/hexagon shape
              ctx.lineWidth = 0.8;
              const coreSize = particle.size * 0.5;
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x = particle.x + Math.cos(angle) * coreSize;
                const y = particle.y + Math.sin(angle) * coreSize;
                if (i === 0) {
                  ctx.moveTo(x, y);
                } else {
                  ctx.lineTo(x, y);
                }
              }
              ctx.closePath();
              ctx.stroke();
              // Inner detail
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3 + Math.PI / 6;
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(
                  particle.x + Math.cos(angle) * coreSize * 0.5,
                  particle.y + Math.sin(angle) * coreSize * 0.5
                );
              }
              ctx.stroke();
            } else {
              // Asterisk style with dots
              ctx.lineWidth = 1;
              const coreSize = particle.size * 0.55;
              ctx.beginPath();
              for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(
                  particle.x + Math.cos(angle) * coreSize,
                  particle.y + Math.sin(angle) * coreSize
                );
              }
              ctx.stroke();
              // Dots at endpoints
              ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
              for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                ctx.beginPath();
                ctx.arc(
                  particle.x + Math.cos(angle) * coreSize,
                  particle.y + Math.sin(angle) * coreSize,
                  1.2,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              }
            }
          }
        });
    }
  }, []);

  // Draw enhanced clouds
  const drawClouds = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    cloudsRef.current.forEach(cloud => {
      const baseX = (cloud.x / 100) * width;
      const verticalOffset = Math.sin(cloud.driftPhase) * 3;
      const baseY = (cloud.y / 100) * height + verticalOffset;
      const baseScale = cloud.scale * 50;

      // Draw each puff of the cloud for fluffy appearance
      cloud.puffs.forEach(puff => {
        const puffX = baseX + puff.offsetX * cloud.scale;
        const puffY = baseY + puff.offsetY * cloud.scale;
        const puffSize = baseScale * puff.scale;

        // Outer soft glow
        const gradient = ctx.createRadialGradient(puffX, puffY, 0, puffX, puffY, puffSize);
        const alpha = cloud.opacity * puff.opacity;
        gradient.addColorStop(0, `rgba(235, 235, 240, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(225, 225, 235, ${alpha * 0.7})`);
        gradient.addColorStop(0.8, `rgba(215, 215, 225, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(200, 200, 210, 0)');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.ellipse(puffX, puffY, puffSize, puffSize * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Add subtle inner highlights for dimension
      const highlightX = baseX - baseScale * 0.2;
      const highlightY = baseY - baseScale * 0.15;
      const highlightGradient = ctx.createRadialGradient(
        highlightX,
        highlightY,
        0,
        highlightX,
        highlightY,
        baseScale * 0.4
      );
      highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${cloud.opacity * 0.15})`);
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.fillStyle = highlightGradient;
      ctx.ellipse(highlightX, highlightY, baseScale * 0.4, baseScale * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Draw clear weather effect (stars at night, dust during day)
  const drawClear = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, _height: number) => {
      const date = debugTime !== null && debugTime !== undefined
        ? (() => { const d = new Date(); d.setHours(debugTime, 0, 0, 0); return d; })()
        : new Date();
      const isNight = isNightTime(date);

      if (isNight) {
        // Night: Draw stars with twinkling
        particlesRef.current.forEach(particle => {
          const isBright = particle.type === 'brightStar';

          // Star glow
          const glowSize = particle.size * (isBright ? 6 : 3);
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            glowSize
          );

          const color = isBright ? '255, 250, 220' : '255, 250, 240';
          gradient.addColorStop(0, `rgba(${color}, ${particle.baseOpacity})`);
          gradient.addColorStop(0.3, `rgba(${color}, ${particle.baseOpacity * 0.5})`);
          gradient.addColorStop(1, `rgba(${color}, 0)`);

          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
          ctx.fill();

          // Star core
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.baseOpacity})`;
          ctx.arc(particle.x, particle.y, particle.size * (isBright ? 1.2 : 0.6), 0, Math.PI * 2);
          ctx.fill();

          // Bright stars get sparkle rays
          if (isBright && particle.baseOpacity > 0.7) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${particle.baseOpacity * 0.4})`;
            ctx.lineWidth = 0.5;
            const rayLength = particle.size * 3;
            for (let i = 0; i < 4; i++) {
              const angle = (i * Math.PI) / 2 + Math.PI / 4;
              ctx.beginPath();
              ctx.moveTo(
                particle.x - Math.cos(angle) * rayLength,
                particle.y - Math.sin(angle) * rayLength
              );
              ctx.lineTo(
                particle.x + Math.cos(angle) * rayLength,
                particle.y + Math.sin(angle) * rayLength
              );
              ctx.stroke();
            }
          }
        });

        // Draw shooting stars
        shootingStarsRef.current.forEach(star => {
          const tailLength = star.length;
          const gradient = ctx.createLinearGradient(
            star.x - Math.cos(star.angle) * tailLength,
            star.y - Math.sin(star.angle) * tailLength,
            star.x,
            star.y
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.7, `rgba(255, 255, 255, ${star.opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${star.opacity})`);

          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.moveTo(
            star.x - Math.cos(star.angle) * tailLength,
            star.y - Math.sin(star.angle) * tailLength
          );
          ctx.lineTo(star.x, star.y);
          ctx.stroke();

          // Bright head
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
          ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Day: Draw floating dust particles in sunbeam
        const beamCenterX = width * 0.5;
        const beamWidth = width * 0.4;

        particlesRef.current.forEach(particle => {
          // Only show particles in sunbeam area
          const distFromBeam = Math.abs(particle.x - beamCenterX);
          if (distFromBeam < beamWidth) {
            const beamFade = 1 - distFromBeam / beamWidth;
            const alpha = particle.opacity * beamFade * 0.8;

            const gradient = ctx.createRadialGradient(
              particle.x,
              particle.y,
              0,
              particle.x,
              particle.y,
              particle.size * 2
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
      }
    },
    [debugTime]
  );

  // Draw fog effect
  const drawFog = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Semi-transparent fog layers
    cloudsRef.current.forEach((cloud) => {
      const baseX = (cloud.x / 100) * width;
      const verticalOffset = Math.sin(cloud.driftPhase + time * 0.0003) * 5;
      const baseY = (cloud.y / 100) * height + verticalOffset;
      const baseScale = cloud.scale * 80;

      // Fog gradient - more diffuse than clouds
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
      // Pulsing glow
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

      // Bright core
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  // Draw glitter/sparkles effect
  const drawGlitter = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    particlesRef.current.forEach((particle, index) => {
      // Sparkle effect
      const sparkle = (Math.sin(time * 0.005 + index * 1.5) + 1) * 0.5;
      if (sparkle < 0.3) return; // Only show some sparkles at a time

      const alpha = particle.opacity * sparkle;
      const size = particle.size * (0.5 + sparkle);

      // Star shape
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Cross pattern
      ctx.moveTo(particle.x - size, particle.y);
      ctx.lineTo(particle.x + size, particle.y);
      ctx.moveTo(particle.x, particle.y - size);
      ctx.lineTo(particle.x, particle.y + size);
      // Diagonal cross
      const diagSize = size * 0.7;
      ctx.moveTo(particle.x - diagSize, particle.y - diagSize);
      ctx.lineTo(particle.x + diagSize, particle.y + diagSize);
      ctx.moveTo(particle.x + diagSize, particle.y - diagSize);
      ctx.lineTo(particle.x - diagSize, particle.y + diagSize);
      ctx.stroke();

      // Center dot
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

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      const deltaTime = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw background overlay
      if (config.backgroundOverlay) {
        ctx.fillStyle = config.backgroundOverlay;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      // Handle special collection theme effects first
      if (hasCollectionEffect) {
        const weatherType = effectiveWeather === 'custom' ? 'clear' : effectiveWeather;

        // Update particles
        particlesRef.current = updateParticles(
          particlesRef.current,
          weatherType,
          dimensions.width,
          dimensions.height,
          deltaTime,
          collectionEffect === 'rain' ? splashesRef.current : undefined
        );

        if (collectionEffect === 'rain') {
          splashesRef.current = updateSplashes(splashesRef.current, deltaTime);
        }

        // Update clouds for fog
        if (collectionEffect === 'fog' || collectionEffect === 'aurora') {
          cloudsRef.current = cloudsRef.current.map(cloud => updateCloud(cloud, deltaTime));
        }

        // Draw based on collection effect
        switch (collectionEffect) {
          case 'fog':
            drawFog(ctx, dimensions.width, dimensions.height, time);
            break;
          case 'snow':
            drawSnow(ctx);
            break;
          case 'rain':
            drawRain(ctx);
            break;
          case 'fireflies':
            drawFireflies(ctx, time);
            break;
          case 'glitter':
          case 'sparkles':
            drawGlitter(ctx, time);
            break;
          case 'stars':
            drawClear(ctx, dimensions.width, dimensions.height);
            break;
          case 'aurora':
            drawAurora(ctx, dimensions.width, dimensions.height, time);
            break;
          case 'dust':
            // Dust uses clear weather daytime particles
            drawClear(ctx, dimensions.width, dimensions.height);
            break;
          default:
            // For other effects, draw clear
            drawClear(ctx, dimensions.width, dimensions.height);
        }
      } else {
        // Original weather-based rendering
        switch (effectiveWeather) {
          case 'rainy':
            particlesRef.current = updateParticles(
              particlesRef.current,
              effectiveWeather,
              dimensions.width,
              dimensions.height,
              deltaTime,
              splashesRef.current
            );
            splashesRef.current = updateSplashes(splashesRef.current, deltaTime);
            drawRain(ctx);
            break;

          case 'snowy':
            particlesRef.current = updateParticles(
              particlesRef.current,
              effectiveWeather,
              dimensions.width,
              dimensions.height,
              deltaTime
            );
            drawSnow(ctx);
            break;

          case 'cloudy':
            cloudsRef.current = cloudsRef.current.map(cloud => updateCloud(cloud, deltaTime));
            drawClouds(ctx, dimensions.width, dimensions.height);
            break;

          case 'clear': {
            particlesRef.current = updateParticles(
              particlesRef.current,
              effectiveWeather,
              dimensions.width,
              dimensions.height,
              deltaTime
            );

            const date = debugTime !== null && debugTime !== undefined
              ? (() => { const d = new Date(); d.setHours(debugTime, 0, 0, 0); return d; })()
              : new Date();
            const isNight = isNightTime(date);

            if (isNight) {
              // Occasionally spawn shooting star (average every 8-15 seconds)
              if (time - lastShootingStarTime.current > 8000 + Math.random() * 7000) {
                if (Math.random() > 0.7) {
                  shootingStarsRef.current.push(
                    createShootingStar(dimensions.width, dimensions.height)
                  );
                  lastShootingStarTime.current = time;
                }
              }

              // Update shooting stars
              shootingStarsRef.current = shootingStarsRef.current
                .map(star => updateShootingStar(star, deltaTime))
                .filter((star): star is ShootingStar => star !== null);

              // Draw night ambient glow
              const nightGradient = ctx.createRadialGradient(
                dimensions.width * 0.5,
                dimensions.height * 0.3,
                0,
                dimensions.width * 0.5,
                dimensions.height * 0.3,
                dimensions.width * 0.7
              );
              nightGradient.addColorStop(0, 'rgba(20, 20, 60, 0.02)');
              nightGradient.addColorStop(1, 'rgba(15, 15, 45, 0.08)');
              ctx.fillStyle = nightGradient;
              ctx.fillRect(0, 0, dimensions.width, dimensions.height);
            } else {
              // Draw day warm overlay
              const sunnyGradient = ctx.createRadialGradient(
                dimensions.width * 0.85,
                dimensions.height * 0.1,
                0,
                dimensions.width * 0.5,
                dimensions.height * 0.5,
                dimensions.width * 0.8
              );
              sunnyGradient.addColorStop(0, 'rgba(255, 245, 200, 0.08)');
              sunnyGradient.addColorStop(0.5, 'rgba(255, 240, 180, 0.03)');
              sunnyGradient.addColorStop(1, 'rgba(255, 235, 160, 0)');
              ctx.fillStyle = sunnyGradient;
              ctx.fillRect(0, 0, dimensions.width, dimensions.height);
            }

            drawClear(ctx, dimensions.width, dimensions.height);
            break;
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [effectiveWeather, collectionEffect, hasCollectionEffect, dimensions, config, drawRain, drawSnow, drawClouds, drawClear, drawFog, drawFireflies, drawGlitter, drawAurora, debugTime]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  );
}
