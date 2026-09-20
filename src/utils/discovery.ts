import type { Show } from '../types/show'

// Copy and filter before sorting so the original catalogue stays untouched.
// Exclude unrated shows, break rating ties by name and keep at most ten.
export function topRated(shows: Show[]) {
  return [...shows].filter(show => show.rating.average !== null)
    .sort((a, b) => b.rating.average! - a.rating.average! || a.name.localeCompare(b.name)).slice(0, 10)
}

// Remove any older entry with this ID before prepending the latest show data.
// Trimming to ten keeps the most recent unique shows, newest first.
export function addRecent(shows: Show[], show: Show) {
  return [show, ...shows.filter(item => item.id !== show.id)].slice(0, 10)
}

// Exclude the previous banner when alternatives exist, then choose a random index.
// A single available show may repeat. An empty collection returns null.
export function pickFeatured(shows: Show[], previousId: number | null) {
  const alternatives = shows.filter(show => show.id !== previousId)
  const choices = alternatives.length ? alternatives : shows
  return choices[Math.floor(Math.random() * choices.length)] ?? null
}
