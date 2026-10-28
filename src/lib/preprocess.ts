/** Optional display-only cleanup. The document source remains in IndexedDB unchanged. */
export function prepareReadingText(source: string): string {
  return source.replace(/\r\n?/gu, '\n').replace(/\u00a0/gu, ' ').split('\n').map(line => line.replace(/^\s{0,3}#{1,6}\s+/u, '').replace(/\s+#+\s*$/u, '').replace(/[\t ]+/gu, ' ').trim()).join('\n')
}

const abbreviations = new Set(['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'st.', 'vs.', 'etc.', 'e.g.', 'i.e.'])
export function isSentenceEnd(word: string): boolean {
  const clean = word.replace(/["'”’)}\]]+$/u, '').toLowerCase()
  return /[.!?]$/u.test(clean) && !abbreviations.has(clean) && !/^\p{L}\.$/u.test(clean)
}
