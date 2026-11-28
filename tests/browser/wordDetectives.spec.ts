import { expect, test } from "@playwright/test";
import { desktopSizes, vocabularyWalkthrough } from "./vocabularyWalkthrough";

for (const [width, height] of desktopSizes) {
  test(`investigates the missing lantern at ${width}×${height}`, async ({ page }) => {
    const { press, button, capture, resume, finish } = await vocabularyWalkthrough(page, "word-detectives", "מועדון המילים החשאיות", width, height);
    const status = page.getByRole("status");
    await press("לבדוק את הכרזה");
    await expect(status).toContainText("מההצגה הקודמת");
    if (width !== 1024) {
      await press("לכיכר");
      await press("לבדוק את הבמה");
      await expect(status).toContainText("זרקורים");
      await capture("wrong-lead");
    }
    if (width !== 1440) {
      await press("לבית הקפה");
      await press("לקרוא פתק רשות");
      await expect(status).toContainText("Can I borrow");
      await press("לבדוק את מגירת המפות");
      await expect(status).toContainText("now in the square");
      await press("מחברת רמזים");
      await expect(page.getByText("מגירת המפות · שולחן המפות הועבר לכיכר.")).toBeVisible();
      await capture("notebook");
      await press("לחזור לחקירה");
    }
    await press("לכיכר");
    if (width === 1024) {
      await press("לבדוק את הבמה");
      await expect(status).toContainText("זרקורים");
      await capture("wrong-lead");
    }
    await press("עזרה");
    await capture("help");
    await page.keyboard.press("Escape");
    await button("לבדוק את שולחן המפות").focus();
    await page.keyboard.press("Enter");
    await expect(status).toContainText("הפנס נמצא מתחת ללוח");
    if (width === 1440) {
      await expect(status).toContainText("השלמת מידע מעוזר המפות");
      await expect(status).toContainText("העבירו את שולחן המפות");
    } else {
      await expect(status).not.toContainText("השלמת מידע מעוזר המפות");
    }
    await capture("found");
    await resume();
    await expect(status).toContainText("הפנס נמצא מתחת ללוח");
    await press("להחזיר את הפנס למדף");
    await expect(status).toContainText("החזיר את הפנס");
    await finish();
  });
}
