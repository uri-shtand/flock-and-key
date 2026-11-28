import { expect, test } from "@playwright/test";
import { desktopSizes, vocabularyWalkthrough } from "./vocabularyWalkthrough";

for (const [width, height] of desktopSizes) {
  test(`changes place, then status, at ${width}×${height}`, async ({ page }) => {
    const { press, button, capture, resume, finish } = await vocabularyWalkthrough(page, "message-relay", "רדיו התחנה", width, height);
    const status = page.getByRole("status");
    await press("בית הקפה");
    await expect(page.getByText("הלהקה בתחנה · מתכנסים")).toBeVisible();
    await press("להעביר ללהקה");
    await expect(status).toContainText("נכנסה לבית הקפה");
    await capture("wrong-place");
    await button("הרחבה מעבר לרחוב").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("הלהקה בבית הקפה · מתכנסים")).toBeVisible();
    await press("להעביר ללהקה");
    await press("להתחיל");
    await press("להעביר ללהקה");
    await expect(status).toContainText("העיכוב");
    await expect(page.getByText("הלהקה ברחבה מעבר לרחוב · מתכנסים")).toBeVisible();
    await capture("early");
    await press("עזרה");
    await capture("help");
    await press("הדגימו בחירה");
    await expect(button("להמתין")).toHaveAttribute("aria-pressed", "true");
    await press("להעביר ללהקה");
    await expect(page.getByText("הלהקה ברחבה מעבר לרחוב · ממתינים")).toBeVisible();
    await expect(button("להתחיל את החזרה")).toHaveCount(0);
    await capture("waiting");
    await resume();
    await expect(status).toContainText("הנרתיקים סגורים");
    await press("לקבל עדכון חדש");
    await expect(page.getByText("We are ready now.")).toBeVisible();
    await expect(page.getByText("הלהקה ברחבה מעבר לרחוב · ממתינים")).toBeVisible();
    await press("להתחיל את החזרה");
    await expect(status).toContainText("פתחה את החזרה");
    await expect(page.getByText("הלהקה ברחבה מעבר לרחוב · מנגנים")).toBeVisible();
    await finish();
  });
}
