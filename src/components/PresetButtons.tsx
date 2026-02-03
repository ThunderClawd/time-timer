interface PresetButtonsProps {
  onSelect: (minutes: number) => void
  selectedDuration: number
  disabled: boolean
}

const PRESETS = [5, 10, 15, 30, 45, 60]

export function PresetButtons({ onSelect, selectedDuration, disabled }: PresetButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
      {PRESETS.map((minutes) => (
        <button
          key={minutes}
          onClick={() => onSelect(minutes)}
          disabled={disabled}
          className={`
            px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            dark:focus:ring-offset-gray-900
            ${disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              : selectedDuration === minutes * 60
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 active:scale-95'
            }
          `}
          aria-label={`Set timer to ${minutes} minutes`}
        >
          {minutes}m
        </button>
      ))}
    </div>
  )
}
