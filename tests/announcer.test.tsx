import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from '../src/App'

it('announces play state, mode changes, and speed changes in a polite live region', async () => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  const { container } = render(<App/>)
  const region = container.querySelector('.sr-only[aria-live="polite"]')!
  expect(region).toHaveTextContent('')
  fireEvent.change(screen.getByLabelText('Reading text'), { target: { value: 'one two three four five six' } })
  fireEvent.click(screen.getByText('Start reading'))
  await screen.findByLabelText('Play')
  fireEvent.click(screen.getByRole('tab', { name: 'Chunk' }))
  expect(region).toHaveTextContent('Chunk mode')
  fireEvent.click(screen.getByLabelText('Play'))
  await vi.waitFor(() => expect(region).toHaveTextContent('Reading'))
  fireEvent.click(screen.getByLabelText('Pause'))
  await vi.waitFor(() => expect(region).toHaveTextContent(/Paused at word \d of 6/))
  fireEvent.keyDown(window, { key: 'ArrowUp', shiftKey: true })
  await vi.waitFor(() => expect(region).toHaveTextContent('350 words per minute'))
})
