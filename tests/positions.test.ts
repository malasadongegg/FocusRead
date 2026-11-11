import { beforeEach, describe, expect, it } from 'vitest'
import { forgetPosition, positionPercent, resumablePosition, savePosition } from '../src/lib/positions'

beforeEach(() => localStorage.clear())
describe('document positions', () => {
  it('resumes only mid-document positions that match the current revision', () => {
    savePosition('a', { hash: 'h1', index: 40, total: 100, updatedAt: 1 })
    expect(resumablePosition('a', 'h1', 100)?.index).toBe(40)
    expect(resumablePosition('a', 'h2', 100)).toBeNull()
    expect(resumablePosition('a', 'h1', 120)).toBeNull()
    expect(resumablePosition('missing', 'h1', 100)).toBeNull()
    savePosition('b', { hash: 'h1', index: 0, total: 100, updatedAt: 2 })
    savePosition('c', { hash: 'h1', index: 99, total: 100, updatedAt: 3 })
    expect(resumablePosition('b', 'h1', 100)).toBeNull()
    expect(resumablePosition('c', 'h1', 100)).toBeNull()
  })
  it('forgets positions and prunes the oldest entries', () => {
    savePosition('a', { hash: 'h', index: 5, total: 50, updatedAt: 1 })
    forgetPosition('a')
    expect(resumablePosition('a', 'h', 50)).toBeNull()
    for (let i = 0; i < 205; i++) savePosition(`d${i}`, { hash: 'h', index: 5, total: 50, updatedAt: i + 10 })
    expect(resumablePosition('d0', 'h', 50)).toBeNull()
    expect(resumablePosition('d204', 'h', 50)).not.toBeNull()
  })
  it('reports progress as a percentage', () => { expect(positionPercent({ index: 50, total: 101 })).toBe(50) })
})
