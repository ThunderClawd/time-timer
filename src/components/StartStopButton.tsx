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

  return (
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
  )
}
