import { useEffect, useState } from 'react'

interface CompletionGlowProps {
  isComplete: boolean
}

export function CompletionGlow({ isComplete }: CompletionGlowProps) {
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isComplete) {
      // Fade in
      setOpacity(1)
    } else {
      // Fade out
      setOpacity(0)
    }
  }, [isComplete])

  return (
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{ opacity, zIndex: 0 }}
    >
      {/* Warm red/orange glow with gentle pulsing animation */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, rgba(251, 146, 60, 0.1) 30%, rgba(249, 115, 22, 0.05) 50%, transparent 70%)',
          animation: isComplete ? 'pulse-glow 3s ease-in-out infinite' : 'none',
        }}
      />
      {/* Additional layer for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(252, 165, 165, 0.08) 0%, transparent 60%)',
          animation: isComplete ? 'pulse-glow 3s ease-in-out infinite 0.5s' : 'none',
        }}
      />
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  )
}
