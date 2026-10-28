import { beforeEach, expect, it } from 'vitest'
import { defaults } from '../src/lib/defaults'
import { captureProfile, exportProfiles, importProfiles, readProfiles, saveProfiles } from '../src/lib/profiles'

beforeEach(() => localStorage.clear())
it('captures, persists, and exports named reader settings without documents', () => {
  const settings = captureProfile({ ...defaults, wpm: 450, mode: 'chunk' })
  const profile = { id: 'fast', name: 'Fast articles', settings, createdAt: 1 }
  expect(saveProfiles([profile])).toBe(true)
  expect(readProfiles()).toEqual([profile])
  expect(importProfiles(exportProfiles([profile]))).toEqual([profile])
  expect(exportProfiles([profile])).not.toContain('document')
  expect(() => importProfiles('{bad')).toThrow()
})
