import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Settings from '../src/components/Settings/Settings'
import { defaults } from '../src/lib/defaults'
import { readPreferences, writeLocal } from '../src/lib/storage'

it('applies a readable preset and keeps it in existing preferences storage', () => {
  localStorage.clear()
  const change = vi.fn(patch => writeLocal('preferences', { ...defaults, ...patch }))
  render(<Settings settings={defaults} onChange={change} onClose={() => {}}/>)
  fireEvent.click(screen.getByRole('button', { name: 'sepia' }))
  expect(change).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light', backgroundColor: '#f4ead4' }))
  expect(readPreferences(defaults).backgroundColor).toBe('#f4ead4')
})
