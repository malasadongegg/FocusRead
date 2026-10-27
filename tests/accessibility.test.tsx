import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Reader from '../src/components/Reader/Reader'
import { defaults } from '../src/lib/defaults'
import { tokenize } from '../src/lib/tokenizer'

it('exposes the whole RSVP word as one accessible text item', () => {
  render(<Reader tokens={tokenize('reading focus')} index={0} mode="rsvp" settings={defaults}/>)
  expect(screen.getByRole('text', { name: 'reading' })).toBeInTheDocument()
  expect(screen.getByText('d')).toHaveAttribute('aria-hidden', 'true')
})
