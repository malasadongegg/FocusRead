import { expect, test } from '@playwright/test'

test('reads, pauses, seeks, and restores a local session', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Document title').fill('Browser regression')
  await page.getByLabel('Reading text').fill(Array.from({ length: 60 }, (_, i) => `word${i}`).join(' '))
  await page.getByLabel('Exact WPM').fill('600')
  await page.getByRole('button', { name: 'Start reading' }).click()
  await expect(page.getByText('WORD 1')).toBeVisible()
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  const progress = page.getByLabel('Reading progress')
  await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const pausedIndex = Number(await progress.inputValue())
  await page.getByRole('button', { name: 'Next word' }).click()
  await expect(progress).toHaveValue(String(pausedIndex + 1))
  await page.reload()
  await page.getByRole('button', { name: /Resume session/ }).click()
  await expect(page.getByLabel('Reading progress')).toHaveValue(String(pausedIndex + 1))
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})

test('loads the installed app shell without a network connection', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Read at the speed/ })).toBeVisible()
  await context.setOffline(false)
})

test('keeps the focal anchor fixed for long words on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByLabel('Reading text').fill('read extraordinarilylongunbrokenword')
  await page.getByRole('button', { name: 'Start reading' }).click()
  const focal = page.locator('.focus-letter')
  const first = await focal.boundingBox()
  await page.getByRole('button', { name: 'Next word' }).click()
  const second = await focal.boundingBox()
  expect(first).not.toBeNull()
  expect(second).not.toBeNull()
  expect(Math.abs(first!.x + first!.width / 2 - second!.x - second!.width / 2)).toBeLessThan(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('serves the app shell for a direct navigation and keeps assets local', async ({ page }) => {
  const external: string[] = []
  page.on('request', request => { if (!new URL(request.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) external.push(request.url()) })
  await page.goto('/reader')
  await expect(page.getByRole('heading', { name: /Read at the speed/ })).toBeVisible()
  expect(external).toEqual([])
  const assets = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return { manifest: Boolean(document.querySelector('link[rel="manifest"]')), worker: Boolean(registration.active) }
  })
  expect(assets).toEqual({ manifest: true, worker: true })
})
