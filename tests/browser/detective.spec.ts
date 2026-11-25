import { test, expect, type Page, type Locator } from '@playwright/test';
import { adventureInteractions, evidenceText, type InteractionId } from '../../src/content/detective';

async function open(page: Page) {
  await page.goto('/?edition=farm'); await page.getByRole('button', { name: '🔎 תיק בלשי קטן', exact: true }).click();
  await bounds(page); await page.screenshot({ path: test.info().outputPath('adventure-intro.png') });
  await page.getByRole('button', { name: 'פותחים בחקירה', exact: true }).click();
}
async function close(page: Page) { await page.getByRole('button', { name: 'סגירה וחזרה למפה', exact: true }).click(); }
const spotNames: Record<InteractionId, string> = { sheep: 'הכבשה בחצר', dad: 'לדבר עם אבא', postman: 'לשאול את הדוור', ribbon: 'הסרט בעגלה', tracks: 'עקבות הקמח', book: 'פנקס המשלוחים', basket: 'הסל של פיצי', note: 'הפתק של השומר', lower: 'מתחת לקשת', curtain: 'המחיצה על הבמה' };
async function inspect(page: Page, id: InteractionId, pins: string[] = [], pickup?: string) {
  await page.getByRole('button', { name: spotNames[id], exact: true }).click();
  const lines = adventureInteractions[id].lines;
  const last = Math.max(adventureInteractions[id].kind === 'talk' ? lines.length - 1 : 0, ...pins.map(pin => lines.findIndex(line => line.id === pin)));
  for (let index = 0; index <= last; index++) {
    const line = lines[index];
    if (pins.includes(line.id)) { const button = page.locator('.case-sentence'); if (await button.getAttribute('aria-pressed') !== 'true') await button.click(); }
    if (index < last) await page.getByRole('button', { name: 'הבא', exact: true }).click();
  }
  if (pickup) await page.getByRole('button', { name: `לקחת: ${pickup}`, exact: true }).click();
  await bounds(page);
  if (adventureInteractions[id].kind === 'talk') {
    await page.getByRole('button', { name: 'סיימנו בינתיים', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  } else await close(page);
}
async function collect(page: Page) {
  await page.getByRole('button', { name: 'הכבשה בחצר', exact: true }).click();
  await expect(page.locator('.case-child-line')).toContainText('תום');
  await expect(page.locator('.case-sentence > span')).toHaveText('זאת לא נוגה');
  await bounds(page); await close(page);
  await inspect(page, 'ribbon', [], 'סרט הכוכבים');
  await inspect(page, 'dad', ['stars']); await inspect(page, 'tracks', ['tracks']);
  await inspect(page, 'book', ['today', 'tomorrow'], 'פתק המשלוח'); await inspect(page, 'postman', ['trip']);
  await inspect(page, 'basket', ['basketBread'], 'כף העץ');
  await page.getByRole('button', { name: 'לשביל אל הגשר ←', exact: true }).click();
  await inspect(page, 'lower', ['wet']); await inspect(page, 'note', ['platform']);
}
function board(page: Page, name: string) { return page.getByRole('region', { name, exact: true }); }
async function trayCard(page: Page, id: string): Promise<Locator> {
  const tray = page.locator('.case-evidence-tray');
  const previous = tray.getByRole('button', { name: 'הקודם', exact: true });
  while (await previous.isVisible() && await previous.isEnabled()) await previous.click();
  const card = tray.getByRole('button', { name: id === 'ribbon' ? 'סרט הכוכבים' : id === 'delivery' ? 'פתק המשלוח' : id === 'spoon' ? 'כף העץ' : evidenceText(id), exact: true });
  for (let i = 0; i < 15 && !await card.count(); i++) await tray.getByRole('button', { name: 'הבא', exact: true }).click();
  await expect(card).toBeVisible(); return card;
}
async function place(page: Page, id: string, target: Locator, drag = false) {
  const card = await trayCard(page, id);
  if (drag) await card.dragTo(target.locator('.case-empty-slot').first());
  else { await card.click(); await target.locator('.case-empty-slot').first().click(); }
}
async function bounds(page: Page) {
  expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth <= innerWidth, height: document.documentElement.scrollHeight <= innerHeight }))).toEqual({ width: true, height: true });
  const clipped = await page.locator('.detective button:visible, dialog[open] button:visible, dialog[open] h2, dialog[open] p, .case-pinned-clue, .case-collected').evaluateAll(elements => elements.flatMap(el => {
    if (el.closest('dialog:not([open])')) return [];
    const rect = el.getBoundingClientRect(); let parent = el.parentElement;
    if (rect.top < -1 || rect.bottom > innerHeight + 1 || rect.left < -1 || rect.right > innerWidth + 1) return [el.textContent];
    // Native modal dialogs escape DOM clipping ancestors through the top layer.
    while (parent) {
      const style = getComputedStyle(parent), p = parent.getBoundingClientRect();
      if ((/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < p.top - 2 || rect.bottom > p.bottom + 2)) || (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < p.left - 2 || rect.right > p.right + 2))) return [el.textContent];
      if (parent.matches('dialog[open]')) break;
      parent = parent.parentElement;
    } return [];
  })); expect(clipped).toEqual([]);
}

