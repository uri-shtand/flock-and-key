import { expect, test, type Page } from "@playwright/test";

const storage = "flock-and-key:game:v2";
const openBarn = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: /חזרה באסם/ }).click();
};

async function changedPixels(page: Page, first: Buffer, second: Buffer) {
  return page.evaluate(async ([firstImage, secondImage]) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    async function pixels(base64: string) {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    }
    const before = await pixels(firstImage);
    const after = await pixels(secondImage);
    if (before.length !== after.length) return Infinity;
    let difference = 0;
    for (let i = 0; i < before.length; i += 4) {
      // Ignore subpixel variation from antialiased edges in Chromium screenshots.
      if ([0, 1, 2].some(channel => Math.abs(before[i + channel] - after[i + channel]) > 12)) difference++;
    }
    return difference;
  }, [first.toString("base64"), second.toString("base64")]);
}

async function checkLayout(page: Page) {
  const clipped = await page.evaluate(() => {
    const dialog = Array.from(document.querySelectorAll("dialog[open]")).at(-1);
    const root = dialog ?? document.querySelector(".rehearsal")!;
    if (document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1) return ["document"];
    const controls = Array.from(root.querySelectorAll("h1,h2,button,p,input,select"));
    return controls.filter(element => {
      if (element.getClientRects().length === 0) return false;
      const rect = element.getBoundingClientRect();
      if (rect.top < -1 || rect.left < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) return true;
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const ancestor = parent.getBoundingClientRect();
        const style = getComputedStyle(parent);
        if (style.overflowX !== "visible" && (rect.left < ancestor.left - 1 || rect.right > ancestor.right + 1)) return true;
        if (style.overflowY !== "visible" && (rect.top < ancestor.top - 1 || rect.bottom > ancestor.bottom + 1)) return true;
        if (parent === dialog) break;
      }
      return false;
    }).map(element => element.textContent);
  });
  expect(clipped).toEqual([]);
}

