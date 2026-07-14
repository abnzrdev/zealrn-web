import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('zealrn-web:intro', 'seen'));
});

test('reads docs, captures a selection, and restores a page-linked note', async ({ page }) => {
  await page.goto('./#/docs/html/introduction');
  const editor = page.getByLabel('Note for current page');
  await editor.fill('Semantic HTML creates a dependable outline.');

  const paragraph = page.getByText('Choose an element for what the content is, not for how it should look. CSS handles appearance later.');
  await paragraph.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });
  await page.getByRole('button', { name: 'Add Selection' }).click();
  await expect(editor).toHaveValue(/> Choose an element/);
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'CSS' }).first().click();
  await page.getByRole('button', { name: 'HTML' }).first().click();
  await expect(editor).toHaveValue(/Semantic HTML creates a dependable outline\./);

  await page.getByRole('button', { name: 'All Notes' }).first().click();
  await page.getByLabel('Search notes').fill('dependable');
  await expect(page.getByRole('button', { name: /HTML gives content structure/ })).toBeVisible();
  await page.getByRole('button', { name: /HTML gives content structure/ }).click();
  await page.getByRole('button', { name: 'Open documentation' }).click();
  await expect(page.getByRole('heading', { name: 'HTML gives content structure' })).toBeVisible();
});

test('runs the isolated playground and captures console output', async ({ page }) => {
  await page.goto('./#/playground');
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Playground preview"]');
  await expect(preview.getByRole('heading', { name: 'Hello ZealRN' })).toBeVisible();
  await preview.getByRole('button', { name: 'Click me' }).click();
  await page.getByRole('tab', { name: /Console/ }).click();
  await expect(page.getByText('Hello from ZealRN', { exact: true })).toBeVisible();

  const sandbox = await page.locator('iframe[title="Playground preview"]').getAttribute('sandbox');
  expect(sandbox).toBe('allow-scripts');
});

test('loads cached docs, notes, and the lazy playground offline', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('zealrn-web:intro', 'seen'));
  let page = await context.newPage();
  await page.goto('./#/docs/html/introduction');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.getByLabel('Note for current page').fill('Available without a network');
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await page.close();

  await context.setOffline(true);
  page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/zealrn-web/#/docs/html/introduction');
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Note for current page')).toHaveValue('Available without a network');
  await page.getByRole('button', { name: 'Web Playground' }).first().click();
  await expect(page.getByRole('heading', { name: 'Web Playground' })).toBeVisible();
  await context.close();
});

test('supports mobile reader and current-page notes drawer', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('zealrn-web:intro', 'seen'));
  await page.goto('http://127.0.0.1:4173/zealrn-web/#/docs/html/introduction');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.getByRole('button', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Learning Notes' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Learning Notes' }).click();
  await expect(page.getByRole('heading', { name: 'HTML gives content structure' })).toBeVisible();
  await context.close();
});

test('keeps reading panels independent and restores the notes layout', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('./#/docs/html/introduction');

  const reader = page.locator('.reader-pane');
  const library = page.locator('.library-scroll');
  const notes = page.getByRole('complementary', { name: 'Learning Notes' });
  const handle = page.getByRole('separator', { name: 'Resize Learning Notes' });
  await reader.evaluate((element) => { element.scrollTop = 500; });
  await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBeGreaterThan(350);
  await expect.poll(() => library.evaluate((element) => element.scrollTop)).toBe(0);
  await expect.poll(() => library.evaluate((element) => getComputedStyle(element).overflowY)).toBe('auto');
  await expect(page.locator('body')).toHaveJSProperty('scrollHeight', 768);

  const originalWidth = (await notes.boundingBox())!.width;
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await notes.boundingBox())!.width).toBeGreaterThan(originalWidth);
  const handleBox = (await handle.boundingBox())!;
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x - 48, handleBox.y + handleBox.height / 2);
  await page.mouse.up();
  const resizedWidth = (await notes.boundingBox())!.width;
  await page.reload();
  await expect.poll(async () => (await notes.boundingBox())!.width).toBeCloseTo(resizedWidth, 0);

  const editor = page.getByLabel('Note for current page');
  await editor.fill('Draft survives panel changes');
  const readerPosition = await reader.evaluate((element) => element.scrollTop);
  await page.getByRole('button', { name: 'Collapse Learning Notes' }).click();
  await expect(page.getByRole('button', { name: 'Expand Learning Notes' })).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBe(readerPosition);
  await page.getByRole('button', { name: 'Expand Learning Notes' }).click();
  await expect(editor).toHaveValue('Draft survives panel changes');
  await page.getByRole('button', { name: 'Collapse Learning Notes' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Expand Learning Notes' })).toBeVisible();
});

test('restores reader position across views, resets on navigation, and supports focus mode', async ({ page }) => {
  await page.goto('./#/docs/html/introduction');
  const reader = page.locator('.reader-pane');
  await reader.evaluate((element) => { element.scrollTop = 600; });
  await expect(page.getByRole('button', { name: 'Scroll documentation to top' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByRole('button', { name: 'Docs' }).first().click();
  await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBeGreaterThan(500);

  await page.getByRole('button', { name: 'CSS' }).first().click();
  await expect.poll(() => reader.evaluate((element) => element.scrollTop)).toBe(0);

  await page.getByRole('button', { name: 'Focus Reading' }).click();
  await expect(page.getByRole('complementary', { name: 'Starter library' })).toBeHidden();
  await expect(page.getByRole('complementary', { name: 'Learning Notes' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Exit Focus Mode' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Starter library' })).toBeVisible();
});

test('avoids horizontal overflow across supported layouts and themes', async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./#/docs/html/introduction');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.getByLabel('Color scheme').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByLabel('Color scheme').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('has no serious axe violations in core views', async ({ page }) => {
  for (const route of ['#/docs/html/introduction', '#/notes', '#/playground', '#/storage', '#/settings']) {
    await page.goto(`./${route}`);
    const results = await new AxeBuilder({ page }).exclude('iframe').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});
