import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from '../src/App'

it('starts guided practice with editor text and a visible target', async () => {
  localStorage.clear()
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  render(<App/>)
  fireEvent.click(screen.getByLabelText('Open guided practice'))
  expect(screen.getByText('Start practice')).toBeDisabled()
  fireEvent.click(screen.getByLabelText('Close practice'))
  fireEvent.change(screen.getByLabelText('Reading text'), { target: { value: 'one two three four five' } })
  fireEvent.click(screen.getByLabelText('Open guided practice'))
  fireEvent.click(screen.getByText('Start practice'))
  expect(await screen.findByText(/Practice: 350 WPM target/)).toBeInTheDocument()
  expect(screen.getByLabelText('Play')).toBeInTheDocument()
})
