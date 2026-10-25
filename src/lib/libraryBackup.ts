import type { DocumentRecord } from '../types'
import { isDocument } from './library'

export interface LibraryBackup { format: 'focusread-library'; version: 1; exportedAt: string; documents: DocumentRecord[] }
export function createLibraryBackup(documents: DocumentRecord[]): string {
  return JSON.stringify({ format: 'focusread-library', version: 1, exportedAt: new Date().toISOString(), documents } satisfies LibraryBackup, null, 2)
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
