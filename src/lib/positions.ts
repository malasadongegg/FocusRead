import { readLocal, writeLocal } from './storage'

export interface SavedPosition { hash: string; index: number; total: number; updatedAt: number }
const KEY = 'positions'
const LIMIT = 200
const readAll = () => readLocal<Record<string, SavedPosition>>(KEY, {})

/** Remembers the last word per saved document, keyed by revision so edited text never resumes at a stale offset. */
export function savePosition(documentId: string, position: SavedPosition) {
  const all = { ...readAll(), [documentId]: position }
  const ids = Object.keys(all)
  if (ids.length > LIMIT) for (const id of ids.sort((a, b) => all[a].updatedAt - all[b].updatedAt).slice(0, ids.length - LIMIT)) delete all[id]
  writeLocal(KEY, all)
}
export function forgetPosition(documentId: string) {
  const all = readAll()
  if (documentId in all) { delete all[documentId]; writeLocal(KEY, all) }
}
/** A position is worth resuming only when it is mid-document and matches the current revision. */
export function resumablePosition(documentId: string, hash: string, total: number): SavedPosition | null {
  const saved = readAll()[documentId]
  if (!saved || saved.hash !== hash || saved.total !== total) return null
  return saved.index > 0 && saved.index < total - 1 ? saved : null
}
export const positionPercent = (position: Pick<SavedPosition, 'index' | 'total'>) => Math.round(position.index / Math.max(1, position.total - 1) * 100)
