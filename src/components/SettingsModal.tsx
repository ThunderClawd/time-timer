import { useEffect, useCallback } from 'react'
import type { Preferences } from '../utils'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  preferences: Preferences
  onSoundToggle: () => void
  onThemeChange: (theme: 'auto' | 'light' | 'dark') => void
  onSeasonalThemeToggle: () => void
  onWeatherEffectsToggle: () => void
  onPresetSelect: (minutes: number) => void
  onReset: () => void
  canReset: boolean
}

const PRESETS = [5, 10, 15, 30, 45, 60]

export function SettingsModal({
  isOpen,
  onClose,
  preferences,
  onSoundToggle,
  onThemeChange,
  onSeasonalThemeToggle,
  onWeatherEffectsToggle,
  onPresetSelect,
  onReset,
  canReset,
}: SettingsModalProps) {
  // Handle ESC key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Duration Presets */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Presets
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => {
                    onPresetSelect(minutes)
                    onClose()
                  }}
                  className="
                    py-3 px-4 rounded-xl
                    text-sm font-medium
                    bg-gray-100 dark:bg-gray-800
                    text-gray-700 dark:text-gray-300
                    hover:bg-blue-50 dark:hover:bg-blue-900/30
                    hover:text-blue-600 dark:hover:text-blue-400
                    transition-colors duration-150
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  "
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </section>

          {/* Sound Toggle */}
          <section className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                {preferences.soundEnabled ? (
                  <SoundOnIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <SoundOffIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sound</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Play sound when timer completes
                </p>
              </div>
            </div>
            <ToggleSwitch enabled={preferences.soundEnabled} onToggle={onSoundToggle} />
          </section>

          {/* Theme Selector */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Theme
            </h3>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <ThemeOption
                active={preferences.darkMode === 'auto'}
                onClick={() => onThemeChange('auto')}
                label="Auto"
                icon={<AutoIcon className="w-4 h-4" />}
              />
              <ThemeOption
                active={preferences.darkMode === 'light'}
                onClick={() => onThemeChange('light')}
                label="Light"
                icon={<SunIcon className="w-4 h-4" />}
              />
              <ThemeOption
                active={preferences.darkMode === 'dark'}
                onClick={() => onThemeChange('dark')}
                label="Dark"
                icon={<MoonIcon className="w-4 h-4" />}
              />
            </div>
          </section>

          {/* Seasonal Theme Toggle */}
          <section className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <SeasonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Seasonal Theme</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Decorations based on current season
                </p>
              </div>
            </div>
            <ToggleSwitch enabled={preferences.seasonalTheme} onToggle={onSeasonalThemeToggle} />
          </section>

          {/* Weather Effects Toggle */}
          <section className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <WeatherIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Weather Effects</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Animated weather particles
                </p>
              </div>
            </div>
            <ToggleSwitch enabled={preferences.weatherEffects} onToggle={onWeatherEffectsToggle} />
          </section>

          {/* Reset Timer */}
          {canReset && (
            <section className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  onReset()
                  onClose()
                }}
                className="
                  w-full py-3 px-4 rounded-xl
                  text-sm font-medium
                  bg-red-50 dark:bg-red-900/20
                  text-red-600 dark:text-red-400
                  hover:bg-red-100 dark:hover:bg-red-900/30
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-red-500/50
                "
              >
                Reset Timer
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// Toggle Switch Component
interface ToggleSwitchProps {
  enabled: boolean
  onToggle: () => void
}

function ToggleSwitch({ enabled, onToggle }: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900
        ${enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
      `}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}

// Theme Option Component
interface ThemeOptionProps {
  active: boolean
  onClick: () => void
  label: string
  icon: React.ReactNode
}

function ThemeOption({ active, onClick, label, icon }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
        text-sm font-medium transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${active
          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// Icons
function SoundOnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  )
}

function SoundOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

function AutoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function SeasonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function WeatherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  )
}
