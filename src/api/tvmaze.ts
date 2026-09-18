import type { Show } from '../types/show'
import type { CastMember, Episode, ShowImage } from '../types/showDetails'

// Search the full catalogue and preserve the API's relevance order.
export async function searchShows(query: string, signal?: AbortSignal): Promise<Show[]> {
  const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query.trim())}`, { signal })
  if (!response.ok) throw new Error('Unable to search shows')
  const results: { show: Show }[] = await response.json()
  return results.map(result => result.show)
}

// Keep the dashboard request bounded; search can find shows outside this first page.
export async function getShows(): Promise<Show[]> {
  const response = await fetch('https://api.tvmaze.com/shows?page=0')

  if (!response.ok) {
    throw new Error(`Unable to load shows (${response.status})`)
  }

  return response.json()
}

// A missing show is a normal empty state, while other HTTP errors can be retried.
export async function getShow(id: string, signal?: AbortSignal): Promise<Show | null> {
  const response = await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}`, { signal })

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Unable to load show (${response.status})`)

  return response.json()
}

// Include specials so the episode list does not silently omit them.
export async function getEpisodes(id: number, signal?: AbortSignal): Promise<Episode[]> {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}/episodes?specials=1`, { signal })
  if (!response.ok) throw new Error('Unable to load episodes')
  return response.json()
}

// Retrieve the show's main cast rather than individual episode guest appearances.
export async function getCast(id: number, signal?: AbortSignal): Promise<CastMember[]> {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}/cast`, { signal })
  if (!response.ok) throw new Error('Unable to load cast')
  return response.json()
}

// Artwork is fetched separately so it can fail without blocking show information.
export async function getShowImages(id: number, signal?: AbortSignal): Promise<ShowImage[]> {
  const response = await fetch(`https://api.tvmaze.com/shows/${id}/images`, { signal })
  if (!response.ok) throw new Error('Unable to load artwork')
  return response.json()
}
