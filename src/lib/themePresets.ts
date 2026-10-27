import type { Preferences } from '../types'

export const themePresets = {
  obsidian: { theme: 'dark', textColor: '#f3f1ed', backgroundColor: '#0b0d0f', accentColor: '#ff5b57' },
  paper: { theme: 'light', textColor: '#20242a', backgroundColor: '#f7f9fb', accentColor: '#c52f31' },
  sepia: { theme: 'light', textColor: '#32291e', backgroundColor: '#f4ead4', accentColor: '#a82f2b' },
} as const satisfies Record<string, Pick<Preferences, 'theme' | 'textColor' | 'backgroundColor' | 'accentColor'>>

export type ThemePreset = keyof typeof themePresets
