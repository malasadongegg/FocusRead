import type { AssessmentRecord, DocumentMark, DocumentRecord, ReadingRecord, Session } from '../types'
import { readSession, writeLocal } from './storage'

const DATABASE = 'focusread-library'
const DOCUMENTS = 'documents'
const DRAFTS = 'drafts'
const SESSIONS = 'sessions'
const MARKS = 'marks'
const ASSESSMENTS = 'assessments'
let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 5)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(DOCUMENTS)) database.createObjectStore(DOCUMENTS, { keyPath: 'id' })
      if (!database.objectStoreNames.contains(DRAFTS)) database.createObjectStore(DRAFTS, { keyPath: 'id' })
      if (!database.objectStoreNames.contains(SESSIONS)) database.createObjectStore(SESSIONS, { keyPath: 'id' })
      const marks = database.objectStoreNames.contains(MARKS) ? request.transaction!.objectStore(MARKS) : database.createObjectStore(MARKS, { keyPath: 'id' })
      if (!marks.indexNames.contains('byDocumentRevision')) marks.createIndex('byDocumentRevision', ['documentId', 'sourceHash'])
      if (!database.objectStoreNames.contains(ASSESSMENTS)) database.createObjectStore(ASSESSMENTS, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local library'))
    request.onblocked = () => reject(new Error('Close other FocusRead tabs, then try again'))
  }).catch(error => { databasePromise = null; throw error })
  return databasePromise!
}

function transact<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore, setResult: (value: T) => void) => void): Promise<T> {
  return openDatabase().then(database => new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode)
    let result: T
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error ?? new Error('Local library operation failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Local library operation was cancelled'))
    action(transaction.objectStore(storeName), value => { result = value })
  }))
}

export const listDocuments = () => transact<DocumentRecord[]>(DOCUMENTS, 'readonly', (store, setResult) => {
  const request = store.getAll()
  request.onsuccess = () => setResult(request.result as DocumentRecord[])
})
export const getDocument = (id: string) => transact<DocumentRecord | undefined>(DOCUMENTS, 'readonly', (store, setResult) => {
  const request = store.get(id)
  request.onsuccess = () => setResult(request.result as DocumentRecord | undefined)
})
export const putDocument = (document: DocumentRecord) => transact<void>(DOCUMENTS, 'readwrite', store => { store.put(document) })
export const deleteDocument = (id: string) => transact<void>(DOCUMENTS, 'readwrite', store => { store.delete(id) })
export const putDocuments = (documents: DocumentRecord[]) => transact<void>(DOCUMENTS, 'readwrite', store => { documents.forEach(document => store.put(document)) })

