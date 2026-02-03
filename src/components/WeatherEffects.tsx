import { useEffect, useRef, useState, useCallback } from 'react';
import { Weather, getWeatherConfig, createParticles, updateParticles, Particle } from '../themes/weather';
import { createClouds, updateCloud, Cloud } from '../themes/animations';

interface WeatherEffectsProps {
  weather: Weather;
}

export function WeatherEffects({ weather }: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const config = getWeatherConfig(weather);

  // Initialize particles and clouds
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      particlesRef.current = createParticles(weather, dimensions.width, dimensions.height);

      // Create clouds for cloudy weather
      if (weather === 'cloudy') {
        cloudsRef.current = createClouds(5);
      } else {
        cloudsRef.current = [];
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

  // Draw particles
  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      particlesRef.current.forEach(particle => {
        ctx.beginPath();

        if (weather === 'rainy') {
          // Draw rain as lines
          ctx.strokeStyle = `rgba(135, 206, 235, ${particle.opacity})`;
          ctx.lineWidth = particle.size;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + 2, particle.y + 10);
          ctx.stroke();
        } else if (weather === 'snowy') {
          // Draw snowflakes as circles with subtle glow
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.opacity})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (weather === 'night') {
          // Draw stars with twinkling effect
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.size * 2
          );
          gradient.addColorStop(0, `rgba(255, 250, 205, ${particle.opacity})`);
          gradient.addColorStop(0.5, `rgba(255, 250, 205, ${particle.opacity * 0.5})`);
          gradient.addColorStop(1, `rgba(255, 250, 205, 0)`);
          ctx.fillStyle = gradient;
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();

          // Star core
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    [weather]
  );

  // Draw clouds
  const drawClouds = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    cloudsRef.current.forEach(cloud => {
      const x = (cloud.x / 100) * width;
      const y = (cloud.y / 100) * height;
      const scale = cloud.scale * 60;

      ctx.fillStyle = `rgba(220, 220, 220, ${cloud.opacity})`;

      // Draw cloud as overlapping ellipses
      ctx.beginPath();
      ctx.ellipse(x, y, scale * 0.8, scale * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x + scale * 0.5, y - scale * 0.1, scale * 0.6, scale * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x - scale * 0.4, y + scale * 0.1, scale * 0.5, scale * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    });
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

      // Update and draw particles
      if (particlesRef.current.length > 0) {
        particlesRef.current = updateParticles(
          particlesRef.current,
          weather,
          dimensions.width,
          dimensions.height,
          deltaTime
        );
        drawParticles(ctx);
      }

      // Update and draw clouds
      if (cloudsRef.current.length > 0) {
        cloudsRef.current = cloudsRef.current.map(cloud => updateCloud(cloud, deltaTime));
        drawClouds(ctx, dimensions.width, dimensions.height);
      }

      // Draw sunny glow effect
      if (weather === 'sunny' && config.glowEffect) {
        const gradient = ctx.createRadialGradient(
          dimensions.width * 0.85,
          dimensions.height * 0.1,
          0,
          dimensions.width * 0.85,
          dimensions.height * 0.1,
          dimensions.width * 0.4
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      // Draw night ambient glow
      if (weather === 'night') {
        const gradient = ctx.createRadialGradient(
          dimensions.width * 0.5,
          dimensions.height * 0.3,
          0,
          dimensions.width * 0.5,
          dimensions.height * 0.3,
          dimensions.width * 0.6
        );
        gradient.addColorStop(0, 'rgba(25, 25, 112, 0.02)');
        gradient.addColorStop(1, 'rgba(25, 25, 112, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [weather, dimensions, config, drawParticles, drawClouds]);

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
