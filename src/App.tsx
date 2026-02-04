import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { TimerDisplay } from './components'
import { SettingsButton } from './components/SettingsButton'
import { ThemeCollectionButton } from './components/ThemeCollectionButton'
import { StartStopButton } from './components/StartStopButton'
import { SettingsModal } from './components/SettingsModal'
import { SeasonalDecorations } from './components/SeasonalDecorations'
import { WeatherEffects } from './components/WeatherEffects'
import { DebugPanel } from './components/DebugPanel'
import { CompletionGlow } from './components/CompletionGlow'
import { DayNightCycle } from './components/DayNightCycle'
import { ThemeCollection } from './components/ThemeCollection'
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
import { requestLocation, type GeolocationError } from './utils/geolocation'
import { fetchWeather, isWeatherDataFresh, type WeatherData } from './utils/weatherApi'
import { autoUnlockTodayTheme, setActiveTheme, unlockAllThemes, getCurrentEffectiveTheme } from './utils/themeCollection'
import type { DailyTheme } from './themes/dailyThemes.types'

function App() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [selectedMinutes, setSelectedMinutes] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [themeCollectionOpen, setThemeCollectionOpen] = useState(false)
  const [dailyThemeEnabled, setDailyThemeEnabled] = useState(true)
  const [activeCollectionTheme, setActiveCollectionTheme] = useState<DailyTheme | null>(() => {
    // Load the active theme on mount
    return getCurrentEffectiveTheme()
  })

  // Real weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [locationError, setLocationError] = useState<GeolocationError | null>(null)
  const weatherFetchInterval = useRef<number | null>(null)

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

  // Auto-unlock today's theme on app load
  useEffect(() => {
    const { unlocked, theme } = autoUnlockTodayTheme()
    if (unlocked) {
      console.log(`Unlocked today's theme: ${theme.name}`)
    }
  }, [])

  // Open theme collection in debug mode if ?themes=true
  // Also auto-unlock all themes in debug mode
  useEffect(() => {
    if (debugParams.themesDebug) {
      const unlocked = unlockAllThemes()
      if (unlocked > 0) {
        console.log(`Debug mode: Unlocked ${unlocked} themes (all 127 themes now available)`)
      }
      setThemeCollectionOpen(true)
    }
  }, [debugParams.themesDebug])

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

  // Refresh real weather data every 30 minutes
  useEffect(() => {
    if (!preferences.useRealWeather || !weatherData) return

    const refreshWeather = async () => {
      // Only refresh if data is stale
      if (!isWeatherDataFresh(weatherData.timestamp)) {
        const locationResult = await requestLocation()
        if (locationResult.success && locationResult.coords) {
          const weather = await fetchWeather(locationResult.coords)
          if (weather) {
            setWeatherData(weather)
            setCurrentWeather(weather.weatherType)
          }
        }
      }
    }

    // Set up interval to check every 5 minutes (actual refresh only if data is stale)
    weatherFetchInterval.current = setInterval(refreshWeather, 5 * 60 * 1000)

    return () => {
      if (weatherFetchInterval.current) {
        clearInterval(weatherFetchInterval.current)
        weatherFetchInterval.current = null
      }
    }
  }, [preferences.useRealWeather, weatherData])

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

  const handleDarkModeChange = (theme: 'auto' | 'light' | 'dark') => {
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

  const handleRealWeatherToggle = async () => {
    const newValue = !preferences.useRealWeather
    
    if (newValue) {
      // Enabling real weather - try automatic location first
      setLocationError(null)
      
      // Check if manual location is set
      if (preferences.manualLocation) {
        // Use manual location
        const weather = await fetchWeather(preferences.manualLocation)
        if (weather) {
          setWeatherData(weather)
          setCurrentWeather(weather.weatherType)
          setLocationError(null)
        } else {
          setLocationError('unavailable')
          return // Don't enable if weather fetch failed
        }
      } else {
        // Try automatic location
        const locationResult = await requestLocation()
        
        if (locationResult.success && locationResult.coords) {
          // Fetch weather data
          const weather = await fetchWeather(locationResult.coords)
          if (weather) {
            setWeatherData(weather)
            setCurrentWeather(weather.weatherType)
            setLocationError(null)
          } else {
            setLocationError('unavailable')
            return // Don't enable if weather fetch failed
          }
        } else {
          setLocationError(locationResult.error || 'unavailable')
          // Don't return - user can still set manual location
        }
      }
    } else {
      // Disabling real weather - clear data and interval
      setWeatherData(null)
      setLocationError(null)
      if (weatherFetchInterval.current) {
        clearInterval(weatherFetchInterval.current)
        weatherFetchInterval.current = null
      }
      // Reset to season's default weather
      if (!debugParams.forceWeather) {
        const config = getSeasonConfig(currentSeason)
        setCurrentWeather(config.defaultWeather as Weather)
      }
    }
    
    savePreferences({ useRealWeather: newValue })
    setPreferences((prev) => ({ ...prev, useRealWeather: newValue }))
  }

  const handleManualLocationSet = async (latitude: number, longitude: number) => {
    const coords = { latitude, longitude }
    savePreferences({ manualLocation: coords })
    setPreferences((prev) => ({ ...prev, manualLocation: coords }))
    
    // Fetch weather with new location
    if (preferences.useRealWeather) {
      const weather = await fetchWeather(coords)
      if (weather) {
        setWeatherData(weather)
        setCurrentWeather(weather.weatherType)
        setLocationError(null)
      } else {
        setLocationError('unavailable')
      }
    }
  }

  const handleManualLocationClear = () => {
    savePreferences({ manualLocation: undefined })
    setPreferences((prev) => ({ ...prev, manualLocation: undefined }))
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

  const handleOpenThemeCollection = () => {
    setSettingsOpen(false)
    setThemeCollectionOpen(true)
  }

  const handleThemeCollectionClose = () => {
    setThemeCollectionOpen(false)
  }

  const handleThemeChange = (themeId: string) => {
    // Reload the effective theme to apply the change
    const effectiveTheme = getCurrentEffectiveTheme()
    setActiveCollectionTheme(effectiveTheme)
    console.log(`Applied theme: ${themeId}`)
  }

  const handleDailyThemeToggle = () => {
    const newValue = !dailyThemeEnabled
    setDailyThemeEnabled(newValue)
    if (!newValue) {
      // When disabling, clear active theme to use seasonal
      setActiveTheme(null)
      setActiveCollectionTheme(null)
    } else {
      // When enabling, load the effective theme
      setActiveCollectionTheme(getCurrentEffectiveTheme())
    }
  }

  const handleOpenThemeDebug = () => {
    setThemeCollectionOpen(true)
  }

  // Determine if reset is available (timer is running, paused, or completed)
  const canReset = timer.state === 'running' || timer.state === 'paused' || timer.state === 'completed'

  // Determine background gradient - collection theme takes priority
  const backgroundGradient = dailyThemeEnabled && activeCollectionTheme
    ? activeCollectionTheme.colors.backgroundGradient
    : preferences.seasonalTheme
      ? seasonConfig.colors.backgroundGradient
      : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)'

  return (
    <div
      className="min-h-full transition-colors duration-500 relative overflow-hidden"
      style={{ background: backgroundGradient }}
    >
      {/* Completion glow layer - lowest z-index */}
      <CompletionGlow isComplete={timer.state === 'completed'} />

      {/* Day/Night cycle layer - behind weather */}
      <DayNightCycle debugTime={debugTime} />

      {/* Weather effects layer - on top of day/night cycle */}
      {preferences.weatherEffects && <WeatherEffects weather={currentWeather} debugTime={debugTime} />}

      {/* Seasonal decorations layer */}
      {preferences.seasonalTheme && <SeasonalDecorations season={currentSeason} />}

      {/* Theme Collection button - top right (next to settings) */}
      <ThemeCollectionButton onClick={() => setThemeCollectionOpen(true)} />

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
        onThemeChange={handleDarkModeChange}
        onSeasonalThemeToggle={handleSeasonalThemeToggle}
        onWeatherEffectsToggle={handleWeatherEffectsToggle}
        onRealWeatherToggle={handleRealWeatherToggle}
        onManualLocationSet={handleManualLocationSet}
        onManualLocationClear={handleManualLocationClear}
        onReset={handleReset}
        canReset={canReset}
        locationError={locationError}
        weatherData={weatherData}
        onOpenThemeCollection={handleOpenThemeCollection}
        onDailyThemeToggle={handleDailyThemeToggle}
        dailyThemeEnabled={dailyThemeEnabled}
      />

      {/* Theme Collection Modal */}
      {themeCollectionOpen && (
        <ThemeCollection
          onClose={handleThemeCollectionClose}
          onThemeChange={handleThemeChange}
          debugMode={debugParams.themesDebug || debugMode}
        />
      )}

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
          onOpenThemeDebug={handleOpenThemeDebug}
        />
      )}
    </div>
  )
}

export default App