export const listReadings = () => transact<ReadingRecord[]>(SESSIONS, 'readonly', (store, setResult) => {
  const request = store.getAll()
  request.onsuccess = () => setResult(request.result as ReadingRecord[])
})
export const putReadings = (records: ReadingRecord[]) => transact<void>(SESSIONS, 'readwrite', store => { records.forEach(record => store.put(record)) })
export const clearReadings = () => transact<void>(SESSIONS, 'readwrite', store => { store.clear() })
export const listMarks = (documentId: string, sourceHash: string) => transact<DocumentMark[]>(MARKS, 'readonly', (store, setResult) => {
  const request = store.index('byDocumentRevision').getAll([documentId, sourceHash])
  request.onsuccess = () => setResult((request.result as DocumentMark[]).sort((a, b) => a.index - b.index))
})
export const putMark = (mark: DocumentMark) => transact<void>(MARKS, 'readwrite', store => { store.put(mark) })
export const deleteMark = (id: string) => transact<void>(MARKS, 'readwrite', store => { store.delete(id) })
export const listAllMarks = () => transact<DocumentMark[]>(MARKS, 'readonly', (store, setResult) => { const request = store.getAll(); request.onsuccess = () => setResult(request.result as DocumentMark[]) })
export const putMarks = (marks: DocumentMark[]) => transact<void>(MARKS, 'readwrite', store => { marks.forEach(mark => store.put(mark)) })
export const listAssessments = () => transact<AssessmentRecord[]>(ASSESSMENTS, 'readonly', (store, setResult) => { const request = store.getAll(); request.onsuccess = () => setResult(request.result as AssessmentRecord[]) })
export const putAssessment = (record: AssessmentRecord) => transact<void>(ASSESSMENTS, 'readwrite', store => { store.put(record) })
export const putAssessments = (records: AssessmentRecord[]) => transact<void>(ASSESSMENTS, 'readwrite', store => { records.forEach(record => store.put(record)) })
export function isMark(value: unknown): value is DocumentMark {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.documentId === 'string' && typeof item.sourceHash === 'string' && typeof item.index === 'number' && Number.isInteger(item.index) && item.index >= 0 && (item.kind === 'bookmark' || item.kind === 'annotation') && typeof item.label === 'string' && (item.note === undefined || typeof item.note === 'string') && typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)
}
export function isAssessment(value: unknown): value is AssessmentRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.documentId === 'string' && typeof item.passageId === 'string' && (item.readingId === undefined || typeof item.readingId === 'string') && (item.observedWpm === undefined || typeof item.observedWpm === 'number' && Number.isFinite(item.observedWpm) && item.observedWpm > 0) && [item.selectedWpm, item.correct, item.total, item.completedAt].every(number => typeof number === 'number' && Number.isFinite(number) && number >= 0) && (item.correct as number) <= (item.total as number)
}
export function isReading(value: unknown): value is ReadingRecord {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return typeof r.id === 'string' && r.id.length > 0 && typeof r.documentId === 'string' && typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && typeof r.title === 'string' && (r.completed === undefined || typeof r.completed === 'boolean') && [r.startedAt, r.words, r.activeMs].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)
}

export interface DraftRecord { id: 'current'; title: string; text: string; updatedAt: number }
export const putDraft = (draft: Omit<DraftRecord, 'id'>) => transact<void>(DRAFTS, 'readwrite', store => { store.put({ ...draft, id: 'current' }) })
export const getDraft = () => transact<DraftRecord | undefined>(DRAFTS, 'readonly', (store, setResult) => {
  const request = store.get('current')
  request.onsuccess = () => setResult(request.result as DraftRecord | undefined)
})

export function isDocument(value: unknown): value is DocumentRecord {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && item.id.length > 0 && typeof item.title === 'string' && typeof item.text === 'string' && typeof item.updatedAt === 'number' && Number.isFinite(item.updatedAt)
}

/** One-time migration from the original LocalStorage library and text-bearing session. */
export async function migrateLegacyLibrary(): Promise<void> {
  const key = 'focusread.v1.documents'
  let legacy: unknown = null
  try { const raw = localStorage.getItem(key); legacy = raw ? JSON.parse(raw) : null } catch { /* Leave damaged legacy data untouched. */ }
  const records = Array.isArray(legacy) ? legacy.filter(isDocument) : []
  const session = readSession()
  if (records.length) {
    const existing = new Set((await listDocuments()).map(document => document.id))
    await putDocuments(records.filter(document => !existing.has(document.id)))
  }
  if (session?.text) {
    if (session.documentId === 'draft') await putDraft({ title: session.title ?? '', text: session.text, updatedAt: session.updatedAt })
    else if (!(await getDocument(session.documentId))) await putDocument({ id: session.documentId, title: session.title ?? 'Untitled document', text: session.text, updatedAt: session.updatedAt })
    const lightweight: Session = { documentId: session.documentId, index: session.index, elapsedMs: session.elapsedMs, updatedAt: session.updatedAt, complete: session.complete }
    if (!writeLocal('session', lightweight)) throw new Error('Could not migrate reading progress')
  }
  if (Array.isArray(legacy)) localStorage.removeItem(key)
}

/** Close the cached connection when the app or a test no longer needs it. */
export async function closeLibrary(): Promise<void> {
  const current = databasePromise
  databasePromise = null
  if (current) (await current).close()
}
