import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import appRouter from '../../src/router'

const show = { id: 1, name: 'Example', genres: ['Drama'], premiered: null, rating: { average: 8 }, image: null }

beforeEach(() => {
  // jsdom does not implement the browser's top layer or native focus trapping.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', '') },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute('open') },
  })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [show] }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  document.body.style.overflow = ''
})

// Create an isolated router so navigation tests do not depend on the browser URL.
async function setup(path = '/') {
  const router = createRouter({ history: createMemoryHistory(), routes: appRouter.options.routes })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(RouterView, {
    attachTo: document.body,
    global: {
      plugins: [router],
      stubs: { ShowDetailView: { props: ['id'], template: '<h1>Details for {{ id }}</h1>' } },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

it('opens details with a URL, retains the catalogue, and restores focus on close', async () => {
  const { wrapper, router } = await setup()
  const card = wrapper.get<HTMLAnchorElement>('.card-link')
  const row = wrapper.get('.show-list').element
  row.scrollLeft = 300
  card.element.focus()
  await card.trigger('click')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/show/1')
  expect(wrapper.get('dialog').attributes('open')).toBeDefined()
  expect(document.body.style.overflow).toBe('hidden')
  expect(wrapper.get('.show-list').element).toBe(row)
  expect(row.scrollLeft).toBe(300)
  await wrapper.get('.close-button').trigger('click')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
  expect(wrapper.find('dialog').exists()).toBe(false)
  expect(document.body.style.overflow).toBe('')
  expect(document.activeElement).toBe(card.element)
  expect(fetch).toHaveBeenCalledTimes(1)
  wrapper.unmount()
})

it('opens a direct show URL and handles the Escape cancel event', async () => {
  const { wrapper, router } = await setup('/show/1')
  expect(wrapper.get('dialog').attributes('open')).toBeDefined()
  await wrapper.get('dialog').trigger('cancel')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
  expect(wrapper.find('dialog').exists()).toBe(false)
  wrapper.unmount()
})

it('follows browser back and forward without refetching the catalogue', async () => {
  const { wrapper, router } = await setup()
  await wrapper.get('.card-link').trigger('click')
  await flushPromises()
  router.back()
  await flushPromises()
  expect(wrapper.find('dialog').exists()).toBe(false)
  router.forward()
  await flushPromises()
  expect(wrapper.get('dialog').attributes('open')).toBeDefined()
  expect(fetch).toHaveBeenCalledTimes(1)
  wrapper.unmount()
})