test("complete an English rehearsal with audio, translation, correction, resume and animation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 1024, height: 600 });
  await openBarn(page);
  await expect(page.locator(".rehearsal-canvas canvas")).toBeVisible();
  await checkLayout(page);
  await page.screenshot({ path: test.info().outputPath("song-selection.png") });
  const rhythm = page.locator("article").filter({ hasText: "Ain’t Got Rhythm" });
  await rhythm.getByRole("button", { name: "מתחילים", exact: true }).click();
  await page.getByRole("button", { name: "מקשיבים לקטע" }).click();
  const media = page.locator(".rehearsal audio");
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => ({
    recording: audio.currentSrc.endsWith("/rhythm.mp3"),
    playingSong: audio.currentTime > 28.22 && !audio.paused,
  }))).toEqual({ recording: true, playingSong: true });
  await page.getByRole("button", { name: "מילות השיר ותרגום" }).click();
  const lyrics = page.getByRole("dialog", { name: "מילות השיר ותרגום" });
  await expect(lyrics.getByText("So you're saying that you don't have rhythm?")).toBeVisible();
  await expect(lyrics.getByText("אז אתה אומר שאין לך חוש קצב?")).toBeVisible();
  await lyrics.getByRole("button", { name: "to spare", exact: true }).click();
  await expect(lyrics.getByText(/יותר ממספיק/)).toBeVisible();
  await expect.poll(() => page.locator(".rehearsal audio").evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await lyrics.getByRole("button", { name: "לקטע הבא" }).click();
  await lyrics.getByRole("button", { name: "השמעת שורה" }).nth(1).click();
  await expect.poll(() => page.locator(".rehearsal audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(40.82);
  await checkLayout(page);
  await page.screenshot({ path: test.info().outputPath("songbook.png") });
  await lyrics.getByRole("button", { name: "השמעת כל השיר" }).click();
  await expect(lyrics.getByText("קטע 1 מתוך 10", { exact: true })).toBeVisible();
  await media.evaluate((audio: HTMLAudioElement) => { audio.currentTime = 62; });
  await expect(lyrics.getByText("קטע 4 מתוך 10", { exact: true })).toBeVisible();
  await checkLayout(page);
  await page.keyboard.press("Escape");
  await expect(lyrics).toBeHidden();
  await page.getByRole("button", { name: "תוף ושער", exact: true }).click();
  await expect(page.getByText(/עוד ניסיון/)).toBeVisible();
  await page.getByRole("button", { name: "רמז", exact: true }).click();
  await checkLayout(page);
  await page.getByRole("button", { name: "חותמת וספר", exact: true }).click();
  await expect(page.getByText(/בדיוק/)).toBeVisible();

  await openBarn(page);
  await rhythm.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "החזרה בהפסקה" })).toBeVisible();
  await checkLayout(page);
  await page.getByRole("button", { name: "ממשיכים בחזרה" }).click();
  await expect(page.getByText(/בדיוק/)).toBeVisible();
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  for (let index = 0; index < 4; index++) {
    await page.getByRole("button", { name: "מגלים וממשיכים" }).click();
    await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  }
  const answer = page.getByRole("textbox", { name: "תשובה באנגלית" });
  await answer.fill("התבלבלתי");
  await answer.press("Enter");
  await expect(page.getByText(/עוד ניסיון/)).toBeVisible();
  await answer.fill("guitar");
  await answer.dispatchEvent("compositionstart");
  await answer.press("Enter");
  await expect(answer).toBeEnabled();
  await answer.dispatchEvent("compositionend");
  await answer.press("Enter");
  await expect(page.getByText(/בדיוק/)).toBeVisible();
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await page.getByRole("button", { name: "כובע אחד", exact: true }).click();
  await expect(page.getByText("The duck is wearing one hat.")).toBeVisible();
  await page.getByRole("button", { name: "שלושה כובעים", exact: true }).click();
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "החזרה בהפסקה" })).toBeVisible();
  const canvas = page.locator(".rehearsal-canvas canvas");
  // Remove the dialog from the image while keeping the actual modal and pause active.
  const screenshotStyle = { style: ".rehearsal-dialog, .rehearsal-dialog::backdrop { opacity: 0 !important; }" };
  const frozen = await canvas.screenshot({ ...screenshotStyle, path: test.info().outputPath("paused-first.png") });
  await page.waitForTimeout(250);
  const stillFrozen = await canvas.screenshot({ ...screenshotStyle, path: test.info().outputPath("paused-second.png") });
  expect(await changedPixels(page, frozen, stillFrozen), "the stage freezes while paused").toBe(0);
  await page.getByRole("button", { name: "ממשיכים בחזרה" }).click();
  await expect.poll(async () => changedPixels(page, frozen, await canvas.screenshot())).toBeGreaterThan(24);
  await expect(page.getByText("The duck is wearing three hats.")).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("variation.png") });
  await page.getByRole("button", { name: "להדרן", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ההדרן שלכם" })).toBeVisible();
  await checkLayout(page);
  const snapshot = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).rehearsals[0], storage);
  expect(snapshot.results[0]).toEqual({ outcome: "supported", mistakes: 1 });
  expect(snapshot.results[5]).toEqual({ outcome: "independent", mistakes: 1 });
  expect(snapshot.variations).toEqual([1, 2]);
  expect(snapshot.finished).toBe(true);
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await expect(page.getByRole("heading", { name: "חזרה באסם · אנגלית" })).toBeVisible();
  await expect(page.getByText(/הבנת הנשמע — עם עזרה/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("both song groups, their six songbooks and separate progress fit the compact desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await openBarn(page);
  const media = page.locator(".rehearsal audio");
  let checkedPages = 0;
  for (const group of ["שירי הסדרה", "שירי החווה"]) {
    const groupButton = page.getByRole("button", { name: group, exact: true });
    await groupButton.click();
    await expect(groupButton).toHaveAttribute("aria-pressed", "true");
    await checkLayout(page);
    const cards = page.locator(".rehearsal-song");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await card.getByRole("button", { name: "מילים ותרגום" }).click();
      const dialog = page.getByRole("dialog", { name: "מילות השיר ותרגום" });
      const next = dialog.getByRole("button", { name: "לקטע הבא" });
      do {
        await checkLayout(page);
        expect(await dialog.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
        checkedPages++;
        if (await next.isDisabled()) break;
        await next.click();
      } while (true);
      await dialog.getByRole("button", { name: "סוגרים" }).click();
      if (group === "שירי החווה") {
        await card.getByRole("button", { name: "טעימה" }).click();
        await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.currentSrc.endsWith(".wav") && !audio.paused && audio.currentTime > 0)).toBe(true);
      }
    }
    await page.screenshot({ path: test.info().outputPath(group === "שירי החווה" ? "farm-songs.png" : "series-songs.png") });
  }
  expect(checkedPages).toBe(37);
  await page.getByRole("button", { name: "שירי הסדרה", exact: true }).click();
  await expect.poll(() => media.evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
  await page.locator(".rehearsal-song").filter({ hasText: "Busted" }).getByRole("button", { name: "מתחילים" }).click();
  await page.getByRole("button", { name: "תמימה", exact: true }).click();
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await page.getByRole("button", { name: "לבחירת שיר" }).click();
  await page.getByRole("button", { name: "שירי החווה", exact: true }).click();
  await page.locator(".rehearsal-song").filter({ hasText: "The Tap-Dancing Boots" }).getByRole("button", { name: "מתחילים" }).click();
  await page.getByRole("button", { name: "המגפיים", exact: true }).click();
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /חזרה באסם/ }).click();
  await expect(page.locator(".rehearsal-song").filter({ hasText: "Busted" }).getByRole("button", { name: "ממשיכים" })).toBeVisible();
  await page.getByRole("button", { name: "שירי החווה", exact: true }).click();
  await page.locator(".rehearsal-song").filter({ hasText: "The Tap-Dancing Boots" }).getByRole("button", { name: "ממשיכים" }).click();
  await page.getByRole("button", { name: "ממשיכים בחזרה" }).click();
  await expect(page.getByText("שאלה 2 מתוך 6")).toBeVisible();
});

