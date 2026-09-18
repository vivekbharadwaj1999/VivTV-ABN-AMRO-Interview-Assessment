// Only the API fields consumed by the UI are modelled here; nullable data stays explicit.
export interface Show {
  id: number
  name: string
  genres: string[]
  premiered: string | null
  rating: { average: number | null }
  image: { medium: string; original: string } | null
  summary?: string | null
  language?: string | null
  status?: string | null
  runtime?: number | null
  averageRuntime?: number | null
  ended?: string | null
  network?: { name: string } | null
  webChannel?: { name: string } | null
}
