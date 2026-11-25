import { expect, test, type Page } from "@playwright/test";

const storage = "flock-and-key:game:v2";
async function activity(page: Page, title: string) {
  await page.getByRole("button", { name: "משחקונים", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`(?:פותחים|ממשיכים) · ${title.replace("?", "\\?")}$`) }).click();
}

async function prepare(page: Page) {
  await page.getByRole("button", { name: "מכירים את המשימה ←" }).click();
}

async function begin(page: Page) {
  await page.getByRole("button", { name: "מוכנים, מתחילים ←" }).click();
  await expect(page.locator(".stage canvas")).toBeVisible();
}

async function expectedWord(page: Page) {
  return page.evaluate(key => {
    const progress = JSON.parse(localStorage.getItem(key)!);
    const session = progress.sessions.find((item: { id: string }) => item.id === progress.currentId);
    return session.tasks[session.stage][session.index].expected as string;
  }, storage);
}

async function enterWord(page: Page, word: string) {
  await page.locator("#answer").fill(word);
  await page.locator("#answer").press("Enter");
}

async function checkLayout(page: Page) {
  expect(await page.evaluate(() => {
    const dialog = document.querySelector("dialog[open]");
    if (document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1) return [`document ${document.documentElement.scrollWidth}×${document.documentElement.scrollHeight} in ${innerWidth}×${innerHeight}`];
    const controls = Array.from((dialog ?? document).querySelectorAll("button,input,select,h1,a"));
    return controls.filter(element => {
      if (!element.getClientRects().length) return false;
      const box = element.getBoundingClientRect();
      if (box.left < -1 || box.right > innerWidth + 1 || box.top < -1 || box.bottom > innerHeight + 1) return true;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const clip = parent.getBoundingClientRect(), style = getComputedStyle(parent);
        if (style.overflowX !== "visible" && (box.left < clip.left - 1 || box.right > clip.right + 1)) return true;
        if (style.overflowY !== "visible" && (box.top < clip.top - 1 || box.bottom > clip.bottom + 1)) return true;
        if (parent === dialog) break;
      }
      return false;
    }).map(element => element.textContent?.trim());
  })).toEqual([]);
}

async function checkDesktopLayouts(page: Page) {
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await checkLayout(page);
  }
  await page.setViewportSize({ width: 1024, height: 600 });
}

test("station storage, Hebrew corrections, saved choice and paid decorations", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/");
  await checkLayout(page);
  await page.screenshot({ path: test.info().outputPath("station-home.png") });
  await activity(page, "ארגזים למחסן");
  await prepare(page);
  await begin(page);
  await enterWord(page, "גג");
  await checkDesktopLayouts(page);
  await page.reload();
  await page.getByRole("button", { name: /ממשיכים · ארגזים למחסן/ }).click();
  await expect(page.locator("#answer")).toHaveValue("גג");
  for (let i = 0; i < 6; i++) {
    await enterWord(page, await expectedWord(page));
    if (i < 5) await expect(page.getByText(`משימה ${i + 2} / 6`)).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "הארגז לתערוכה מוכן" })).toBeVisible();
  await page.getByRole("group", { name: "ארגזים על המדף" }).getByRole("button").last().click();
  await page.getByRole("button", { name: "לחנות התחנה ←" }).click();
  await page.getByRole("button", { name: "אולם התחנה" }).click();
  await page.getByRole("button", { name: "כרית לפיצי" }).click();
  await expect(page.locator(".station-preview-item")).toBeVisible();
  await page.getByRole("button", { name: "לקנות · 65 פעמונים" }).click();
  await expect(page.locator(".station-prize").filter({ hasText: "כרית לפיצי" })).toContainText("מוצג בתחנה");
  await page.screenshot({ path: test.info().outputPath("station-shop.png") });
  await checkLayout(page);
  await page.reload();
  await expect(page.locator(".station-home-art .station-decoration")).toBeVisible();
  expect(errors).toEqual([]);
});

test("postcards, trail and courier use different inputs and persist", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/");
  await activity(page, "גלויות לדוור");
  await prepare(page);
  await begin(page);
  await expect(page.getByText("מילה חסרה בגלויה")).toBeVisible();
  await page.getByRole("button", { name: "פתיחת מקלדת עזר" }).click();
  await checkDesktopLayouts(page);
  await page.getByRole("button", { name: "צריכים להעתיק?" }).click();
  await enterWord(page, await expectedWord(page));
  await page.getByRole("button", { name: "שמירה ויציאה" }).click();
  await activity(page, "בעקבות פיצי");
  await prepare(page);
  await begin(page);
  await page.getByRole("button", { name: "שער", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "פיצי בדק שם" })).toBeVisible();
  await enterWord(page, "ספסל");
  await expect(page.getByText("משימה 2 / 4")).toBeVisible();
  await checkLayout(page);
  await page.screenshot({ path: test.info().outputPath("station-trail.png") });
  await page.getByRole("button", { name: "שמירה ויציאה" }).click();
  await activity(page, "שליחות עם פיצי");
  await prepare(page);
  await page.getByRole("button", { name: "דרך בית הקפה" }).click();
  await checkLayout(page);
  await begin(page);
  await expect(page.getByTestId("target-word")).toHaveText("תה");
  await page.locator("#answer").fill("תה");
  await expect(page.getByTestId("target-word")).toHaveText("דלת");
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  const canvas = page.locator(".stage canvas");
  const stopped = await canvas.screenshot();
  await expect.poll(() => canvas.screenshot()).toEqual(stopped);
  await page.reload();
  await page.getByRole("button", { name: /ממשיכים · שליחות עם פיצי/ }).click();
  await expect(page.getByTestId("target-word")).toHaveText("דלת");
  await checkDesktopLayouts(page);
});

