import { useState, useEffect, useCallback, useMemo } from 'react'
import { TimerDisplay } from './components'
import { SettingsButton } from './components/SettingsButton'
import { StartStopButton } from './components/StartStopButton'
import { SettingsModal } from './components/SettingsModal'
import { SeasonalDecorations } from './components/SeasonalDecorations'
import { WeatherEffects } from './components/WeatherEffects'
import { DebugPanel } from './components/DebugPanel'
import { CompletionGlow } from './components/CompletionGlow'
import { DayNightCycle } from './components/DayNightCycle'
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
  type Season,
} from './themes/seasons'
import type { Weather } from './themes/weather'

function App() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [selectedMinutes, setSelectedMinutes] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Seasonal theme state
  const debugParams = useMemo(() => getDebugParams(), [])
  const [debugMode, setDebugMode] = useState(debugParams.debugMode)
  const [debugTime, setDebugTime] = useState<number | null>(null)
  const [currentSeason, setCurrentSeason] = useState<Season>(
    debugParams.forceSeason || getCurrentSeason()
  )
  const [currentWeather, setCurrentWeather] = useState<Weather>(() => {
    if (debugParams.forceWeather) {
      return debugParams.forceWeather as Weather
    }
    const season = debugParams.forceSeason || getCurrentSeason()
    const config = getSeasonConfig(season)
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
      setCurrentWeather(config.defaultWeather as Weather)
    }
  }

  const handleWeatherChange = (weather: Weather) => {
    setCurrentWeather(weather)
  }

  const handleDebugClose = () => {
    setDebugMode(false)
  }

  // Determine if reset is available (timer is running, paused, or completed)
  const canReset = timer.state === 'running' || timer.state === 'paused' || timer.state === 'completed'

  return (
    <div
      className="min-h-full transition-colors duration-500 relative overflow-hidden"
      style={{
        background: preferences.seasonalTheme
          ? seasonConfig.colors.backgroundGradient
          : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)'
      }}
    >
      {/* Completion glow layer - lowest z-index */}
      <CompletionGlow isComplete={timer.state === 'completed'} />

      {/* Day/Night cycle layer - behind weather */}
      <DayNightCycle debugTime={debugTime} />

      {/* Weather effects layer - on top of day/night cycle */}
      {preferences.weatherEffects && <WeatherEffects weather={currentWeather} debugTime={debugTime} />}

      {/* Seasonal decorations layer */}
      {preferences.seasonalTheme && <SeasonalDecorations season={currentSeason} />}

      {/* Settings button - top right */}
      <SettingsButton onClick={() => setSettingsOpen(true)} />

      {/* Main content - minimal and centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Timer Display */}
        <div className="w-full max-w-lg">
          <TimerDisplay
            progress={timer.progress}
            timeRemaining={timer.timeRemaining}
            state={timer.state}
            onDurationSet={handleDurationSet}
            season={currentSeason}
            seasonalThemeEnabled={preferences.seasonalTheme}
          />
        </div>

        {/* Start/Stop Button */}
        <div className="mt-8">
          <StartStopButton
            state={timer.state}
            onStart={handleStart}
            onPause={timer.pause}
            onResume={timer.resume}
            onReset={handleReset}
            canStart={timer.totalDuration > 0}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        onSoundToggle={handleSoundToggle}
        onThemeChange={handleThemeChange}
        onSeasonalThemeToggle={handleSeasonalThemeToggle}
        onWeatherEffectsToggle={handleWeatherEffectsToggle}
        onReset={handleReset}
        canReset={canReset}
      />

      {/* Debug Panel - only in debug mode */}
      {debugMode && (
        <DebugPanel
          currentSeason={currentSeason}
          currentWeather={currentWeather}
          onSeasonChange={handleSeasonChange}
          onWeatherChange={handleWeatherChange}
          debugTime={debugTime}
          onDebugTimeChange={setDebugTime}
          onClose={handleDebugClose}
        />
      )}
    </div>
  )
}

export default App
