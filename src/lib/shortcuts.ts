export function shouldHandleReaderShortcut(event: KeyboardEvent, panelOpen: boolean): boolean {
  if (panelOpen || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return false
  const target = event.target
  if (!(target instanceof Element)) return true
  return !target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
}

/** Single source for the reader's keyboard help. Keep in step with the handler in App. */
export const readerShortcuts: { keys: string[]; action: string }[] = [
  { keys: ['Space'], action: 'Play or pause' },
  { keys: ['←', '→'], action: 'Previous or next word' },
  { keys: ['Shift', '←/→'], action: 'Previous or next sentence' },
  { keys: ['[', ']'], action: 'Replay sentence, jump to next sentence' },
  { keys: ['↑', '↓'], action: 'Speed up or slow down by 10 WPM (1 with fine adjustment)' },
  { keys: ['Shift', '↑/↓'], action: 'Change speed by 50 WPM' },
  { keys: ['R'], action: 'Restart from the first word' },
  { keys: ['F'], action: 'Toggle fullscreen' },
  { keys: ['D'], action: 'Toggle focus mode' },
  { keys: ['?'], action: 'Show or hide this list' },
]
