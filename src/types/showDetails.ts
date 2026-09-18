// Only the API fields consumed by the UI are modelled here; nullable data stays explicit.
export interface Episode {
  id: number
  name: string
  season: number
  number: number | null
  airdate: string
  runtime: number | null
  summary: string | null
  image: { medium: string; original: string } | null
}

export interface CastMember {
  person: { id: number; name: string; image: { medium: string; original: string } | null }
  character: { id: number; name: string }
}

export interface ShowImage {
  id: number
  type: string | null
  main: boolean
  resolutions: { original: { url: string; width: number; height: number } }
}
