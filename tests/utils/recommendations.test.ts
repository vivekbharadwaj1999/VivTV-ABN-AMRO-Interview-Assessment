import { expect, it } from 'vitest'
import { genrePreferences, recommendShows } from '../../src/utils/recommendations'
import type { Show } from '../../src/types/show'

const show = (id: number, genres: string[], rating: number | null = 8): Show => ({
  id, name: `Show ${id}`, genres, rating: { average: rating }, image: null, premiered: null,
})

it('counts each genre once per distinct opened show', () => {
  const history = [show(1, ['Drama', 'Drama', 'Crime']), show(1, ['Drama']), show(2, ['Drama'])]
  expect(genrePreferences(history)).toEqual([{ genre: 'Drama', count: 2 }, { genre: 'Crime', count: 1 }])
})

it('prioritises genre matches, then rating, and excludes opened or unrelated shows', () => {
  const history = [show(1, ['Drama']), show(2, ['Drama']), show(3, ['Crime'])]
  const catalogue = [history[0]!, show(4, ['Crime'], 10), show(5, ['Drama'], 8), show(6, ['Drama', 'Crime'], 6), show(7, ['Comedy']), show(8, ['Drama'], null), show(5, ['Drama'], 8)]
  const before = JSON.stringify({ history, catalogue })
  expect(recommendShows(catalogue, history).map(item => item.show.id)).toEqual([6, 5, 8, 4])
  expect(JSON.stringify({ history, catalogue })).toBe(before)
  expect(recommendShows(catalogue, [])).toEqual([])
})
