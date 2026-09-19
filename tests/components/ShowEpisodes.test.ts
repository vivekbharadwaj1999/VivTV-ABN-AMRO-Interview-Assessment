import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ShowEpisodes from '../../src/components/ShowEpisodes.vue'

afterEach(() => vi.unstubAllGlobals())

it('filters episodes by season and retains specials without numbers', async () => {
  const base = { image: null, airdate: '', runtime: null, summary: '<p>A story.</p>' }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [
    { ...base, id: 1, season: 1, number: 1, name: 'Pilot' },
    { ...base, id: 2, season: 2, number: 1, name: 'Return' },
    { ...base, id: 3, season: 2, number: null, name: 'Behind the scenes' },
  ] }))
  const wrapper = mount(ShowEpisodes, { props: { showId: 1 } })
  await flushPromises()
  expect(wrapper.text()).toContain('Pilot')
  expect(wrapper.text()).not.toContain('Return')
  await wrapper.get('select').setValue('2')
  expect(wrapper.text()).toContain('Return')
  expect(wrapper.text()).toContain('Special')
  expect(wrapper.text()).not.toContain('Pilot')
  expect(wrapper.findAll('li')).toHaveLength(2)
  wrapper.unmount()
})

it('allows retry after failure and shows an empty state', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ ok: true, json: async () => [] }))
  const wrapper = mount(ShowEpisodes, { props: { showId: 1 } })
  await flushPromises()
  expect(wrapper.get('[role="alert"]').text()).toContain("couldn't be loaded")
  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('No episodes have been listed')
  wrapper.unmount()
})
