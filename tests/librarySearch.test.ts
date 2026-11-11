import { describe, expect, it } from 'vitest'
import { searchDocuments } from '../src/lib/librarySearch'
import type { DocumentRecord } from '../src/types'

const docs: DocumentRecord[] = [
  { id: 'a', title: 'Chapter 10', text: 'Whales and oceans', updatedAt: 1 },
  { id: 'b', title: 'Chapter 2', text: 'Mountains', updatedAt: 3 },
  { id: 'c', title: '', text: 'A much longer note about whales, harbors and many other things', updatedAt: 2 },
]
describe('library search', () => {
  it('requires every term in the title or text, ignoring case', () => {
    expect(searchDocuments(docs, 'WHALES').map(d => d.id)).toEqual(['c', 'a'])
    expect(searchDocuments(docs, 'whales ocean').map(d => d.id)).toEqual(['a'])
    expect(searchDocuments(docs, 'chapter mountains').map(d => d.id)).toEqual(['b'])
    expect(searchDocuments(docs, 'nothing')).toEqual([])
  })
  it('sorts by recency, natural title order, or length without mutating input', () => {
    const copy = [...docs]
    expect(searchDocuments(docs, '').map(d => d.id)).toEqual(['b', 'c', 'a'])
    expect(searchDocuments(docs, '', 'title').map(d => d.id)).toEqual(['b', 'a', 'c'])
    expect(searchDocuments(docs, '', 'length').map(d => d.id)).toEqual(['c', 'a', 'b'])
    expect(docs).toEqual(copy)
  })
})
