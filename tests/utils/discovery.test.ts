import { afterEach, expect, it, vi } from 'vitest'
import { addRecent, pickFeatured, topRated } from '../../src/utils/discovery'
import type { Show } from '../../src/types/show'

const show = (id: number, rating: number | null = id): Show => ({
  id, name: `Show ${id}`, rating: { average: rating }, genres: [], image: null, premiered: null,
})
afterEach(() => vi.restoreAllMocks())

it('returns the ten highest rated shows without changing the input', () => {
  const shows = Array.from({ length: 12 }, (_, i) => show(i + 1))
  shows.push(show(13, null))
  expect(topRated(shows).map(s => s.id)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3])
  expect(shows[0]?.id).toBe(1)
})

it('moves reopened shows to the front and limits history to ten unique shows', () => {
  const shows = Array.from({ length: 10 }, (_, i) => show(i + 1))
  expect(addRecent(shows, show(5)).map(s => s.id)).toEqual([5, 1, 2, 3, 4, 6, 7, 8, 9, 10])
  expect(addRecent(shows, show(11)).map(s => s.id)).toEqual([11, 1, 2, 3, 4, 5, 6, 7, 8, 9])
})

it('randomly picks another banner and handles a single or empty collection', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  expect(pickFeatured([show(1), show(2)], 1)?.id).toBe(2)
  expect(pickFeatured([show(1)], 1)?.id).toBe(1)
  expect(pickFeatured([], null)).toBeNull()
})
