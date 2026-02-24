import { useState, useRef, useEffect } from 'react'
import type { AuthState } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'

interface AuthButtonProps {
  auth: AuthState
}

export function AuthButton({ auth }: AuthButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!isSupabaseConfigured()) return null

  const { user, loading, signIn, signOut } = auth

  if (loading) {
    return (
      <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-gray-200/30 dark:bg-gray-700/30 animate-pulse" />
    )
  }

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="
          absolute top-4 left-4 z-20
          flex items-center gap-2 px-3 py-1.5 rounded-full
          text-xs font-medium
          text-gray-600 dark:text-gray-300
          bg-white/40 dark:bg-gray-800/40
          hover:bg-white/70 dark:hover:bg-gray-700/60
          backdrop-blur-sm
          border border-white/30 dark:border-gray-600/30
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
        "
        aria-label="Sign in with Google"
      >
        {/* Google 'G' icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in
      </button>
    )
  }

  // Logged in — show avatar + dropdown
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Account'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div ref={menuRef} className="absolute top-4 left-4 z-20">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="
          flex items-center gap-2 px-2 py-1 rounded-full
          text-xs font-medium
          text-gray-600 dark:text-gray-300
          bg-white/40 dark:bg-gray-800/40
          hover:bg-white/70 dark:hover:bg-gray-700/60
          backdrop-blur-sm
          border border-white/30 dark:border-gray-600/30
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
        "
        aria-label="Account menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
            {initials}
          </span>
        )}
        <span className="max-w-[80px] truncate hidden sm:block">{displayName.split(' ')[0]}</span>
      </button>

      {menuOpen && (
        <div className="
          absolute top-full left-0 mt-1 w-44
          bg-white/90 dark:bg-gray-800/90
          backdrop-blur-sm
          rounded-xl shadow-lg
          border border-white/40 dark:border-gray-700/40
          overflow-hidden
          text-sm
        ">
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200/50 dark:border-gray-700/50 truncate">
            {user.email}
          </div>
          <button
            onClick={() => { setMenuOpen(false); void signOut() }}
            className="
              w-full text-left px-3 py-2
              text-gray-700 dark:text-gray-300
              hover:bg-gray-100/70 dark:hover:bg-gray-700/70
              transition-colors duration-150
            "
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
