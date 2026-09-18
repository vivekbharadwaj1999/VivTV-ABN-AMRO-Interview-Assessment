import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ShowCast from './ShowCast.vue'

afterEach(() => vi.unstubAllGlobals())

it('shows actor and character names with a missing-photo fallback', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [
    { person: { id: 1, name: 'Actor Name', image: null }, character: { id: 2, name: 'Character Name' } },
  ] }))
  const wrapper = mount(ShowCast, { props: { showId: 1 } })
  await flushPromises()
  expect(wrapper.text()).toContain('Actor Name')
  expect(wrapper.text()).toContain('Character Name')
  expect(wrapper.text()).toContain('Photo unavailable')
  wrapper.unmount()
})

it('supports retry and an empty cast list', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => [] }))
  const wrapper = mount(ShowCast, { props: { showId: 1 } })
  await flushPromises()
  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('No cast information')
  wrapper.unmount()
})
