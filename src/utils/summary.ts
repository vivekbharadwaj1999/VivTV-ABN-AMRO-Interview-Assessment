// Convert markup to text first, then take the first English sentence segment.
// Sentence boundaries handle decimal points better than splitting on every full stop.
export function firstSummarySentence(summary?: string | null): string {
  const text = summaryToText(summary)
  const sentences = new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text)
  return sentences[Symbol.iterator]().next().value?.segment.trim() ?? ''
}

// Parse the API markup in a separate document, remove unwanted content and extract text.
// Adding spaces at paragraph and break boundaries avoids joining words when tags disappear.
export function summaryToText(summary?: string | null): string {
  if (!summary) return ''

  // TVMaze summaries contain HTML. Render only text, never API HTML in the page.
  const document = new DOMParser().parseFromString(summary, 'text/html')
  document.querySelectorAll('script, style').forEach(element => element.remove())
  document.querySelectorAll('p, br').forEach(element => element.append(' '))
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
