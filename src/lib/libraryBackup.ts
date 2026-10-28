import type { AssessmentRecord, DocumentMark, DocumentRecord, ReadingRecord } from '../types'
import { isAssessment, isDocument, isMark, isReading, type DraftRecord } from './library'

export interface LibraryBackup { format: 'focusread-library'; version: 1; exportedAt: string; documents: DocumentRecord[]; readings?: ReadingRecord[]; marks?: DocumentMark[]; assessments?: AssessmentRecord[]; draft?: DraftRecord }
export function createLibraryBackup(documents: DocumentRecord[], readings: ReadingRecord[] = [], marks: DocumentMark[] = [], assessments: AssessmentRecord[] = [], draft?: DraftRecord): string {
  return JSON.stringify({ format: 'focusread-library', version: 1, exportedAt: new Date().toISOString(), documents, readings, marks, assessments, draft } satisfies LibraryBackup, null, 2)
}
export function parseLibraryBackup(source: string): DocumentRecord[] {
  let data: unknown
  try { data = JSON.parse(source) } catch { throw new Error('This is not a valid JSON backup.') }
  if (!data || typeof data !== 'object') throw new Error('This is not a FocusRead library backup.')
  const backup = data as Partial<LibraryBackup>
  if (backup.format !== 'focusread-library' || backup.version !== 1 || !Array.isArray(backup.documents) || !backup.documents.every(isDocument)) throw new Error('This is not a supported FocusRead library backup.')
  return backup.documents
}
/** Keep the newer copy when the same document ID exists on both devices. */
export function mergeDocuments(existing: DocumentRecord[], imported: DocumentRecord[]): DocumentRecord[] {
  const merged = new Map(existing.map(document => [document.id, document]))
  for (const document of imported) if (!merged.has(document.id) || document.updatedAt >= merged.get(document.id)!.updatedAt) merged.set(document.id, document)
  return [...merged.values()]
}
/** Reading history is optional so older backups still import. Invalid entries are dropped. */
export function parseBackupReadings(source: string): ReadingRecord[] {
  try { const data = JSON.parse(source) as Partial<LibraryBackup>; return Array.isArray(data.readings) ? data.readings.filter(isReading) : [] } catch { return [] }
}
export function parseBackupMarks(source: string): DocumentMark[] {
  try { const data = JSON.parse(source) as Partial<LibraryBackup>; return Array.isArray(data.marks) ? data.marks.filter(isMark) : [] } catch { return [] }
}
export function parseBackupAssessments(source: string): AssessmentRecord[] {
  try { const data = JSON.parse(source) as Partial<LibraryBackup>; return Array.isArray(data.assessments) ? data.assessments.filter(isAssessment) : [] } catch { return [] }
}
export function parseBackupDraft(source: string): DraftRecord | undefined {
  try { const data = JSON.parse(source) as Partial<LibraryBackup>; const draft = data.draft; return draft?.id === 'current' && typeof draft.title === 'string' && typeof draft.text === 'string' && typeof draft.updatedAt === 'number' && Number.isFinite(draft.updatedAt) ? draft : undefined } catch { return undefined }
}
