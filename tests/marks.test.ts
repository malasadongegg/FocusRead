import { beforeEach, expect, it } from 'vitest'
import { closeLibrary, deleteMark, listMarks, putMark, putDocument } from '../src/lib/library'
import { documentFingerprint } from '../src/lib/documentFingerprint'

beforeEach(async () => { await closeLibrary(); await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase('focusread-library'); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error) }) })

it('upgrades a document library and anchors marks to the correct text revision', async () => {
  await new Promise<void>((resolve, reject) => { const request = indexedDB.open('focusread-library', 2); request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'id' }); request.onsuccess = () => { request.result.close(); resolve() }; request.onerror = () => reject(request.error) })
  await putDocument({ id: 'doc', title: 'Document', text: 'One two three', updatedAt: 1 })
  const sourceHash = documentFingerprint('One two three')
  const mark = { id: 'mark-1', documentId: 'doc', sourceHash, index: 2, kind: 'bookmark' as const, label: 'Third word', createdAt: 1 }
  await putMark(mark)
  expect(await listMarks('doc', sourceHash)).toEqual([mark])
  expect(await listMarks('doc', documentFingerprint('Revised text'))).toEqual([])
  await deleteMark(mark.id)
  expect(await listMarks('doc', sourceHash)).toEqual([])
})

it('stores an annotation at its word index without copying document text', async () => {
  const mark = { id: 'note-1', documentId: 'draft', sourceHash: documentFingerprint('Read this'), index: 1, kind: 'annotation' as const, label: 'this', note: 'Compare with earlier chapter', createdAt: 2 }
  await putMark(mark)
  expect(await listMarks('draft', mark.sourceHash)).toEqual([mark])
  expect(JSON.stringify((await listMarks('draft', mark.sourceHash))[0])).not.toContain('Read this')
})

it('indexes marks created by an older database version without removing them', async () => {
  const mark = { id: 'legacy-note', documentId: 'doc', sourceHash: 'revision', index: 3, kind: 'annotation' as const, label: 'word', createdAt: 1 }
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('focusread-library', 4)
    request.onupgradeneeded = () => request.result.createObjectStore('marks', { keyPath: 'id' })
    request.onsuccess = () => { const db = request.result; const tx = db.transaction('marks', 'readwrite'); tx.objectStore('marks').put(mark); tx.oncomplete = () => { db.close(); resolve() }; tx.onerror = () => reject(tx.error) }
    request.onerror = () => reject(request.error)
  })
  expect(await listMarks('doc', 'revision')).toEqual([mark])
})
