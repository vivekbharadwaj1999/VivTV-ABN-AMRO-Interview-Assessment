import { describe, expect, it } from 'vitest'
import { firstSummarySentence, summaryToText } from '../../src/utils/summary'

it('extracts the first sentence from formatted summaries without cutting at decimal points', () => {
  expect(firstSummarySentence('<p>A <b>crew</b> travels 3.5 light years. Their adventure begins.</p>'))
    .toBe('A crew travels 3.5 light years.')
  expect(firstSummarySentence('Who survives? Find out next.')).toBe('Who survives?')
  expect(firstSummarySentence(null)).toBe('')
  expect(firstSummarySentence('A story without punctuation')).toBe('A story without punctuation')
})

describe('summaryToText', () => {
  it('decodes entities and keeps paragraphs readable without rendering HTML', () => {
    expect(summaryToText('<p>A <b>great</b> show &amp; more.</p><p>Next story.</p>'))
      .toBe('A great show & more. Next story.')
  })

  it('ignores executable markup and handles missing summaries', () => {
    expect(summaryToText('<script>alert(1)</script><style>body{color:red}</style><p>Story<img src=x onerror=alert(1)></p>'))
      .toBe('Story')
    expect(summaryToText(null)).toBe('')
  })
})
