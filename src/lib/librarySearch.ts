import type { DocumentRecord } from '../types'

export type DocumentSort = 'recent' | 'title' | 'length'
/** Comma-separated input becomes at most ten unique lowercase tags of up to 30 characters. */
export function normalizeTags(input: string): string[] {
  const tags: string[] = []
  for (const part of input.split(',')) { const tag = part.trim().replace(/\s+/gu, ' ').toLowerCase().slice(0, 30); if (tag && !tags.includes(tag)) tags.push(tag) }
  return tags.slice(0, 10)
}
export const libraryTags = (documents: DocumentRecord[]) => [...new Set(documents.flatMap(doc => doc.tags ?? []))].sort()
/** Every whitespace-separated term must appear in the title, tags, or text, ignoring case. An active tag narrows the list first. */
export function searchDocuments(documents: DocumentRecord[], query: string, sort: DocumentSort = 'recent', tag = ''): DocumentRecord[] {
  const terms = query.toLowerCase().split(/\s+/u).filter(Boolean)
  const tagged = tag ? documents.filter(doc => doc.tags?.includes(tag)) : documents
  const matches = terms.length ? tagged.filter(doc => { const haystack = `${doc.title}
${(doc.tags ?? []).join(' ')}
${doc.text}`.toLowerCase(); return terms.every(term => haystack.includes(term)) }) : tagged.slice()
  const title = (doc: DocumentRecord) => (doc.title || 'Untitled document')
  if (sort === 'title') return matches.sort((a, b) => title(a).localeCompare(title(b), undefined, { sensitivity: 'base', numeric: true }))
  if (sort === 'length') return matches.sort((a, b) => b.text.length - a.text.length)
  return matches.sort((a, b) => b.updatedAt - a.updatedAt)
}
