let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export function playCompletionSound(): void {
  try {
    const ctx = getAudioContext()

    // Resume audio context if suspended (required for some browsers)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Create a pleasant completion chime
    const now = ctx.currentTime

    // First tone
    playTone(ctx, 523.25, now, 0.15, 0.3) // C5
    // Second tone (higher)
    playTone(ctx, 659.25, now + 0.15, 0.15, 0.3) // E5
    // Third tone (even higher)
    playTone(ctx, 783.99, now + 0.3, 0.3, 0.3) // G5
  } catch {
    // Audio not available, fail silently
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number
): void {
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startTime)

  // Envelope for smooth sound
  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

export function initAudioContext(): void {
  // Initialize audio context on user interaction
  try {
    getAudioContext()
  } catch {
    // Audio not available
  }
}
