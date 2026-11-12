import { test, expect, type Page } from "@playwright/test";
import { sceneryAssets, stageOneScenery } from "../../src/content/gatesScenery";
import { gateDistances } from "../../src/content/gates";
async function open(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
}
async function fits(page: Page) {
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth <= innerWidth,
    height: document.documentElement.scrollHeight <= innerHeight,
  }))).toEqual({ width: true, height: true });
  for (const box of await page.locator(".gates-screen button:visible, .gate-prototype-dialog, .gate-prototype-help").all()) {
    const bounds = await box.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual((await page.evaluate(() => innerWidth)) + 1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual((await page.evaluate(() => innerHeight)) + 1);
  }
}
for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
  test(`four-gate farm fits ${width}×${height} including instructions and pause`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    await fits(page);
    await expect(page.getByTestId("locked-gate")).toHaveCount(5);
    await expect(page.getByRole("group", { name: /^שער [עיחל]: סגור$/ })).toHaveCount(4);
    // Every prop is an independent instance, and every standalone SVG must load.
    const props = page.locator("[data-scenery-id]");
    await expect(props).toHaveCount(stageOneScenery.length);
    const files = [...new Set(Object.values(sceneryAssets).map((asset) => asset.file))];
    expect(await page.evaluate(async (files) => Promise.all(files.map((file) => new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth > 0);
      image.onerror = () => resolve(false);
      image.src = `/assets/gates/scenery/${file}`;
    }))), files)).toEqual(files.map(() => true));
    await page.getByRole("button", { name: "מתחילים", exact: true }).click();
    await fits(page);
    await page.getByRole("button", { name: "הפסקה", exact: true }).click();
    await fits(page);
    await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
    await fits(page);
    await page.screenshot({ path: test.info().outputPath("farm.png") });
  });
}
test("physical Hebrew keys, closed-gate queues, return trip and cleanup", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await open(page);
  await page.clock.install();
  await page.getByRole("button", { name: "מתחילים", exact: true }).click();
  const progress = () => page.getByTestId("sheep-0").getAttribute("data-progress").then(Number);
  async function seconds(count: number) {
    // Advance frames rather than jumping: the simulation deliberately caps large deltas.
    await page.clock.runFor(count * 1000);
  }
  for (const [index, code] of ["KeyG", "KeyH", "KeyJ", "KeyK"].entries()) {
    await seconds(16);
    expect(await progress()).toBeCloseTo(gateDistances[index] - 40, 0);
    await page.getByRole("application").dispatchEvent("keydown", { code, key: ["ע", "י", "ח", "ל"][index] });
    await seconds(1);
    await expect(page.getByTestId(`gate-${index}`)).toHaveAttribute("data-open", "true");
    await seconds(3);
    expect(await progress()).toBeGreaterThan(gateDistances[index]);
  }
  const farm = page.locator(".gate-prototype");
  for (let step = 0; step < 60 && await farm.getAttribute("data-phase") === "out"; step++) await seconds(0.5);
  await expect(farm).toHaveAttribute("data-phase", "regroup");
  await expect(page.locator(".gate-prototype-overlay")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "מחזירים הביתה" })).toHaveCount(0);
  await seconds(0.5);
  const tint = Number(await page.getByTestId("dusk-tint").getAttribute("opacity"));
  expect(tint).toBeGreaterThan(0);
  expect(tint).toBeLessThan(0.32);
  const parked = await progress();
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  const pausedTint = await page.getByTestId("dusk-tint").getAttribute("opacity");
  await seconds(4);
  await expect(farm).toHaveAttribute("data-phase", "regroup");
  expect(await progress()).toBe(parked);
  expect(await page.getByTestId("dusk-tint").getAttribute("opacity")).toBe(pausedTint);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await seconds(3);
  await expect(farm).toHaveAttribute("data-phase", "back");
  expect(await progress()).toBeLessThan(parked);
  await expect(page.getByTestId("dusk-tint")).toHaveAttribute("opacity", "0.32");
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await fits(page);
  }
  await page.screenshot({ path: test.info().outputPath("dusk.png") });
  for (const code of ["KeyK", "KeyJ", "KeyH", "KeyG"]) {
    await seconds(30);
    await page.getByRole("application").press(code);
    await seconds(4);
  }
  await seconds(20);
  await expect(page.getByRole("heading", { name: "כל הכבשים בבית! 🐑" })).toBeVisible();
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await fits(page);
  }
  await page.getByRole("button", { name: "משחק חדש", exact: true }).click();
  await expect(farm).toHaveAttribute("data-phase", "ready");
  await expect(page.getByTestId("dusk-tint")).toHaveAttribute("opacity", "0");
  await page.getByRole("button", { name: "חזרה לבית", exact: true }).click();
  await expect(page.locator(".gate-prototype")).toHaveCount(0);
  await seconds(2);
  expect(errors).toEqual([]);
});