test('map adventure: objects, conversations, real drag, correction, refresh, reveal and reporting', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.setViewportSize({ width: 1280, height: 720 }); await open(page);
  await page.getByRole('button', { name: /מחברת הרמזים/ }).click(); await expect(page.getByText('עוד אין כאן משפטים.', { exact: false })).toBeVisible(); await close(page);
  await page.getByRole('button', { name: /תיק החפצים/ }).click(); await expect(page.getByText('התיק עדיין ריק.', { exact: false })).toBeVisible(); await close(page);
  await collect(page);
  await page.getByRole('button', { name: /תיק החפצים/ }).click(); await expect(page.locator('.case-collected')).toHaveCount(3); await page.screenshot({ path: test.info().outputPath('bag.png') }); await close(page);
  await page.getByRole('button', { name: /מחברת הרמזים/ }).click(); await bounds(page); await page.screenshot({ path: test.info().outputPath('notebook.png') }); await close(page);
  await page.getByRole('button', { name: 'בוא ננסה לפתור', exact: true }).click();
  const happened = board(page, 'מה קרה לנוגה?'), where = board(page, 'איפה נוגה עכשיו?');
  for (const id of ['stars', 'ribbon', 'spoon']) await place(page, id, happened, true);
  await happened.getByRole('button', { name: 'בודקים את החיבור', exact: true }).click(); await expect(page.getByRole('status')).toContainText('עדיין לא');
  await happened.getByRole('button', { name: /להוציא רמז 3/ }).click(); await place(page, 'tracks', happened, true);
  await happened.getByRole('button', { name: 'בודקים את החיבור', exact: true }).click(); await expect(happened).toContainText('התחבאה ליד השטיח');
  await place(page, 'delivery', where, true); await bounds(page);
  await page.reload(); await page.getByRole('button', { name: '🔎 תיק בלשי קטן', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'החקירה מחכה לכם' })).toBeVisible(); await bounds(page); await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click();
  await page.getByRole('button', { name: 'בוא ננסה לפתור', exact: true }).click();
  await expect(happened).toHaveClass(/solved/); await expect(where.locator('.case-pinned-clue')).toHaveCount(1);
  await place(page, 'trip', where, true); await place(page, 'platform', where, true); await bounds(page);
  await page.screenshot({ path: test.info().outputPath('deduction.png') }); await where.getByRole('button', { name: 'בודקים את החיבור', exact: true }).click();
  await expect(page.getByText('התיק נפתר!', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); const frozen = await page.locator('canvas').screenshot(); await page.waitForTimeout(250); expect(await page.locator('canvas').screenshot()).toEqual(frozen);
  await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click(); await bounds(page); await page.waitForTimeout(1600);
  await page.screenshot({ path: test.info().outputPath('reveal.png') });
  await page.getByRole('button', { name: 'בחזרה לפיקניק', exact: true }).click(); await page.getByRole('button', { name: 'להורים', exact: true }).click();
  await expect(page.getByText(/קישור מבוסס טקסט/).first()).toBeVisible(); await expect(page.getByText(/מה קרה לנוגה/).first()).toBeVisible(); expect(errors).toEqual([]);
});
for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) test(`adventure keyboard, collected clues, boards, help, pause and lab ${viewport.width}`, async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await bounds(page);
  const placement = await page.evaluate(() => {
    const map = document.querySelector('.detective-map')!.getBoundingClientRect();
    const tools = document.querySelector('.detective-hud')!.getBoundingClientRect();
    return { beside: tools.left >= map.right, aligned: tools.top < map.bottom && tools.bottom > map.top, visible: tools.top >= 0 && tools.bottom <= innerHeight && tools.right <= innerWidth };
  });
  expect(placement).toEqual({ beside: true, aligned: true, visible: true });
  await page.screenshot({ path: test.info().outputPath('map.png') });
  await page.getByRole('button', { name: 'לדבר עם אבא', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /הבוקר קשרתי/ }).focus(); await page.keyboard.press('Enter'); await bounds(page);
  await page.screenshot({ path: test.info().outputPath('conversation.png') }); await page.keyboard.press('Escape');
  await collect(page);
  for (const name of [/מחברת הרמזים/, /תיק החפצים/]) { await page.getByRole('button', { name }).click(); await bounds(page); await close(page); }
  await page.getByRole('button', { name: 'אפשרויות', exact: true }).click(); await bounds(page);
  await page.getByRole('checkbox', { name: 'פחות תנועה', exact: true }).check(); await page.getByRole('button', { name: 'העתקת הגדרות', exact: true }).click(); await bounds(page); await close(page);
  await page.keyboard.press('Escape'); await bounds(page); await page.getByRole('button', { name: 'ממשיכים בחקירה', exact: true }).click();
  await page.getByRole('button', { name: 'בוא ננסה לפתור', exact: true }).click();
  const happened = board(page, 'מה קרה לנוגה?'), where = board(page, 'איפה נוגה עכשיו?');
  for (const id of ['stars', 'ribbon', 'tracks']) await place(page, id, happened);
  for (const id of ['today', 'trip', 'platform']) await place(page, id, where);
  await bounds(page); await page.screenshot({ path: test.info().outputPath('full-boards.png') });
  await happened.getByRole('button', { name: 'בודקים את החיבור', exact: true }).click(); await bounds(page);
  await where.getByRole('button', { name: 'רמז', exact: true }).click(); await bounds(page);
  await page.getByRole('button', { name: 'עוד רמז', exact: true }).click(); await page.getByRole('button', { name: 'עוד רמז', exact: true }).click(); await bounds(page);
  await page.getByRole('button', { name: 'נחבר יחד', exact: true }).click(); await expect(page.getByText('התיק נפתר!', { exact: true })).toBeVisible(); await bounds(page);
  await page.screenshot({ path: test.info().outputPath('ending.png') });
});
