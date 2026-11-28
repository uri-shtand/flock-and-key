import { expect, test } from "@playwright/test";
import { desktopSizes, vocabularyWalkthrough } from "./vocabularyWalkthrough";

for (const [width, height] of desktopSizes) {
  test(`edits a sandwich and serves either half at ${width}×${height}`, async ({ page }) => {
    const { press, button, capture, resume, finish } = await vocabularyWalkthrough(page, "cafe-shift", "המשמרת בבית הקפה", width, height);
    await press("גבינה");
    await press("עגבנייה");
    await press("להגיש למיה");
    await expect(page.getByRole("status")).toContainText("בלי עגבנייה");
    await capture("correction");
    await expect(button("גבינה")).toHaveAttribute("aria-pressed", "true");
    await press("עגבנייה");
    await press("להגיש למיה");
    await press("ההזמנה הבאה");
    await press("גבינה");
    await press("לחלק לשניים");
    await capture("split");
    const half = width === 1280 ? "לארוז חצי 1" : "לארוז חצי 2";
    await button(half).focus();
    await page.keyboard.press("Enter");
    await resume();
    await expect(button("לפתוח אריזה")).toBeVisible();
    await press("לפתוח אריזה");
    await press("לחבר חצאים");
    await expect(button("גבינה")).toHaveAttribute("aria-pressed", "true");
    await press("לחלק לשניים");
    await press(half);
    await press("להגיש ליואב");
    await expect(page.getByRole("status")).toContainText("לתיק הטיול");
    await capture("served-half");
    await press("ההזמנה הבאה");
    await press("עזרה");
    await capture("help");
    await page.keyboard.press("Escape");
    await press("עגבנייה");
    await press("להגיש לנטע");
    await expect(page.getByRole("status")).toContainText("המשמרת הסתיימה");
    await finish();
  });
}
