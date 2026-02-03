import type { TimerState } from '../hooks'

interface ControlsProps {
  state: TimerState
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  canStart: boolean
}

export function Controls({ state, onStart, onPause, onResume, onReset, canStart }: ControlsProps) {
  return (
    <div className="flex justify-center gap-4">
      {state === 'idle' && (
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`
            px-8 py-3 rounded-full text-lg font-semibold
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
            dark:focus:ring-offset-gray-900
            ${canStart
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/40 active:scale-95'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }
          `}
          aria-label="Start timer"
        >
          Start
        </button>
      )}

      {state === 'running' && (
        <button
          onClick={onPause}
          className="
            px-8 py-3 rounded-full text-lg font-semibold
            bg-yellow-500 text-white shadow-lg shadow-yellow-500/30
            hover:bg-yellow-600 hover:shadow-xl hover:shadow-yellow-500/40
            active:scale-95
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
            dark:focus:ring-offset-gray-900
          "
          aria-label="Pause timer"
        >
          Pause
        </button>
      )}

      {state === 'paused' && (
        <>
          <button
            onClick={onResume}
            className="
              px-8 py-3 rounded-full text-lg font-semibold
              bg-green-500 text-white shadow-lg shadow-green-500/30
              hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/40
              active:scale-95
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
              dark:focus:ring-offset-gray-900
            "
            aria-label="Resume timer"
          >
            Resume
          </button>
          <button
            onClick={onReset}
            className="
              px-8 py-3 rounded-full text-lg font-semibold
              bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300
              hover:bg-gray-300 dark:hover:bg-gray-600
              active:scale-95
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
              dark:focus:ring-offset-gray-900
            "
            aria-label="Reset timer"
          >
            Reset
          </button>
        </>
      )}

      {state === 'completed' && (
        <button
          onClick={onReset}
          className="
            px-8 py-3 rounded-full text-lg font-semibold
            bg-blue-500 text-white shadow-lg shadow-blue-500/30
            hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/40
            active:scale-95
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            dark:focus:ring-offset-gray-900
          "
          aria-label="Start new timer"
        >
          New Timer
        </button>
      )}
    </div>
  )
}
