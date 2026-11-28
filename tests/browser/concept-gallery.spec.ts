import { expect, test } from "@playwright/test";

test("concept gallery opens from station home and restores its entry focus", async ({ page }) => {
  await page.goto("/");
  const entry = page.getByRole("button", { name: "גלריית קונספט ארט", exact: true });
  await entry.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "גלריית קונספט ארט", exact: true })).toBeFocused();
  await expect(page.getByText("איורי תכנון בלבד — המיני־משחקים האלה עדיין לא נבנו.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "חזרה לתחנה", exact: true }).click();
  await expect(entry).toBeFocused();
});

test("all five concept illustrations load and can be browsed without changing progress", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  const saved = await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2"));
  await page.getByRole("button", { name: "גלריית קונספט ארט", exact: true }).click();
  const choices = page.getByRole("group", { name: "בחירת איור" }).getByRole("button");
  await expect(choices).toHaveCount(5);
  const titles = ["מחלקת האבידות של פיצי", "המשמרת בבית הקפה", "הסדנה של אבא", "רדיו התחנה", "מועדון המילים החשאיות"];
  for (const [index, title] of titles.entries()) {
    await choices.nth(index).click();
    await expect(choices.nth(index)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const image = page.locator(".concept-artwork");
    await expect(image).toHaveAttribute("alt", /.+/);
    await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(1024);
    await expect(page.getByRole("link", { name: "פתיחת האיור בגודל מלא" })).toHaveAttribute("href", await image.getAttribute("src") as string);
  }
  await page.getByRole("button", { name: "האיור הבא", exact: true }).click();
  await expect(page.getByRole("heading", { name: titles[0], exact: true })).toBeVisible();
  await page.getByRole("button", { name: "האיור הקודם", exact: true }).click();
  await expect(page.getByRole("heading", { name: titles[4], exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "גלריית קונספט ארט", exact: true })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2"))).toBe(saved);
  expect(errors).toEqual([]);
});

for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
  test(`concept gallery fits desktop ${width}x${height} including every illustration`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.getByRole("button", { name: "גלריית קונספט ארט", exact: true }).click();
    const choices = page.getByRole("group", { name: "בחירת איור" }).getByRole("button");
    for (let index = 0; index < 5; index++) {
      await choices.nth(index).click();
      const clipped = await page.evaluate(() => {
        const bad: string[] = [];
        if (document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1) bad.push("document overflow");
        for (const element of document.querySelectorAll("button,a,h1,h2,.concept-artwork")) {
          if (!element.getClientRects().length) continue;
          const rect = element.getBoundingClientRect();
          if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) bad.push(element.textContent?.trim() || element.tagName);
          if (element.matches("button,a")) {
            const front = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
            if (!front || !element.contains(front)) bad.push(`covered ${element.textContent?.trim()}`);
          }
          const selectors = document.querySelector(".concept-choices")!.getBoundingClientRect();
          if (element.closest(".concept-detail") && rect.bottom > selectors.top - 1) bad.push(`overlaps selectors ${element.textContent?.trim() || element.tagName}`);
          for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            const clip = parent.getBoundingClientRect(), style = getComputedStyle(parent);
            if (style.overflowX !== "visible" && (rect.left < clip.left - 1 || rect.right > clip.right + 1)) bad.push(`X ${element.textContent?.trim()}`);
            if (style.overflowY !== "visible" && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1)) bad.push(`Y ${element.textContent?.trim()}`);
          }
        }
        return bad;
      });
      expect(clipped).toEqual([]);
    }
    await page.screenshot({ path: test.info().outputPath(`concept-gallery-${width}.png`) });
  });
}

test("missing concept image reports a useful fallback and does not block navigation", async ({ page }) => {
  await page.route("**/assets/vocabulary-concepts/lost-and-found.webp", route => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "גלריית קונספט ארט", exact: true }).click();
  await expect(page.getByText("האיור לא נטען. אפשר לבחור איור אחר או לחזור לתחנה.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "האיור הבא", exact: true }).click();
  await expect.poll(() => page.locator(".concept-artwork").evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(1024);
  await expect(page.getByText("האיור לא נטען. אפשר לבחור איור אחר או לחזור לתחנה.", { exact: true })).toBeHidden();
});
