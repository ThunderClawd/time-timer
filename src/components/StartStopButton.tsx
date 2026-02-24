import type { TimerState } from '../hooks'

interface StartStopButtonProps {
  state: TimerState
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  canStart: boolean
}

export function StartStopButton({
  state,
  onStart,
  onPause,
  onResume,
  onReset,
  canStart,
}: StartStopButtonProps) {
  const getButtonConfig = () => {
    switch (state) {
      case 'running':
        return {
          label: 'Pause',
          onClick: onPause,
          disabled: false,
          className: 'bg-yellow-500 shadow-yellow-500/30 hover:bg-yellow-600 hover:shadow-yellow-500/40 focus:ring-yellow-500',
        }
      case 'paused':
        return {
          label: 'Resume',
          onClick: onResume,
          disabled: false,
          className: 'bg-green-500 shadow-green-500/30 hover:bg-green-600 hover:shadow-green-500/40 focus:ring-green-500',
        }
      case 'completed':
        return {
          label: 'Done',
          onClick: onReset,
          disabled: false,
          className: 'bg-indigo-500 shadow-indigo-500/30 hover:bg-indigo-600 hover:shadow-indigo-500/40 focus:ring-indigo-500',
        }
      case 'idle':
      default:
        return {
          label: 'Start',
          onClick: onStart,
          disabled: !canStart,
          className: canStart
            ? 'bg-green-500 shadow-green-500/30 hover:bg-green-600 hover:shadow-green-500/40 focus:ring-green-500'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed shadow-none',
        }
    }
  }

  const config = getButtonConfig()
  const isPaused = state === 'paused'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main action button */}
      <button
        onClick={config.onClick}
        disabled={config.disabled}
        className={`
          px-12 py-4 rounded-full text-xl font-semibold
          text-white shadow-lg
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          active:scale-95
          ${config.className}
        `}
        aria-label={`${config.label} timer`}
      >
        {config.label}
      </button>

      {/*
        Reset button — always in the DOM so the CSS transition runs in both
        directions. Fades + slides up when entering (paused), fades + slides
        down when leaving. pointer-events-none while hidden so it can't be
        accidentally tapped.
      */}
      <button
        onClick={onReset}
        aria-label="Reset timer"
        tabIndex={isPaused ? 0 : -1}
        className={`
          flex items-center gap-1.5
          px-5 py-1.5 rounded-full
          text-sm font-medium
          text-gray-400 dark:text-gray-500
          hover:text-red-400 dark:hover:text-red-400
          hover:bg-red-50 dark:hover:bg-red-950/40
          active:scale-95
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400
          dark:focus:ring-offset-gray-900
          ${isPaused
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-2 pointer-events-none'
          }
        `}
      >
        {/* Rotating arrow icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Reset
      </button>
    </div>
  )
}
