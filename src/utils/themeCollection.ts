// Theme Collection System - Unlocking, saving, and managing collectible themes

import type { CollectedThemes } from '../themes/dailyThemes.types';
import type { DailyTheme } from '../themes/dailyThemes.types';
import { getThemeForDate, getThemeById } from '../themes/dailyThemes';

export const THEME_COLLECTION_STORAGE_KEY = 'time-timer-theme-collection';

const DEFAULT_COLLECTION: CollectedThemes = {
  themes: [],
  unlockedDates: {},
  activeTheme: null,
};

/**
 * Load theme collection from localStorage
 */
export function loadThemeCollection(): CollectedThemes {
  try {
    const stored = localStorage.getItem(THEME_COLLECTION_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_COLLECTION };

    const parsed = JSON.parse(stored) as CollectedThemes;
    return {
      themes: parsed.themes || [],
      unlockedDates: parsed.unlockedDates || {},
      activeTheme: parsed.activeTheme ?? null,
    };
  } catch {
    return { ...DEFAULT_COLLECTION };
  }
}

/**
 * Save theme collection to localStorage
 */
export function saveThemeCollection(collection: CollectedThemes): void {
  try {
    localStorage.setItem(THEME_COLLECTION_STORAGE_KEY, JSON.stringify(collection));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Unlock a theme and add it to the collection
 */
export function unlockTheme(themeId: string): void {
  const collection = loadThemeCollection();

  // Don't duplicate
  if (!collection.themes.includes(themeId)) {
    collection.themes.push(themeId);
  }

  // Only set unlock date if not already set
  if (!collection.unlockedDates[themeId]) {
    collection.unlockedDates[themeId] = Date.now();
  }

  saveThemeCollection(collection);
}

/**
 * Get all collected theme IDs
 */
export function getCollectedThemes(): string[] {
  return loadThemeCollection().themes;
}

/**
 * Set the active theme (null for auto/daily theme)
 */
export function setActiveTheme(themeId: string | null): void {
  const collection = loadThemeCollection();
  collection.activeTheme = themeId;
  saveThemeCollection(collection);
}

/**
 * Get the currently active theme ID (null = auto/daily)
 */
export function getActiveTheme(): string | null {
  return loadThemeCollection().activeTheme;
}

/**
 * Check if a theme is unlocked
 */
export function isThemeUnlocked(themeId: string): boolean {
  return loadThemeCollection().themes.includes(themeId);
}

/**
 * Get the unlock date timestamp for a theme
 */
export function getUnlockDate(themeId: string): number | null {
  return loadThemeCollection().unlockedDates[themeId] || null;
}

/**
 * Clear the entire collection (for testing/debug)
 */
export function clearCollection(): void {
  try {
    localStorage.removeItem(THEME_COLLECTION_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Unlock all themes (for debug mode)
 * Returns the number of newly unlocked themes
 */
export function unlockAllThemes(): number {
  const { getAllThemes } = require('../themes/dailyThemes');
  const allThemes = getAllThemes();
  const collection = loadThemeCollection();
  let newlyUnlocked = 0;

  allThemes.forEach((theme: { id: string }) => {
    if (!collection.themes.includes(theme.id)) {
      collection.themes.push(theme.id);
      newlyUnlocked++;
    }
    if (!collection.unlockedDates[theme.id]) {
      collection.unlockedDates[theme.id] = Date.now();
    }
  });

  saveThemeCollection(collection);
  return newlyUnlocked;
}

/**
 * Get today's theme based on the current date
 */
export function getTodayTheme(): DailyTheme {
  return getThemeForDate(new Date());
}

/**
 * Get the current effective theme (respects user selection or auto)
 */
export function getCurrentEffectiveTheme(): DailyTheme {
  const activeId = getActiveTheme();

  if (activeId) {
    const theme = getThemeById(activeId);
    if (theme) return theme;
  }

  // Fallback to today's theme
  return getTodayTheme();
}

/**
 * Auto-unlock today's theme if not already unlocked
 * Returns true if a new theme was unlocked
 */
export function autoUnlockTodayTheme(): { unlocked: boolean; theme: DailyTheme } {
  const todayTheme = getTodayTheme();
  const wasUnlocked = isThemeUnlocked(todayTheme.id);

  if (!wasUnlocked) {
    unlockTheme(todayTheme.id);
  }

  return {
    unlocked: !wasUnlocked,
    theme: todayTheme,
  };
}

/**
 * Get collection statistics
 */
export function getCollectionStats(): {
  totalCollected: number;
  totalAvailable: number;
  percentComplete: number;
  byCategory: Record<string, number>;
  bySeason: Record<string, number>;
} {
  const collection = loadThemeCollection();
  const collectedThemes = collection.themes
    .map((id) => getThemeById(id))
    .filter((t): t is DailyTheme => t !== undefined);

  // Count by category
  const byCategory: Record<string, number> = {};
  const bySeason: Record<string, number> = {};

  collectedThemes.forEach((theme) => {
    theme.categories.forEach((cat) => {
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    bySeason[theme.season] = (bySeason[theme.season] || 0) + 1;
  });

  // 120 regular themes + 7 holiday themes = 127 total
  const totalAvailable = 127;

  return {
    totalCollected: collection.themes.length,
    totalAvailable,
    percentComplete: Math.round((collection.themes.length / totalAvailable) * 100),
    byCategory,
    bySeason,
  };
}

/**
 * Sort collected themes by different criteria
 */
export type SortOption = 'date' | 'season' | 'name' | 'category';

export function sortCollectedThemes(themes: DailyTheme[], sortBy: SortOption): DailyTheme[] {
  const sorted = [...themes];

  switch (sortBy) {
    case 'date': {
      const collection = loadThemeCollection();
      sorted.sort((a, b) => {
        const dateA = collection.unlockedDates[a.id] || 0;
        const dateB = collection.unlockedDates[b.id] || 0;
        return dateB - dateA; // Most recent first
      });
      break;
    }
    case 'season': {
      const seasonOrder = { spring: 0, summer: 1, autumn: 2, winter: 3 };
      sorted.sort(
        (a, b) => seasonOrder[a.season] - seasonOrder[b.season] || a.dayNumber - b.dayNumber
      );
      break;
    }
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'category':
      sorted.sort((a, b) => a.categories[0]?.localeCompare(b.categories[0] || '') || 0);
      break;
  }

  return sorted;
}
