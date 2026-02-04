// Daily Collectible Theme Types

import type { Season } from './seasons';

export type ThemeCategory =
  | 'cozy'
  | 'vibrant'
  | 'minimal'
  | 'whimsical'
  | 'dark'
  | 'light'
  | 'nature'
  | 'festive';

export type BackgroundEffect =
  | 'glitter'
  | 'snow'
  | 'rain'
  | 'leaves'
  | 'fireflies'
  | 'sparkles'
  | 'stars'
  | 'bubbles'
  | 'petals'
  | 'confetti'
  | 'hearts'
  | 'dust'
  | 'aurora'
  | 'fog'
  | 'none';

export type DecorativeElement =
  | 'snowmen'
  | 'flowers'
  | 'hearts'
  | 'stars'
  | 'moons'
  | 'suns'
  | 'clouds'
  | 'trees'
  | 'mountains'
  | 'waves'
  | 'birds'
  | 'butterflies'
  | 'lanterns'
  | 'candles'
  | 'pumpkins'
  | 'eggs'
  | 'presents'
  | 'fireworks'
  | 'crystals'
  | 'mushrooms'
  | 'leaves'
  | 'none';

export interface DailyThemeColors {
  // Background
  backgroundPrimary: string;
  backgroundSecondary: string;
  backgroundGradient: string;

  // Timer
  timerStart: string;
  timerMid: string;
  timerEnd: string;
  timerBackground: string;
  timerBackgroundDark: string;
  timerInnerCircle: string;
  timerInnerCircleDark: string;
  timerProgress: string;
  timerProgressDark: string;

  // Text
  textPrimary: string;
  textPrimaryDark: string;
  textSecondary: string;
  textSecondaryDark: string;

  // Accents
  accent: string;
  accentDark: string;
}

export interface DailyTheme {
  id: string;
  name: string;
  season: Season;
  dayNumber: number; // 1-30 (or special for holidays)
  colors: DailyThemeColors;
  backgroundEffect: BackgroundEffect;
  decorativeElements: DecorativeElement[];
  categories: ThemeCategory[];
  description?: string;
  isSpecial?: boolean; // For holiday themes
  specialDate?: { month: number; day: number }; // For holiday themes (month 1-12)
}

export interface CollectedThemes {
  themes: string[]; // Array of theme IDs
  unlockedDates: Record<string, number>; // themeId -> timestamp
  activeTheme: string | null; // null = auto/daily theme
}

// Holiday dates (month is 1-indexed)
export interface HolidayTheme {
  month: number;
  day: number;
  themeId: string;
  name: string;
}

export const HOLIDAYS: HolidayTheme[] = [
  { month: 1, day: 1, themeId: 'new-year', name: 'New Year' },
  { month: 2, day: 14, themeId: 'valentine', name: "Valentine's Day" },
  { month: 4, day: 9, themeId: 'easter', name: 'Easter' },
  { month: 6, day: 21, themeId: 'summer-solstice', name: 'Summer Solstice' },
  { month: 10, day: 31, themeId: 'halloween', name: 'Halloween' },
  { month: 12, day: 21, themeId: 'winter-solstice', name: 'Winter Solstice' },
  { month: 12, day: 25, themeId: 'christmas', name: 'Christmas' },
];
