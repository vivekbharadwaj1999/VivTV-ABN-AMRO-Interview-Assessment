import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ShowHero from '../../src/components/ShowHero.vue'

const show = { id: 1, name: 'Example', genres: [], premiered: null, rating: { average: null }, image: null }
afterEach(() => vi.unstubAllGlobals())

it('prefers background artwork and falls back when the image fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [
    { type: 'poster', resolutions: { original: { url: '/poster.jpg' } } },
    { type: 'background', resolutions: { original: { url: '/background.jpg' } } },
  ] }))
  const wrapper = mount(ShowHero, { props: { show } })
  await flushPromises()
  expect(wrapper.get('.backdrop').attributes('src')).toBe('/background.jpg')
  await wrapper.get('.backdrop').trigger('error')
  expect(wrapper.text()).toContain('Poster unavailable')
  expect(wrapper.get('h1').text()).toBe('Example')
  wrapper.unmount()
})

it('keeps show information visible if optional artwork fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')))
  const wrapper = mount(ShowHero, { props: { show } })
  await flushPromises()
  expect(wrapper.get('h1').text()).toBe('Example')
  expect(wrapper.text()).toContain('Not rated')
  wrapper.unmount()
})
