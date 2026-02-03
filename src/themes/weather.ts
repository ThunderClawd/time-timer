// Weather effect configurations
export type Weather = 'sunny' | 'rainy' | 'snowy' | 'cloudy' | 'night';

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
  sunny: {
    name: 'Sunny',
    particleCount: 0, // No particles, just glow effect
    particleSpeed: { min: 0, max: 0 },
    particleSize: { min: 0, max: 0 },
    particleColor: '#FFD700',
    particleOpacity: { min: 0, max: 0 },
    backgroundOverlay: 'rgba(255, 250, 205, 0.1)',
    glowEffect: '0 0 100px 20px rgba(255, 215, 0, 0.15)',
  },
  rainy: {
    name: 'Rainy',
    particleCount: 50,
    particleSpeed: { min: 4, max: 8 },
    particleSize: { min: 1, max: 2 },
    particleColor: '#87CEEB',
    particleOpacity: { min: 0.3, max: 0.6 },
    backgroundOverlay: 'rgba(100, 149, 237, 0.08)',
  },
  snowy: {
    name: 'Snowy',
    particleCount: 40,
    particleSpeed: { min: 0.5, max: 1.5 },
    particleSize: { min: 2, max: 5 },
    particleColor: '#FFFFFF',
    particleOpacity: { min: 0.6, max: 0.9 },
    backgroundOverlay: 'rgba(240, 248, 255, 0.1)',
  },
  cloudy: {
    name: 'Cloudy',
    particleCount: 0, // Clouds are rendered as decorations, not particles
    particleSpeed: { min: 0, max: 0 },
    particleSize: { min: 0, max: 0 },
    particleColor: '#D3D3D3',
    particleOpacity: { min: 0, max: 0 },
    backgroundOverlay: 'rgba(169, 169, 169, 0.05)',
  },
  night: {
    name: 'Clear Night',
    particleCount: 30, // Twinkling stars
    particleSpeed: { min: 0, max: 0 }, // Stars don't move
    particleSize: { min: 1, max: 3 },
    particleColor: '#FFFACD',
    particleOpacity: { min: 0.3, max: 1 }, // Twinkling effect
    backgroundOverlay: 'rgba(25, 25, 112, 0.15)',
    glowEffect: '0 0 50px 10px rgba(255, 250, 205, 0.1)',
  },
};

export interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number; // For snowflakes horizontal drift
  twinklePhase: number; // For stars twinkling
}

/**
 * Create initial particles for weather effect
 */
export function createParticles(weather: Weather, width: number, height: number): Particle[] {
  const config = WEATHER_CONFIGS[weather];
  const particles: Particle[] = [];

  for (let i = 0; i < config.particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min),
      speed: config.particleSpeed.min + Math.random() * (config.particleSpeed.max - config.particleSpeed.min),
      opacity: config.particleOpacity.min + Math.random() * (config.particleOpacity.max - config.particleOpacity.min),
      wobble: Math.random() * Math.PI * 2,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  return particles;
}

/**
 * Update particle positions based on weather type
 */
export function updateParticles(
  particles: Particle[],
  weather: Weather,
  width: number,
  height: number,
  deltaTime: number
): Particle[] {
  const config = WEATHER_CONFIGS[weather];

  return particles.map(particle => {
    const newParticle = { ...particle };

    switch (weather) {
      case 'rainy':
        // Rain falls straight down with slight angle
        newParticle.y += particle.speed * deltaTime * 60;
        newParticle.x += 0.5 * deltaTime * 60; // Slight wind effect
        // Reset when off screen
        if (newParticle.y > height) {
          newParticle.y = -10;
          newParticle.x = Math.random() * width;
        }
        if (newParticle.x > width) {
          newParticle.x = 0;
        }
        break;

      case 'snowy':
        // Snowflakes drift and wobble
        newParticle.wobble += 0.02 * deltaTime * 60;
        newParticle.y += particle.speed * deltaTime * 60;
        newParticle.x += Math.sin(newParticle.wobble) * 0.5;
        // Reset when off screen
        if (newParticle.y > height) {
          newParticle.y = -10;
          newParticle.x = Math.random() * width;
        }
        if (newParticle.x > width) {
          newParticle.x = 0;
        } else if (newParticle.x < 0) {
          newParticle.x = width;
        }
        break;

      case 'night':
        // Stars twinkle in place
        newParticle.twinklePhase += 0.03 * deltaTime * 60;
        newParticle.opacity =
          config.particleOpacity.min +
          (Math.sin(newParticle.twinklePhase) * 0.5 + 0.5) *
            (config.particleOpacity.max - config.particleOpacity.min);
        break;

      default:
        // No particle animation for sunny/cloudy
        break;
    }

    return newParticle;
  });
}

/**
 * Get all weather types for UI display
 */
export function getAllWeatherTypes(): Weather[] {
  return ['sunny', 'rainy', 'snowy', 'cloudy', 'night'];
}

/**
 * Get weather configuration
 */
export function getWeatherConfig(weather: Weather): WeatherConfig {
  return WEATHER_CONFIGS[weather];
}
