import { useRef, useEffect } from 'react'
import { formatTime, interpolateColor } from '../utils'
import type { TimerState } from '../hooks'

interface TimerDisplayProps {
  progress: number
  timeRemaining: number
  state: TimerState
}

export function TimerDisplay({ progress, timeRemaining, state }: TimerDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const currentProgressRef = useRef(progress)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = Math.min(canvas.parentElement?.clientWidth || 320, 400)

    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 20
    const innerRadius = radius * 0.65

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3)
    }

    function draw() {
      if (!ctx) return

      // Smooth progress animation
      const targetProgress = progress
      const diff = targetProgress - currentProgressRef.current
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * 0.15
      } else {
        currentProgressRef.current = targetProgress
      }

      const animatedProgress = currentProgressRef.current

      // Clear canvas
      ctx.clearRect(0, 0, size, size)

      // Background circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      const isDark = document.documentElement.classList.contains('dark')
      ctx.fillStyle = isDark ? '#374151' : '#e5e7eb'
      ctx.fill()

      // Inner circle (creates the donut effect)
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? '#1f2937' : '#ffffff'
      ctx.fill()

      // Timer arc (the colored portion showing time remaining)
      if (animatedProgress > 0) {
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + animatedProgress * Math.PI * 2

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()

        // Get color based on progress
        const color = interpolateColor(animatedProgress)

        // Create gradient for depth effect
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerRadius,
          centerX,
          centerY,
          radius
        )
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, adjustBrightness(color, -20))
        ctx.fillStyle = gradient
        ctx.fill()

        // Cut out inner circle
        ctx.beginPath()
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? '#1f2937' : '#ffffff'
        ctx.fill()

        // Add subtle shadow/glow effect
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.strokeStyle = adjustBrightness(color, 30)
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Outer ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.strokeStyle = isDark ? '#4b5563' : '#d1d5db'
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = isDark ? '#4b5563' : '#d1d5db'
      ctx.lineWidth = 2
      ctx.stroke()

      // Pulse effect when completed
      if (state === 'completed') {
        const pulsePhase = (Date.now() % 1000) / 1000
        const pulseAlpha = easeOutCubic(Math.sin(pulsePhase * Math.PI)) * 0.3

        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha})`
        ctx.lineWidth = 4
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
  }, [progress, state])

  // Update progress ref when props change
  useEffect(() => {
    if (state === 'idle') {
      currentProgressRef.current = progress
    }
  }, [progress, state])

  return (
    <div className="relative flex items-center justify-center w-full max-w-[400px] aspect-square mx-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`text-5xl md:text-6xl font-light tabular-nums tracking-tight transition-colors
            ${state === 'completed' ? 'text-red-500 animate-pulse-soft' : 'text-gray-800 dark:text-gray-100'}`}
        >
          {formatTime(timeRemaining)}
        </span>
        {state !== 'idle' && state !== 'completed' && (
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
            {state === 'paused' ? 'Paused' : 'Running'}
          </span>
        )}
        {state === 'completed' && (
          <span className="text-sm text-red-500 mt-2 uppercase tracking-wider font-medium">
            Time's Up!
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
