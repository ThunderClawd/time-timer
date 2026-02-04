export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function getTimerColor(progress: number): string {
  if (progress > 0.5) {
    return '#22c55e' // green
  } else if (progress > 0.25) {
    return '#eab308' // yellow
  } else if (progress > 0.1) {
    return '#f97316' // orange
  } else {
    return '#ef4444' // red
  }
}

export function interpolateColor(progress: number): string {
  // Smooth color transitions
  if (progress > 0.5) {
    // Green to Yellow transition (1.0 -> 0.5)
    const t = (progress - 0.5) / 0.5
    return interpolateHex('#eab308', '#22c55e', t)
  } else if (progress > 0.25) {
    // Yellow to Orange transition (0.5 -> 0.25)
    const t = (progress - 0.25) / 0.25
    return interpolateHex('#f97316', '#eab308', t)
  } else if (progress > 0.1) {
    // Orange to Red transition (0.25 -> 0.1)
    const t = (progress - 0.1) / 0.15
    return interpolateHex('#ef4444', '#f97316', t)
  } else {
    return '#ef4444' // red
  }
}

function interpolateHex(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)

  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)

  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export interface CelestialPosition {
  x: number // 0-100 percentage
  y: number // 0-100 percentage
  visible: boolean
}

/**
 * Calculate sun position based on current time
 * 6am: sunrise (left, y=50)
 * 12pm: noon (center, y=10 - high in sky)
 * 6pm: sunset (right, y=50)
 * Night (6pm-6am): sun is below horizon (not visible)
 */
export function getSunPosition(now: Date = new Date()): CelestialPosition {
  const hours = now.getHours() + now.getMinutes() / 60
  
  // Sun is visible from 6am to 6pm
  if (hours < 6 || hours >= 18) {
    return { x: 0, y: 100, visible: false }
  }
  
  // Calculate progress through day (6am = 0, 6pm = 1)
  const dayProgress = (hours - 6) / 12
  
  // X position: moves from left (10%) to right (90%)
  const x = 10 + dayProgress * 80
  
  // Y position: follows an arc (parabola)
  // Peak at noon (dayProgress = 0.5), lower at sunrise/sunset
  const arcHeight = Math.sin(dayProgress * Math.PI)
  const y = 50 - arcHeight * 40 // Ranges from 50% (horizon) to 10% (peak)
  
  return { x, y, visible: true }
}

/**
 * Calculate moon position based on current time
 * 6pm: moonrise (left, y=50)
 * 12am: midnight (center, y=10 - high in sky)
 * 6am: moonset (right, y=50)
 * Day (6am-6pm): moon is below horizon (not visible)
 */
export function getMoonPosition(now: Date = new Date()): CelestialPosition {
  const hours = now.getHours() + now.getMinutes() / 60
  
  // Convert to night hours (18:00 = 0, 06:00 = 12)
  let nightHours: number
  if (hours >= 18) {
    nightHours = hours - 18 // 18:00-23:59 -> 0-5.99
  } else if (hours < 6) {
    nightHours = hours + 6 // 00:00-05:59 -> 6-11.99
  } else {
    // Day time (6am-6pm): moon not visible
    return { x: 0, y: 100, visible: false }
  }
  
  // Calculate progress through night (0 = 6pm, 12 = 6am)
  const nightProgress = nightHours / 12
  
  // X position: moves from left (10%) to right (90%)
  const x = 10 + nightProgress * 80
  
  // Y position: follows an arc (parabola)
  // Peak at midnight (nightProgress = 0.5), lower at rise/set
  const arcHeight = Math.sin(nightProgress * Math.PI)
  const y = 50 - arcHeight * 40 // Ranges from 50% (horizon) to 10% (peak)
  
  return { x, y, visible: true }
}
