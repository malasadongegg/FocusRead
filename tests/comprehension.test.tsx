import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ComprehensionCheck from '../src/components/Comprehension/ComprehensionCheck'

it('keeps reflection optional and does not persist answers', () => {
  localStorage.clear()
  const close = vi.fn()
  const { unmount } = render(<ComprehensionCheck onClose={close}/>)
  expect(screen.getByText('Finish self-check')).toBeDisabled()
  fireEvent.change(screen.getByPlaceholderText('Write a short summary'), { target: { value: 'A private summary' } })
  fireEvent.change(screen.getByLabelText('How clear was your recall?'), { target: { value: 'reread' } })
  fireEvent.click(screen.getByText('Finish self-check'))
  expect(screen.getByText(/not scored or saved/)).toBeInTheDocument()
  expect(localStorage.length).toBe(0)
  fireEvent.click(screen.getByLabelText('Close self-check'))
  expect(close).toHaveBeenCalledOnce()
  unmount()
})
