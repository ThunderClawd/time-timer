// Season detection and configuration
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundGradient: string;
    timerColors: {
      start: string;
      mid1: string;
      mid2: string;
      end: string;
    };
  };
  decorations: {
    elements: string[];
    positions: Array<{ x: number; y: number; scale: number; rotation: number }>;
  };
  defaultWeather: string;
}

// Season date ranges (Northern Hemisphere)

export const SEASON_CONFIGS: Record<Season, SeasonConfig> = {
  spring: {
    name: 'Spring',
    colors: {
      primary: '#90EE90', // Light green
      secondary: '#FFB6C1', // Light pink
      accent: '#FFFACD', // Lemon chiffon (light yellow)
      background: '#F0FFF0', // Honeydew
      backgroundGradient: 'linear-gradient(135deg, #F0FFF0 0%, #FFE4E1 50%, #FFFAF0 100%)',
      timerColors: {
        start: '#90EE90', // Light green
        mid1: '#98FB98', // Pale green
        mid2: '#FFB6C1', // Light pink
        end: '#FF69B4', // Hot pink
      },
    },
    decorations: {
      elements: ['cherry-blossom', 'tulip', 'butterfly', 'sprout'],
      positions: [
        { x: 10, y: 15, scale: 1, rotation: -15 },
        { x: 85, y: 20, scale: 0.8, rotation: 10 },
        { x: 5, y: 75, scale: 0.9, rotation: -5 },
        { x: 90, y: 80, scale: 1.1, rotation: 20 },
        { x: 50, y: 5, scale: 0.7, rotation: 0 },
        { x: 15, y: 45, scale: 0.6, rotation: 45 },
        { x: 88, y: 50, scale: 0.65, rotation: -30 },
      ],
    },
    defaultWeather: 'sunny',
  },
  summer: {
    name: 'Summer',
    colors: {
      primary: '#FFD700', // Golden yellow
      secondary: '#87CEEB', // Sky blue
      accent: '#FF7F50', // Coral
      background: '#FFFAF0', // Floral white
      backgroundGradient: 'linear-gradient(135deg, #87CEEB 0%, #FFFAF0 50%, #FFE4B5 100%)',
      timerColors: {
        start: '#FFD700', // Golden
        mid1: '#FFA500', // Orange
        mid2: '#FF7F50', // Coral
        end: '#FF4500', // Orange red
      },
    },
    decorations: {
      elements: ['sun', 'cloud', 'seashell', 'palm-leaf'],
      positions: [
        { x: 85, y: 10, scale: 1.2, rotation: 0 },
        { x: 10, y: 12, scale: 0.8, rotation: 0 },
        { x: 5, y: 80, scale: 0.9, rotation: 15 },
        { x: 92, y: 75, scale: 0.85, rotation: -20 },
        { x: 50, y: 3, scale: 0.6, rotation: 0 },
        { x: 8, y: 50, scale: 0.7, rotation: 30 },
      ],
    },
    defaultWeather: 'sunny',
  },
  autumn: {
    name: 'Autumn',
    colors: {
      primary: '#D2691E', // Chocolate (burnt orange)
      secondary: '#CD853F', // Peru (golden brown)
      accent: '#8B4513', // Saddle brown
      background: '#FFF8DC', // Cornsilk
      backgroundGradient: 'linear-gradient(135deg, #FFF8DC 0%, #FFEFD5 50%, #FFE4C4 100%)',
      timerColors: {
        start: '#DAA520', // Goldenrod
        mid1: '#D2691E', // Chocolate
        mid2: '#CD5C5C', // Indian red
        end: '#8B0000', // Dark red
      },
    },
    decorations: {
      elements: ['maple-leaf', 'oak-leaf', 'acorn', 'pumpkin'],
      positions: [
        { x: 8, y: 18, scale: 1, rotation: -25 },
        { x: 88, y: 15, scale: 0.9, rotation: 30 },
        { x: 5, y: 78, scale: 0.85, rotation: 10 },
        { x: 92, y: 82, scale: 1.1, rotation: -10 },
        { x: 45, y: 2, scale: 0.7, rotation: 15 },
        { x: 12, y: 50, scale: 0.65, rotation: -45 },
        { x: 90, y: 48, scale: 0.7, rotation: 40 },
      ],
    },
    defaultWeather: 'cloudy',
  },
  winter: {
    name: 'Winter',
    colors: {
      primary: '#B0E0E6', // Powder blue
      secondary: '#F0F8FF', // Alice blue
      accent: '#C0C0C0', // Silver
      background: '#F8F8FF', // Ghost white
      backgroundGradient: 'linear-gradient(135deg, #E6E6FA 0%, #F0F8FF 50%, #F5F5F5 100%)',
      timerColors: {
        start: '#87CEEB', // Sky blue
        mid1: '#B0E0E6', // Powder blue
        mid2: '#DDA0DD', // Plum
        end: '#4169E1', // Royal blue
      },
    },
    decorations: {
      elements: ['snowflake', 'icicle', 'snowman', 'pine-tree'],
      positions: [
        { x: 10, y: 12, scale: 0.9, rotation: 0 },
        { x: 88, y: 18, scale: 1, rotation: 15 },
        { x: 5, y: 75, scale: 1.1, rotation: 0 },
        { x: 90, y: 80, scale: 0.85, rotation: 0 },
        { x: 50, y: 5, scale: 0.7, rotation: 30 },
        { x: 8, y: 45, scale: 0.6, rotation: -20 },
        { x: 92, y: 52, scale: 0.65, rotation: 10 },
      ],
    },
    defaultWeather: 'snowy',
  },
};

