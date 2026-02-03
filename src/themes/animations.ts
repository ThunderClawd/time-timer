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
 * Cloud drift animation
 */
export interface Cloud {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
}

export function createClouds(count: number): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * 120 - 10, // Allow some off-screen positioning
      y: 5 + Math.random() * 25, // Top portion of screen
      scale: 0.6 + Math.random() * 0.6,
      opacity: 0.4 + Math.random() * 0.3,
      speed: 0.01 + Math.random() * 0.02,
    });
  }
  return clouds;
}

export function updateCloud(cloud: Cloud, deltaTime: number): Cloud {
  let newX = cloud.x + cloud.speed * deltaTime * 60;

  // Wrap around
  if (newX > 110) {
    newX = -20;
  }

  return {
    ...cloud,
    x: newX,
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
