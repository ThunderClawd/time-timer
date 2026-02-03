import { useEffect, useRef, useState } from 'react'
import { getSunPosition, getMoonPosition, type CelestialPosition } from '../utils/time'

export function DayNightCycle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [sunPos, setSunPos] = useState<CelestialPosition>(() => getSunPosition())
  const [moonPos, setMoonPos] = useState<CelestialPosition>(() => getMoonPosition())

  // Update positions every minute
  useEffect(() => {
    const updatePositions = () => {
      setSunPos(getSunPosition())
      setMoonPos(getMoonPosition())
    }

    // Update immediately
    updatePositions()

    // Update every minute
    const interval = setInterval(updatePositions, 60000)
    return () => clearInterval(interval)
  }, [])

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement
        if (parent) {
          const rect = parent.getBoundingClientRect()
          setDimensions({ width: rect.width, height: rect.height })
        }
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !dimensions.width || !dimensions.height) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    
    const drawSun = (x: number, y: number) => {
      const sunRadius = Math.min(dimensions.width, dimensions.height) * 0.08

      // Outer glow layers
      for (let i = 3; i >= 0; i--) {
        const radius = sunRadius * (3 + i * 1.5)
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        const alpha = 0.03 + i * 0.02
        gradient.addColorStop(0, `rgba(255, 230, 150, ${alpha})`)
        gradient.addColorStop(0.5, `rgba(255, 220, 100, ${alpha * 0.5})`)
        gradient.addColorStop(1, 'rgba(255, 220, 100, 0)')
        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Sun core
      const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, sunRadius)
      coreGradient.addColorStop(0, 'rgba(255, 250, 200, 0.3)')
      coreGradient.addColorStop(0.7, 'rgba(255, 230, 150, 0.15)')
      coreGradient.addColorStop(1, 'rgba(255, 220, 100, 0.05)')
      ctx.beginPath()
      ctx.fillStyle = coreGradient
      ctx.arc(x, y, sunRadius, 0, Math.PI * 2)
      ctx.fill()

      // Subtle light rays
      const rayCount = 8
      const time = Date.now() * 0.0003
      ctx.save()
      ctx.globalCompositeOperation = 'screen'

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + time
        const rayLength = sunRadius * (4 + Math.sin(time * 2 + i) * 1.5)
        const rayWidth = Math.PI / 20

        const gradient = ctx.createRadialGradient(x, y, sunRadius * 0.5, x, y, rayLength)
        gradient.addColorStop(0, 'rgba(255, 240, 180, 0.08)')
        gradient.addColorStop(0.5, 'rgba(255, 235, 150, 0.03)')
        gradient.addColorStop(1, 'rgba(255, 230, 100, 0)')

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.moveTo(x, y)
        ctx.arc(x, y, rayLength, angle - rayWidth, angle + rayWidth)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    const drawMoon = (x: number, y: number) => {
      const moonRadius = Math.min(dimensions.width, dimensions.height) * 0.06

      // Moon glow (outer)
      const outerGlow = ctx.createRadialGradient(
        x,
        y,
        moonRadius * 0.5,
        x,
        y,
        moonRadius * 3
      )
      outerGlow.addColorStop(0, 'rgba(255, 250, 230, 0.15)')
      outerGlow.addColorStop(0.3, 'rgba(255, 250, 230, 0.06)')
      outerGlow.addColorStop(1, 'rgba(255, 250, 230, 0)')
      ctx.beginPath()
      ctx.fillStyle = outerGlow
      ctx.arc(x, y, moonRadius * 3, 0, Math.PI * 2)
      ctx.fill()

      // Moon body
      const moonGradient = ctx.createRadialGradient(
        x - moonRadius * 0.2,
        y - moonRadius * 0.2,
        0,
        x,
        y,
        moonRadius
      )
      moonGradient.addColorStop(0, 'rgba(255, 252, 240, 0.95)')
      moonGradient.addColorStop(0.7, 'rgba(250, 245, 220, 0.9)')
      moonGradient.addColorStop(1, 'rgba(240, 235, 210, 0.85)')

      ctx.beginPath()
      ctx.fillStyle = moonGradient
      ctx.arc(x, y, moonRadius, 0, Math.PI * 2)
      ctx.fill()

      // Subtle moon craters/texture
      ctx.fillStyle = 'rgba(220, 215, 200, 0.15)'
      ctx.beginPath()
      ctx.arc(x + moonRadius * 0.2, y - moonRadius * 0.1, moonRadius * 0.15, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x - moonRadius * 0.25, y + moonRadius * 0.3, moonRadius * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + moonRadius * 0.3, y + moonRadius * 0.25, moonRadius * 0.08, 0, Math.PI * 2)
      ctx.fill()
    }

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Draw sun if visible
      if (sunPos.visible) {
        const sunX = (sunPos.x / 100) * dimensions.width
        const sunY = (sunPos.y / 100) * dimensions.height
        drawSun(sunX, sunY)
      }

      // Draw moon if visible
      if (moonPos.visible) {
        const moonX = (moonPos.x / 100) * dimensions.width
        const moonY = (moonPos.y / 100) * dimensions.height
        drawMoon(moonX, moonY)
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [dimensions, sunPos, moonPos])

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}
