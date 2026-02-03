import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPreferences, savePreferences } from '../src/utils/storage'

describe('storage', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReset()
    vi.mocked(localStorage.setItem).mockReset()
  })

  describe('loadPreferences', () => {
    it('should return default preferences when localStorage is empty', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)

      const prefs = loadPreferences()

      expect(prefs).toEqual({
        soundEnabled: true,
        darkMode: 'auto',
        lastDuration: 5,
      })
    })

    it('should return stored preferences', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({
          soundEnabled: false,
          darkMode: 'dark',
          lastDuration: 15,
        })
      )

      const prefs = loadPreferences()

      expect(prefs.soundEnabled).toBe(false)
      expect(prefs.darkMode).toBe('dark')
      expect(prefs.lastDuration).toBe(15)
    })

    it('should merge partial stored preferences with defaults', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({
          soundEnabled: false,
        })
      )

      const prefs = loadPreferences()

      expect(prefs.soundEnabled).toBe(false)
      expect(prefs.darkMode).toBe('auto')
      expect(prefs.lastDuration).toBe(5)
    })

    it('should return defaults when localStorage throws', () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Storage error')
      })

      const prefs = loadPreferences()

      expect(prefs).toEqual({
        soundEnabled: true,
        darkMode: 'auto',
        lastDuration: 5,
      })
    })

    it('should return defaults when JSON is invalid', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid json')

      const prefs = loadPreferences()

      expect(prefs).toEqual({
        soundEnabled: true,
        darkMode: 'auto',
        lastDuration: 5,
      })
    })
  })

  describe('savePreferences', () => {
    it('should save partial preferences merged with current', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify({
          soundEnabled: true,
          darkMode: 'auto',
          lastDuration: 5,
        })
      )

      savePreferences({ soundEnabled: false })

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'time-timer-preferences',
        expect.stringContaining('"soundEnabled":false')
      )
    })

    it('should not throw when localStorage fails', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => savePreferences({ soundEnabled: false })).not.toThrow()
    })
  })
})
