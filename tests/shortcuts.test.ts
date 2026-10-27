import { expect, it } from 'vitest'
import { shouldHandleReaderShortcut } from '../src/lib/shortcuts'

it('reserves reader shortcuts for non-editable targets without modifiers or panels', () => {
  const input = document.createElement('input')
  const button = document.createElement('button')
  const dialog = document.createElement('div')
  dialog.setAttribute('role', 'dialog')
  dialog.append(button)
  expect(shouldHandleReaderShortcut(new KeyboardEvent('keydown', { key: ' ', bubbles: true }), false)).toBe(true)
  const inputEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
  input.dispatchEvent(inputEvent)
  expect(shouldHandleReaderShortcut(inputEvent, false)).toBe(false)
  const dialogEvent = new KeyboardEvent('keydown', { key: 'r', bubbles: true })
  button.dispatchEvent(dialogEvent)
  expect(shouldHandleReaderShortcut(dialogEvent, false)).toBe(false)
  expect(shouldHandleReaderShortcut(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }), false)).toBe(false)
  expect(shouldHandleReaderShortcut(new KeyboardEvent('keydown', { key: 'f' }), true)).toBe(false)
})
