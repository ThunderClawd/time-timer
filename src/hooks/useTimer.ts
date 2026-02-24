import { useState, useCallback, useRef, useEffect } from 'react'

export type TimerState = 'idle' | 'running' | 'paused' | 'completed'

// ─── Persistence ────────────────────────────────────────────────────────────

const TIMER_STATE_KEY = 'time-timer-state'

interface PersistedState {
  /** epoch ms when the timer was (last) started / resumed */
  startedAt: number
  /** epoch ms when the timer was paused; null when running */
  pausedAt: number | null
  /** total timer length in seconds */
  totalDuration: number
  state: TimerState
}

function saveTimerState(s: PersistedState | null): void {
  try {
    if (s === null) {
      localStorage.removeItem(TIMER_STATE_KEY)
    } else {
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(s))
    }
  } catch {
    /* storage unavailable */
  }
}

function loadTimerState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY)
    if (raw) return JSON.parse(raw) as PersistedState
  } catch {
    /* corrupted data */
  }
  return null
}

/** Compute remaining seconds from a persisted state snapshot. */
function computeRemaining(s: PersistedState): number {
  if (s.state === 'completed' || s.state === 'idle') return 0
  if (s.state === 'paused' && s.pausedAt !== null) {
    const elapsed = (s.pausedAt - s.startedAt) / 1000
    return Math.max(0, s.totalDuration - elapsed)
  }
  // running
  const elapsed = (Date.now() - s.startedAt) / 1000
  return Math.max(0, s.totalDuration - elapsed)
}

// ─── Service-worker notification helpers ────────────────────────────────────

function swPostMessage(msg: object): void {
  try {
    navigator.serviceWorker?.controller?.postMessage(msg)
  } catch {
    /* SW unavailable */
  }
}

function scheduleSwNotification(delayMs: number): void {
  swPostMessage({ type: 'SCHEDULE_NOTIFICATION', delayMs })
}

function cancelSwNotification(): void {
  swPostMessage({ type: 'CANCEL_NOTIFICATION' })
}

