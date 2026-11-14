import { test, expect, type Page } from '@playwright/test';
async function open(page: Page) { await page.goto('/'); await page.getByRole('button', { name: '🔎 תיק בלשי קטן', exact: true }).click(); await page.getByRole('button', { name: 'פותחים בחקירה', exact: true }).click(); }
async function source(page: Page, name: string, text: string) { await page.getByRole('complementary', { name: 'מחברת החקירה' }).getByRole('button', { name, exact: true }).click(); await page.getByRole('button', { name: new RegExp(text) }).click(); await page.getByRole('button', { name: 'לחבר את הרמזים ←', exact: true }).click(); }
async function assisted(page: Page) { for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'רמז לחקירה', exact: true }).click(); await bounds(page); await page.getByRole('button', { name: 'נבדוק יחד', exact: true }).click(); }
async function bounds(page: Page) {
  await page.screenshot({ path: test.info().outputPath('latest.png') });
  expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth <= innerWidth, height: document.documentElement.scrollHeight <= innerHeight }))).toEqual({ width: true, height: true });
  const clipped = await page.locator('.detective button:visible, .detective h2:visible, .detective-paper p:visible').evaluateAll(elements => elements.flatMap(el => {
    const rect = el.getBoundingClientRect(); let parent = el.parentElement;
    if (rect.top < -1 || rect.bottom > innerHeight + 1 || rect.left < -1 || rect.right > innerWidth + 1) return [el.textContent];
    while (parent) { const style = getComputedStyle(parent), p = parent.getBoundingClientRect(); if ((/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < p.top - 2 || rect.bottom > p.bottom + 2)) || (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < p.left - 2 || rect.right > p.right + 2))) return [el.textContent]; parent = parent.parentElement; } return [];
  })); expect(clipped).toEqual([]);
}
test('supported investigation, wrong leads, persistence and parent records', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 720 }); await open(page);
  await page.getByRole('button', { name: 'הסרט בעגלה', exact: true }).click();
  await page.getByRole('button', { name: 'להראות לאבא את הסרט', exact: true }).click();
  await page.getByRole('button', { name: /הבוקר קשרתי לנוגה/ }).click();
  await page.getByRole('button', { name: 'לחבר את הרמזים ←', exact: true }).click();
  await page.getByRole('button', { name: 'נוגה, עם סרט הכוכבים', exact: true }).click(); await page.getByRole('button', { name: 'בודקים את הכיוון', exact: true }).click();
  await page.getByRole('button', { name: 'המסלול', exact: false }).click();
  await source(page, 'פנקס המשלוחים', 'היום: לקחת'); await source(page, 'הדוור', 'יצאתי אחרי');
  await page.getByRole('button', { name: 'אל האסם', exact: true }).click(); await page.getByRole('button', { name: 'בודקים את הכיוון', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('איזו נסיעה');
  await page.getByRole('button', { name: 'אל הגשר', exact: true }).click(); await page.getByRole('button', { name: 'בודקים את הכיוון', exact: true }).click();
  await page.getByRole('button', { name: 'יוצאים אל הגשר ←', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: '🔎 תיק בלשי קטן', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'החקירה מחכה לכם' })).toBeVisible(); await bounds(page);
  await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click();
  await page.getByRole('button', { name: 'מתחת לקשת', exact: true }).click(); await page.getByRole('button', { name: 'בודקים את הכיוון', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('אבנים רטובות');
  await source(page, 'הפתק של שומר הגשר', 'את השטיח הנח');
  await page.getByRole('button', { name: 'על הבמה שמעל הקשת', exact: true }).click(); await page.getByRole('button', { name: 'בודקים את הכיוון', exact: true }).click();
  await expect(page.getByText('התיק נפתר!', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  const frozen = await page.locator('canvas').screenshot();
  await page.waitForTimeout(250);
  expect(await page.locator('canvas').screenshot()).toEqual(frozen);
  await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click();
  await bounds(page);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: test.info().outputPath('noga-reveal.png') });
  await page.getByRole('button', { name: 'בחזרה לפיקניק', exact: true }).click(); await page.getByRole('button', { name: 'להורים', exact: true }).click();
  await expect(page.getByText(/קישור מבוסס טקסט/).first()).toBeVisible();
  expect(errors).toEqual([]);
});
for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) test(`assistance, keyboard, layout, pause and lab ${viewport.width}`, async ({ page }) => {
  await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await bounds(page);
  await page.getByRole('button', { name: 'לדבר עם אבא', exact: true }).click(); await bounds(page);
  await page.screenshot({ path: test.info().outputPath('reading.png') });
  await page.getByRole('button', { name: 'לחבר את הרמזים ←', exact: true }).click(); await assisted(page); await bounds(page);
  await page.getByRole('button', { name: 'המסלול', exact: false }).click(); await source(page, 'פנקס המשלוחים', 'היום: לקחת'); await bounds(page); await source(page, 'הדוור', 'יצאתי אחרי'); await bounds(page); await assisted(page); await bounds(page);
  await page.getByRole('button', { name: 'יוצאים אל הגשר ←', exact: true }).click();
  await page.getByRole('button', { name: 'מעבדת החקירה', exact: true }).click(); await bounds(page);
  await page.getByRole('checkbox', { name: 'פחות תנועה', exact: true }).check(); await page.getByRole('button', { name: 'חזרה לחקירה', exact: true }).click();
  await page.keyboard.press('Escape'); await bounds(page); await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click();
  await page.getByRole('button', { name: 'על הבמה', exact: true }).focus(); await page.keyboard.press('Enter'); await bounds(page);
  await page.getByRole('button', { name: 'בודקים את הכיוון', exact: true }).click(); await expect(page.getByText('התיק נפתר!', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  const frozen = await page.locator('canvas').screenshot();
  await page.waitForTimeout(250);
  expect(await page.locator('canvas').screenshot()).toEqual(frozen);
  await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click();
  await bounds(page);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: test.info().outputPath('exploratory-ending.png') });
});
