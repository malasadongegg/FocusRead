import { calibrationPassages } from './calibration'

export function matchingSample(text: string) { return calibrationPassages.find(passage => passage.text.trim() === text.trim()) }
export function scoreSample(passageId: string, answers: number[]) {
  const passage = calibrationPassages.find(item => item.id === passageId)
  if (!passage || answers.length !== passage.questions.length || answers.some(answer => !Number.isInteger(answer))) throw new Error('Answer every question in a bundled passage.')
  return { correct: passage.questions.filter((question, index) => answers[index] === question.answer).length, total: passage.questions.length }
}