for (const [width, height] of [[1280, 720], [1440, 900]]) {
  test(`rehearsal controls fit ${width}×${height} with reduced motion and saved options`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openBarn(page);
    await checkLayout(page);
    const song = page.locator("article").filter({ hasText: width === 1280 ? "Busted" : "Gitchee Gitchee Goo" });
    await song.getByRole("button", { name: "טעימה" }).click();
    await expect.poll(() => page.locator(".rehearsal audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
    await song.getByRole("button", { name: "מתחילים" }).click();
    await expect(page.locator(".rehearsal-canvas canvas")).toBeVisible();
    await page.getByRole("button", { name: "הפסקה", exact: true }).click();
    await page.getByRole("button", { name: "אפשרויות חזרה" }).click();
    const options = page.getByRole("dialog", { name: "אפשרויות חזרה" });
    await options.getByLabel("אורך החזרה").selectOption("2");
    await options.getByRole("checkbox").check();
    await options.getByRole("button", { name: "העתקת הגדרות" }).click();
    await expect(options.getByRole("textbox")).toHaveValue('{"parts":2,"support":true}');
    await checkLayout(page);
    await options.getByRole("button", { name: "מתחילים מחדש עם ההגדרות" }).click();
    await expect(page.getByText("שאלה 1 מתוך 4")).toBeVisible();
    await checkLayout(page);
    await page.getByRole("button", { name: "מילות השיר ותרגום" }).click();
    await checkLayout(page);
    await page.screenshot({ path: test.info().outputPath("songbook.png") });
    await page.getByRole("button", { name: "סוגרים", exact: true }).click();
    for (let index = 0; index < 4; index++) {
      await page.getByRole("button", { name: "מגלים וממשיכים" }).click();
      await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
    }
    await page.getByRole("button", { name: width === 1280 ? "גרב" : "נוגה רודפת", exact: true }).click();
    const canvas = page.locator(".rehearsal-canvas canvas");
    const settled = await canvas.screenshot();
    await page.waitForTimeout(250);
    expect(await changedPixels(page, settled, await canvas.screenshot()), "the reduced-motion pose stays still").toBe(0);
    await checkLayout(page);
    await page.screenshot({ path: test.info().outputPath("stage.png") });
    await page.reload();
    await page.getByRole("button", { name: /חזרה באסם/ }).click();
    await song.getByRole("button", { name: "ממשיכים", exact: true }).click();
    await page.getByRole("button", { name: "ממשיכים בחזרה" }).click();
    await expect(page.getByRole("heading", { name: "עכשיו אתם מביימים" })).toBeVisible();
  });
}
