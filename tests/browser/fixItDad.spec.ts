import { expect, test } from "@playwright/test";
import { desktopSizes, vocabularyWalkthrough } from "./vocabularyWalkthrough";

for (const [width, height] of desktopSizes) {
  test(`tests, repairs and restores the workshop at ${width}×${height}`, async ({ page }) => {
    const { press, button, capture, resume, finish } = await vocabularyWalkthrough(page, "fix-it-dad", "הסדנה של אבא", width, height);
    const status = page.getByRole("status");
    await press("ננסה להשתמש");
    await expect(status).toContainText("השלט יושב מעל הידית");
    await capture("blocked");
    await press("Remove ידית");
    await press("ננסה להשתמש");
    await expect(status).toContainText("אין במה לאחוז");
    await press("לבטל שינוי");
    await press("Remove שלט");
    await press("ננסה להשתמש");
    await expect(status).toContainText("המזוודה כבר מתרוממת");
    await resume();
    await expect(status).toContainText("המזוודה כבר מתרוממת");
    await press("עזרה");
    await capture("help");
    await page.keyboard.press("Escape");
    await button(width === 1280 ? "לחבר לתושבת שמאל" : "לחבר לתושבת ימין").focus();
    await page.keyboard.press("Enter");
    await press("ננסה להשתמש");
    await expect(status).toContainText("ההצגה מוכנה");
    await press("Remove ידית");
    await press("ננסה להשתמש");
    await expect(status).toContainText("אין במה לאחוז");
    await press("להחזיר לתיקון התקין");
    await expect(status).toContainText("ההצגה מוכנה");
    if (width !== 1280) {
      await press("לוח תגים · אפשר לדלג");
      await press("● תג עיגול");
      await expect(status).toContainText("ציור אחר");
      await press("★ תג כוכב");
      await expect(status).toContainText("ציור של הר");
      await capture("tags");
      await press("בחזרה למזוודה");
    }
    await finish();
  });
}

test("workshop recovers invalid saves and stays playable when storage rejects writes", async ({ page }) => {
  await page.addInitScript(() => {
    const key = "flock-key-vocabulary-fix-it-dad-v1";
    localStorage.setItem(key, JSON.stringify(["restore"]));
    const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function (requestedKey, value) {
      if (requestedKey === key) throw new Error("storage unavailable");
      save.call(this, requestedKey, value);
    };
  });
  const { press } = await vocabularyWalkthrough(page, "fix-it-dad", "הסדנה של אבא", 1024, 600);
  await expect(page.getByRole("alert")).toContainText("השמירה לא התאימה");
  await press("Remove שלט");
  await expect(page.getByRole("alert")).toContainText("השמירה המקומית אינה זמינה");
  await press("לחבר לתושבת שמאל");
  await press("ננסה להשתמש");
  await expect(page.getByRole("status")).toContainText("ההצגה מוכנה");
});
