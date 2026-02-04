import { describe, it, expect } from 'vitest';
import {
  getThemeById,
  getThemeForDate,
  getThemesForSeason,
  getHolidayTheme,
  getDayOfYear,
  isLeapYear,
  getAllThemes,
  getThemesByCategory,
} from '../../src/themes/dailyThemes';
import type { ThemeCategory } from '../../src/themes/dailyThemes.types';
import { HOLIDAYS } from '../../src/themes/dailyThemes.types';

describe('Daily Themes Data', () => {
  describe('Theme Structure Validation', () => {
    it('should have at least 30 themes per season (120+ total)', () => {
      const springThemes = getThemesForSeason('spring');
      const summerThemes = getThemesForSeason('summer');
      const autumnThemes = getThemesForSeason('autumn');
      const winterThemes = getThemesForSeason('winter');

      expect(springThemes.length).toBeGreaterThanOrEqual(30);
      expect(summerThemes.length).toBeGreaterThanOrEqual(30);
      expect(autumnThemes.length).toBeGreaterThanOrEqual(30);
      expect(winterThemes.length).toBeGreaterThanOrEqual(30);

      const totalThemes = getAllThemes().length;
      expect(totalThemes).toBeGreaterThanOrEqual(120);
    });

    it('should have all required properties for each theme', () => {
      const allThemes = getAllThemes();

      allThemes.forEach((theme) => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('season');
        expect(theme).toHaveProperty('dayNumber');
        expect(theme).toHaveProperty('colors');
        expect(theme).toHaveProperty('backgroundEffect');
        expect(theme).toHaveProperty('decorativeElements');
        expect(theme).toHaveProperty('categories');

        // Check colors object
        expect(theme.colors).toHaveProperty('backgroundPrimary');
        expect(theme.colors).toHaveProperty('backgroundSecondary');
        expect(theme.colors).toHaveProperty('backgroundGradient');
        expect(theme.colors).toHaveProperty('timerStart');
        expect(theme.colors).toHaveProperty('timerMid');
        expect(theme.colors).toHaveProperty('timerEnd');
        expect(theme.colors).toHaveProperty('textPrimary');
        expect(theme.colors).toHaveProperty('accent');
      });
    });

    it('should have unique IDs for all themes', () => {
      const allThemes = getAllThemes();
      const ids = allThemes.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names for all themes', () => {
      const allThemes = getAllThemes();
      const names = allThemes.map((t) => t.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid season values', () => {
      const allThemes = getAllThemes();
      const validSeasons = ['spring', 'summer', 'autumn', 'winter'];

      allThemes.forEach((theme) => {
        expect(validSeasons).toContain(theme.season);
      });
    });

    it('should have valid hex color values', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      const allThemes = getAllThemes();

      allThemes.forEach((theme) => {
        expect(theme.colors.backgroundPrimary).toMatch(hexColorRegex);
        expect(theme.colors.backgroundSecondary).toMatch(hexColorRegex);
        expect(theme.colors.timerStart).toMatch(hexColorRegex);
        expect(theme.colors.timerMid).toMatch(hexColorRegex);
        expect(theme.colors.timerEnd).toMatch(hexColorRegex);
        expect(theme.colors.textPrimary).toMatch(hexColorRegex);
        expect(theme.colors.accent).toMatch(hexColorRegex);
      });
    });

    it('should have at least one category per theme', () => {
      const allThemes = getAllThemes();

      allThemes.forEach((theme) => {
        expect(theme.categories.length).toBeGreaterThan(0);
      });
    });

    it('should have valid category values', () => {
      const validCategories: ThemeCategory[] = [
        'cozy',
        'vibrant',
        'minimal',
        'whimsical',
        'dark',
        'light',
        'nature',
        'festive',
      ];
      const allThemes = getAllThemes();

      allThemes.forEach((theme) => {
        theme.categories.forEach((category) => {
          expect(validCategories).toContain(category);
        });
      });
    });

    it('should have day numbers between 1 and 30 for regular themes', () => {
      const allThemes = getAllThemes();
      const regularThemes = allThemes.filter((t) => !t.isSpecial);

      regularThemes.forEach((theme) => {
        expect(theme.dayNumber).toBeGreaterThanOrEqual(1);
        expect(theme.dayNumber).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('Special/Holiday Themes', () => {
    it('should have all holiday themes defined', () => {
      HOLIDAYS.forEach((holiday) => {
        const theme = getThemeById(holiday.themeId);
        expect(theme).toBeDefined();
        expect(theme?.isSpecial).toBe(true);
        expect(theme?.specialDate).toEqual({ month: holiday.month, day: holiday.day });
      });
    });

    it('should have a Christmas theme for Dec 25', () => {
      const christmas = getHolidayTheme(12, 25);
      expect(christmas).toBeDefined();
      expect(christmas?.name).toContain('Silent Night');
    });

    it('should have a New Year theme for Jan 1', () => {
      const newYear = getHolidayTheme(1, 1);
      expect(newYear).toBeDefined();
      expect(newYear?.name).toContain('Midnight Sparkle');
    });

    it('should have a Valentine theme for Feb 14', () => {
      const valentine = getHolidayTheme(2, 14);
      expect(valentine).toBeDefined();
      expect(valentine?.name).toContain('Heartbeat');
    });

    it('should have an Easter theme for Apr 9', () => {
      const easter = getHolidayTheme(4, 9);
      expect(easter).toBeDefined();
      expect(easter?.name).toContain('Spring Awakening');
    });

    it('should have a Halloween theme for Oct 31', () => {
      const halloween = getHolidayTheme(10, 31);
      expect(halloween).toBeDefined();
      expect(halloween?.name).toContain('Spooky Night');
    });

    it('should have Summer Solstice theme for Jun 21', () => {
      const summerSolstice = getHolidayTheme(6, 21);
      expect(summerSolstice).toBeDefined();
      expect(summerSolstice?.name).toContain('Endless Day');
    });

    it('should have Winter Solstice theme for Dec 21', () => {
      const winterSolstice = getHolidayTheme(12, 21);
      expect(winterSolstice).toBeDefined();
      expect(winterSolstice?.name).toContain('Longest Night');
    });

    it('should return null for non-holiday dates', () => {
      const regularDay = getHolidayTheme(3, 15);
      expect(regularDay).toBeNull();
    });
  });

  describe('Date Utility Functions', () => {
    it('should correctly calculate day of year', () => {
      // Jan 1
      expect(getDayOfYear(new Date(2024, 0, 1))).toBe(1);
      // Feb 1 (31 days in Jan)
      expect(getDayOfYear(new Date(2024, 1, 1))).toBe(32);
      // Dec 31 (leap year)
      expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366);
      // Dec 31 (non-leap year)
      expect(getDayOfYear(new Date(2023, 11, 31))).toBe(365);
    });

    it('should correctly identify leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2000)).toBe(true); // divisible by 400
      expect(isLeapYear(1900)).toBe(false); // divisible by 100 but not 400
    });
  });

  describe('Theme Retrieval Functions', () => {
    it('should get theme by ID', () => {
      const allThemes = getAllThemes();
      const firstTheme = allThemes[0];

      const retrieved = getThemeById(firstTheme.id);
      expect(retrieved).toEqual(firstTheme);
    });

    it('should return undefined for non-existent theme ID', () => {
      const retrieved = getThemeById('non-existent-theme-id');
      expect(retrieved).toBeUndefined();
    });

    it('should get themes for a specific season', () => {
      const springThemes = getThemesForSeason('spring');

      springThemes.forEach((theme) => {
        expect(theme.season).toBe('spring');
      });
    });

    it('should get themes by category', () => {
      const cozyThemes = getThemesByCategory('cozy');

      cozyThemes.forEach((theme) => {
        expect(theme.categories).toContain('cozy');
      });
    });
  });

  describe('getThemeForDate', () => {
    it('should return holiday theme on holiday dates', () => {
      // Christmas
      const christmasDate = new Date(2024, 11, 25);
      const christmasTheme = getThemeForDate(christmasDate);
      expect(christmasTheme.isSpecial).toBe(true);
      expect(christmasTheme.name).toContain('Silent Night');
    });

    it('should return seasonal theme based on day of year', () => {
      // A regular spring day (April 15)
      const springDate = new Date(2024, 3, 15);
      const springTheme = getThemeForDate(springDate);
      expect(springTheme.season).toBe('spring');
    });

    it('should handle year boundary correctly', () => {
      // Jan 1 should be New Year holiday
      const newYearDate = new Date(2024, 0, 1);
      const newYearTheme = getThemeForDate(newYearDate);
      expect(newYearTheme.isSpecial).toBe(true);

      // Jan 2 should be winter theme
      const jan2Date = new Date(2024, 0, 2);
      const jan2Theme = getThemeForDate(jan2Date);
      expect(jan2Theme.season).toBe('winter');
    });

    it('should cycle through themes based on day number', () => {
      // Get themes for consecutive days
      const day1 = new Date(2024, 3, 1);
      const day2 = new Date(2024, 3, 2);

      const theme1 = getThemeForDate(day1);
      const theme2 = getThemeForDate(day2);

      // They should be different themes
      expect(theme1.id).not.toBe(theme2.id);
    });

    it('should handle edge cases at season boundaries', () => {
      // Last day of winter (March 19)
      const lastWinter = new Date(2024, 2, 19);
      const winterTheme = getThemeForDate(lastWinter);
      expect(winterTheme.season).toBe('winter');

      // First day of spring (March 20)
      const firstSpring = new Date(2024, 2, 20);
      const springTheme = getThemeForDate(firstSpring);
      expect(springTheme.season).toBe('spring');
    });
  });

  describe('Theme Variety', () => {
    it('should have themes with different background effects', () => {
      const allThemes = getAllThemes();
      const effects = new Set(allThemes.map((t) => t.backgroundEffect));

      // Should have multiple different effects
      expect(effects.size).toBeGreaterThan(5);
    });

    it('should have themes with different categories', () => {
      const allThemes = getAllThemes();
      const allCategories = new Set<ThemeCategory>();

      allThemes.forEach((theme) => {
        theme.categories.forEach((cat) => allCategories.add(cat));
      });

      // Should have all category types represented
      expect(allCategories.size).toBe(8);
    });

    it('should have themes with decorative elements', () => {
      const allThemes = getAllThemes();
      const themesWithDecorations = allThemes.filter(
        (t) => t.decorativeElements.length > 0 && !t.decorativeElements.includes('none')
      );

      // At least half should have decorations
      expect(themesWithDecorations.length).toBeGreaterThan(allThemes.length / 2);
    });
  });
});
