import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ShowCard from '../components/ShowCard.vue'
import ShowDetailView from './ShowDetailView.vue'

const show = {
  id: 1, name: 'Example', genres: ['Drama'], premiered: null,
  rating: { average: 8 }, image: null, summary: '<p>A <b>great</b> show.</p>',
}

// Create an isolated router so navigation tests do not depend on the browser URL.
async function setup(path = '/') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { components: { ShowCard }, setup: () => ({ show }), template: '<ShowCard :show="show" />' } },
      { path: '/show/:id', name: 'show', component: ShowDetailView, props: true },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterView, { global: {
    plugins: [router],
    stubs: {
      ShowEpisodes: true,
      ShowCast: true,
      ShowHero: { props: ['show'], template: '<h1>{{ show.name }}</h1>' },
    },
  } })
  return { wrapper, router }
}

afterEach(() => vi.unstubAllGlobals())

describe('show navigation', () => {
  it('opens details on the first card click and supports returning to the dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => show }))
    const { wrapper, router } = await setup()
    expect(wrapper.get('a').attributes('href')).toBe('/show/1')
    await wrapper.get('a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/show/1')
    expect(wrapper.get('h1').text()).toBe('Example')
    expect(wrapper.get('.summary').text()).toBe('A great show.')
    expect(wrapper.find('.summary b').exists()).toBe(false)
    await wrapper.get('.back-link').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })

  it('handles a direct missing-show URL and refetches when the ID changes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ ok: true, json: async () => show })
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper, router } = await setup('/show/999')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Show not found')
    await router.push('/show/1')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Example')
    expect(fetchMock).toHaveBeenLastCalledWith('https://api.tvmaze.com/shows/1', expect.any(Object))
    wrapper.unmount()
  })

  it('offers retry on server failure', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => show }))
    const { wrapper } = await setup('/show/1')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('couldn’t load')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Example')
    wrapper.unmount()
  })

  it('rejects invalid IDs without requesting the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { wrapper } = await setup('/show/invalid')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Show not found')
    expect(fetchMock).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('switches panels with clicks and arrow keys while maintaining tab selection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => show }))
    const { wrapper } = await setup('/show/1')
    await flushPromises()
    await wrapper.get('#tab-Episodes').trigger('click')
    expect(wrapper.get('#tab-Episodes').attributes('aria-selected')).toBe('true')
    expect(wrapper.get('#panel-Overview').isVisible()).toBe(false)
    expect(wrapper.get('#panel-Episodes').isVisible()).toBe(true)
    await wrapper.get('#tab-Episodes').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('#tab-Cast').attributes('tabindex')).toBe('0')
    expect(wrapper.get('#panel-Cast').isVisible()).toBe(true)
    await wrapper.get('#tab-Cast').trigger('keydown', { key: 'Home' })
    expect(wrapper.get('#tab-Overview').attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })
})
