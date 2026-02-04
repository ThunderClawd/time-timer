// Weather effect configurations
export type Weather = 'clear' | 'rainy' | 'snowy' | 'cloudy';

export interface WeatherConfig {
  name: string;
  particleCount: number;
  particleSpeed: { min: number; max: number };
  particleSize: { min: number; max: number };
  particleColor: string;
  particleOpacity: { min: number; max: number };
  backgroundOverlay: string;
  glowEffect?: string;
}

export const WEATHER_CONFIGS: Record<Weather, WeatherConfig> = {
  clear: {
    name: 'Clear',
    particleCount: 60, // Dust particles (day) or stars (night)
    particleSpeed: { min: 0, max: 0.5 },
    particleSize: { min: 0.5, max: 3 },
    particleColor: '#FFFACD',
    particleOpacity: { min: 0.2, max: 1 },
    backgroundOverlay: 'rgba(255, 250, 205, 0.08)',
    glowEffect: '0 0 50px 10px rgba(255, 250, 205, 0.1)',
  },
  rainy: {
    name: 'Rainy',
    particleCount: 150, // More raindrops for fuller coverage
    particleSpeed: { min: 6, max: 12 },
    particleSize: { min: 1, max: 3 },
    particleColor: '#87CEEB',
    particleOpacity: { min: 0.3, max: 0.7 },
    backgroundOverlay: 'rgba(100, 149, 237, 0.06)',
  },
  snowy: {
    name: 'Snowy',
    particleCount: 130, // Fuller coverage with more snowflakes
    particleSpeed: { min: 0.4, max: 1.5 },
    particleSize: { min: 3, max: 8 },
    particleColor: '#FFFFFF',
    particleOpacity: { min: 0.6, max: 1.0 },
    backgroundOverlay: 'rgba(240, 248, 255, 0.08)',
    glowEffect: '0 0 15px 5px rgba(255, 255, 255, 0.3)',
  },
  cloudy: {
    name: 'Cloudy',
    particleCount: 0, // Clouds are rendered separately
    particleSpeed: { min: 0, max: 0 },
    particleSize: { min: 0, max: 0 },
    particleColor: '#D3D3D3',
    particleOpacity: { min: 0, max: 0 },
    backgroundOverlay: 'rgba(169, 169, 169, 0.04)',
  },
};

// Extended particle with more properties for enhanced effects
export interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
  twinklePhase: number;
  // New properties for enhanced effects
  layer: number; // 0 = back, 1 = mid, 2 = front (for depth)
  type: 'normal' | 'mist' | 'large' | 'star' | 'brightStar' | 'dust';
  drift: number; // Horizontal drift speed
  angle: number; // For rain angle variation
  splashTimer: number; // For rain splash effect
  swayAmplitude: number; // For snow sway
  swaySpeed: number; // For snow sway speed
  baseOpacity: number; // Original opacity for twinkling
  twinkleSpeed: number; // Individual twinkle speed
}

// Rain splash effect
export interface Splash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
}

// Shooting star for night effect
export interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  life: number;
  opacity: number;
}

/**
 * Create initial particles for weather effect
 */
export function createParticles(weather: Weather, width: number, height: number): Particle[] {
  const config = WEATHER_CONFIGS[weather];
  const particles: Particle[] = [];

  for (let i = 0; i < config.particleCount; i++) {
    const layer = Math.floor(Math.random() * 3); // 0, 1, or 2
    const layerMultiplier = 0.5 + layer * 0.25; // Back layer slower/smaller

    let type: Particle['type'] = 'normal';
    if (weather === 'rainy') {
      const rand = Math.random();
      if (rand < 0.2) type = 'mist';
      else if (rand > 0.85) type = 'large';
    } else if (weather === 'clear') {
      // Clear weather particles will be either dust or stars depending on time of day
      // The actual rendering in WeatherEffects will determine which to show
      const rand = Math.random();
      if (rand < 0.1) type = 'brightStar';
      else type = 'star';
    }

    const baseSize =
      config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min);
    const baseSpeed =
      config.particleSpeed.min + Math.random() * (config.particleSpeed.max - config.particleSpeed.min);
    const baseOpacity =
      config.particleOpacity.min + Math.random() * (config.particleOpacity.max - config.particleOpacity.min);

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: baseSize * layerMultiplier,
      speed: baseSpeed * layerMultiplier,
      opacity: baseOpacity * (0.6 + layer * 0.2),
      wobble: Math.random() * Math.PI * 2,
      twinklePhase: Math.random() * Math.PI * 2,
      layer,
      type,
      drift: (Math.random() - 0.5) * 0.5,
      angle: weather === 'rainy' ? 0.1 + Math.random() * 0.1 : 0, // Slight rain angle
      splashTimer: 0,
      swayAmplitude: 0.3 + Math.random() * 0.7,
      swaySpeed: 0.015 + Math.random() * 0.02,
      baseOpacity,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
    });
  }

  return particles;
}

/**
 * Create splashes array
 */
export function createSplashes(): Splash[] {
  return [];
}

/**
 * Update particle positions based on weather type
 */
