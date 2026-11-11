import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Settings from '../src/components/Settings/Settings'
import { defaults } from '../src/lib/defaults'

it('offers a bundled high-legibility reading font', () => {
  const onChange = vi.fn()
  render(<Settings settings={defaults} onChange={onChange} onClose={() => {}}/>)
  fireEvent.change(screen.getByLabelText('Font family'), { target: { value: "'Atkinson Hyperlegible', Inter, system-ui, sans-serif" } })
  expect(onChange).toHaveBeenCalledWith({ fontFamily: "'Atkinson Hyperlegible', Inter, system-ui, sans-serif" })
})
