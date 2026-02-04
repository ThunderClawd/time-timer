import type { DailyTheme, ThemeCategory } from '../themes/dailyThemes.types';
import { getUnlockDate, isThemeUnlocked, setActiveTheme } from '../utils/themeCollection';

interface ThemePreviewProps {
  theme: DailyTheme;
  onClose: () => void;
  onApply?: (themeId: string) => void;
}

const categoryColors: Record<ThemeCategory, string> = {
  cozy: 'bg-amber-100 text-amber-800',
  vibrant: 'bg-pink-100 text-pink-800',
  minimal: 'bg-gray-100 text-gray-800',
  whimsical: 'bg-purple-100 text-purple-800',
  dark: 'bg-slate-700 text-slate-100',
  light: 'bg-sky-100 text-sky-800',
  nature: 'bg-green-100 text-green-800',
  festive: 'bg-red-100 text-red-800',
};

const effectIcons: Record<string, string> = {
  glitter: '✨',
  snow: '❄️',
  rain: '🌧️',
  leaves: '🍂',
  fireflies: '🌟',
  sparkles: '💫',
  stars: '⭐',
  bubbles: '🫧',
  petals: '🌸',
  confetti: '🎊',
  hearts: '💕',
  dust: '🌫️',
  aurora: '🌌',
  fog: '🌁',
  none: '',
};

const effectDescriptions: Record<string, string> = {
  glitter: 'Sparkling shimmer effect',
  leaves: 'Falling leaves animation',
  fireflies: 'Gentle glowing particles',
  sparkles: 'Twinkling sparkle effect',
  stars: 'Starry sky animation',
  bubbles: 'Floating bubble effect',
  petals: 'Falling petal animation',
  confetti: 'Celebratory confetti',
  hearts: 'Floating hearts effect',
  dust: 'Gentle dust particles',
  aurora: 'Northern lights shimmer',
  fog: 'Misty atmosphere effect',
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

export function ThemePreview({ theme, onClose, onApply }: ThemePreviewProps) {
  const unlocked = isThemeUnlocked(theme.id);
  const unlockDate = getUnlockDate(theme.id);
  const unlockDateStr = unlockDate ? new Date(unlockDate).toLocaleDateString() : null;

  const handleApply = () => {
    setActiveTheme(theme.id);
    onApply?.(theme.id);
    onClose();
  };

  const handleSetAuto = () => {
    setActiveTheme(null);
    onApply?.(theme.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: theme.colors.backgroundGradient,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="space-y-1">
            <h2
              className="text-2xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              {theme.name}
            </h2>
            {theme.isSpecial && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-400 text-yellow-900">
                Special Holiday Theme
              </span>
            )}
          </div>

          {/* Mini Timer Preview */}
          <div className="flex justify-center py-4">
            <div
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(${theme.colors.timerStart} 0%, ${theme.colors.timerMid} 50%, ${theme.colors.timerEnd} 100%)`,
                boxShadow: `0 0 20px ${theme.colors.accent}40`,
              }}
            >
              <div
                className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.colors.timerBackground }}
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  5:00
                </span>
              </div>
            </div>
          </div>

          {/* Theme Info */}
          <div className="space-y-3">
            {/* Season & Day */}
            <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textSecondary }}>
              <span className="capitalize font-medium">{theme.season}</span>
              {!theme.isSpecial && <span>Day {theme.dayNumber}</span>}
              {theme.isSpecial && theme.specialDate && (
                <span>
                  {new Date(2024, theme.specialDate.month - 1, theme.specialDate.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            {/* Description */}
            {theme.description && (
              <p className="text-sm italic" style={{ color: theme.colors.textSecondary }}>
                "{theme.description}"
              </p>
            )}

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              {theme.categories.map((category) => (
                <span
                  key={category}
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[category]}`}
                >
                  {category}
                </span>
              ))}
            </div>

            {/* Effects */}
            {theme.backgroundEffect !== 'none' && (
              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Effect:</span>
                  <span>
                    {effectIcons[theme.backgroundEffect]} {theme.backgroundEffect}
                  </span>
                </div>
                {effectDescriptions[theme.backgroundEffect] && (
                  <p className="text-xs mt-0.5 opacity-80 ml-[52px]">
                    {effectDescriptions[theme.backgroundEffect]}
                  </p>
                )}
              </div>
            )}

            {/* Decorative Elements */}
            {theme.decorativeElements.length > 0 && !theme.decorativeElements.includes('none') && (
              <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                <span className="font-medium">Decorations:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {theme.decorativeElements.map((element) => (
                    <span
                      key={element}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/10"
                    >
                      <span>{decorationEmojis[element] || '•'}</span>
                      <span className="text-xs">{element}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unlock Date */}
            {unlockDateStr && (
              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                Collected on {unlockDateStr}
              </div>
            )}
          </div>

          {/* Color Palette Preview */}
          <div className="flex gap-1 rounded-lg overflow-hidden h-6">
            <div className="flex-1" style={{ backgroundColor: theme.colors.backgroundPrimary }} title="Background" />
            <div className="flex-1" style={{ backgroundColor: theme.colors.timerStart }} title="Timer Start" />
            <div className="flex-1" style={{ backgroundColor: theme.colors.timerMid }} title="Timer Mid" />
            <div className="flex-1" style={{ backgroundColor: theme.colors.timerEnd }} title="Timer End" />
            <div className="flex-1" style={{ backgroundColor: theme.colors.accent }} title="Accent" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {unlocked ? (
              <>
                <button
                  onClick={handleApply}
                  className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  Use This Theme
                </button>
                <button
                  onClick={handleSetAuto}
                  className="py-2.5 px-4 rounded-lg font-medium bg-black/10 hover:bg-black/20 transition-colors"
                  style={{ color: theme.colors.textPrimary }}
                >
                  Auto
                </button>
              </>
            ) : (
              <div
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-center bg-black/10"
                style={{ color: theme.colors.textSecondary }}
              >
                Come back when this theme is available!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
