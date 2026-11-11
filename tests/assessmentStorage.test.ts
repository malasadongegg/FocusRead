import { beforeEach, expect, it } from 'vitest'
import { closeLibrary, listAssessments, listDocuments, putAssessment, putDocument } from '../src/lib/library'

beforeEach(async () => { await closeLibrary(); await new Promise<void>((resolve, reject) => { const request = indexedDB.deleteDatabase('focusread-library'); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error) }) })

it('keeps existing documents while adding local quiz results', async () => {
  await putDocument({ id: 'one', title: 'Local', text: 'Private text', updatedAt: 1 })
  const record = { id: 'a1', documentId: 'one', passageId: 'garden', selectedWpm: 300, correct: 2, total: 2, completedAt: 50 }
  await putAssessment(record)
  expect(await listAssessments()).toEqual([record])
  expect(await listDocuments()).toMatchObject([{ id: 'one', text: 'Private text' }])
  expect(JSON.stringify(await listAssessments())).not.toContain('Private text')
})
