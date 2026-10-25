import { beforeEach, describe, expect, it } from 'vitest'
import { closeLibrary, deleteDocument, getDocument, getDraft, listDocuments, migrateLegacyLibrary, putDocument, putDraft } from '../src/lib/library'
import { createLibraryBackup, mergeDocuments, parseLibraryBackup } from '../src/lib/libraryBackup'
import { readSession, writeLocal } from '../src/lib/storage'
import type { DocumentRecord } from '../src/types'

const first: DocumentRecord = { id: 'one', title: 'First', text: 'A private reading.', updatedAt: 10 }
const second: DocumentRecord = { id: 'two', title: 'Second', text: 'Another text.', updatedAt: 20 }
beforeEach(async () => {
  localStorage.clear()
  await closeLibrary()
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('focusread-library')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
})

describe('IndexedDB library', () => {
  it('stores, lists, updates, and deletes documents', async () => {
    await putDocument(first)
    expect(await getDocument('one')).toEqual(first)
    await putDocument({ ...first, text: 'Updated' })
    expect((await listDocuments())[0].text).toBe('Updated')
    await deleteDocument('one')
    expect(await listDocuments()).toEqual([])
  })
  it('migrates legacy documents and draft text without losing progress', async () => {
    writeLocal('documents', [first])
    writeLocal('session', { documentId: 'draft', text: 'A draft', title: 'Draft', index: 2, elapsedMs: 1200, updatedAt: 10 })
    await migrateLegacyLibrary()
    expect(await getDocument('one')).toEqual(first)
    expect(await getDraft()).toMatchObject({ title: 'Draft', text: 'A draft' })
    expect(readSession()).toMatchObject({ documentId: 'draft', index: 2, elapsedMs: 1200 })
    expect(readSession()).not.toHaveProperty('text')
    expect(localStorage.getItem('focusread.v1.documents')).toBeNull()
    await migrateLegacyLibrary()
    expect(await listDocuments()).toHaveLength(1)
  })
  it('keeps a separate resumable draft in IndexedDB', async () => {
    await putDraft({ title: 'Draft', text: 'Sensitive local text', updatedAt: 1 })
    writeLocal('session', { documentId: 'draft', index: 1, elapsedMs: 100, updatedAt: 1 })
    expect(await getDraft()).toMatchObject({ text: 'Sensitive local text' })
    expect(localStorage.getItem('focusread.v1.session')).not.toContain('Sensitive local text')
  })
})

describe('library backup', () => {
  it('exports and parses a versioned JSON backup', () => {
    const backup = createLibraryBackup([first, second])
    expect(parseLibraryBackup(backup)).toEqual([first, second])
    expect(() => parseLibraryBackup('{invalid')).toThrow('valid JSON')
    expect(() => parseLibraryBackup(JSON.stringify({ format: 'focusread-library', version: 2, documents: [] }))).toThrow('supported')
  })
  it('merges by ID and preserves the newer local document', () => {
    const imported = [{ ...first, text: 'Old backup', updatedAt: 5 }, second]
    expect(mergeDocuments([first], imported)).toEqual([first, second])
  })
})
