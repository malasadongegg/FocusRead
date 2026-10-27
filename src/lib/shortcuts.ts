export function shouldHandleReaderShortcut(event: KeyboardEvent, panelOpen: boolean): boolean {
  if (panelOpen || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false
  const target = event.target
  if (!(target instanceof Element)) return true
  return !target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
}
