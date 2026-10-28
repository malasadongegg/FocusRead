export interface CalibrationQuestion { prompt: string; choices: string[]; answer: number }
export interface CalibrationPassage { id: string; title: string; text: string; questions: CalibrationQuestion[] }

export const calibrationPassages: CalibrationPassage[] = [
  { id: 'garden', title: 'The rooftop garden', text: 'A small library turned its flat roof into a garden. Volunteers planted herbs in shallow beds and collected rainwater in barrels. On summer afternoons, visitors could read in the shade and help water the plants. The garden did not replace the library. It gave neighbors another reason to gather there.', questions: [
    { prompt: 'Where was the garden built?', choices: ['Behind the library', 'On the library roof', 'Inside the library'], answer: 1 },
    { prompt: 'How did volunteers get water?', choices: ['They collected rainwater', 'They brought it from a river', 'They used a fountain'], answer: 0 },
  ] },
  { id: 'tide', title: 'A changing shoreline', text: 'At low tide, a narrow path appeared between the beach and a rocky island. A guide asked visitors to check the tide table before crossing. The path was easy to follow, but the returning water could cover it quickly. Those who wanted more time on the island took the boat instead.', questions: [
    { prompt: 'When did the path appear?', choices: ['At low tide', 'At high tide', 'Only at night'], answer: 0 },
    { prompt: 'What was the alternative to walking?', choices: ['A bridge', 'A boat', 'A train'], answer: 1 },
  ] },
]

export function calibrationResult(wordCount: number, elapsedMs: number, correct: number, total: number) {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || wordCount <= 0) throw new Error('A completed passage is required.')
  const observedWpm = Math.round(wordCount / (elapsedMs / 60000))
  const accuracy = total > 0 ? correct / total : 0
  // A cautious starting point, not a cognitive or clinical measurement.
  const recommendedWpm = Math.min(600, Math.max(100, Math.round((observedWpm * (accuracy >= .75 ? .9 : .7)) / 10) * 10))
  return { observedWpm, accuracy, recommendedWpm }
}
