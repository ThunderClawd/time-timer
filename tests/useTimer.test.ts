import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../src/hooks/useTimer'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIMER_STATE_KEY = 'time-timer-state'

function getPersistedState() {
  const raw = localStorage.getItem(TIMER_STATE_KEY)
  return raw ? JSON.parse(raw) : null
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
  localStorage.clear()

  // Stub navigator.serviceWorker so SW postMessages don't throw
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { controller: null },
    writable: true,
    configurable: true,
  })

  // Stub requestAnimationFrame / cancelAnimationFrame
  let frameId = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return ++frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (_id: number) => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

// Helper to advance the clock AND trigger the RAF tick manually
// (since rAF is stubbed to a no-op scheduler above)
function advanceAndTick(result: { current: ReturnType<typeof useTimer> }, ms: number) {
  vi.advanceTimersByTime(ms)
  // Manually recompute by starting/stopping isn't needed for these tests —
  // we test the visibility-change recalculation path instead.
}

// ─── Basic state machine ─────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts idle with zeros', () => {
    const { result } = renderHook(() => useTimer())
    expect(result.current.state).toBe('idle')
    expect(result.current.timeRemaining).toBe(0)
    expect(result.current.totalDuration).toBe(0)
    expect(result.current.progress).toBe(0)
  })
})

describe('setDuration', () => {
  it('sets duration while idle', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.setDuration(5) })
    expect(result.current.totalDuration).toBe(300)
    expect(result.current.timeRemaining).toBe(300)
    expect(result.current.state).toBe('idle')
  })

  it('ignores setDuration while running', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.setDuration(10) })
    expect(result.current.totalDuration).toBe(60)
  })
})

describe('start', () => {
  it('transitions to running', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    expect(result.current.state).toBe('running')
    expect(result.current.totalDuration).toBe(60)
    expect(result.current.timeRemaining).toBe(60)
  })
})

describe('pause', () => {
  it('transitions to paused', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.pause() })
    expect(result.current.state).toBe('paused')
  })

  it('is a no-op when idle', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.pause() })
    expect(result.current.state).toBe('idle')
  })
})

describe('resume', () => {
  it('transitions back to running', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.pause() })
    act(() => { result.current.resume() })
    expect(result.current.state).toBe('running')
  })

  it('is a no-op when already running', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.resume() })
    expect(result.current.state).toBe('running')
  })
})

describe('reset', () => {
  it('clears everything back to idle', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.reset() })
    expect(result.current.state).toBe('idle')
    expect(result.current.timeRemaining).toBe(0)
    expect(result.current.totalDuration).toBe(0)
  })
})

describe('progress', () => {
  it('is 1 (100%) right after start', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    expect(result.current.progress).toBe(1)
  })

  it('is 0 after reset', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.reset() })
    expect(result.current.progress).toBe(0)
  })
})

// ─── Timestamp-based persistence ─────────────────────────────────────────────

describe('localStorage persistence', () => {
  it('saves state when timer starts', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })

    const ps = getPersistedState()
    expect(ps).not.toBeNull()
    expect(ps.state).toBe('running')
    expect(ps.totalDuration).toBe(60)
    expect(ps.startedAt).toBeCloseTo(0, -2) // clock is at 0
    expect(ps.pausedAt).toBeNull()
  })

  it('saves pausedAt when paused', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })

    vi.setSystemTime(10_000) // advance 10 s
    act(() => { result.current.pause() })

    const ps = getPersistedState()
    expect(ps.state).toBe('paused')
    expect(ps.pausedAt).toBe(10_000)
  })

  it('adjusts startedAt on resume to preserve elapsed time', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })            // started at t=0

    vi.setSystemTime(10_000)                          // 10 s elapsed
    act(() => { result.current.pause() })             // paused at t=10 000

    vi.setSystemTime(20_000)                          // wait 10 s while paused
    act(() => { result.current.resume() })            // resume at t=20 000

    const ps = getPersistedState()
    expect(ps.state).toBe('running')
    expect(ps.pausedAt).toBeNull()
    // elapsed before pause = 10 s; resume at 20 s → startedAt = 20000 - 10000 = 10000
    expect(ps.startedAt).toBe(10_000)
  })

  it('clears localStorage on reset', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) })
    act(() => { result.current.reset() })

    expect(localStorage.getItem(TIMER_STATE_KEY)).toBeNull()
  })
})

// ─── Recovery after "reload" ──────────────────────────────────────────────────

describe('persistence recovery on mount', () => {
  it('resumes a running timer that was saved before reload', () => {
    // Simulate a timer that started 20 s ago and has 40 s remaining
    const savedState = {
      startedAt: -20_000,   // relative to fake epoch (0) → 20 s ago
      pausedAt: null,
      totalDuration: 60,
      state: 'running',
    }
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(savedState))

    const { result } = renderHook(() => useTimer())

    // Should hydrate and calculate remaining ≈ 40 s
    expect(result.current.state).toBe('running')
    expect(result.current.totalDuration).toBe(60)
    expect(result.current.timeRemaining).toBeCloseTo(40, 0)
  })

  it('marks timer as completed if it expired while backgrounded', () => {
    const onComplete = vi.fn()
    // Timer that should have finished 5 s ago
    const savedState = {
      startedAt: -65_000,   // 65 s ago
      pausedAt: null,
      totalDuration: 60,    // was 60 s
      state: 'running',
    }
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(savedState))

    renderHook(() => useTimer({ onComplete }))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('restores a paused timer with correct remaining time', () => {
    // Paused after 15 s; 45 s remaining
    const savedState = {
      startedAt: -20_000,
      pausedAt: -5_000,     // paused 5 s later → 15 s elapsed
      totalDuration: 60,
      state: 'paused',
    }
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(savedState))

    const { result } = renderHook(() => useTimer())
    expect(result.current.state).toBe('paused')
    expect(result.current.timeRemaining).toBeCloseTo(45, 0)
  })
})

// ─── Visibility-change recalculation ────────────────────────────────────────

describe('Page Visibility API recalculation', () => {
  it('recalculates remaining time when tab becomes visible', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start(1) }) // starts at t=0, 60 s

    // Simulate 20 s passing while backgrounded
    vi.setSystemTime(20_000)

    // Simulate tab returning to foreground
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.timeRemaining).toBeCloseTo(40, 0)
    expect(result.current.state).toBe('running')
  })

  it('marks timer done on visibility change if it expired while hidden', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTimer({ onComplete }))
    act(() => { result.current.start(1) }) // 60 s

    // 65 s pass while backgrounded
    vi.setSystemTime(65_000)

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.state).toBe('completed')
    expect(result.current.timeRemaining).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
