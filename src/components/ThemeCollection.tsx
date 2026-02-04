import { useState, useMemo } from 'react';
import type { DailyTheme, ThemeCategory } from '../themes/dailyThemes.types';
import { getAllThemes, getThemesForSeason } from '../themes/dailyThemes';
import {
  isThemeUnlocked,
  getCollectionStats,
  sortCollectedThemes,
  getActiveTheme,
  type SortOption,
} from '../utils/themeCollection';
import { ThemePreview } from './ThemePreview';
import type { Season } from '../themes/seasons';

interface ThemeCollectionProps {
  onClose: () => void;
  onThemeChange?: (themeId: string) => void;
  debugMode?: boolean;
}

const categoryColors: Record<ThemeCategory, string> = {
  cozy: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  vibrant: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
  minimal: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  whimsical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  dark: 'bg-slate-700 text-slate-100',
  light: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
  nature: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  festive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const seasonEmojis: Record<Season, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
};

// Emoji mappings for decorative elements
const decorationEmojis: Record<string, string> = {
  snowmen: '⛄',
  flowers: '🌸',
  hearts: '💕',
  stars: '⭐',
  moons: '🌙',
  suns: '☀️',
  clouds: '☁️',
  trees: '🌲',
  mountains: '⛰️',
  waves: '🌊',
  birds: '🐦',
  butterflies: '🦋',
  lanterns: '🏮',
  candles: '🕯️',
  pumpkins: '🎃',
  eggs: '🥚',
  presents: '🎁',
  fireworks: '🎆',
  crystals: '💎',
  mushrooms: '🍄',
  leaves: '🍂',
};

// Emoji mappings for background effects
const effectEmojis: Record<string, string> = {
  fog: '🌫️',
  fireflies: '✨',
  aurora: '🌌',
  glitter: '✨',
  sparkles: '💫',
  stars: '⭐',
  dust: '🌫️',
  leaves: '🍂',
  petals: '🌸',
  confetti: '🎊',
  hearts: '💕',
  bubbles: '🫧',
};

type FilterOption = 'all' | Season | 'special';

