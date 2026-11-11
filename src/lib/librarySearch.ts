import type { DocumentRecord } from '../types'

export type DocumentSort = 'recent' | 'title' | 'length'
/** Every whitespace-separated term must appear in the title or text, ignoring case. */
export function searchDocuments(documents: DocumentRecord[], query: string, sort: DocumentSort = 'recent'): DocumentRecord[] {
  const terms = query.toLowerCase().split(/\s+/u).filter(Boolean)
  const matches = terms.length ? documents.filter(doc => { const haystack = `${doc.title}\n${doc.text}`.toLowerCase(); return terms.every(term => haystack.includes(term)) }) : documents.slice()
  const title = (doc: DocumentRecord) => (doc.title || 'Untitled document')
  if (sort === 'title') return matches.sort((a, b) => title(a).localeCompare(title(b), undefined, { sensitivity: 'base', numeric: true }))
  if (sort === 'length') return matches.sort((a, b) => b.text.length - a.text.length)
  return matches.sort((a, b) => b.updatedAt - a.updatedAt)
}
