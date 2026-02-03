import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../src/hooks/useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useTimer())

    expect(result.current.state).toBe('idle')
    expect(result.current.timeRemaining).toBe(0)
    expect(result.current.totalDuration).toBe(0)
    expect(result.current.progress).toBe(0)
  })

  it('should set duration when idle', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.setDuration(5) // 5 minutes
    })

    expect(result.current.totalDuration).toBe(300) // 300 seconds
    expect(result.current.timeRemaining).toBe(300)
    expect(result.current.progress).toBe(1)
    expect(result.current.state).toBe('idle')
  })

  it('should start timer and change state to running', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(1) // 1 minute
    })

    expect(result.current.state).toBe('running')
    expect(result.current.totalDuration).toBe(60)
    expect(result.current.timeRemaining).toBe(60)
  })

  it('should pause running timer', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(1)
    })

    act(() => {
      result.current.pause()
    })

    expect(result.current.state).toBe('paused')
  })

  it('should resume paused timer', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(1)
    })

    act(() => {
      result.current.pause()
    })

    act(() => {
      result.current.resume()
    })

    expect(result.current.state).toBe('running')
  })

  it('should reset timer to idle state', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(1)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe('idle')
    expect(result.current.timeRemaining).toBe(0)
    expect(result.current.totalDuration).toBe(0)
  })

  it('should not pause when idle', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.pause()
    })

    expect(result.current.state).toBe('idle')
  })

  it('should not resume when not paused', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(1)
    })

    act(() => {
      result.current.resume()
    })

    expect(result.current.state).toBe('running')
  })

  it('should not set duration when running', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(1)
    })

    act(() => {
      result.current.setDuration(5)
    })

    expect(result.current.totalDuration).toBe(60) // Still 1 minute
  })

  it('should call onComplete when timer finishes', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ onComplete }))

    // Mock performance.now to simulate time passing
    let currentTime = 0
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime)

    act(() => {
      result.current.start(1) // 1 minute = 60 seconds
    })

    // Simulate time passing (60+ seconds)
    currentTime = 61000 // 61 seconds in ms

    // Trigger the animation frame callback
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current.state).toBe('completed')
    expect(result.current.timeRemaining).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.setDuration(1) // 1 minute
    })

    expect(result.current.progress).toBe(1) // 100% at start

    // When totalDuration is 0, progress should be 0
    act(() => {
      result.current.reset()
    })

    expect(result.current.progress).toBe(0)
  })
})
