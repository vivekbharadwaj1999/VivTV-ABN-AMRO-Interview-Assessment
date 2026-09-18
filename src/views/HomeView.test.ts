import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HomeView from './HomeView.vue'

afterEach(() => vi.unstubAllGlobals())

describe('dashboard loading', () => {
  it('shows loading, then renders the returned genres', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: 'Example', genres: ['Drama'], premiered: null, rating: { average: 8 }, image: null }],
    }))
    const wrapper = mount(HomeView, { global: { stubs: { RouterLink: RouterLinkStub, RouterView: true } } })
    expect(wrapper.text()).toContain('Loading your next watch')
    await flushPromises()
    expect(wrapper.text()).toContain('Drama')
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('lets the user retry after an HTTP error and handles an empty response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(HomeView, { global: { stubs: { RouterLink: RouterLinkStub, RouterView: true } } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('couldn’t load')
    await wrapper.get('.retry-button').trigger('click')
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('No shows to explore')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
