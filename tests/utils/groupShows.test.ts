import { describe, expect, it } from 'vitest'
import type { Show } from '../../src/types/show'
import { groupShowsByGenre } from '../../src/utils/groupShows'

const show: Show = {
  id: 1, name: 'Example', genres: ['Drama', 'Comedy'],
  premiered: null, rating: { average: 8 }, image: null,
}

describe('groupShowsByGenre', () => {
  it('includes a show in each genre and orders genres alphabetically', () => {
    expect(groupShowsByGenre([show])).toEqual([
      { genre: 'Comedy', shows: [show] },
      { genre: 'Drama', shows: [show] },
    ])
  })

  it('sorts ratings descending, breaks ties by name, and puts null after zero', () => {
    const shows = [
      { ...show, id: 2, name: 'Unrated', rating: { average: null } },
      { ...show, id: 3, name: 'Zero', rating: { average: 0 } },
      { ...show, id: 4, name: 'Zulu', rating: { average: 9 } },
      { ...show, id: 5, name: 'Alpha', rating: { average: 9 } },
      show,
    ]
    const original = structuredClone(shows)
    expect(groupShowsByGenre(shows)[0]?.shows.map(show => show.name))
      .toEqual(['Alpha', 'Zulu', 'Example', 'Zero', 'Unrated'])
    expect(shows).toEqual(original)
  })

  it('handles an empty catalogue and shows without genres', () => {
    expect(groupShowsByGenre([])).toEqual([])
    expect(groupShowsByGenre([{ ...show, genres: [] }])).toEqual([])
  })
})
