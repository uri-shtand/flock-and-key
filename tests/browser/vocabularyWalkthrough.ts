import { expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

export const desktopSizes = [[1024, 600], [1280, 720], [1440, 900]] as const;

export async function vocabularyWalkthrough(page: Page, id: string, title: string, width: number, height: number) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width, height });
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  const press = (name: string) => button(name).click();
  const open = async () => { await press("משחקונים"); await press(title); };
  await page.goto("/");
  await open();
  const folder = `output/playwright/vocabulary/${id}`;
  await mkdir(folder, { recursive: true });
  async function capture(name: string) {
    expect(await page.evaluate(() => {
      const root = document.documentElement;
      const dialog = document.querySelector("dialog[open]");
      const area = dialog ?? document.querySelector(".vocabulary-panel");
      if (!area || root.scrollHeight > innerHeight || root.scrollWidth > innerWidth) return false;
      return [...area.querySelectorAll("button")].every(button => {
        const box = button.getBoundingClientRect();
        if (!box.width) return true;
        if (box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight) return false;
        if (!button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))) return false;
        for (let parent = button.parentElement; parent; parent = parent.parentElement) {
          const bounds = parent.getBoundingClientRect();
          const style = getComputedStyle(parent);
          if (/hidden|clip|auto|scroll/.test(style.overflowX) && (box.left < bounds.left || box.right > bounds.right)) return false;
          if (/hidden|clip|auto|scroll/.test(style.overflowY) && (box.top < bounds.top || box.bottom > bounds.bottom)) return false;
        }
        return true;
      });
    })).toBe(true);
    await page.screenshot({ path: `${folder}/${width}-${name}.png` });
  }
  async function resume() {
    await page.reload();
    await open();
    await expect(page.getByRole("dialog", { name: "הפסקה" })).toBeVisible();
    await capture("resume");
    await page.keyboard.press("Enter");
  }
  async function finish() {
    await capture("complete");
    await press("למשחקונים");
    await expect(page.getByRole("heading", { name: "משחקונים בתחנה" })).toBeVisible();
    await expect(page.getByTestId("balance")).toContainText("0");
    expect(errors).toEqual([]);
  }
  return { press, button, capture, resume, finish };
}
