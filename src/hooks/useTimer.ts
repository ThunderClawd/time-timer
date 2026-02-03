import { useState, useCallback, useRef, useEffect } from 'react'

export type TimerState = 'idle' | 'running' | 'paused' | 'completed'

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

  const [totalDuration, setTotalDuration] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [state, setState] = useState<TimerState>('idle')

  const intervalRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      cancelAnimationFrame(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const now = performance.now()
    const elapsed = now - lastTickRef.current

    setTimeRemaining((prev) => {
      const newTime = Math.max(0, prev - elapsed / 1000)

      if (newTime <= 0) {
        clearTimer()
        setState('completed')
        onComplete?.()
        return 0
      }

      return newTime
    })

    lastTickRef.current = now
    intervalRef.current = requestAnimationFrame(tick)
  }, [clearTimer, onComplete])

  const start = useCallback((durationMinutes: number) => {
    clearTimer()
    const durationSeconds = durationMinutes * 60
    setTotalDuration(durationSeconds)
    setTimeRemaining(durationSeconds)
    setState('running')
    lastTickRef.current = performance.now()
    intervalRef.current = requestAnimationFrame(tick)
  }, [clearTimer, tick])

  const pause = useCallback(() => {
    if (state === 'running') {
      clearTimer()
      setState('paused')
    }
  }, [state, clearTimer])

  const resume = useCallback(() => {
    if (state === 'paused') {
      setState('running')
      lastTickRef.current = performance.now()
      intervalRef.current = requestAnimationFrame(tick)
    }
  }, [state, tick])

  const reset = useCallback(() => {
    clearTimer()
    setTimeRemaining(0)
    setTotalDuration(0)
    setState('idle')
  }, [clearTimer])

  const setDuration = useCallback((durationMinutes: number) => {
    if (state === 'idle') {
      const durationSeconds = durationMinutes * 60
      setTotalDuration(durationSeconds)
      setTimeRemaining(durationSeconds)
    }
  }, [state])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

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
