const STORAGE_KEY = 'time-timer-preferences'

export interface Preferences {
  soundEnabled: boolean
  darkMode: 'auto' | 'light' | 'dark'
  lastDuration: number
  seasonalTheme: boolean
  weatherEffects: boolean
  useRealWeather: boolean
}

const defaultPreferences: Preferences = {
  soundEnabled: true,
  darkMode: 'auto',
  lastDuration: 5,
  seasonalTheme: true,
  weatherEffects: true,
  useRealWeather: false,
}

export function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) }
    }
  } catch {
    // localStorage not available or invalid data
  }
  return defaultPreferences
}

export function savePreferences(preferences: Partial<Preferences>): void {
  try {
    const current = loadPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available
  }
}
