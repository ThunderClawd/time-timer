// Animation helpers for seasonal effects

/**
 * Easing function for smooth animations
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for bouncy animations
 */
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

/**
 * Gentle sway animation for decorations
 */
export function getSwayOffset(time: number, seed: number, amplitude: number = 3): number {
  return Math.sin(time * 0.001 + seed) * amplitude;
}

/**
 * Gentle floating animation
 */
export function getFloatOffset(time: number, seed: number, amplitude: number = 2): number {
  return Math.sin(time * 0.0015 + seed * 2) * amplitude;
}

/**
 * Rotation animation for leaves falling
 */
export function getFallingRotation(time: number, seed: number): number {
  return Math.sin(time * 0.002 + seed) * 15;
}

/**
 * Scale pulse animation
 */
export function getScalePulse(time: number, seed: number, minScale: number = 0.95, maxScale: number = 1.05): number {
  const pulse = (Math.sin(time * 0.002 + seed * 3) + 1) / 2;
  return minScale + pulse * (maxScale - minScale);
}

/**
 * Opacity fade animation
 */
export function getOpacityFade(time: number, seed: number, minOpacity: number = 0.7, maxOpacity: number = 1): number {
  const fade = (Math.sin(time * 0.003 + seed * 4) + 1) / 2;
  return minOpacity + fade * (maxOpacity - minOpacity);
}

/**
 * Falling petal/leaf animation path
 */
export interface FallingElement {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  seed: number;
  type: string;
}

export function createFallingElements(count: number, types: string[]): FallingElement[] {
  const elements: FallingElement[] = [];
  for (let i = 0; i < count; i++) {
    elements.push({
      x: Math.random() * 100,
      y: Math.random() * -50 - 10, // Start above viewport
      rotation: Math.random() * 360,
      scale: 0.3 + Math.random() * 0.4,
      opacity: 0.6 + Math.random() * 0.4,
      seed: Math.random() * 1000,
      type: types[Math.floor(Math.random() * types.length)] || 'default',
    });
  }
  return elements;
}

export function updateFallingElement(
  element: FallingElement,
  deltaTime: number,
  fallSpeed: number = 0.5
): FallingElement {
  const newY = element.y + fallSpeed * deltaTime * 60;
  const wobbleX = Math.sin(Date.now() * 0.001 + element.seed) * 0.3;
  const newX = element.x + wobbleX;
  const newRotation = element.rotation + getFallingRotation(Date.now(), element.seed) * 0.1;

  // Reset if off screen
  if (newY > 110) {
    return {
      ...element,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
    };
  }

  return {
    ...element,
    x: newX < 0 ? 100 : newX > 100 ? 0 : newX,
    y: newY,
    rotation: newRotation,
  };
}

/**
 * Enhanced Cloud with more properties for fluffy, realistic appearance
 */
export interface Cloud {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
  // New properties for enhanced clouds
  layer: number; // 0 = far back, 1 = mid, 2 = front
  puffCount: number; // Number of puffs in this cloud
  puffs: CloudPuff[]; // Individual puff positions for fluffier look
  verticalDrift: number; // Subtle vertical movement
  driftPhase: number;
}

export interface CloudPuff {
  offsetX: number; // Relative to cloud center
  offsetY: number;
  scale: number;
  opacity: number;
}

export function createClouds(count: number): Cloud[] {
  const clouds: Cloud[] = [];

  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * 3);
    const layerOpacity = 0.25 + layer * 0.12;
    const layerSpeed = 0.008 + layer * 0.006;
    const layerScale = 0.7 + layer * 0.25;

    // Create 4-7 puffs per cloud for fluffy appearance
    const puffCount = 4 + Math.floor(Math.random() * 4);
    const puffs: CloudPuff[] = [];

    for (let j = 0; j < puffCount; j++) {
      puffs.push({
        offsetX: (j - puffCount / 2) * 20 + (Math.random() - 0.5) * 15,
        offsetY: (Math.random() - 0.5) * 20,
        scale: 0.6 + Math.random() * 0.5,
        opacity: 0.7 + Math.random() * 0.3,
      });
    }

    clouds.push({
      x: Math.random() * 140 - 20, // Allow off-screen positioning
      y: 8 + layer * 8 + Math.random() * 15, // Layered heights
      scale: layerScale + Math.random() * 0.3,
      opacity: layerOpacity + Math.random() * 0.1,
      speed: layerSpeed + Math.random() * 0.005,
      layer,
      puffCount,
      puffs,
      verticalDrift: Math.random() * Math.PI * 2,
      driftPhase: Math.random() * Math.PI * 2,
    });
  }

  // Sort by layer so back clouds render first
  return clouds.sort((a, b) => a.layer - b.layer);
}

export function updateCloud(cloud: Cloud, deltaTime: number): Cloud {
  let newX = cloud.x + cloud.speed * deltaTime * 60;
  const newDriftPhase = cloud.driftPhase + 0.005 * deltaTime * 60;

  // Wrap around with buffer
  if (newX > 130) {
    newX = -30;
  }

  return {
    ...cloud,
    x: newX,
    driftPhase: newDriftPhase,
  };
}

/**
 * Moon configuration for night effect
 */
export interface Moon {
  x: number; // Percentage position
  y: number;
  size: number;
  phase: number; // 0-1, 0 = new moon, 0.5 = full moon
  glowIntensity: number;
}

export function createMoon(): Moon {
  return {
    x: 80 + Math.random() * 10, // Top right area
    y: 10 + Math.random() * 10,
    size: 35 + Math.random() * 10,
    phase: 0.7 + Math.random() * 0.3, // Mostly full or gibbous
    glowIntensity: 0.15 + Math.random() * 0.1,
  };
}

/**
 * Request animation frame with cleanup
 */
export function createAnimationLoop(
  callback: (time: number, deltaTime: number) => void
): { start: () => void; stop: () => void } {
  let animationId: number | null = null;
  let lastTime = 0;

  const loop = (time: number) => {
    const deltaTime = lastTime ? (time - lastTime) / 1000 : 0.016;
    lastTime = time;

    callback(time, deltaTime);
    animationId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (animationId === null) {
        lastTime = 0;
        animationId = requestAnimationFrame(loop);
      }
    },
    stop: () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
  };
}
