import { gearSlot } from "../../src/content/gatesShifter";
import { test, expect, type Page } from "@playwright/test";
import { sceneryAssets, stageOneScenery } from "../../src/content/gatesScenery";
import { gateDistances, gateControls, routeForLevel } from "../../src/content/gates";
async function open(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
}
async function fits(page: Page) {
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth <= innerWidth,
    height: document.documentElement.scrollHeight <= innerHeight,
  }))).toEqual({ width: true, height: true });
  // The map clips decorative layers: dialogs must also fit INSIDE that clipping ancestor.
  for (const dialog of await page.locator("div.gate-prototype-dialog, .gate-machine-panel, .gate-farm-note").all()) {
    const bounds = (await dialog.boundingBox())!;
    const world = (await page.locator(".gate-prototype-world").boundingBox())!;
    expect(bounds.y).toBeGreaterThanOrEqual(world.y - 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(world.y + world.height + 1);
  }
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
  test(`farm fits ${width}×${height} including instructions and pause`, async ({ page }) => {
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

for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
  test(`help and tuning lab fit ${width}×${height} and use real configuration`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    await page.getByRole("button", { name: "איך משחקים?" }).click();
    await fits(page);
    await page.getByRole("button", { name: "הבנתי", exact: true }).click();
    await page.getByRole("button", { name: "מעבדת הכיף", exact: true }).click();
    await fits(page);
    await page.getByLabel("שלב לניסוי").selectOption("5");
    await page.getByLabel("כבשים בעדר", { exact: true }).fill("6");
    await page.getByLabel("זמן שער פתוח", { exact: true }).fill("1.8");
    await page.getByLabel("זמן תיבת ההילוכים", { exact: true }).fill("0.3");
    await page.getByLabel("פחות תנועה", { exact: true }).check();
    await page.getByRole("button", { name: "העתקת הגדרות", exact: true }).click();
    await fits(page);
    await page.screenshot({ path: test.info().outputPath("fun-lab.png") });
    const config = JSON.parse(await page.getByLabel("הגדרות JSON").inputValue());
    expect(config).toMatchObject({ level: 5, sheepCount: 6, openSeconds: 1.8, gearboxSeconds: 0.3, reducedMotion: true });
    await page.getByRole("button", { name: "החלה וסיבוב חדש", exact: true }).click();
    await expect(page.locator(".gate-prototype")).toHaveAttribute("data-level", "5");
    await expect(page.locator(".gate-prototype")).toHaveAttribute("data-still", "true");
    await expect(page.locator('[data-testid^="sheep-"]')).toHaveCount(6);
    await page.screenshot({ path: test.info().outputPath("level-five-ready.png") });
    await page.getByRole("button", { name: "מתחילים", exact: true }).click();
    await page.getByRole("button", { name: "הפסקה", exact: true }).click();
    const position = await page.getByTestId("sheep-0").getAttribute("data-progress");
    await page.reload();
    await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
    await expect(page.getByRole("heading", { name: "המשחק בהפסקה" })).toBeVisible();
    await expect(page.getByTestId("sheep-0")).toHaveAttribute("data-progress", position!);
    await fits(page);
    await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
    await page.getByRole("button", { name: "מעבדת הכיף", exact: true }).click();
    await expect(page.getByLabel("זמן שער פתוח", { exact: true })).toHaveValue("1.8");
    await page.keyboard.press("Escape");
    await expect(page.locator(".gate-lab")).toHaveCount(0);
  });
}

test("five rounds are playable through the UI, with safe help and persistent medals", async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => { if (e.type() === "error") errors.push(e.text()); });
  await open(page);
  await page.clock.install();
  for (let level = 1; level <= 5; level++) {
    await expect(page.locator(".gate-prototype")).toHaveAttribute("data-level", String(level));
    await page.getByRole("button", { name: "מתחילים", exact: true }).click();
    let usedHelp = false;
    for (let i = 0; i < 160; i++) {
      if (await page.locator(".gate-prototype").getAttribute("data-phase") === "done") break;
      const key = page.locator(".gate-prototype-key.is-next");
      const letter = await key.count() ? (await key.innerText()).trim() : "";
      const index = gateControls.findIndex((control) => control.hebrew === letter);
      const positions = await page.locator('[data-testid^="sheep-"]').evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("data-progress"))));
      const near = index >= 0 && positions.some((p) => Math.abs(p - routeForLevel(level).gateDistances[index]) < 200);
      if (near && await key.getAttribute("aria-disabled") === "false") {
        if (!usedHelp) {
          await page.getByRole("button", { name: "עזרה בשער", exact: true }).click(); usedHelp = true;
        } else await key.click();
      }
      await page.clock.runFor(1000);
    }
    await expect(page.getByRole("heading", { name: "כל הכבשים בבית! 🐑" })).toBeVisible();
    await expect(page.getByText(/עזרה: 1/)).toBeVisible();
    for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await fits(page);
    }
    await page.screenshot({ path: test.info().outputPath(`level-${level}-done.png`) });
    if (level < 5) await page.getByRole("button", { name: "לשלב הבא", exact: true }).click();
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("flock-key-gates-v1")!));
  expect(saved.best.every((n: number) => n > 0)).toBe(true);
  expect(errors).toEqual([]);
});

