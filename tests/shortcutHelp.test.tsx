import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from '../src/App'
import { readerShortcuts } from '../src/lib/shortcuts'

it('opens the shortcut list with ? while reading and closes it with Escape', async () => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<App/>)
  fireEvent.change(screen.getByLabelText('Reading text'), { target: { value: 'one two three four five six' } })
  fireEvent.click(screen.getByText('Start reading'))
  await screen.findByLabelText('Play')
  fireEvent.keyDown(window, { key: '?', shiftKey: true })
  const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })
  expect(dialog).toHaveTextContent('Replay sentence')
  expect(readerShortcuts.length).toBeGreaterThan(8)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog', { name: 'Keyboard shortcuts' })).toBeNull()
})
