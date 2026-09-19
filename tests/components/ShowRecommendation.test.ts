import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import ShowRecommendation from '../../src/components/ShowRecommendation.vue'
import type { Show } from '../../src/types/show'

const show = (id: number, genres = ['Drama']): Show => ({ id, name: `Show ${id}`, genres, rating: { average: 8 }, image: null, premiered: null })
const history = [show(1), show(2), show(3)]

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open') } })
})
afterEach(() => {
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
  document.body.style.overflow = ''
})

async function setup(recent = history) {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/show/:id', name: 'show', component: { template: '<div />' } },
  ] })
  await router.push('/')
  const wrapper = mount(ShowRecommendation, { props: { shows: [show(4), show(5)], history: recent }, attachTo: document.body, global: { plugins: [router] } })
  if (wrapper.find('.recommend-trigger').exists()) await wrapper.get('.recommend-trigger').trigger('click')
  return { wrapper, router }
}

it('cycles picks without recording activity and closes before navigating to details', async () => {
  const { wrapper, router } = await setup()
  expect(wrapper.get('h3').text()).toBe('Show 4')
  expect(document.body.style.overflow).toBe('hidden')
  await wrapper.get('.another-button').trigger('click')
  expect(wrapper.get('h3').text()).toBe('Show 5')
  expect(history.map(item => item.id)).toEqual([1, 2, 3])
  await wrapper.get('.details-button').trigger('click')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/show/5')
  expect(wrapper.get('dialog').attributes('open')).toBeUndefined()
  expect(document.body.style.overflow).toBe('')
  wrapper.unmount()
})

it('hides the trigger until three distinct shows and recalculates when activity changes', async () => {
  const { wrapper } = await setup([show(1)])
  expect(wrapper.find('.recommend-trigger').exists()).toBe(false)
  await wrapper.setProps({ history: [show(1), show(1), show(2)] })
  expect(wrapper.find('.recommend-trigger').exists()).toBe(false)
  expect(wrapper.find('.recommend-card').exists()).toBe(false)
  await wrapper.setProps({ history })
  await wrapper.get('.recommend-trigger').trigger('click')
  expect(wrapper.get('h3').text()).toBe('Show 4')
  await wrapper.setProps({ history: [show(1), show(4), show(5)] })
  expect(wrapper.find('.recommend-card').exists()).toBe(false)
  expect(wrapper.text()).toContain('all the matching shows')
  await wrapper.get('dialog').trigger('cancel')
  expect(document.activeElement).toBe(wrapper.get('.recommend-trigger').element)
  expect(document.body.style.overflow).toBe('')
  wrapper.unmount()
})
