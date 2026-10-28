/** Fast noncryptographic identity for anchoring positions to a specific text revision. */
export function documentFingerprint(text: string): string {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619) }
  return `${text.length}-${(hash >>> 0).toString(36)}`
}
