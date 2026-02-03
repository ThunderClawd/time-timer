import { useRef, useEffect, useState, useCallback } from 'react'
import { formatTime, interpolateColor } from '../utils'
import type { TimerState } from '../hooks'

interface TimerDisplayProps {
  progress: number
  timeRemaining: number
  state: TimerState
  onDurationSet: (minutes: number) => void
}

const MAX_MINUTES = 60

export function TimerDisplay({ progress, timeRemaining, state, onDurationSet }: TimerDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const currentProgressRef = useRef(progress)
  const lastHapticMinute = useRef<number>(-1)

  const [isDragging, setIsDragging] = useState(false)
  const [settingMinutes, setSettingMinutes] = useState(0)
  const [canvasSize, setCanvasSize] = useState(320)

  // Calculate angle and minutes from pointer position
  const getMinutesFromPosition = useCallback((clientX: number, clientY: number): number => {
    const canvas = canvasRef.current
    if (!canvas) return 0

    const rect = canvas.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY

    // Calculate angle from 12 o'clock position (top)
    // atan2 gives angle from positive x-axis, so we adjust
    let angle = Math.atan2(dx, -dy) // Negative dy because y increases downward
    if (angle < 0) angle += Math.PI * 2

    // Convert angle to minutes (full circle = 60 minutes)
    const rawMinutes = (angle / (Math.PI * 2)) * MAX_MINUTES

    // Snap to nearest minute
    const snappedMinutes = Math.round(rawMinutes)

    return Math.max(0, Math.min(MAX_MINUTES, snappedMinutes))
  }, [])

  // Haptic feedback when crossing minute marks
  const triggerHaptic = useCallback((minutes: number) => {
    if (minutes !== lastHapticMinute.current && 'vibrate' in navigator) {
      navigator.vibrate(10)
      lastHapticMinute.current = minutes
    }
  }, [])

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (state !== 'idle') return

    e.preventDefault()
    const minutes = getMinutesFromPosition(e.clientX, e.clientY)
    setIsDragging(true)
    setSettingMinutes(minutes)
    lastHapticMinute.current = minutes
    triggerHaptic(minutes)

    // Capture pointer for smooth dragging
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [state, getMinutesFromPosition, triggerHaptic])

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || state !== 'idle') return

    e.preventDefault()
    const minutes = getMinutesFromPosition(e.clientX, e.clientY)
    setSettingMinutes(minutes)
    triggerHaptic(minutes)
  }, [isDragging, state, getMinutesFromPosition, triggerHaptic])

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return

    e.preventDefault()
    setIsDragging(false)

    if (settingMinutes > 0) {
      onDurationSet(settingMinutes)
    }

    // Release pointer capture
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [isDragging, settingMinutes, onDurationSet])

  // Handle pointer cancel
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current
      if (container) {
        const size = Math.min(container.clientWidth, 400)
        setCanvasSize(size)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Main drawing effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = canvasSize

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 20
    const innerRadius = radius * 0.55
    const tickOuterRadius = radius - 5
    const tickInnerRadius = radius - 20

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3)
    }

    function draw() {
      if (!ctx) return

      // Smooth progress animation during countdown
      const targetProgress = progress
      const diff = targetProgress - currentProgressRef.current
      if (Math.abs(diff) > 0.0001 && state === 'running') {
        currentProgressRef.current += diff * 0.15
      } else {
        currentProgressRef.current = targetProgress
      }

      const isDark = document.documentElement.classList.contains('dark')

      // Clear canvas
      ctx.clearRect(0, 0, size, size)

      // Background circle (the "dial" background)
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? '#1f2937' : '#f3f4f6'
      ctx.fill()

      // Draw tick marks around the edge
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2
        const isMajor = i % 5 === 0
        const tickStart = isMajor ? tickInnerRadius - 5 : tickInnerRadius
        const tickEnd = tickOuterRadius
        const tickWidth = isMajor ? 2 : 1

        const x1 = centerX + Math.cos(angle) * tickStart
        const y1 = centerY + Math.sin(angle) * tickStart
        const x2 = centerX + Math.cos(angle) * tickEnd
        const y2 = centerY + Math.sin(angle) * tickEnd

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = isDark ? '#4b5563' : '#9ca3af'
        ctx.lineWidth = tickWidth
        ctx.stroke()
      }

      // Draw minute numbers at major tick marks
      ctx.font = `${size * 0.035}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const numberRadius = tickInnerRadius - 18
      for (let i = 0; i < 60; i += 5) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2
        const x = centerX + Math.cos(angle) * numberRadius
        const y = centerY + Math.sin(angle) * numberRadius
        const label = i === 0 ? '60' : i.toString()
        ctx.fillText(label, x, y)
      }

      // Determine what slice to show
      let sliceMinutes = 0
      let sliceColor = '#ef4444' // Red

      if (isDragging && state === 'idle') {
        // While setting duration - show red slice based on drag
        sliceMinutes = settingMinutes
      } else if (state === 'running' || state === 'paused') {
        // Timer running - show slice based on remaining time (with color based on progress)
        sliceMinutes = timeRemaining / 60
        sliceColor = interpolateColor(currentProgressRef.current)
      } else if (state === 'idle' && settingMinutes > 0) {
        // Duration set but not started
        sliceMinutes = settingMinutes
      }

      // Draw the time slice/wedge
      if (sliceMinutes > 0) {
        const sliceAngle = (sliceMinutes / MAX_MINUTES) * Math.PI * 2
        const startAngle = -Math.PI / 2 // 12 o'clock
        const endAngle = startAngle + sliceAngle

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius - 2, startAngle, endAngle)
        ctx.closePath()

        // Create gradient for the slice
        const gradient = ctx.createRadialGradient(
          centerX, centerY, innerRadius,
          centerX, centerY, radius
        )
        gradient.addColorStop(0, sliceColor)
        gradient.addColorStop(1, adjustBrightness(sliceColor, -15))
        ctx.fillStyle = gradient
        ctx.fill()

        // Add subtle edge highlight
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius - 2, startAngle, endAngle)
        ctx.strokeStyle = adjustBrightness(sliceColor, 20)
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Inner circle (center of the dial)
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? '#111827' : '#ffffff'
      ctx.fill()

      // Inner circle border
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb'
      ctx.lineWidth = 2
      ctx.stroke()

      // Outer ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = isDark ? '#374151' : '#d1d5db'
      ctx.lineWidth = 3
      ctx.stroke()

      // Draw handle/marker at the end of the slice (only when setting or has duration in idle)
      if ((isDragging || (state === 'idle' && settingMinutes > 0)) && sliceMinutes > 0) {
        const handleAngle = -Math.PI / 2 + (sliceMinutes / MAX_MINUTES) * Math.PI * 2
        const handleRadius = (innerRadius + radius) / 2
        const handleX = centerX + Math.cos(handleAngle) * handleRadius
        const handleY = centerY + Math.sin(handleAngle) * handleRadius

        // Handle shadow (drawn first, underneath)
        ctx.beginPath()
        ctx.arc(handleX + 2, handleY + 2, 12, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.2)'
        ctx.fill()

        // Handle circle
        ctx.beginPath()
        ctx.arc(handleX, handleY, 12, 0, Math.PI * 2)
        ctx.fillStyle = '#dc2626'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Pulse effect when completed
      if (state === 'completed') {
        const pulsePhase = (Date.now() % 1000) / 1000
        const pulseAlpha = easeOutCubic(Math.sin(pulsePhase * Math.PI)) * 0.4

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`
        ctx.lineWidth = 6
        ctx.stroke()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [canvasSize, progress, state, isDragging, settingMinutes, timeRemaining])

  // Update progress ref when props change
  useEffect(() => {
    if (state === 'idle') {
      currentProgressRef.current = progress
    }
  }, [progress, state])

  // Reset settingMinutes when timer resets
  useEffect(() => {
    if (state === 'idle' && progress === 0 && timeRemaining === 0) {
      setSettingMinutes(0)
    }
  }, [state, progress, timeRemaining])

  // Determine what text to show in center
  const getCenterText = () => {
    if (isDragging && state === 'idle') {
      return `${settingMinutes} min`
    }
    if (state === 'idle' && settingMinutes > 0) {
      return `${settingMinutes} min`
    }
    if (state === 'running' || state === 'paused') {
      return formatTime(timeRemaining)
    }
    if (state === 'completed') {
      return "0:00"
    }
    // Idle with no duration set
    return 'Drag to set'
  }

  const getSubText = () => {
    if (isDragging) {
      return 'Release to set'
    }
    if (state === 'paused') {
      return 'Paused'
    }
    if (state === 'running') {
      return 'Running'
    }
    if (state === 'completed') {
      return "Time's Up!"
    }
    if (state === 'idle' && settingMinutes > 0) {
      return 'Ready'
    }
    return ''
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center w-full max-w-[400px] aspect-square mx-auto select-none"
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${state === 'idle' ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerUp}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`text-4xl md:text-5xl font-light tabular-nums tracking-tight transition-colors
            ${state === 'completed' ? 'text-red-500 animate-pulse-soft' : 'text-gray-800 dark:text-gray-100'}
            ${isDragging ? 'text-red-600 dark:text-red-400' : ''}`}
        >
          {getCenterText()}
        </span>
        {getSubText() && (
          <span className={`text-sm mt-2 uppercase tracking-wider
            ${state === 'completed' ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            {getSubText()}
          </span>
        )}
      </div>
    </div>
  )
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.slice(1), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt))
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}
