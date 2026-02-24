import { useState, useEffect, useRef, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Preferences } from '../utils/storage'
import type { CollectedThemes } from '../themes/dailyThemes.types'
import { loadThemeCollection, saveThemeCollection } from '../utils/themeCollection'

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

/**
 * Merge two theme collections — never loses themes from either side.
 * - themes:        union of both arrays
 * - unlockedDates: merged, keeping the EARLIEST date per theme
 * - activeTheme:   remote wins if set, otherwise keep local
 */
function mergeThemeCollections(local: CollectedThemes, remote: CollectedThemes): CollectedThemes {
  const allIds = new Set([...local.themes, ...remote.themes])

  const mergedDates: Record<string, number> = { ...remote.unlockedDates }
  for (const id of Object.keys(local.unlockedDates)) {
    const localDate = local.unlockedDates[id] ?? 0
    const remoteDate = mergedDates[id] ?? 0
    if (!remoteDate || localDate < remoteDate) {
      mergedDates[id] = localDate
    }
  }

  return {
    themes: Array.from(allIds),
    unlockedDates: mergedDates,
    activeTheme: remote.activeTheme ?? local.activeTheme,
  }
}

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
  // Keep a ref to current preferences so the initial fetch can read the latest value
  const preferencesRef = useRef(preferences)
  useEffect(() => { preferencesRef.current = preferences }, [preferences])

  // On login: fetch remote, merge with local, push merged result back up
  useEffect(() => {
    if (!supabase || !user) {
      isInitialLoad.current = true
      return
    }

    const syncOnLogin = async () => {
      if (!supabase) return
      setSyncing(true)
      setSyncError(null)
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences, theme_collection')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        // Read freshest local data at merge time (not stale closure)
        const localCollection = loadThemeCollection()

        let finalCollection: CollectedThemes
        let finalPreferences: Preferences | null = null

        if (data) {
          // Merge theme collections from both sides
          const remoteCollection = (data.theme_collection ?? {
            themes: [],
            unlockedDates: {},
            activeTheme: null,
          }) as CollectedThemes

          finalCollection = mergeThemeCollections(localCollection, remoteCollection)

          // Preferences: remote wins if it has data
          if (data.preferences && Object.keys(data.preferences as object).length > 0) {
            finalPreferences = data.preferences as Preferences
          }
        } else {
          // No remote row yet — local is the source of truth
          finalCollection = localCollection
        }

        // Apply merged result locally
        saveThemeCollection(finalCollection)
        onThemeCollectionLoaded(finalCollection)
        if (finalPreferences) {
          onPreferencesLoaded(finalPreferences)
        }

        // Push merged result back to Supabase immediately so all devices get it
        await supabase.from('user_preferences').upsert(
          {
            user_id: user.id,
            preferences: finalPreferences ?? preferencesRef.current,
            theme_collection: finalCollection,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

        setLastSynced(new Date())
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        setSyncing(false)
        isInitialLoad.current = false
      }
    }

    syncOnLogin()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced upsert whenever preferences or theme collection changes
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
