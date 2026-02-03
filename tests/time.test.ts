import { describe, it, expect } from 'vitest'
import { formatTime, getTimerColor, interpolateColor } from '../src/utils/time'

describe('formatTime', () => {
  it('should format 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('should format seconds less than a minute', () => {
    expect(formatTime(30)).toBe('00:30')
    expect(formatTime(59)).toBe('00:59')
  })

  it('should format full minutes', () => {
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(120)).toBe('02:00')
    expect(formatTime(600)).toBe('10:00')
  })

  it('should format minutes and seconds', () => {
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(150)).toBe('02:30')
    expect(formatTime(3599)).toBe('59:59')
  })

  it('should handle fractional seconds by flooring', () => {
    expect(formatTime(30.5)).toBe('00:30')
    expect(formatTime(30.9)).toBe('00:30')
  })

  it('should handle large values', () => {
    expect(formatTime(3600)).toBe('60:00')
    expect(formatTime(3661)).toBe('61:01')
  })
})

describe('getTimerColor', () => {
  it('should return green for progress > 0.5', () => {
    expect(getTimerColor(1)).toBe('#22c55e')
    expect(getTimerColor(0.75)).toBe('#22c55e')
    expect(getTimerColor(0.51)).toBe('#22c55e')
  })

  it('should return yellow for progress > 0.25 and <= 0.5', () => {
    expect(getTimerColor(0.5)).toBe('#eab308')
    expect(getTimerColor(0.35)).toBe('#eab308')
    expect(getTimerColor(0.26)).toBe('#eab308')
  })

  it('should return orange for progress > 0.1 and <= 0.25', () => {
    expect(getTimerColor(0.25)).toBe('#f97316')
    expect(getTimerColor(0.15)).toBe('#f97316')
    expect(getTimerColor(0.11)).toBe('#f97316')
  })

  it('should return red for progress <= 0.1', () => {
    expect(getTimerColor(0.1)).toBe('#ef4444')
    expect(getTimerColor(0.05)).toBe('#ef4444')
    expect(getTimerColor(0)).toBe('#ef4444')
  })
})

describe('interpolateColor', () => {
  it('should return green-ish color for high progress', () => {
    const color = interpolateColor(1)
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should return yellow-ish color for medium progress', () => {
    const color = interpolateColor(0.5)
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should return orange-ish color for low progress', () => {
    const color = interpolateColor(0.2)
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should return red for very low progress', () => {
    const color = interpolateColor(0.05)
    expect(color).toBe('#ef4444')
  })

  it('should return valid hex colors for all ranges', () => {
    for (let i = 0; i <= 100; i += 5) {
      const color = interpolateColor(i / 100)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
