import type { Show } from '../types/show'

// Rank a copy so the dashboard's original show order is left untouched.
export function topRated(shows: Show[]) {
  return [...shows].filter(show => show.rating.average !== null)
    .sort((a, b) => b.rating.average! - a.rating.average! || a.name.localeCompare(b.name)).slice(0, 10)
}

// Reopening a show moves it to the front without creating a duplicate.
export function addRecent(shows: Show[], show: Show) {
  return [show, ...shows.filter(item => item.id !== show.id)].slice(0, 10)
}

// Avoid repeating the last banner when another top-rated show is available.
export function pickFeatured(shows: Show[], previousId: number | null) {
  const alternatives = shows.filter(show => show.id !== previousId)
  const choices = alternatives.length ? alternatives : shows
  return choices[Math.floor(Math.random() * choices.length)] ?? null
}
