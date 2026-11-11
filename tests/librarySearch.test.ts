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
import { libraryTags, normalizeTags } from '../src/lib/librarySearch'
import { isDocument } from '../src/lib/library'

describe('document tags', () => {
  const tagged: DocumentRecord[] = [{ ...docs[0], tags: ['science', 'ocean'] }, { ...docs[1], tags: ['travel'] }, docs[2]]
  it('normalizes, filters, and searches by tag', () => {
    expect(normalizeTags(' Science, ocean ,SCIENCE,, big   data ')).toEqual(['science', 'ocean', 'big data'])
    expect(normalizeTags(Array.from({ length: 15 }, (_, i) => `t${i}`).join(',')).length).toBe(10)
    expect(libraryTags(tagged)).toEqual(['ocean', 'science', 'travel'])
    expect(searchDocuments(tagged, '', 'recent', 'travel').map(d => d.id)).toEqual(['b'])
    expect(searchDocuments(tagged, 'ocean').map(d => d.id)).toEqual(['a'])
  })
  it('rejects malformed tags from imported backups but accepts older untagged documents', () => {
    expect(isDocument(docs[0])).toBe(true)
    expect(isDocument({ ...docs[0], tags: ['ok'] })).toBe(true)
    expect(isDocument({ ...docs[0], tags: [5] })).toBe(false)
    expect(isDocument({ ...docs[0], tags: 'ok' })).toBe(false)
    expect(isDocument({ ...docs[0], tags: Array(11).fill('x') })).toBe(false)
  })
})
import { findDuplicate } from '../src/lib/documentFingerprint'
describe('duplicate detection', () => {
  it('matches identical text only, and ignores the document being edited', () => {
    expect(findDuplicate(docs, 'Mountains')?.id).toBe('b')
    expect(findDuplicate(docs, 'Mountain')).toBeUndefined()
    expect(findDuplicate(docs, 'Mountains', 'b')).toBeUndefined()
    expect(findDuplicate(docs, '   ')).toBeUndefined()
  })
})
