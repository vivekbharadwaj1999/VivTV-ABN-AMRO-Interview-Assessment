import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ShowCard from '../../src/components/ShowCard.vue'
import type { Show } from '../../src/types/show'

const show: Show = {
  id: 1, name: 'Example', genres: ['Drama'],
  premiered: null, rating: { average: null }, image: null,
}

describe('ShowCard', () => {
  it('provides fallbacks for missing image, rating, and premiere date', () => {
    const wrapper = mount(ShowCard, { props: { show }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.text()).toContain('Poster unavailable')
    expect(wrapper.text()).toContain('N/A')
    expect(wrapper.text()).toContain('Year unknown')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('shows a zero rating and replaces a broken poster', async () => {
    const wrapper = mount(ShowCard, { props: { show: {
      ...show, rating: { average: 0 }, premiered: '2020-04-05',
      image: { medium: 'https://example.com/poster.jpg', original: 'https://example.com/poster.jpg' },
    } }, global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.text()).toContain('0.0')
    expect(wrapper.text()).toContain('2020')
    await wrapper.get('img').trigger('error')
    expect(wrapper.text()).toContain('Poster unavailable')
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
