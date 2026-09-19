import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ShowSearch from '../../src/components/ShowSearch.vue'

afterEach(() => vi.unstubAllGlobals())
const options = { props: { query: '' }, global: { stubs: { ShowCard: { props: ['show'], template: '<p>{{ show.name }}</p>' } } } }

it('searches the API, displays matches and clears results', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [{ show: { id: 1000, name: 'A & B' } }] })
  vi.stubGlobal('fetch', fetcher)
  const wrapper = mount(ShowSearch, options)
  await wrapper.setProps({ query: ' A & B ' })
  await flushPromises()
  expect(fetcher.mock.calls[0]?.[0]).toContain('q=A%20%26%20B')
  expect(wrapper.get('li').text()).toBe('A & B')
  await wrapper.setProps({ query: '' })
  expect(wrapper.find('li').exists()).toBe(false)
  wrapper.unmount()
})

it('supports retry after an error and reports no matches', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ ok: true, json: async () => [] }))
  const wrapper = mount(ShowSearch, options)
  await wrapper.setProps({ query: 'Unknown' })
  await flushPromises()
  expect(wrapper.get('[role=alert]').text()).toContain('try again')
  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('No shows found')
  wrapper.unmount()
})

it('ignores an earlier response after a newer search completes', async () => {
  let resolveFirst!: (value: unknown) => void
  vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
    .mockResolvedValueOnce({ ok: true, json: async () => [{ show: { id: 2, name: 'New result' } }] }))
  const wrapper = mount(ShowSearch, options)
  await wrapper.setProps({ query: 'Old' })
  await wrapper.setProps({ query: 'New' })
  await flushPromises()
  resolveFirst({ ok: true, json: async () => [{ show: { id: 1, name: 'Old result' } }] })
  await flushPromises()
  expect(wrapper.get('li').text()).toBe('New result')
  wrapper.unmount()
})
