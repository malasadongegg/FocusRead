/** Fast noncryptographic identity for anchoring positions to a specific text revision. */
export function documentFingerprint(text: string): string {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619) }
  return `${text.length}-${(hash >>> 0).toString(36)}`
}

/** Finds a saved document whose text is identical, so importing or saving twice does not create a copy. */
export function findDuplicate<T extends { id: string; text: string }>(documents: T[], text: string, ignoreId?: string): T | undefined {
  if (!text.trim()) return undefined
  const fingerprint = documentFingerprint(text)
  return documents.find(doc => doc.id !== ignoreId && doc.text.length === text.length && documentFingerprint(doc.text) === fingerprint && doc.text === text)
}
