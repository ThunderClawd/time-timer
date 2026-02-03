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