function requestNotificationPermission(): void {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface UseTimerOptions {
  onComplete?: () => void
}

interface UseTimerReturn {
  timeRemaining: number
  totalDuration: number
  state: TimerState
  progress: number
  start: (durationMinutes: number) => void
  pause: () => void
  resume: () => void
  reset: () => void
  setDuration: (durationMinutes: number) => void
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onComplete } = options

  // ── React state ─────────────────────────────────────────────────────────
  const [totalDuration, setTotalDuration] = useState(0)   // seconds
  const [timeRemaining, setTimeRemaining] = useState(0)   // seconds
  const [state, setState] = useState<TimerState>('idle')

  // Internal refs – don't need to be in state (don't drive UI directly)
  const rafRef = useRef<number | null>(null)
  const persistRef = useRef<PersistedState | null>(null)  // mirrors latest saved state
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // ── RAF tick (display only – accurate because we read Date.now()) ────────
  const tick = useCallback(() => {
    const ps = persistRef.current
    if (!ps || ps.state !== 'running') return

    const remaining = computeRemaining(ps)
    setTimeRemaining(remaining)

    if (remaining <= 0) {
      rafRef.current = null
      const completed: PersistedState = { ...ps, state: 'completed' }
      persistRef.current = completed
      saveTimerState(completed)
      setState('completed')
      onCompleteRef.current?.()
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startRaf = useCallback(() => {
    stopRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [stopRaf, tick])

  // ── Hydrate from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    const ps = loadTimerState()
    if (!ps) return

    const remaining = computeRemaining(ps)

    if (ps.state === 'running' && remaining <= 0) {
      // Timer expired while we were away
      const completed: PersistedState = { ...ps, state: 'completed' }
      persistRef.current = completed
      saveTimerState(completed)
      setState('completed')
      setTotalDuration(ps.totalDuration)
      setTimeRemaining(0)
      onCompleteRef.current?.()
    } else if (ps.state === 'running') {
      persistRef.current = ps
      setState('running')
      setTotalDuration(ps.totalDuration)
      setTimeRemaining(remaining)
      startRaf()
    } else if (ps.state === 'paused') {
      persistRef.current = ps
      setState('paused')
      setTotalDuration(ps.totalDuration)
      setTimeRemaining(remaining)
    } else if (ps.state === 'completed') {
      persistRef.current = ps
      setState('completed')
      setTotalDuration(ps.totalDuration)
      setTimeRemaining(0)
    }
    // idle: nothing to restore
  }, [startRaf]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page Visibility API – recalculate when returning to foreground ───────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      const ps = persistRef.current
      if (!ps || ps.state !== 'running') return

      const remaining = computeRemaining(ps)
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        stopRaf()
        const completed: PersistedState = { ...ps, state: 'completed' }
        persistRef.current = completed
        saveTimerState(completed)
        setState('completed')
        onCompleteRef.current?.()
      } else {
        // Restart RAF (may have been throttled while backgrounded)
        startRaf()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [startRaf, stopRaf])

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => () => stopRaf(), [stopRaf])

  // ── Actions ─────────────────────────────────────────────────────────────

  const start = useCallback((durationMinutes: number) => {
    stopRaf()
    cancelSwNotification()
    requestNotificationPermission()

    const durationSeconds = durationMinutes * 60
    const now = Date.now()
    const ps: PersistedState = {
      startedAt: now,
      pausedAt: null,
      totalDuration: durationSeconds,
      state: 'running',
    }
    persistRef.current = ps
    saveTimerState(ps)

    setTotalDuration(durationSeconds)
    setTimeRemaining(durationSeconds)
    setState('running')
    startRaf()

    // Ask the service worker to fire a notification when the timer ends
    scheduleSwNotification(durationSeconds * 1000)
  }, [stopRaf, startRaf])

  const pause = useCallback(() => {
    if (persistRef.current?.state !== 'running') return
    stopRaf()
    cancelSwNotification()

    const now = Date.now()
    const ps: PersistedState = { ...persistRef.current, pausedAt: now, state: 'paused' }
    persistRef.current = ps
    saveTimerState(ps)
    setState('paused')
  }, [stopRaf])

  const resume = useCallback(() => {
    const ps = persistRef.current
    if (!ps || ps.state !== 'paused' || ps.pausedAt === null) return

    // Adjust startedAt so elapsed time stays correct
    const pausedDuration = Date.now() - ps.pausedAt
    const remaining = computeRemaining(ps) // seconds remaining at resume time
    const newStartedAt = Date.now() - (ps.totalDuration - remaining) * 1000

    const resumed: PersistedState = {
      ...ps,
      startedAt: newStartedAt,
      pausedAt: null,
      state: 'running',
    }
    persistRef.current = resumed
    saveTimerState(resumed)
    setState('running')
    startRaf()

    // Reschedule notification for remaining duration
    cancelSwNotification()
    scheduleSwNotification(remaining * 1000)
    void pausedDuration // used implicitly above
  }, [startRaf])

  const reset = useCallback(() => {
    stopRaf()
    cancelSwNotification()
    saveTimerState(null)
    persistRef.current = null
    setTimeRemaining(0)
    setTotalDuration(0)
    setState('idle')
  }, [stopRaf])

  const setDuration = useCallback((durationMinutes: number) => {
    if (state !== 'idle') return
    const durationSeconds = durationMinutes * 60
    setTotalDuration(durationSeconds)
    setTimeRemaining(durationSeconds)
  }, [state])

  const progress = totalDuration > 0 ? timeRemaining / totalDuration : 0

  return {
    timeRemaining,
    totalDuration,
    state,
    progress,
    start,
    pause,
    resume,
    reset,
    setDuration,
  }
}
