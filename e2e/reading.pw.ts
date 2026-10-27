import { expect, test } from '@playwright/test'

test('reads, pauses, seeks, and restores a local session', async ({ page }) => {
  await page.goto('/app')
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
  await page.goto('/app')
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
  await page.goto('/app')
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
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: /Read at the speed/ })).toBeVisible()
  expect(external).toEqual([])
  const assets = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return { manifest: Boolean(document.querySelector('link[rel="manifest"]')), worker: Boolean(registration.active) }
  })
  expect(assets).toEqual({ manifest: true, worker: true })
})

test('product routes lead into the reader and survive refresh', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Read at your own pace/ })).toBeVisible()
  await page.getByRole('button', { name: 'Play demo' }).click()
  await expect(page.getByRole('button', { name: 'Pause demo' })).toBeVisible()
  await page.getByRole('tab', { name: /Chunks/ }).click()
  await expect(page.getByRole('tabpanel')).toContainText('A little context')
  await page.getByRole('link', { name: 'Start reading' }).first().click()
  await expect(page).toHaveURL(/\/app$/)
  await expect(page.getByLabel('Reading text')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Reading text')).toBeVisible()
  await page.getByRole('link', { name: 'Back to FocusRead website' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('public routes remain usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of ['/', '/features', '/progress', '/privacy', '/docs']) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true)
  }
})

test('demo advances automatically and pauses without racing ahead', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Demo speed').fill('600')
  const demo = page.getByLabel('Interactive FocusRead demonstration')
  const word = demo.locator('.demo-word')
  await expect(word).toHaveAttribute('aria-label', 'Find')
  await page.getByRole('button', { name: 'Play demo' }).click()
  await expect.poll(() => word.getAttribute('aria-label')).not.toBe('Find')
  await page.getByRole('button', { name: 'Pause demo' }).click()
  const paused = await word.getAttribute('aria-label')
  await page.waitForTimeout(300)
  await expect(word).toHaveAttribute('aria-label', paused!)
})

test('dashboard reads real local history and persists a goal', async ({ page }) => {
  await page.goto('/progress')
  await expect(page.getByText('Your history begins with a reading session.')).toBeVisible()
  await page.evaluate(async () => {
    const opened = indexedDB.open('focusread-library', 2)
    const database = await new Promise<IDBDatabase>((resolve, reject) => { opened.onsuccess = () => resolve(opened.result); opened.onerror = () => reject(opened.error); opened.onupgradeneeded = () => opened.result.createObjectStore('sessions', { keyPath: 'id' }) })
    const transaction = database.transaction('sessions', 'readwrite')
    const now = Date.now()
    const day = new Date(now).toLocaleDateString('en-CA')
    transaction.objectStore('sessions').put({ id: 'browser-history', documentId: 'draft', title: 'Actual local sample', day, startedAt: now, words: 120, activeMs: 60000 })
    await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error) })
    database.close()
  })
  await page.reload()
  await expect(page.getByText('Actual local sample')).toBeVisible()
  await expect(page.getByText('120 words', { exact: true })).toBeVisible()
  await page.getByRole('spinbutton', { name: 'Daily reading goal' }).fill('700')
  await page.reload()
  await expect(page.getByRole('spinbutton', { name: 'Daily reading goal' })).toHaveValue('700')
})

test('website navigation reaches sections without browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/features')
  await page.getByRole('link', { name: 'How it works' }).click()
  await expect(page).toHaveURL(/\/#how-it-works$/)
  await expect(page.locator('#how-it-works')).toBeInViewport()
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: /Your reading belongs/ })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: /Your reading belongs/ })).toBeVisible()
  await page.getByRole('link', { name: 'Docs', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: /Everything you need/ })).toBeVisible()
  expect(errors).toEqual([])
})