test("invalid save recovers without touching word progress; blocked storage remains playable", async ({ page }) => {
  await page.goto("/");
  const wordsBefore = await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2"));
  await page.evaluate(() => localStorage.setItem("flock-key-gates-v1", '{"version":1,"game":{}}'));
  await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
  await expect(page.getByText("שמירת השערים לא נקראה. אפשר להתחיל סיבוב חדש.")).toBeVisible();
  await page.getByRole("button", { name: "מתחילים", exact: true }).click();
  await expect(page.locator(".gate-prototype")).toHaveAttribute("data-phase", "out");
  expect(await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2"))).toBe(wordsBefore);
  await page.getByRole("button", { name: "חזרה לבית", exact: true }).click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Blocked", "QuotaExceededError"); }; });
  await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
  await expect(page.getByText("השמירה המקומית אינה זמינה. אפשר להמשיך לשחק.")).toBeVisible();
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect(page.getByRole("button", { name: "עזרה בשער", exact: true })).toBeEnabled();
});

test("gearbox feedback pauses, ignores composition and modifiers, and help freezes time", async ({ page }) => {
  await open(page);
  await page.clock.install();
  await page.getByRole("button", { name: "מתחילים", exact: true }).click();
  const world = page.getByRole("application");
  for (const flags of [{ isComposing: true }, { repeat: true }, { ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
    await world.dispatchEvent("keydown", { code: "KeyG", key: "ע", ...flags });
    await expect(page.getByTestId("gearbox")).toHaveAttribute("data-working", "false");
  }
  await world.dispatchEvent("keydown", { code: "KeyG", key: "ע" });
  await page.clock.runFor(150);
  await expect(page.getByTestId("gearbox")).toHaveAttribute("data-working", "true");
  await page.getByRole("button", { name: "איך משחקים?", exact: true }).click();
  await expect(page.getByRole("heading", { name: "דשא, שערים וקצת תזמון" })).toBeVisible();
  const machineBefore = await page.getByTestId("gearbox").innerHTML();
  const positionBefore = await page.getByTestId("sheep-0").getAttribute("data-progress");
  await page.clock.runFor(3000);
  expect(await page.getByTestId("gearbox").innerHTML()).toBe(machineBefore);
  expect(await page.getByTestId("sheep-0").getAttribute("data-progress")).toBe(positionBefore);
  await page.getByRole("button", { name: "הבנתי", exact: true }).click();
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await page.clock.runFor(400);
  await expect(page.getByTestId("gearbox")).toHaveAttribute("data-working", "false");
  await expect(page.getByTestId("gate-0")).toHaveAttribute("data-open", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".gate-prototype")).toHaveAttribute("data-still", "true");
});

test("levels unlock actual route gates and every physical key has a distinct persistent truck gear", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.clock.install();
  for (const [levelIndex, count] of [4, 5, 6, 7, 9].entries()) {
    const level = levelIndex + 1;
    await page.getByRole("navigation", { name: "בחירת שלב" }).getByRole("button").nth(levelIndex).click();
    await expect(page.getByTestId("locked-gate")).toHaveCount(9 - count);
    await expect(page.locator('[data-testid^="gate-"]')).toHaveCount(count);
    if (level > 1) await expect(page.getByTestId("active-route").locator("path").first()).toHaveAttribute("d", routeForLevel(level).path);
    await page.getByRole("button", { name: "מתחילים", exact: true }).click();
    for (const [index, control] of gateControls.slice(0, count).entries()) {
      await page.getByRole("application").dispatchEvent("keydown", { code: control.code, key: control.hebrew });
      await page.clock.runFor(500);
      await expect(page.getByTestId("gearbox")).toHaveAttribute("data-selected-gate", String(index));
      const point = gearSlot(index);
      await expect(page.getByTestId("gear-knob")).toHaveAttribute("transform", `translate(${point.x} ${point.y})`);
    }
    await page.getByRole("button", { name: "הפסקה", exact: true }).click();
    const knob = await page.getByTestId("gear-knob").getAttribute("transform");
    await page.clock.runFor(1000);
    await expect(page.getByTestId("gear-knob")).toHaveAttribute("transform", knob!);
    for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await fits(page);
    }
    await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
    await page.screenshot({ path: test.info().outputPath(`unlocked-${level}.png`) });
    if (level === 5) {
      await page.setViewportSize({ width: 1024, height: 600 });
      await fits(page);
      await page.screenshot({ path: test.info().outputPath("nine-gates-1024.png") });
    }
  }
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  const before = await page.getByTestId("gear-knob").getAttribute("transform");
  await page.reload();
  await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
  await expect(page.getByTestId("gear-knob")).toHaveAttribute("transform", before!);
  expect(errors).toEqual([]);
});

test("upgrading the older route keeps medals and starts the revised level safely", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("flock-key-gates-v1", JSON.stringify({ version: 1, game: { config: { level: 2, speed: 145, sheepCount: 4, openSeconds: 3, gearboxSeconds: 0.45, hints: false, reducedMotion: true } }, best: [3, 2, 0, 0, 0] })));
  await page.getByRole("button", { name: "🐑 שומרי השערים (משחקון 5)" }).click();
  await expect(page.getByText("המסלול עודכן: השלב מתחיל מחדש. המדליות והעדפות העזרה נשמרו.")).toBeVisible();
  await expect(page.locator(".gate-prototype")).toHaveAttribute("data-phase", "ready");
  await expect(page.locator('[data-testid^="gate-"]')).toHaveCount(5);
  await fits(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("flock-key-gates-v1")!));
  expect(saved).toMatchObject({ version: 2, best: [3, 2, 0, 0, 0], game: { config: { hints: false, reducedMotion: true, openSeconds: 2 } } });
});
