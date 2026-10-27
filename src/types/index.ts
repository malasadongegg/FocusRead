export type Mode = 'rsvp' | 'chunk' | 'traditional'
export type Theme = 'dark' | 'light' | 'system'
export type AudioProfile = 'silence' | 'white' | 'pink' | 'brown' | 'rain'
export type PaceMode = 'fixed' | 'ramp' | 'adaptive'
export interface PracticeGoal { wpm: number; minutes: number }
export interface Token { text: string; start: number; end: number; paragraphBefore: boolean }
export interface Preferences {
  wpm: number; fineSpeed: boolean; mode: Mode; chunkSize: number; theme: Theme; paceMode: PaceMode; rampUpWords: number;
  fontFamily: string; fontSize: number; fontWeight: number; textColor: string; accentColor: string; backgroundColor: string;
  orpEnabled: boolean; orpOffset: number; focalScale: number; verticalGuide: boolean; horizontalGuides: boolean;
  punctuation: boolean; commaPause: number; sentencePause: number; paragraphPause: number;
  readerWidth: number; fullscreenPreference: boolean; reducedMotion: boolean; countdownSeconds: number;
  audioProfile: AudioProfile; audioVolume: number; audioMuted: boolean; audioPauseWithReading: boolean; audioTimerMinutes: number; dailyGoalWords: number;
}
export interface DocumentRecord { id: string; title: string; text: string; updatedAt: number }
export interface Session { documentId: string; index: number; elapsedMs: number; updatedAt: number; title?: string; text?: string; complete?: boolean }
export interface ReadingRecord { id: string; documentId: string; title: string; day: string; startedAt: number; words: number; activeMs: number }
