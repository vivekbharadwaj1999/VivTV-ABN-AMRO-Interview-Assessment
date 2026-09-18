import { ref } from 'vue'
import type { Show } from '../types/show'
import { addRecent } from './discovery'

const key = 'tv-explorer-recent-shows'
// Treat missing or damaged history as empty, without preventing the app from loading.
function readRecent(): Show[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter(show => Number.isInteger(show?.id) && typeof show.name === 'string'
      && Array.isArray(show.genres) && show.rating
      && (show.rating.average === null || typeof show.rating.average === 'number')).slice(0, 10)
  } catch { return [] }
}

export const recentShows = ref<Show[]>(readRecent())
// Update the visible row immediately, even if browser storage is unavailable.
export function rememberShow(show: Show) {
  recentShows.value = addRecent(recentShows.value, show)
  try { localStorage.setItem(key, JSON.stringify(recentShows.value)) } catch {
    // Browsing still works if storage is unavailable; history remains in memory.
  }
}
