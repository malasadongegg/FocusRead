import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Settings from '../src/components/Settings/Settings'
import { defaults } from '../src/lib/defaults'

it('focuses the dialog, wraps Tab, and closes on Escape', () => {
  const close = vi.fn()
  render(<Settings settings={defaults} onChange={() => {}} onClose={close}/>)
  expect(screen.getByRole('dialog', { name: 'Reader settings' })).toHaveAttribute('aria-modal', 'true')
  expect(screen.getByLabelText('Close settings')).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
  expect(screen.getByLabelText('Reduce motion')).toHaveFocus()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(close).toHaveBeenCalledOnce()
})
