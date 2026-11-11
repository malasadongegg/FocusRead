/** Optional display-only cleanup. The document source remains in IndexedDB unchanged. */
export const cleanLine = (line: string) => line.replace(/^\s{0,3}#{1,6}\s+/u, '').replace(/\s+#+\s*$/u, '').replace(/[\t ]+/gu, ' ').trim()
export function prepareReadingText(source: string): string {
  return source.replace(/\r\n?/gu, '\n').replace(/ /gu, ' ').split('\n').map(cleanLine).join('\n')
}

const abbreviations = new Set(['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'st.', 'vs.', 'etc.', 'e.g.', 'i.e.'])
export function isSentenceEnd(word: string): boolean {
  const clean = word.replace(/["'”’)}\]]+$/u, '').toLowerCase()
  return /[.!?]$/u.test(clean) && !abbreviations.has(clean) && !/^\p{L}\.$/u.test(clean)
}
