import type { Show } from '../types/show'

// Build a new array for each genre, adding shows to every genre they belong to.
// Sorting these arrays leaves the original catalogue order unchanged.
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
    // Sort each row by rating, then name for equal ratings. Finally sort the rows
    // themselves alphabetically so the menu and catalogue use a predictable order.
    genre,
    shows: shows.sort((a, b) => {
      // Unrated shows follow rated shows, including a valid rating of zero.
      return (b.rating.average ?? -1) - (a.rating.average ?? -1)
        || a.name.localeCompare(b.name)
    }),
  })).sort((a, b) => a.genre.localeCompare(b.genre))
}