test("both station mysteries and the square rehearsal have separate resumable saves", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/");
  await page.getByRole("button", { name: "יוצאים לחקירה", exact: true }).click();
  await page.getByRole("button", { name: "פותחים בחקירה" }).click();
  await page.getByRole("button", { name: "רשומת המסירה של אבא" }).click();
  await checkDesktopLayouts(page);
  await page.getByLabel("תווית לקבלה:").fill("מפת שבילים");
  await page.getByRole("button", { name: "להכין קבלה" }).click();
  await expect(page.getByText("הקבלה של חבילה 27 בתיק ✓")).toBeVisible();
  await page.getByRole("button", { name: "סגירה וחזרה למפה" }).click();
  await page.getByRole("button", { name: "בית הקפה", exact: true }).click();
  await page.getByRole("button", { name: "בעלת בית הקפה והתצלומים" }).click();
  await page.locator(".case-sentence").click();
  await checkDesktopLayouts(page);
  await page.getByRole("button", { name: "סגירה וחזרה למפה" }).click();
  await page.getByRole("button", { name: "לתחנה", exact: true }).click();
  await expect(page.getByText("פרק ראשון · בית הקפה")).toBeVisible();
  await page.getByRole("button", { name: "פרק חדש", exact: true }).click();
  await checkDesktopLayouts(page);
  await page.getByRole("button", { name: "ביטול", exact: true }).click();
  await expect(page.getByText("פרק ראשון · בית הקפה")).toBeVisible();
  await activity(page, "איפה נוגה?");
  await page.getByRole("button", { name: "פותחים בחקירה" }).click();
  await page.getByRole("button", { name: "המחסה ליד התחנה", exact: true }).click();
  await page.getByRole("button", { name: "מעמד התווים" }).click();
  await page.locator(".case-sentence").click();
  await page.getByRole("button", { name: "סגירה וחזרה למפה" }).click();
  await page.getByRole("button", { name: "בוא ננסה לפתור" }).click();
  await checkDesktopLayouts(page);
  await page.screenshot({ path: test.info().outputPath("station-noga-evidence.png") });
  await page.getByRole("button", { name: "סגירה וחזרה למפה" }).click();
  await page.getByRole("button", { name: "לתחנה", exact: true }).click();
  await activity(page, "חזרה בכיכר");
  await page.getByRole("button", { name: "מתחילים", exact: true }).click();
  await page.getByRole("button", { name: "מקשיבים לקטע" }).click();
  await expect.poll(() => page.locator(".rehearsal audio").evaluate((audio: HTMLAudioElement) => audio.readyState)).toBeGreaterThan(1);
  await page.getByRole("button", { name: "מילות השיר ותרגום" }).click();
  await expect(page.getByText("Put the drum beside the suitcase.", { exact: true })).toBeVisible();
  await checkDesktopLayouts(page);
  await page.screenshot({ path: test.info().outputPath("station-songbook.png") });
  await page.reload();
  await activity(page, "חזרה בכיכר");
  await expect(page.getByText("איזה כלי מבקשים להזיז?")).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "מגלים וממשיכים" }).click();
    await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  }
  await page.getByRole("button", { name: "מאחורי", exact: true }).click();
  await expect(page.getByText("Put the drum behind the suitcase.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "להדרן", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ההדרן שלכם" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("station menu, activity board, shop and Gatekeepers entry fit desktop sizes", async ({ page }) => {
  await page.goto("/");
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await checkLayout(page);
    await page.getByRole("button", { name: "משחקונים", exact: true }).click();
    await checkLayout(page);
    await page.getByRole("button", { name: "לתחנה", exact: true }).click();
    await page.getByRole("button", { name: "חנות התחנה", exact: true }).click();
    for (const category of ["פיצי והמשפחה", "אולם התחנה", "הכניסה והכיכר"]) {
      await page.getByRole("button", { name: category, exact: true }).click();
      await checkLayout(page);
    }
    await page.getByRole("button", { name: "לתחנה", exact: true }).click();
  }
  await page.getByRole("button", { name: "משחקונים", exact: true }).click();
  await page.getByRole("button", { name: /שומרי השערים/ }).click();
  await expect(page.getByRole("heading", { name: /שומרי השערים/ })).toBeVisible();
});
