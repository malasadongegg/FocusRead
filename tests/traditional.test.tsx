import { expect, it } from 'vitest'
import { render } from '@testing-library/react'
import TraditionalReader from '../src/components/Reader/TraditionalReader'
import { defaults } from '../src/lib/defaults'
import { tokenize } from '../src/lib/tokenizer'

it('keeps a long passage mounted while updating only the active word', () => {
  const tokens = tokenize(Array.from({ length: 3000 }, (_, i) => `word${i}`).join(' '))
  const { container, rerender } = render(<TraditionalReader tokens={tokens} index={0} settings={defaults}/>)
  const first = container.querySelector('.traditional-reader')?.firstElementChild
  expect(container.querySelectorAll('.traditional-active')).toHaveLength(1)
  rerender(<TraditionalReader tokens={tokens} index={2999} settings={defaults}/>)
  expect(container.querySelector('.traditional-reader')?.firstElementChild).toBe(first)
  expect(container.querySelectorAll('.traditional-active')).toHaveLength(1)
  expect(container.querySelector('.traditional-active')?.textContent).toBe('word2999')
})
