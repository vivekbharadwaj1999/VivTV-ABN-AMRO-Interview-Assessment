import type { Show } from '../types/show'

// A show can belong to several rows; each row is sorted independently.
export function groupShowsByGenre(shows: Show[]) {
  const groups = new Map<string, Show[]>()

  for (const show of shows) {
    for (const genre of show.genres) {
      const group = groups.get(genre) ?? []
      group.push(show)
      groups.set(genre, group)
    }
  }

  return Array.from(groups, ([genre, shows]) => ({
    genre,
    shows: shows.sort((a, b) => {
      // Unrated shows follow rated shows, including a valid rating of zero.
      return (b.rating.average ?? -1) - (a.rating.average ?? -1)
        || a.name.localeCompare(b.name)
    }),
  })).sort((a, b) => a.genre.localeCompare(b.genre))
}