export function ThemeCollection({ onClose, onThemeChange, debugMode = false }: ThemeCollectionProps) {
  const [selectedTheme, setSelectedTheme] = useState<DailyTheme | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showOnlyCollected, setShowOnlyCollected] = useState(!debugMode);

  const stats = getCollectionStats();
  const activeThemeId = getActiveTheme();

  const allThemes = useMemo(() => getAllThemes(), []);

  const filteredThemes = useMemo(() => {
    let themes = allThemes;

    // Filter by season/special
    if (filter === 'special') {
      themes = themes.filter((t) => t.isSpecial);
    } else if (filter !== 'all') {
      themes = getThemesForSeason(filter);
    }

    // Filter by collected status (unless in debug mode viewing all)
    if (showOnlyCollected) {
      themes = themes.filter((t) => isThemeUnlocked(t.id));
    }

    // Sort
    return sortCollectedThemes(themes, sortBy);
  }, [allThemes, filter, showOnlyCollected, sortBy]);

  const handleThemeClick = (theme: DailyTheme) => {
    // In debug mode, allow preview of any theme
    // Otherwise, only allow preview of unlocked themes
    if (debugMode || isThemeUnlocked(theme.id)) {
      setSelectedTheme(theme);
    }
  };

  const handleThemeApply = (themeId: string) => {
    onThemeChange?.(themeId);
  };

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Theme Collection
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {stats.totalCollected} / {stats.totalAvailable} collected ({stats.percentComplete}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${stats.percentComplete}%` }}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Season Filters */}
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {(['spring', 'summer', 'autumn', 'winter'] as Season[]).map((season) => (
              <button
                key={season}
                onClick={() => setFilter(season)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === season
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {seasonEmojis[season]} {season.charAt(0).toUpperCase() + season.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setFilter('special')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === 'special'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              ⭐ Special
            </button>
          </div>

          {/* Sort & Toggle */}
          <div className="flex gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">By Date</option>
              <option value="season">By Season</option>
              <option value="name">By Name</option>
              <option value="category">By Category</option>
            </select>

            {debugMode && (
              <button
                onClick={() => setShowOnlyCollected(!showOnlyCollected)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showOnlyCollected
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {showOnlyCollected ? 'Collected' : 'All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredThemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-lg font-medium">No themes found</p>
            <p className="text-sm mt-1">Come back tomorrow to unlock more!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredThemes.map((theme) => {
              const unlocked = isThemeUnlocked(theme.id);
              const isActive = activeThemeId === theme.id;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme)}
                  className={`relative rounded-xl overflow-hidden aspect-square transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    !unlocked && !debugMode ? 'cursor-not-allowed' : ''
                  }`}
                  disabled={!unlocked && !debugMode}
                >
                  {/* Background */}
                  <div
                    className={`absolute inset-0 ${!unlocked ? 'grayscale opacity-40' : ''}`}
                    style={{ background: theme.colors.backgroundGradient }}
                  />

                  {/* Mini Timer Preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`w-16 h-16 rounded-full relative ${!unlocked ? 'opacity-50' : ''}`}
                      style={{
                        background: `conic-gradient(${theme.colors.timerStart} 0%, ${theme.colors.timerMid} 50%, ${theme.colors.timerEnd} 100%)`,
                      }}
                    >
                      {/* Inner circle to create ring effect */}
                      <div
                        className="absolute rounded-full"
                        style={{
                          top: '4px',
                          left: '4px',
                          right: '4px',
                          bottom: '4px',
                          backgroundColor: theme.colors.timerBackground,
                        }}
                      />
                      {/* Progress indicator simulation - 75% fill */}
                      <div
                        className="absolute rounded-full"
                        style={{
                          top: '8px',
                          left: '8px',
                          right: '8px',
                          bottom: '8px',
                          backgroundColor: theme.colors.timerInnerCircle,
                        }}
                      />
                    </div>
                  </div>

                  {/* Lock Overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg
                        className="w-8 h-8 text-white/80"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Special Badge */}
                  {theme.isSpecial && (
                    <div className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center">
                      <span className="text-lg">⭐</span>
                    </div>
                  )}

                  {/* Decoration/Effect Indicators */}
                  {unlocked && (
                    <div className="absolute bottom-10 left-0 right-0 px-2 flex items-center gap-1 justify-end">
                      {/* Decorations */}
                      {theme.decorativeElements.length > 0 &&
                        !theme.decorativeElements.includes('none') && (
                          <span className="text-xs opacity-90 drop-shadow-md">
                            {theme.decorativeElements
                              .slice(0, 2)
                              .map((el) => decorationEmojis[el] || '')
                              .filter(Boolean)
                              .join('')}
                          </span>
                        )}
                      {/* Effect */}
                      {theme.backgroundEffect !== 'none' && effectEmojis[theme.backgroundEffect] && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-black/30 text-white flex items-center gap-0.5">
                          <span>{effectEmojis[theme.backgroundEffect]}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Theme Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-xs font-medium text-white truncate">{theme.name}</p>
                    {unlocked && theme.categories[0] && (
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded-full ${categoryColors[theme.categories[0]]}`}
                      >
                        {theme.categories[0]}
                      </span>
                    )}
                  </div>

                  {/* Debug Info */}
                  {debugMode && (
                    <div className="absolute top-2 left-2 text-[8px] text-white bg-black/50 px-1 rounded">
                      {theme.id}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-around text-center">
          {(['spring', 'summer', 'autumn', 'winter'] as Season[]).map((season) => (
            <div key={season} className="flex flex-col items-center">
              <span className="text-lg">{seasonEmojis[season]}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stats.bySeason[season] || 0}/30
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center">
            <span className="text-lg">⭐</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {allThemes.filter((t) => t.isSpecial && isThemeUnlocked(t.id)).length}/7
            </span>
          </div>
        </div>
      </div>

      {/* Theme Preview Modal */}
      {selectedTheme && (
        <ThemePreview
          theme={selectedTheme}
          onClose={() => setSelectedTheme(null)}
          onApply={handleThemeApply}
        />
      )}
    </div>
  );
}
