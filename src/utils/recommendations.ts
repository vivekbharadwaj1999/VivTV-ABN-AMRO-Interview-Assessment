import type { Show } from '../types/show'

// Count each genre once per distinct show. Reopening a show changes recent-history
// order, but should not give that show extra votes for its genres.
export function genrePreferences(history: Show[]) {
  const seen = new Set<number>()
  const counts = new Map<string, number>()
  for (const show of history) {
    if (seen.has(show.id)) continue
    seen.add(show.id)
    for (const genre of new Set(show.genres)) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }
  return Array.from(counts, ([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
}

// Match candidates against all recent genre counts, excluding already opened shows.
// Stronger genre matches come first; rating and name make equal matches predictable.
export function recommendShows(catalogue: Show[], history: Show[]) {
  const preferences = genrePreferences(history)
  const opened = new Set(history.map(show => show.id))
  const seen = new Set<number>()
  return catalogue.filter(show => {
    if (opened.has(show.id) || seen.has(show.id)) return false
    seen.add(show.id)
    return true
  }).map(show => {
    const matches = preferences.filter(item => show.genres.includes(item.genre))
    return { show, genres: matches.map(item => item.genre), score: matches.reduce((sum, item) => sum + item.count, 0) }
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score
      || (b.show.rating.average ?? -1) - (a.show.rating.average ?? -1)
      || a.show.name.localeCompare(b.show.name))
}
