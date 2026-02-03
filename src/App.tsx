import { useState, useEffect, useCallback } from 'react'
import { TimerDisplay, PresetButtons, Controls, Settings } from './components'
import { useTimer } from './hooks'
import {
  playCompletionSound,
  initAudioContext,
  loadPreferences,
  savePreferences,
  type Preferences,
} from './utils'

function App() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)
  const [selectedMinutes, setSelectedMinutes] = useState(preferences.lastDuration)

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

  // Apply theme
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

  const handlePresetSelect = (minutes: number) => {
    setSelectedMinutes(minutes)
    timer.setDuration(minutes)
    savePreferences({ lastDuration: minutes })
    setPreferences((prev) => ({ ...prev, lastDuration: minutes }))
  }

  const handleStart = () => {
    timer.start(selectedMinutes)
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

  // Set initial duration on mount
  useEffect(() => {
    if (timer.state === 'idle' && timer.totalDuration === 0) {
      timer.setDuration(selectedMinutes)
    }
  }, [timer, selectedMinutes])

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-lg mx-auto px-4 py-8 md:py-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-light text-gray-800 dark:text-gray-100 tracking-tight">
            Time Timer
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visual countdown timer
          </p>
        </header>

        {/* Timer Display */}
        <main className="flex-1 flex flex-col justify-center gap-8">
          <TimerDisplay
            progress={timer.progress}
            timeRemaining={timer.timeRemaining}
            state={timer.state}
          />

          {/* Preset Buttons */}
          <PresetButtons
            onSelect={handlePresetSelect}
            selectedDuration={timer.totalDuration}
            disabled={timer.state !== 'idle'}
          />

          {/* Controls */}
          <Controls
            state={timer.state}
            onStart={handleStart}
            onPause={timer.pause}
            onResume={timer.resume}
            onReset={timer.reset}
            canStart={timer.totalDuration > 0}
          />
        </main>

        {/* Settings */}
        <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Settings
            preferences={preferences}
            onSoundToggle={handleSoundToggle}
            onThemeChange={handleThemeChange}
          />
        </footer>
      </div>
    </div>
  )
}

export default App