export function updateParticles(
  particles: Particle[],
  weather: Weather,
  width: number,
  height: number,
  deltaTime: number,
  splashes?: Splash[]
): Particle[] {
  const config = WEATHER_CONFIGS[weather];

  return particles.map(particle => {
    const newParticle = { ...particle };
    const dt = deltaTime * 60;

    switch (weather) {
      case 'rainy': {
        // Rain falls with angle and speed variation based on layer
        const layerSpeed = 1 + particle.layer * 0.3;
        newParticle.y += particle.speed * layerSpeed * dt;
        newParticle.x += (0.8 + particle.layer * 0.2) * dt; // Wind effect varies by layer

        // Reset when off screen and potentially create splash
        if (newParticle.y > height) {
          // Add splash effect
          if (splashes && particle.type !== 'mist' && Math.random() > 0.7) {
            splashes.push({
              x: newParticle.x,
              y: height - 5,
              life: 0,
              maxLife: 0.3 + Math.random() * 0.2,
              size: particle.size * 2,
            });
          }
          newParticle.y = -20 - Math.random() * 50;
          newParticle.x = Math.random() * width;
        }
        if (newParticle.x > width + 20) {
          newParticle.x = -10;
        }
        break;
      }

      case 'snowy': {
        // Snowflakes drift and sway gently
        newParticle.wobble += newParticle.swaySpeed * dt;
        const layerSpeed = 0.6 + particle.layer * 0.2;
        newParticle.y += particle.speed * layerSpeed * dt;

        // Gentle horizontal sway
        const sway = Math.sin(newParticle.wobble) * newParticle.swayAmplitude;
        newParticle.x += sway + particle.drift * 0.3;

        // Subtle opacity variation as it falls (like catching light)
        newParticle.opacity =
          particle.baseOpacity * (0.85 + 0.15 * Math.sin(newParticle.wobble * 0.5));

        // Reset when off screen
        if (newParticle.y > height + 10) {
          newParticle.y = -20 - Math.random() * 30;
          newParticle.x = Math.random() * width;
        }
        if (newParticle.x > width + 20) {
          newParticle.x = -20;
        } else if (newParticle.x < -20) {
          newParticle.x = width + 20;
        }
        break;
      }

      case 'clear': {
        // Clear weather: stars twinkle at night, dust floats during day
        newParticle.twinklePhase += particle.twinkleSpeed * dt;
        newParticle.wobble += 0.01 * dt;

        // Twinkling effect for stars (used at night)
        const twinkleRange = particle.type === 'brightStar' ? 0.7 : 0.4;
        const baseMin = particle.type === 'brightStar' ? 0.6 : config.particleOpacity.min;
        const twinkleOpacity =
          baseMin + (Math.sin(newParticle.twinklePhase) * 0.5 + 0.5) * twinkleRange;

        // Gentle floating motion for dust (used during day)
        newParticle.y += Math.sin(newParticle.wobble) * 0.2;
        newParticle.x += Math.cos(newParticle.twinklePhase) * 0.15;

        // Set opacity (actual visibility determined by time of day in rendering)
        newParticle.opacity = particle.baseOpacity * (0.7 + 0.3 * Math.sin(newParticle.wobble * 2));
        // Store twinkle opacity for night rendering
        newParticle.baseOpacity = twinkleOpacity;

        // Keep in bounds with gentle wrapping
        if (newParticle.y > height + 10) newParticle.y = -10;
        if (newParticle.y < -10) newParticle.y = height + 10;
        if (newParticle.x > width + 10) newParticle.x = -10;
        if (newParticle.x < -10) newParticle.x = width + 10;
        break;
      }

      default:
        break;
    }

    return newParticle;
  });
}

/**
 * Update splashes
 */
export function updateSplashes(splashes: Splash[], deltaTime: number): Splash[] {
  return splashes
    .map(splash => ({
      ...splash,
      life: splash.life + deltaTime,
    }))
    .filter(splash => splash.life < splash.maxLife);
}

/**
 * Create a shooting star
 */
export function createShootingStar(width: number, height: number): ShootingStar {
  return {
    x: Math.random() * width * 0.8,
    y: Math.random() * height * 0.4,
    length: 30 + Math.random() * 40,
    speed: 300 + Math.random() * 200,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3, // ~45 degrees with variation
    life: 0,
    opacity: 0.7 + Math.random() * 0.3,
  };
}

/**
 * Update shooting star
 */
export function updateShootingStar(star: ShootingStar, deltaTime: number): ShootingStar | null {
  const newStar = { ...star };
  newStar.x += Math.cos(star.angle) * star.speed * deltaTime;
  newStar.y += Math.sin(star.angle) * star.speed * deltaTime;
  newStar.life += deltaTime;

  // Fade out over time
  newStar.opacity = star.opacity * (1 - newStar.life * 2);

  if (newStar.life > 0.5 || newStar.opacity <= 0) {
    return null;
  }
  return newStar;
}

/**
 * Get all weather types for UI display
 */
export function getAllWeatherTypes(): Weather[] {
  return ['clear', 'rainy', 'snowy', 'cloudy'];
}

/**
 * Get weather configuration
 */
export function getWeatherConfig(weather: Weather): WeatherConfig {
  return WEATHER_CONFIGS[weather];
}
