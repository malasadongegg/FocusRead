import type { CalibrationPassage } from './calibration'
import { clampWpm } from './readingTime'

export const LADDER_STEP = 25
export interface RungResult { wpm: number; correct: number; total: number }

/** Distinct passages, one per rung, so a later rung never repeats a passage the reader already knows. */
export const ladderPassages: CalibrationPassage[] = [
  { id: 'bakery', title: 'Before sunrise', text: 'Every morning before sunrise, the baker mixed dough by hand. She let it rest while the oven warmed, then shaped each loaf with floured fingers. Customers lined up at seven, and the first loaves were usually gone within an hour. She kept three loaves aside for the school nearby.', questions: [
    { prompt: 'When did customers line up?', choices: ['At five', 'At seven', 'At noon'], answer: 1 },
    { prompt: 'Where did the three spare loaves go?', choices: ['To the school', 'To a neighbor', 'To the market'], answer: 0 },
  ] },
  { id: 'lighthouse', title: 'The lamp and the bell', text: 'The lighthouse keeper climbed ninety steps each evening to light the lamp. In foggy weather he also rang a bell every two minutes. Ships passing at night relied on both signals to avoid the rocks. When automatic lights arrived, the bell was moved to a small museum in town.', questions: [
    { prompt: 'How many steps did the keeper climb?', choices: ['Sixty', 'Ninety', 'One hundred'], answer: 1 },
    { prompt: 'Where did the bell end up?', choices: ['In a museum', 'On a ship', 'At the harbor'], answer: 0 },
  ] },
  { id: 'bicycles', title: 'The repair shop', text: 'A repair shop in the old market fixed bicycles for almost nothing. The owner kept spare wheels hanging from the ceiling and labeled every drawer of screws. Students often left their bikes overnight and found them tuned in the morning. He only asked that they return a used tire for recycling.', questions: [
    { prompt: 'Where were the spare wheels kept?', choices: ['Hanging from the ceiling', 'Behind the door', 'In the window'], answer: 0 },
    { prompt: 'What did the owner ask in return?', choices: ['A small fee', 'A used tire', 'A thank-you note'], answer: 1 },
  ] },
  { id: 'desert', title: 'Crossing the desert', text: 'Researchers crossing the desert traveled at dawn and dusk to avoid the midday heat. They carried water in sealed containers and marked each well on a paper map. Sandstorms sometimes forced them to wait for hours. On the fourth day, they reached a village that offered fresh bread and shade.', questions: [
    { prompt: 'When did the researchers travel?', choices: ['At noon', 'At dawn and dusk', 'Only at night'], answer: 1 },
    { prompt: 'What did the village offer?', choices: ['Fresh bread and shade', 'A new map', 'Extra water'], answer: 0 },
  ] },
  { id: 'orchestra', title: 'A borrowed gymnasium', text: 'The youth orchestra rehearsed in a gymnasium because the concert hall was being repaired. Echoes made the violins sound sharper, so the conductor moved the cellos to the front. After three weeks, the players had learned to listen more closely to one another. The final concert was held outdoors in the park.', questions: [
    { prompt: 'Why did the orchestra use a gymnasium?', choices: ['The hall was being repaired', 'It was cheaper', 'It was larger'], answer: 0 },
    { prompt: 'Where was the final concert?', choices: ['In the gym', 'Outdoors in the park', 'At a school'], answer: 1 },
  ] },
  { id: 'seeds', title: 'The seed library', text: 'A community seed library lets neighbors borrow packets of vegetable seeds for free. Gardeners return seeds from their best plants at the end of the season. Over time, the collection has adapted to the local soil. Beans and tomatoes are the most popular choices every spring.', questions: [
    { prompt: 'What do gardeners return at season end?', choices: ['Empty packets', 'Seeds from their best plants', 'Small tools'], answer: 1 },
    { prompt: 'Which seeds are most popular?', choices: ['Beans and tomatoes', 'Herbs and flowers', 'Corn and squash'], answer: 0 },
  ] },
]

export const rungWpm = (startWpm: number, rung: number) => clampWpm(startWpm + rung * LADDER_STEP)
export const isCleanPass = (result: RungResult) => result.total > 0 && result.correct === result.total
/** The ladder ends at the first rung with a missed question. The suggestion is the last clean rung, never the failed one. */
export function ladderSummary(results: RungResult[]) {
  const failed = results.findIndex(result => !isCleanPass(result))
  const clean = failed === -1 ? results : results.slice(0, failed)
  return { topCleanWpm: clean.length ? clean[clean.length - 1].wpm : null, finished: failed !== -1 || results.length >= ladderPassages.length }
}
