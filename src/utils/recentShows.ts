import { ref } from 'vue'
import type { Show } from '../types/show'
import { addRecent } from './discovery'

const key = 'tv-explorer-recent-shows'
// Parse stored JSON and check the basic fields needed by the rows before using it.
// Invalid or blocked storage falls back to an empty history rather than breaking browsing.
function readRecent(): Show[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter(show => Number.isInteger(show?.id) && typeof show.name === 'string'
      && Array.isArray(show.genres) && show.rating
      && (show.rating.average === null || typeof show.rating.average === 'number')).slice(0, 10)
  } catch { return [] }
}

// This ref is created once at module scope, so the detail view and homepage share it.
// Storage restores it on refresh. It is not separated by the locally signed-in account.
export const recentShows = ref<Show[]>(readRecent())
// Update reactive history first so the homepage changes immediately, then persist it.
// A failed write leaves history usable in memory for the current page session.
export function rememberShow(show: Show) {
  recentShows.value = addRecent(recentShows.value, show)
  try { localStorage.setItem(key, JSON.stringify(recentShows.value)) } catch {
    // Browsing still works if storage is unavailable. History remains in memory.
  }
}
