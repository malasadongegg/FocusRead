import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import TextEditor from '../src/components/TextEditor/TextEditor'

const noop = () => {}
const props = { title: '', tags: '', text: '', documents: [], wordCount: 0, duration: 0, libraryStatus: null, onTags: noop, onSave: noop, onOpen: noop, onDelete: noop, onStart: noop, onExport: noop, onImportBackup: noop }
it('imports a dropped file and ignores drags that carry no files', async () => {
  const onTitle = vi.fn(), onText = vi.fn(), onNotice = vi.fn()
  const { container } = render(<TextEditor {...props} onTitle={onTitle} onText={onText} onImportNotice={onNotice}/>)
  const card = container.querySelector('.editor-card')!
  const textDrag = new Event('dragover', { bubbles: true, cancelable: true })
  Object.assign(textDrag, { dataTransfer: { types: ['text/plain'] } })
  card.dispatchEvent(textDrag)
  expect(textDrag.defaultPrevented).toBe(false)
  const file = { name: 'notes.txt', size: 5, text: async () => 'hello' } as File
  fireEvent.dragOver(card, { dataTransfer: { types: ['Files'] } })
  expect(container.querySelector('.drop-hint')).not.toBeNull()
  fireEvent.drop(card, { dataTransfer: { types: ['Files'], files: [file] } })
  await waitFor(() => expect(onText).toHaveBeenCalledWith('hello'))
  expect(onTitle).toHaveBeenCalledWith('notes')
  expect(onNotice).toHaveBeenCalledWith(expect.stringContaining('Imported notes.txt'))
  expect(container.querySelector('.drop-hint')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
})

it('offers the saved copy when an imported file duplicates a library document', async () => {
  const onOpen = vi.fn()
  const saved = { id: 'x', title: 'Notes', text: 'hello', updatedAt: 1 }
  const { container } = render(<TextEditor {...props} documents={[saved]} onOpen={onOpen} onTitle={noop} onText={noop} onImportNotice={noop}/>)
  fireEvent.drop(container.querySelector('.editor-card')!, { dataTransfer: { types: ['Files'], files: [{ name: 'again.txt', size: 5, text: async () => 'hello' } as File] } })
  fireEvent.click(await screen.findByText('Open saved copy'))
  expect(onOpen).toHaveBeenCalledWith(saved)
})
