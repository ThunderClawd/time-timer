import { useEffect, useState, useCallback } from 'react'
import type { DailyTheme, ThemeCategory } from '../themes/dailyThemes.types'

export interface ThemeUnlockPopupProps {
  theme: DailyTheme
  onDismiss: () => void
  onEquip: (themeId: string) => void
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
}

const AUTO_DISMISS_MS = 8000

export function ThemeUnlockPopup({ theme, onDismiss, onEquip }: ThemeUnlockPopupProps) {
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss()
    }, 300) // Match fade-out animation duration
  }, [onDismiss])

  const handleEquip = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onEquip(theme.id)
    }, 300)
  }, [onEquip, theme.id])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleDismiss])

  // Auto-dismiss timer
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100)
      setProgress(remaining)

      if (elapsed >= AUTO_DISMISS_MS) {
        clearInterval(interval)
        handleDismiss()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [handleDismiss])

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-auto px-4 ${
        isExiting ? 'animate-fade-out' : 'animate-slide-up'
      }`}
      role="dialog"
      aria-labelledby="theme-unlock-title"
      aria-describedby="theme-unlock-description"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Banner with theme gradient */}
        <div
          className="h-24 relative flex items-center justify-center"
          style={{ background: theme.colors.backgroundGradient }}
        >
          {/* Large emoji */}
          <span className="text-5xl drop-shadow-lg" role="img" aria-label="theme emoji">
            {getThemeEmoji(theme)}
          </span>

          {/* Sparkle decorations */}
          <div className="absolute top-2 left-4 text-xl animate-pulse">✨</div>
          <div className="absolute top-4 right-6 text-lg animate-pulse" style={{ animationDelay: '0.3s' }}>✨</div>
          <div className="absolute bottom-3 left-8 text-sm animate-pulse" style={{ animationDelay: '0.6s' }}>✨</div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h2
            id="theme-unlock-title"
            className="text-lg font-bold text-center text-gray-900 dark:text-white mb-1"
          >
            New Theme Collected!
          </h2>

          {/* Theme name */}
          <p
            id="theme-unlock-description"
            className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-2"
          >
            {theme.name}
          </p>

          {/* Description/tagline */}
          {theme.description && (
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">
              {theme.description}
            </p>
          )}

          {/* Category badges */}
          <div className="flex justify-center gap-2 mb-4">
            {theme.categories.map((category) => (
              <span
                key={category}
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[category]}`}
              >
                {category}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500/50"
            >
              Dismiss
            </button>
            <button
              onClick={handleEquip}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              Equip Now
            </button>
          </div>
        </div>

        {/* Auto-dismiss progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Get an appropriate emoji for a theme based on its properties
 */
function getThemeEmoji(theme: DailyTheme): string {
  // Check for special themes first
  if (theme.isSpecial) {
    if (theme.id.includes('christmas')) return '🎄'
    if (theme.id.includes('halloween')) return '🎃'
    if (theme.id.includes('valentine')) return '💕'
    if (theme.id.includes('easter')) return '🐰'
    if (theme.id.includes('new-year')) return '🎆'
    if (theme.id.includes('solstice')) return theme.season === 'winter' ? '❄️' : '☀️'
  }

  // Check categories
  if (theme.categories.includes('festive')) return '🎉'
  if (theme.categories.includes('cozy')) return '🧣'
  if (theme.categories.includes('nature')) return '🌿'
  if (theme.categories.includes('whimsical')) return '🦋'
  if (theme.categories.includes('vibrant')) return '🌈'
  if (theme.categories.includes('minimal')) return '💫'
  if (theme.categories.includes('dark')) return '🌙'
  if (theme.categories.includes('light')) return '☀️'

  // Default based on season
  switch (theme.season) {
    case 'spring': return '🌸'
    case 'summer': return '🌻'
    case 'autumn': return '🍂'
    case 'winter': return '❄️'
    default: return '🎨'
  }
}
