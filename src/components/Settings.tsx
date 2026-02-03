import type { Preferences } from '../utils'

interface SettingsProps {
  preferences: Preferences
  onSoundToggle: () => void
  onThemeChange: (theme: 'auto' | 'light' | 'dark') => void
}

export function Settings({ preferences, onSoundToggle, onThemeChange }: SettingsProps) {
  return (
    <div className="flex items-center justify-center gap-6 text-sm">
      <button
        onClick={onSoundToggle}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          text-gray-600 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
        aria-label={preferences.soundEnabled ? 'Disable sound' : 'Enable sound'}
      >
        {preferences.soundEnabled ? (
          <SoundOnIcon className="w-5 h-5" />
        ) : (
          <SoundOffIcon className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">Sound {preferences.soundEnabled ? 'On' : 'Off'}</span>
      </button>

      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <ThemeButton
          active={preferences.darkMode === 'auto'}
          onClick={() => onThemeChange('auto')}
          label="Auto theme"
        >
          <AutoIcon className="w-4 h-4" />
        </ThemeButton>
        <ThemeButton
          active={preferences.darkMode === 'light'}
          onClick={() => onThemeChange('light')}
          label="Light theme"
        >
          <SunIcon className="w-4 h-4" />
        </ThemeButton>
        <ThemeButton
          active={preferences.darkMode === 'dark'}
          onClick={() => onThemeChange('dark')}
          label="Dark theme"
        >
          <MoonIcon className="w-4 h-4" />
        </ThemeButton>
      </div>
    </div>
  )
}

interface ThemeButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}

function ThemeButton({ active, onClick, children, label }: ThemeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-md transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${active
          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-500'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function SoundOnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  )
}

function SoundOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

function AutoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
