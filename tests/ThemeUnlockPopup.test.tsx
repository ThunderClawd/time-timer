import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeUnlockPopup } from '../src/components/ThemeUnlockPopup'
import type { DailyTheme } from '../src/themes/dailyThemes.types'

const mockTheme: DailyTheme = {
  id: 'spring-day-1',
  name: 'Cherry Blossom',
  season: 'spring',
  dayNumber: 1,
  categories: ['nature', 'light'],
  backgroundEffect: 'petals',
  decorativeElements: ['flowers'],
  description: 'A beautiful spring day theme',
  colors: {
    backgroundPrimary: '#fff0f5',
    backgroundSecondary: '#ffe4e9',
    backgroundGradient: 'linear-gradient(135deg, #fff0f5 0%, #ffe4e9 100%)',
    timerStart: '#ff69b4',
    timerMid: '#ff1493',
    timerEnd: '#db7093',
    timerBackground: '#ffffff',
    timerBackgroundDark: '#1a1a2e',
    timerInnerCircle: '#fdf2f8',
    timerInnerCircleDark: '#2d2d44',
    timerProgress: '#ff69b4',
    timerProgressDark: '#ff69b4',
    textPrimary: '#4a4a4a',
    textPrimaryDark: '#f5f5f5',
    textSecondary: '#7a7a7a',
    textSecondaryDark: '#c0c0c0',
    accent: '#ff69b4',
    accentDark: '#ff69b4',
  },
}

describe('ThemeUnlockPopup', () => {
  const mockOnDismiss = vi.fn()
  const mockOnEquip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with theme info visible (name, emoji)', () => {
    render(
      <ThemeUnlockPopup
        theme={mockTheme}
        onDismiss={mockOnDismiss}
        onEquip={mockOnEquip}
      />
    )

    expect(screen.getByText('Cherry Blossom')).toBeInTheDocument()
    expect(screen.getByText('New Theme Collected! 🎨')).toBeInTheDocument()
    expect(screen.getByText('A beautiful spring day theme')).toBeInTheDocument()
    expect(screen.getByText('nature')).toBeInTheDocument()
    expect(screen.getByText('light')).toBeInTheDocument()
  })

  it('Dismiss button calls onDismiss', async () => {
    render(
      <ThemeUnlockPopup
        theme={mockTheme}
        onDismiss={mockOnDismiss}
        onEquip={mockOnEquip}
      />
    )

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(dismissButton)

    // Wait for the exit animation timeout
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('Equip Now button calls onEquip with theme id', async () => {
    render(
      <ThemeUnlockPopup
        theme={mockTheme}
        onDismiss={mockOnDismiss}
        onEquip={mockOnEquip}
      />
    )

    const equipButton = screen.getByRole('button', { name: /equip now/i })
    fireEvent.click(equipButton)

    // Wait for the exit animation timeout
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(mockOnEquip).toHaveBeenCalledTimes(1)
    expect(mockOnEquip).toHaveBeenCalledWith('spring-day-1')
  })

  it('Escape key calls onDismiss', async () => {
    render(
      <ThemeUnlockPopup
        theme={mockTheme}
        onDismiss={mockOnDismiss}
        onEquip={mockOnEquip}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    // Wait for the exit animation timeout
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('auto-dismiss fires after 8000ms', async () => {
    render(
      <ThemeUnlockPopup
        theme={mockTheme}
        onDismiss={mockOnDismiss}
        onEquip={mockOnEquip}
      />
    )

    // Advance to just before auto-dismiss
    await act(async () => {
      vi.advanceTimersByTime(7900)
    })
    expect(mockOnDismiss).not.toHaveBeenCalled()

    // Advance past auto-dismiss threshold + animation delay
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
  })

  it('has accessible role and labels', () => {
    render(
      <ThemeUnlockPopup
        theme={mockTheme}
        onDismiss={mockOnDismiss}
        onEquip={mockOnEquip}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'theme-unlock-title')
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'theme-unlock-description')
  })
})
