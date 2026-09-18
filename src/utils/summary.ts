// Use sentence boundaries so decimal points do not cut the banner description short.
export function firstSummarySentence(summary?: string | null): string {
  const text = summaryToText(summary)
  const sentences = new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text)
  return sentences[Symbol.iterator]().next().value?.segment.trim() ?? ''
}

// Convert API markup to plain text before displaying it in cards or descriptions.
export function summaryToText(summary?: string | null): string {
  if (!summary) return ''

  // TVMaze summaries contain HTML. Render only text, never API HTML in the page.
  const document = new DOMParser().parseFromString(summary, 'text/html')
  document.querySelectorAll('script, style').forEach(element => element.remove())
  document.querySelectorAll('p, br').forEach(element => element.append(' '))
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
