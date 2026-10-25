import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { tokenize } from '../src/lib/tokenizer'
import { orpIndex, splitOrp } from '../src/lib/orp'
import { msPerWord, tokenDuration } from '../src/lib/readingTime'
import { PlaybackEngine } from '../src/lib/playbackEngine'
import { readSession, writeLocal } from '../src/lib/storage'
import { defaults } from '../src/lib/defaults'
import App from '../src/App'

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) })
afterEach(() => { vi.useRealTimers() })
describe('text and focus', () => {
  it('tokenizes Unicode, punctuation and paragraphs with source offsets', () => {
    const text = '“Hello,” 世界!\n\nMore text.'
    const words = tokenize(text)
    expect(words.map(w => w.text)).toEqual(['“Hello,”', '世界!', 'More', 'text.'])
    expect(words[2].paragraphBefore).toBe(true)
    expect(text.slice(words[1].start, words[1].end)).toBe('世界!')
  })
  it('selects the documented focal letters and clamps offsets', () => {
    for (const [word, letter] of [['reading','d'],['focus','c'],['speed','e'],['computer','p']]) expect(splitOrp(word).focal).toBe(letter)
    expect(orpIndex('!a', 20)).toBe(1)
  })
  it('uses strict 60,000 / WPM timing and optional punctuation', () => {
    expect(msPerWord(300)).toBe(200)
    const words = tokenize('Hi, there.\n\nNext')
    expect(tokenDuration(words, 0, defaults)).toBe(200)
    const settings = { ...defaults, punctuation: true }
    expect(tokenDuration(words, 0, settings)).toBe(350)
    expect(tokenDuration(words, 1, settings)).toBe(1000)
  })
})
describe('deadline playback', () => {
  const make = (text = 'one two three four', overrides = {}) => {
    const listener = vi.fn()
    const engine = new PlaybackEngine({ ...defaults, ...overrides }, listener, { now: () => Date.now(), set: (fn, delay) => setTimeout(fn, delay), clear: id => clearTimeout(id) })
    engine.load(tokenize(text))
    return { engine, listener }
  }
  it.each([300,600,900,1500])('advances at %i WPM', wpm => {
    const { engine } = make('one two three', { wpm })
    engine.play(); vi.advanceTimersByTime(Math.ceil(60000 / wpm) + 1)
    expect(engine.snapshot().index).toBe(1); engine.destroy()
  })
  it('pauses, resumes without repeating, and changes speed mid-word', () => {
    const { engine } = make()
    engine.play(); vi.advanceTimersByTime(100); engine.pause()
    vi.advanceTimersByTime(1000); expect(engine.snapshot().index).toBe(0)
    engine.play(); vi.advanceTimersByTime(101); expect(engine.snapshot().index).toBe(1)
    engine.update({ ...defaults, wpm: 600 }); vi.advanceTimersByTime(101)
    expect(engine.snapshot().index).toBe(2); engine.destroy()
  })
  it('seeks, restarts, and completes after the final word duration', () => {
    const { engine } = make('one two three')
    engine.seek(2); expect(engine.snapshot().index).toBe(2)
    engine.play(); vi.advanceTimersByTime(201)
    expect(engine.snapshot()).toMatchObject({ index: 2, playing: false, complete: true })
    engine.restart(); expect(engine.snapshot()).toMatchObject({ index: 0, complete: false }); engine.destroy()
  })
  it('uses total words per minute for chunks', () => {
    const { engine } = make('one two three four five', { mode: 'chunk', chunkSize: 2 })
    engine.play(); vi.advanceTimersByTime(201); expect(engine.snapshot().index).toBe(0)
    vi.advanceTimersByTime(201); expect(engine.snapshot().index).toBe(2); engine.destroy()
  })
})
it('restores a local session', async () => {
  vi.useRealTimers()
  writeLocal('session', { documentId: 'draft', text: 'hello world', index: 1, elapsedMs: 500, updatedAt: 1 })
  expect(readSession()?.index).toBe(1)
  render(<App />)
  fireEvent.click(screen.getByText('Resume session'))
  expect(await screen.findByText('WORD 2')).toBeInTheDocument()
  expect(screen.getByLabelText('Play')).toBeInTheDocument()
})
it('keyboard shortcuts play and advance; typing remains untouched', async () => {
  vi.useRealTimers()
  render(<App />)
  fireEvent.change(screen.getByLabelText('Reading text'), { target: { value: 'one two three' } })
  fireEvent.click(screen.getByText('Start reading'))
  await screen.findByText('WORD 1')
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByText('WORD 2')).toBeInTheDocument()
  fireEvent.keyDown(window, { key: ' ' })
  expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByLabelText('Reading speed'), { key: 'ArrowRight' })
  expect(screen.getByText('WORD 2')).toBeInTheDocument()
})
