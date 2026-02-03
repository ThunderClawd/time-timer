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
import { createClouds, updateCloud, Cloud, Moon, createMoon } from '../themes/animations';

interface WeatherEffectsProps {
  weather: Weather;
}

export function WeatherEffects({ weather }: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const moonRef = useRef<Moon | null>(null);
  const lastShootingStarTime = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const config = getWeatherConfig(weather);

  // Initialize particles, clouds, and other effects
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      particlesRef.current = createParticles(weather, dimensions.width, dimensions.height);
      splashesRef.current = createSplashes();
      shootingStarsRef.current = [];

      // Create clouds for cloudy weather
      if (weather === 'cloudy') {
        cloudsRef.current = createClouds(8); // More clouds
      } else {
        cloudsRef.current = [];
      }

      // Create moon for night
      if (weather === 'night') {
        moonRef.current = createMoon();
      } else {
        moonRef.current = null;
      }
    }
  }, [weather, dimensions.width, dimensions.height]);

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

  // Draw night sky with moon and stars
  const drawNight = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Draw moon
      const moon = moonRef.current;
      if (moon) {
        const moonX = (moon.x / 100) * width;
        const moonY = (moon.y / 100) * height;

        // Moon glow (outer)
        const outerGlow = ctx.createRadialGradient(
          moonX,
          moonY,
          moon.size * 0.5,
          moonX,
          moonY,
          moon.size * 3
        );
        outerGlow.addColorStop(0, `rgba(255, 250, 230, ${moon.glowIntensity})`);
        outerGlow.addColorStop(0.3, `rgba(255, 250, 230, ${moon.glowIntensity * 0.4})`);
        outerGlow.addColorStop(1, 'rgba(255, 250, 230, 0)');
        ctx.beginPath();
        ctx.fillStyle = outerGlow;
        ctx.arc(moonX, moonY, moon.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Moon body
        const moonGradient = ctx.createRadialGradient(
          moonX - moon.size * 0.2,
          moonY - moon.size * 0.2,
          0,
          moonX,
          moonY,
          moon.size
        );
        moonGradient.addColorStop(0, 'rgba(255, 252, 240, 0.95)');
        moonGradient.addColorStop(0.7, 'rgba(250, 245, 220, 0.9)');
        moonGradient.addColorStop(1, 'rgba(240, 235, 210, 0.85)');

        ctx.beginPath();
        ctx.fillStyle = moonGradient;
        ctx.arc(moonX, moonY, moon.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle moon craters/texture
        ctx.fillStyle = 'rgba(220, 215, 200, 0.15)';
        ctx.beginPath();
        ctx.arc(moonX + moon.size * 0.2, moonY - moon.size * 0.1, moon.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX - moon.size * 0.25, moonY + moon.size * 0.3, moon.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX + moon.size * 0.3, moonY + moon.size * 0.25, moon.size * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw stars with twinkling
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
        gradient.addColorStop(0, `rgba(${color}, ${particle.opacity})`);
        gradient.addColorStop(0.3, `rgba(${color}, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${color}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Star core
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.arc(particle.x, particle.y, particle.size * (isBright ? 1.2 : 0.6), 0, Math.PI * 2);
        ctx.fill();

        // Bright stars get sparkle rays
        if (isBright && particle.opacity > 0.7) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${particle.opacity * 0.4})`;
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
    },
    []
  );

  // Draw sunny effect with rays and dust particles
  const drawSunny = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Sun position (top right)
      const sunX = width * 0.85;
      const sunY = height * 0.08;
      const sunRadius = Math.min(width, height) * 0.08;

      // Outer glow layers
      for (let i = 3; i >= 0; i--) {
        const radius = sunRadius * (3 + i * 1.5);
        const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius);
        const alpha = 0.03 + i * 0.02;
        gradient.addColorStop(0, `rgba(255, 230, 150, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 220, 100, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun core (partial, as if just peeking)
      const coreGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
      coreGradient.addColorStop(0, 'rgba(255, 250, 200, 0.3)');
      coreGradient.addColorStop(0.7, 'rgba(255, 230, 150, 0.15)');
      coreGradient.addColorStop(1, 'rgba(255, 220, 100, 0.05)');
      ctx.beginPath();
      ctx.fillStyle = coreGradient;
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle light rays
      const rayCount = 8;
      const time = Date.now() * 0.0003;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + time;
        const rayLength = sunRadius * (4 + Math.sin(time * 2 + i) * 1.5);
        const rayWidth = Math.PI / 20;

        const gradient = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, rayLength);
        gradient.addColorStop(0, 'rgba(255, 240, 180, 0.08)');
        gradient.addColorStop(0.5, 'rgba(255, 235, 150, 0.03)');
        gradient.addColorStop(1, 'rgba(255, 230, 100, 0)');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.moveTo(sunX, sunY);
        ctx.arc(sunX, sunY, rayLength, angle - rayWidth, angle + rayWidth);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Floating dust particles in sunbeam
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
    },
    []
  );

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

      // Update and draw based on weather type
      switch (weather) {
        case 'rainy':
          particlesRef.current = updateParticles(
            particlesRef.current,
            weather,
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
            weather,
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

        case 'night': {
          particlesRef.current = updateParticles(
            particlesRef.current,
            weather,
            dimensions.width,
            dimensions.height,
            deltaTime
          );

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

          drawNight(ctx, dimensions.width, dimensions.height);
          break;
        }

        case 'sunny': {
          particlesRef.current = updateParticles(
            particlesRef.current,
            weather,
            dimensions.width,
            dimensions.height,
            deltaTime
          );

          // Warm overlay
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

          drawSunny(ctx, dimensions.width, dimensions.height);
          break;
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [weather, dimensions, config, drawRain, drawSnow, drawClouds, drawNight, drawSunny]);

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
