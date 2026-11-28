import { expect, test } from "@playwright/test";

for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
test(`three distinct travelers use their returned belongings at ${width}×${height}`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width, height });
  const screenshot = async (name: string) => {
    await expect(page.locator(".vocabulary-panel")).toBeVisible();
    expect(await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollHeight <= innerHeight && root.scrollWidth <= innerWidth &&
        [...document.querySelectorAll(".vocabulary-panel button")].every(button => {
          const box = button.getBoundingClientRect();
          if (!box.width) return true;
          if (box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight) return false;
          for (let parent = button.parentElement; parent; parent = parent.parentElement) {
            const bounds = parent.getBoundingClientRect();
            const style = getComputedStyle(parent);
            if (/hidden|clip|auto|scroll/.test(style.overflowX) && (box.left < bounds.left || box.right > bounds.right)) return false;
            if (/hidden|clip|auto|scroll/.test(style.overflowY) && (box.top < bounds.top || box.bottom > bounds.bottom)) return false;
          }
          return true;
        });
    })).toBe(true);
    await page.screenshot({ path: `output/playwright/vocabulary/lost-found/${width}-${name}.png` });
  };
  await page.goto("/");
  await page.getByRole("button", { name: "משחקונים", exact: true }).click();
  await page.getByRole("button", { name: "מחלקת האבידות של פיצי" }).click();
  await page.getByRole("button", { name: "בחירת צעיף 2" }).click();
  await page.getByRole("button", { name: "למסור למיה" }).click();
  await expect(page.getByRole("status")).toContainText("הדוגמה קצת שונה");
  await screenshot("correction");
  await page.getByRole("button", { name: "בחירת צעיף 1" }).click();
  await page.getByRole("button", { name: "למסור למיה" }).click();
  await expect(page.getByText("מיה כורכת את הצעיף", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "הלקוח הבא" }).click();
  await page.getByRole("button", { name: "בחירת תיק 1", exact: true }).click();
  await page.getByRole("button", { name: "למסור ליואב" }).click();
  await expect(page.getByRole("status")).toContainText("שניהם נראים מתאימים");
  await page.getByRole("button", { name: "בדיקת חפץ 1" }).click();
  await expect(page.getByText("מאחורי הספסל", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "לשאול על מקום המציאה" }).click();
  await expect(page.getByRole("status")).toContainText("It was beside the bench.");
  await screenshot("bags");
  await page.reload();
  await page.getByRole("button", { name: "משחקונים", exact: true }).click();
  await page.getByRole("button", { name: "מחלקת האבידות של פיצי" }).click();
  await expect(page.getByRole("dialog", { name: "הפסקה" })).toBeVisible();
  await screenshot("resume");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("It was beside the bench.");
  await page.getByRole("button", { name: "בחירת תיק 2", exact: true }).click();
  await page.getByRole("button", { name: "למסור ליואב" }).click();
  await page.getByRole("button", { name: "הלקוח הבא" }).click();
  await page.getByRole("button", { name: "עזרה", exact: true }).click();
  await screenshot("help");
  await page.getByRole("button", { name: "הדגימו איזה חפץ למסור" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "למסור לנטע" }).click();
  await expect(page.getByText("נטע פורשת מפה", { exact: false })).toBeVisible();
  await screenshot("complete");
  await page.getByRole("button", { name: "למשחקונים" }).click();
  await expect(page.getByRole("heading", { name: "משחקונים בתחנה" })).toBeVisible();
  await expect(page.getByTestId("balance")).toContainText("0");
  expect(errors).toEqual([]);
});
}
