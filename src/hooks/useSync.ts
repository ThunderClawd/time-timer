import { useState, useEffect, useRef, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Preferences } from '../utils/storage'
import type { CollectedThemes } from '../themes/dailyThemes.types'
import { saveThemeCollection } from '../utils/themeCollection'

interface SyncOptions {
  user: User | null
  preferences: Preferences
  themeCollection: CollectedThemes
  onPreferencesLoaded: (prefs: Preferences) => void
  onThemeCollectionLoaded: (collection: CollectedThemes) => void
}

export interface SyncState {
  syncing: boolean
  lastSynced: Date | null
  syncError: string | null
}

const DEBOUNCE_MS = 1500

export function useSync({
  user,
  preferences,
  themeCollection,
  onPreferencesLoaded,
  onThemeCollectionLoaded,
}: SyncOptions): SyncState {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialLoad = useRef(true)

  // Fetch from Supabase when user logs in
  useEffect(() => {
    if (!supabase || !user) {
      isInitialLoad.current = true
      return
    }

    const fetchRemoteData = async () => {
      if (!supabase) return
      setSyncing(true)
      setSyncError(null)
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences, theme_collection')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = row not found, which is fine for new users
          throw error
        }

        if (data) {
          // Supabase data wins on initial load
          if (data.preferences && Object.keys(data.preferences as object).length > 0) {
            onPreferencesLoaded(data.preferences as Preferences)
          }
          if (data.theme_collection) {
            const remote = data.theme_collection as CollectedThemes
            onThemeCollectionLoaded(remote)
            saveThemeCollection(remote)
          }
        }

        setLastSynced(new Date())
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        setSyncing(false)
        isInitialLoad.current = false
      }
    }

    fetchRemoteData()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced upsert on preferences/theme changes
  const scheduleUpsert = useCallback(() => {
    if (!supabase || !user || isInitialLoad.current) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      if (!supabase) return
      setSyncing(true)
      setSyncError(null)
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert(
            {
              user_id: user.id,
              preferences,
              theme_collection: themeCollection,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

        if (error) throw error
        setLastSynced(new Date())
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        setSyncing(false)
      }
    }, DEBOUNCE_MS)
  }, [user, preferences, themeCollection])

  useEffect(() => {
    scheduleUpsert()
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [scheduleUpsert])

  return { syncing, lastSynced, syncError }
}
