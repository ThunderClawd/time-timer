import { useState, useEffect, useCallback, useMemo } from 'react'
import { TimerDisplay, Controls, Settings } from './components'
import { SeasonalDecorations } from './components/SeasonalDecorations'
import { WeatherEffects } from './components/WeatherEffects'
import { DebugPanel } from './components/DebugPanel'
import { useTimer } from './hooks'
import {
  playCompletionSound,
  initAudioContext,
  loadPreferences,
  savePreferences,
  type Preferences,
} from './utils'
import {
  getCurrentSeason,
  getSeasonConfig,
  getDebugParams,
  isNightTime,
  type Season,
} from './themes/seasons'
import type { Weather } from './themes/weather'

function App() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [selectedMinutes, setSelectedMinutes] = useState(0)

  // Seasonal theme state
  const debugParams = useMemo(() => getDebugParams(), [])
  const [debugMode, setDebugMode] = useState(debugParams.debugMode)
  const [currentSeason, setCurrentSeason] = useState<Season>(
    debugParams.forceSeason || getCurrentSeason()
  )
  const [currentWeather, setCurrentWeather] = useState<Weather>(() => {
    if (debugParams.forceWeather) {
      return debugParams.forceWeather as Weather
    }
    const season = debugParams.forceSeason || getCurrentSeason()
    const config = getSeasonConfig(season)
    // Use night weather if it's nighttime
    if (isNightTime()) {
      return 'night'
    }
    return config.defaultWeather as Weather
  })

  const seasonConfig = useMemo(() => getSeasonConfig(currentSeason), [currentSeason])

  const handleComplete = useCallback(() => {
    if (preferences.soundEnabled) {
      playCompletionSound()
    }
    // Vibrate on mobile if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }, [preferences.soundEnabled])

  const timer = useTimer({ onComplete: handleComplete })

  // Apply theme (dark mode)
  useEffect(() => {
    const root = document.documentElement

    if (preferences.darkMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const updateTheme = () => {
        root.classList.toggle('dark', mediaQuery.matches)
      }
      updateTheme()
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    } else {
      root.classList.toggle('dark', preferences.darkMode === 'dark')
    }
  }, [preferences.darkMode])

  // Apply seasonal theme class
  useEffect(() => {
    const root = document.documentElement
    // Remove all season classes first
    root.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter')
    root.classList.add(`season-${currentSeason}`)
  }, [currentSeason])

  // Initialize audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction)
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  // Handle duration set from the dial
  const handleDurationSet = useCallback((minutes: number) => {
    setSelectedMinutes(minutes)
    timer.setDuration(minutes)
    savePreferences({ lastDuration: minutes })
    setPreferences((prev) => ({ ...prev, lastDuration: minutes }))
  }, [timer])

  const handleStart = () => {
    timer.start(selectedMinutes)
  }

  const handleReset = () => {
    timer.reset()
    setSelectedMinutes(0)
  }

  const handleSoundToggle = () => {
    const newValue = !preferences.soundEnabled
    savePreferences({ soundEnabled: newValue })
    setPreferences((prev) => ({ ...prev, soundEnabled: newValue }))
  }

  const handleThemeChange = (theme: 'auto' | 'light' | 'dark') => {
    savePreferences({ darkMode: theme })
    setPreferences((prev) => ({ ...prev, darkMode: theme }))
  }

  const handleSeasonalThemeToggle = () => {
    const newValue = !preferences.seasonalTheme
    savePreferences({ seasonalTheme: newValue })
    setPreferences((prev) => ({ ...prev, seasonalTheme: newValue }))
  }

  const handleWeatherEffectsToggle = () => {
    const newValue = !preferences.weatherEffects
    savePreferences({ weatherEffects: newValue })
    setPreferences((prev) => ({ ...prev, weatherEffects: newValue }))
  }

  const handleSeasonChange = (season: Season) => {
    setCurrentSeason(season)
    // Update weather to match season's default if not in debug with forced weather
    if (!debugParams.forceWeather) {
      const config = getSeasonConfig(season)
      setCurrentWeather(isNightTime() ? 'night' : config.defaultWeather as Weather)
    }
  }

  const handleWeatherChange = (weather: Weather) => {
    setCurrentWeather(weather)
  }

  const handleDebugClose = () => {
    setDebugMode(false)
  }

  return (
    <div
      className="min-h-full transition-colors duration-500 relative overflow-hidden"
      style={{
        background: preferences.seasonalTheme
          ? seasonConfig.colors.backgroundGradient
          : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)'
      }}
    >
      {/* Weather effects layer */}
      {preferences.weatherEffects && <WeatherEffects weather={currentWeather} />}

      {/* Seasonal decorations layer */}
      {preferences.seasonalTheme && <SeasonalDecorations season={currentSeason} />}

      {/* Main content */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-light text-gray-800 dark:text-gray-100 tracking-tight">
            Time Timer
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 opacity-70">
            {seasonConfig.name} Edition
          </p>
        </header>

        {/* Timer Display - Interactive Dial */}
        <main className="flex-1 flex flex-col justify-center gap-6">
          <TimerDisplay
            progress={timer.progress}
            timeRemaining={timer.timeRemaining}
            state={timer.state}
            onDurationSet={handleDurationSet}
            season={currentSeason}
            seasonalThemeEnabled={preferences.seasonalTheme}
          />

          {/* Controls */}
          <Controls
            state={timer.state}
            onStart={handleStart}
            onPause={timer.pause}
            onResume={timer.resume}
            onReset={handleReset}
            canStart={timer.totalDuration > 0}
          />
        </main>

        {/* Settings */}
        <footer className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
          <Settings
            preferences={preferences}
            onSoundToggle={handleSoundToggle}
            onThemeChange={handleThemeChange}
            onSeasonalThemeToggle={handleSeasonalThemeToggle}
            onWeatherEffectsToggle={handleWeatherEffectsToggle}
          />
        </footer>
      </div>

      {/* Debug Panel - only in debug mode */}
      {debugMode && (
        <DebugPanel
          currentSeason={currentSeason}
          currentWeather={currentWeather}
          onSeasonChange={handleSeasonChange}
          onWeatherChange={handleWeatherChange}
          onClose={handleDebugClose}
        />
      )}
    </div>
  )
}

export default App
