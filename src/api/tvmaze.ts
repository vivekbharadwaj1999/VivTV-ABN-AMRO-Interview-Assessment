import type { Show } from '../types/show'
import type { CastMember, Episode, ShowImage } from '../types/showDetails'

// Encode the submitted name so spaces and symbols are safe in the URL. TVMaze wraps
// each match with a score, so return just its show while keeping the relevance order.
export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query.trim())}`, { signal })
  if (!response.ok) throw new Error('Unable to search shows')
  const results: { show: Show }[] = await response.json()
  return results.map(result => result.show)
}

// Load one index page and let the dashboard group it locally by genre. This bounds the
// initial request. Search can still find shows outside this collection.
export async function getShows(): Promise<Show[]> {
  const response = await fetch('https://api.tvmaze.com/shows?page=0')

  if (!response.ok) {
    // fetch rejects network errors but not HTTP failures, so check the status explicitly.
    throw new Error(`Unable to load shows (${response.status})`)
  }

  return response.json()
}

// Return null for a missing show so the view can render its not-found state.
// Throw for other HTTP failures so the same view can offer a retry instead.
export async function getShow(id: string, signal?: AbortSignal): Promise<Show | null> {
  const response = await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}`, { signal })

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Unable to load show (${response.status})`)

  return response.json()
}

// Include specials in the single episode response. The component derives seasons and
// filters this list locally rather than requesting another list for each selection.
export async function getEpisodes(id: number, signal?: AbortSignal): Promise<Episode[]> {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}/episodes?specials=1`, { signal })
  if (!response.ok) throw new Error('Unable to load episodes')
  return response.json()
}

// Retrieve main cast entries containing both an actor and their character.
// This does not include separate guest credits from individual episodes.
export async function getCast(id: number, signal?: AbortSignal): Promise<CastMember[]> {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}/cast`, { signal })
  if (!response.ok) throw new Error('Unable to load cast')
  return response.json()
}

// Fetch optional artwork separately from the show's required information.
// The hero decides which image to use and falls back to the poster if this request fails.
export async function getShowImages(id: number, signal?: AbortSignal): Promise<ShowImage[]> {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}/images`, { signal })
  if (!response.ok) throw new Error('Unable to load artwork')
  return response.json()
}
