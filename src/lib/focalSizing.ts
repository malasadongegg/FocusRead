/** Fit the full word inside both the reader lane and a narrow viewport.
 * The center grid column remains fixed, so sizing never shifts the focal anchor. */
export function focalFontSize(word: string, preferredPx: number, readerWidthPx: number): string {
  const count = Math.max(8, Array.from(word).length)
  const estimatedEmWidth = count * .65
  const readerLimit = Math.max(100, readerWidthPx - 64) / estimatedEmWidth
  const viewportLimit = 90 / estimatedEmWidth
  return `min(${preferredPx}px, ${readerLimit.toFixed(2)}px, ${viewportLimit.toFixed(2)}vw)`
}