/**
 * Detect the current season based on the date
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();
  const dayOfYear = month * 100 + day; // Simple comparison format: MMDD

  // Winter wraps around the year
  if (dayOfYear >= 1221 || dayOfYear <= 319) {
    return 'winter';
  }
  if (dayOfYear >= 320 && dayOfYear <= 620) {
    return 'spring';
  }
  if (dayOfYear >= 621 && dayOfYear <= 922) {
    return 'summer';
  }
  // autumn: 923 to 1220
  return 'autumn';
}

/**
 * Get the season configuration
 */
export function getSeasonConfig(season: Season): SeasonConfig {
  return SEASON_CONFIGS[season];
}

/**
 * Get all season names for UI display
 */
export function getAllSeasons(): Season[] {
  return ['spring', 'summer', 'autumn', 'winter'];
}

/**
 * Check if it's currently nighttime (for night weather effect)
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hours = date.getHours();
  return hours >= 20 || hours < 6; // 8 PM to 6 AM
}

/**
 * Parse debug parameters from URL
 */
export function getDebugParams(): {
  debugMode: boolean;
  forceSeason: Season | null;
  forceWeather: string | null;
} {
  if (typeof window === 'undefined') {
    return { debugMode: false, forceSeason: null, forceWeather: null };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug') === 'true';
  const forceSeason = urlParams.get('season') as Season | null;
  const forceWeather = urlParams.get('weather');

  // Validate season
  const validSeasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
  const validatedSeason = forceSeason && validSeasons.includes(forceSeason) ? forceSeason : null;

  return {
    debugMode,
    forceSeason: validatedSeason,
    forceWeather,
  };
}

/**
 * Interpolate between two hex colors
 */
export function interpolateHexColor(color1: string, color2: string, factor: number): string {
  const hex = (x: string) => parseInt(x, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get timer color based on progress and season
 */
export function getSeasonalTimerColor(progress: number, season: Season): string {
  const config = SEASON_CONFIGS[season];
  const { start, mid1, mid2, end } = config.colors.timerColors;

  if (progress > 0.66) {
    const factor = (progress - 0.66) / 0.34;
    return interpolateHexColor(mid1, start, factor);
  } else if (progress > 0.33) {
    const factor = (progress - 0.33) / 0.33;
    return interpolateHexColor(mid2, mid1, factor);
  } else {
    const factor = progress / 0.33;
    return interpolateHexColor(end, mid2, factor);
  }
}
