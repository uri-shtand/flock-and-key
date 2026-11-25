import { test, expect, type Page } from "@playwright/test";
import words from "../../src/content/words.json" with { type: "json" };
const storageKey = "flock-and-key:game:v2";
async function quiet(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "יוצאים לחקירה ←", exact: true })).toBeEnabled();
}
async function start(page: Page, mode?: string, difficulty?: number) {
  if (mode)
    await page
      .getByRole("button")
      .filter({ has: page.getByText(mode, { exact: true }) })
      .click();
  else
    await page
      .getByRole("button", { name: "יוצאים לחקירה ←", exact: true })
      .click();
  await page
    .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
    .click();
  if (difficulty) await page.getByRole("radio", { name: new RegExp(`${difficulty} ·`) }).check();
  await page
    .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
    .click();
}
async function expectedWord(page: Page) {
  return page.evaluate((key) => {
    const p = JSON.parse(localStorage.getItem(key)!);
    const s = p.sessions.find((s: { id: string }) => s.id === p.currentId);
    return s.tasks[s.stage][s.index].expected as string;
  }, storageKey);
}
async function submit(page: Page, word: string) {
  await page.getByRole("textbox").fill(word);
  await page.getByRole("textbox").press("Enter");
}

test("Hebrew correction, physical keys, exact position and prizes survive refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await quiet(page);
  await start(page);
  expect(await page.locator("canvas").count()).toBe(1);
  await expect(
    page.getByRole("img", {
      name: "ידיים בתנוחת הקלדה על המקלדת העברית",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("guided.png"),
    fullPage: true,
  });
  await page
    .getByRole("textbox")
    .dispatchEvent("keydown", { key: "ד", code: "KeyS" });
  await submit(page, "דק");
  await expect(page.getByRole("status")).toContainText("אפשר לתקן");
  await page.getByRole("textbox").press("Backspace");
  await page.keyboard.insertText("ג");
  await page.getByRole("textbox").press("Enter");
  await expect(page.getByRole("status")).toContainText("כל הכבוד");
  await expect(page.getByTestId("balance")).toContainText("8");
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  await page.getByRole("textbox").fill("ג");
  await page.reload();
  await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו" }).click();
  await expect(page.getByRole("textbox")).toHaveValue("ג");
  await expect(
    page
      .getByRole("region", { name: "אבא מציג את המילה" })
      .getByTestId("target-word"),
  ).toHaveText("גל");
  await expect(page.getByRole("textbox")).toHaveAccessibleName(
    "כתבו על הארגז את המילה שאבא מבקש",
  );
  await expect(page.getByText("הדוגמה לשלט החדש", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "התקדמות וטעויות" }),
  ).toBeVisible();
  await expect(page.locator("tbody").last()).toContainText("דק");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions[0]
          .attempts[0].physicalCodes,
    ),
  ).toContain("KeyS");
  expect(errors).toEqual([]);
});

test("spelling hides the answer, plays local audio and retains exposure classification on reload", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const remote: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const localOrigin = new URL(baseURL!).origin;
  page.on("request", (r) => {
    // A fresh test server may use a different local port from the user's server.
    const origin = new URL(r.url()).origin.replace(/^ws/, "http");
    if (origin !== localOrigin) remote.push(r.url());
  });
  await quiet(page);
  const clipResponse = page.waitForResponse(
    (response) => response.url().includes("/audio/words/") && response.ok(),
  );
  await start(page, "הדואר המבולבל");
  await clipResponse;
  const word = await expectedWord(page);
  await expect(page.getByTestId("revealed-word")).toHaveCount(0);
  await expect(page.getByTestId("target-word")).toHaveCount(0);
  const duration = await page.evaluate(
    (path) =>
      new Promise<number>((resolve, reject) => {
        const clip = new Audio(path);
        clip.onloadedmetadata = () => resolve(clip.duration);
        clip.onerror = () => reject(Error("audio decode failed"));
      }),
    words.find((w) => w.text === word)!.audio,
  );
  expect(duration).toBeGreaterThan(2);
  await page.getByRole("button", { name: "רמז ראשון", exact: true }).click();
  await expect(page.getByText("האות הראשונה:", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "הצגת המילה", exact: true }).click();
  await expect(page.getByTestId("revealed-word")).toHaveText(word);
  await page.reload();
  await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו" }).click();
  await expect(page.getByTestId("revealed-word")).toHaveText(word);
  // The child can submit after the clip ends; disable speech to avoid depending on audio duration.
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await submit(page, word);
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
  const a = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
      .sessions.at(-1)
      .attempts.at(-1),
  );
  expect(a.aid).toBe("copy");
  expect(a.points).toBe(10);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test("composition is not validated until committed and paste never earns an independent spelling result", async ({
  page,
}) => {
  await quiet(page);
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page, "הדואר המבולבל");
  const word = await expectedWord(page);
  const input = page.getByRole("textbox");
  await input.dispatchEvent("compositionstart");
  await input.fill(word);
  await input.press("Enter");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(
          -1,
        ).attempts.length,
    ),
  ).toBe(0);
  await input.dispatchEvent("compositionend", { data: word });
  await input.dispatchEvent("paste");
  await input.press("Enter");
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
          .sessions.at(-1)
          .attempts.at(-1).pasted,
    ),
  ).toBe(true);
});

test("complete the available chapter, skip difficulty, decorate the world and export real history", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1024, height: 600 });
  await quiet(page);
  await page.clock.install({ time: new Date("2026-11-11T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-11T12:00:01Z"));
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page);
  for (const stage of [0, 2]) {
    if (stage > 0) {
      await fitsViewport(page);
      await page
        .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
        .click();
      await page
        .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
        .click();
    }
    await fitsViewport(page);
    const length = stage === 2 ? 10 : 8;
    for (let index = 0; index < length; index++) {
      if (stage === 2 && index === 1)
        await page
          .getByRole("button", {
            name: "דילוג על המילה",
            exact: true,
          })
          .click();
      else await submit(page, await expectedWord(page));
      await expect(page.getByRole("textbox")).toBeDisabled();
      await fitsViewport(page);
      await page
        .getByRole("button", {
          name: stage === 2 && index === 1 ? "למשימה הבאה ←" : "המשך עכשיו ←",
          exact: true,
        })
        .click();
    }
    await fitsViewport(page);
    await page
      .getByRole("button", {
        name: stage === 2 ? "לסיום ←" : "ממשיכים בעקבות הרמז ←",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "הכבשים התאמנו למופע פעמונים!" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "משנים את החווה ←", exact: true })
    .click();
  await fitsViewport(page);
  const hat = page.locator("article").filter({ hasText: "כובע בלשי לפיצי" });
  await hat.getByRole("button", { name: "לפתוח", exact: true }).click();
  await expect(hat.getByRole("button")).toHaveText("להוריד");
  await page.reload();
  await page
    .getByRole("button", { name: "משנים את החווה", exact: true })
    .click();
  await expect(hat.getByRole("button")).toHaveText("להוריד");
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ייצוא JSON מלא", exact: true })
    .click();
  const file = await downloaded;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.sessions[0].status).toBe("completed");
  expect(exported.sessions[0].attempts).toHaveLength(18);
  expect(exported.owned).toContain("hat");
  expect(
    exported.sessions[0].attempts.some((a: { skipped: boolean }) => a.skipped),
  ).toBe(true);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("recall after a reveal in this session is kept separate from independent spelling", async ({
  page,
}) => {
  await quiet(page);
  await start(page, "הדואר המבולבל");
  await page.getByRole("button", { name: "דילוג על ההקראה", exact: true }).click();
  const first = await expectedWord(page);
  await page
    .getByRole("button", { name: "צריכים להעתיק?", exact: true })
    .click();
  await submit(page, first);
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  for (let i = 1; i < 8; i++) {
    await page
      .getByRole("button", { name: "דילוג על המילה", exact: true })
      .click();
    await page
      .getByRole("button", { name: "למשימה הבאה ←", exact: true })
      .click();
  }
  expect(await expectedWord(page)).toBe(first);
  await page.getByRole("button", { name: "דילוג על ההקראה", exact: true }).click();
  await submit(page, first);
  await expect(page.getByRole("status")).toContainText("אחרי שראינו אותה קודם");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
          .sessions.at(-1)
          .attempts.at(-1).aid,
    ),
  ).toBe("recall");
});

test("missing audio offers an explicit copying fallback rather than blocking the story", async ({
  page,
}) => {
  await page.route("**/audio/words/*.mp3", (route) => route.abort());
  await quiet(page);
  await start(page, "הדואר המבולבל");
  await expect(page.getByRole("alert")).toContainText("ההקראה לא נטענה");
  await page
    .getByRole("button", { name: "צריכים להעתיק?", exact: true })
    .click();
  await submit(page, await expectedWord(page));
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
  await expect(
    page.getByRole("button", { name: "המשך עכשיו ←", exact: true }),
  ).toBeVisible();
});

test("engagement time and farm animation stop during a break, and the farm respects reduced motion", async ({
  page,
}) => {
  await page.addInitScript(key => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({
      version: 2, sessions: [], currentId: null, balance: 0, earned: 240,
      owned: ["dance"], equipped: ["dance"], knownCodes: [],
      settings: { music: false, speech: false },
    }));
  }, storageKey);
  await quiet(page);
  await start(page, "הדואר המבולבל");
  await page.bringToFront();
  const engagement = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(
          -1,
        ).playMs as number,
    );
  await expect.poll(engagement).toBeGreaterThan(0);
  const canvas = page.locator(".stage canvas");
  const moving = await canvas.screenshot();
  await expect.poll(async () => (await canvas.screenshot()).equals(moving)).toBe(false);
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  const paused = await engagement();
  const frozen = await canvas.screenshot();
  await page.waitForTimeout(1100);
  expect(await engagement()).toBe(paused);
  expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect.poll(engagement).toBeGreaterThan(paused);
  await expect.poll(async () => (await canvas.screenshot()).equals(frozen)).toBe(false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const settled = await canvas.screenshot();
  await page.waitForTimeout(400);
  expect((await canvas.screenshot()).equals(settled)).toBe(true);
});

test("spelling keyboard help finds keys without revealing or highlighting the answer", async ({
  page,
}) => {
  await quiet(page);
  await start(page, "הדואר המבולבל");
  await page
    .getByRole("button", { name: "פתיחת מקלדת עזר", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "מקלדת עברית לעזרה" }),
  ).toBeVisible();
  await expect(page.locator(".key.target")).toHaveCount(0);
  await expect(page.getByTestId("revealed-word")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "דילוג על ההקראה", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "בדיקה ←", exact: true })).toBeEnabled();
  await submit(page, await expectedWord(page));
  const attempt = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flock-and-key:game:v2")!)
      .sessions.at(-1)
      .attempts.at(-1),
  );
  expect(attempt.aid).toBe("independent");
  expect(attempt.keyboardHelp).toBe(true);
});

test("the sign-painting introduction explains the goal through separate character turns", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await quiet(page);
  await page.screenshot({
    path: test.info().outputPath("adventure-home.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "יוצאים לחקירה ←", exact: true })
    .click();
  const conversation = page.getByRole("list", { name: "שיחת הדמויות" });
  await expect(conversation.getByRole("listitem")).toHaveCount(3);
  await expect(conversation.getByRole("listitem").nth(0)).toContainText("אבא");
  await expect(conversation.getByRole("listitem").nth(0)).toContainText(
    "כל הכיתובים נמרחו",
  );
  await expect(conversation.getByRole("listitem").nth(1)).toContainText("תום");
  await expect(conversation.getByRole("listitem").nth(2)).toContainText(
    "נצבע מחדש את המילים על הארגזים",
  );
  await expect(
    page.getByRole("heading", { name: "המשימה: כותבים על הארגזים" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "אבא יציג מילה בבועה בצד ימין. כתבו אותה על הארגז בצד שמאל ולחצו Enter.",
      {
        exact: false,
      },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("sign-dialogue.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "מכירים את המשימה ←", exact: true })
    .click();
  await page
    .getByRole("button", { name: "מוכנים, מתחילים ←", exact: true })
    .click();
  await expect(page.getByRole("textbox")).toBeFocused();
  await submit(page, "דג");
  await expect(page.getByRole("status")).toContainText("כל הכבוד");
  expect(errors).toEqual([]);
});

test("desktop home fits without scrolling, also when resuming", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1024, height: 600 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const newChapter = page.getByRole("button", { name: "יוצאים לחקירה ←", exact: true })
      .or(page.getByRole("button", { name: "פרק חדש", exact: true }));
    await expect(newChapter).toBeEnabled();
    const fits = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollHeight <= innerHeight + 1 &&
          document.documentElement.scrollWidth <= innerWidth + 1,
      );
    await expect.poll(fits).toBe(true);
    for (const name of [
      "צובעים ארגזים",
      "הדואר המבולבל",
    ]) {
      const button = page
        .getByRole("button")
        .filter({ has: page.getByText(name, { exact: true }) });
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport({ ratio: 0.99 });
    }
    await page.screenshot({
      path: test
        .info()
        .outputPath(`home-${viewport.width}x${viewport.height}.png`),
      fullPage: true,
    });
    await newChapter.click();
    if (await page.getByRole("dialog").isVisible()) {
      await page.getByRole("button", { name: "מתחילים פרק חדש", exact: true }).click();
    }
    await page
      .getByRole("button", { name: "שמירה ויציאה", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }),
    ).toBeVisible();
    await expect.poll(fits).toBe(true);
  }
});

test("the chapter and standalone drafts survive switching, reload and cancelling a restart", async ({ page }) => {
  await quiet(page);
  await page.setViewportSize({ width: 1024, height: 600 });
  const version = await page.locator("footer time").getAttribute("datetime");
  expect(Number.isFinite(Date.parse(version!))).toBe(true);
  await expect(page.locator("footer time")).toBeInViewport();
  await start(page);
  await page.getByRole("textbox").fill("ד");
  const save = page.getByRole("button", { name: "שמירה ויציאה", exact: true });
  await save.click();
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  await start(page, "הדואר המבולבל");
  await expect(page.getByTestId("revealed-word")).toHaveText(await expectedWord(page));
  await page.getByRole("textbox").fill("מ");
  await save.click();
  await page.reload();
  await expect(page.locator("footer time")).toHaveAttribute("datetime", version!);
  await fitsViewport(page);
  await page.getByRole("button", { name: "פרק חדש", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "להתחיל את הפרק מחדש?" });
  await expect(dialog.getByRole("button", { name: "ביטול", exact: true })).toBeFocused();
  await expect(dialog).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath("restart-1024.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "להמשיך בפרק השמור", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue("ד");
  await save.click();
  await page.getByRole("button", { name: "להמשיך במשחקון השמור", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue("מ");
  await fitsViewport(page);
  await page.screenshot({ path: test.info().outputPath("quiet-post-resume-1024.png") });
  await page.getByRole("button", { name: "הקראה כבויה", exact: true }).click();
  await expect(page.getByTestId("revealed-word")).toHaveText(await expectedWord(page));
  await page.getByRole("button", { name: "דילוג על ההקראה", exact: true }).click();
  await submit(page, await expectedWord(page));
  await expect(page.getByRole("status")).toContainText("בעזרת המילה הכתובה");
});

test("correct answers advance automatically once, while mistakes, pause and navigation do not", async ({
  page,
}) => {
  await quiet(page);
  await page.clock.install({ time: new Date("2026-11-11T12:00:00Z") });
  // Control the feedback timer without replaying every Phaser animation frame.
  await page.clock.pauseAt(new Date("2026-11-11T12:01:00Z"));
  const textbox = page.getByRole("textbox");
  await start(page);
  await submit(page, "דק");
  await page.clock.fastForward(2500);
  await expect(textbox).toHaveValue("דק");
  await expect(textbox).toBeEnabled();
  await submit(page, "דג");
  await expect(textbox).toBeDisabled();
  await page.clock.fastForward(1500);
  await expect(textbox).toBeDisabled();
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  await expect(textbox).toHaveCount(0);
  await page.clock.fastForward(5000);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect(page.getByTestId("target-word")).toHaveText("דג");
  await expect(textbox).toBeDisabled();
  await page.clock.fastForward(2100);
  await expect(textbox).toBeEnabled();
  await expect(textbox).toBeFocused();
  await expect(page.getByTestId("target-word")).toHaveText("גל");
  await submit(page, "גל");
  await expect(textbox).toBeDisabled();
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  const resume = page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true });
  await expect(resume).toBeVisible();
  await page.clock.fastForward(5000);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(
          -1,
        ).index,
    ),
  ).toBe(1);
  await resume.click();
  await expect(textbox).toBeDisabled();
  await page.clock.fastForward(2100);
  await expect(textbox).toBeEnabled();
  await expect(page.getByTestId("target-word")).toHaveText(await expectedWord(page));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(-1).index)).toBe(2);
  for (let i = 2; i < 8; i++) {
    await expect(textbox).toBeEnabled();
    await submit(page, await expectedWord(page));
    await expect(textbox).toBeDisabled();
    await page.clock.fastForward(2100);
  }
  await expect(
    page.getByRole("heading", { name: "נייר מנצנץ עם ציור של תו מוזיקלי" }),
  ).toBeVisible();
  const attempts = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("flock-and-key:game:v2")!).sessions.at(-1)
        .attempts,
  );
  expect(attempts.filter((a: { correct: boolean }) => a.correct)).toHaveLength(
    8,
  );
  expect(
    new Set(
      attempts
        .filter((a: { correct: boolean }) => a.correct)
        .map((a: { task: number }) => a.task),
    ).size,
  ).toBe(8);
});

test("parent reset requires confirmation, supports cancellation and stays reset after refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await quiet(page);
  await start(page);
  await submit(page, "דג");
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  await submit(page, "גל");
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  await submit(page, await expectedWord(page));
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page
    .getByRole("button", { name: "משנים את החווה", exact: true })
    .click();
  await page
    .locator("article")
    .filter({ hasText: "כובע בלשי לפיצי" })
    .getByRole("button", { name: "לפתוח", exact: true })
    .click();
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await page.evaluate(() => localStorage.setItem("other-app", "keep"));
  const before = await page.evaluate(() =>
    localStorage.getItem("flock-and-key:game:v2"),
  );
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "לאפס את כל ההתקדמות?" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", {
      name: "ביטול, שומרים את ההתקדמות",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2")),
  ).toBe(before);
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "ביטול, שומרים את ההתקדמות", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2")),
  ).toBe(before);
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "כן, לאפס את ההתקדמות", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ההתקדמות אופסה");
  const reset = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("flock-and-key:game:v2")!),
  );
  expect(reset.sessions).toEqual([]);
  expect(reset.currentId).toBeNull();
  expect(reset.earned).toBe(0);
  expect(reset.balance).toBe(0);
  expect(reset.owned).toEqual([]);
  expect(reset.equipped).toEqual([]);
  expect(reset.knownCodes).toEqual([]);
  expect(reset.settings.music).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("other-app"))).toBe(
    "keep",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  await expect(
    page.getByText("עוד אין סשנים. הנתונים יופיעו אחרי תחילת משחק.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("a failed parent reset keeps the history available and reports failure", async ({
  page,
}) => {
  await quiet(page);
  await start(page);
  await submit(page, "דג");
  await page.getByRole("button", { name: "להורים", exact: true }).click();
  const before = await page.evaluate(() =>
    localStorage.getItem("flock-and-key:game:v2"),
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new Error("storage blocked");
    };
  });
  await page
    .getByRole("button", { name: "איפוס התקדמות", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "לאפס את כל ההתקדמות?" });
  await dialog
    .getByRole("button", { name: "כן, לאפס את ההתקדמות", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("ההתקדמות לא אופסה");
  expect(
    await page.evaluate(() => localStorage.getItem("flock-and-key:game:v2")),
  ).toBe(before);
  await dialog
    .getByRole("button", { name: "ביטול, שומרים את ההתקדמות", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ייצוא JSON מלא", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }),
  ).toBeVisible();
});

test("music is picked at stage entry, stays through tasks and resumes, and respects mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const clips: HTMLAudioElement[] = [];
    (window as unknown as { observedMusic: HTMLAudioElement[] }).observedMusic =
      clips;
    window.Audio = new Proxy(window.Audio, {
      construct(target, args) {
        const clip = Reflect.construct(target, args) as HTMLAudioElement;
        if (String(args[0]).endsWith(".wav")) clips.push(clip);
        return clip;
      },
    });
  });
  const music = () =>
    page.evaluate(() => {
      const clip = (
        window as unknown as { observedMusic: HTMLAudioElement[] }
      ).observedMusic.at(-1)!;
      return { path: clip.getAttribute("src"), paused: clip.paused };
    });
  await quiet(page);
  await start(page);
  const chosen = (await music()).path;
  expect(chosen).toMatch(/^\/audio\/.+\.wav$/);
  expect(chosen).not.toBe("/audio/farm-theme.wav");
  expect((await music()).paused).toBe(true);
  await page.getByRole("button", { name: "מוזיקה כבויה", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(false);
  const initialTitle = await page.locator("#track-title").textContent();
  await page.getByRole("button", { name: "מנגינה אחרת", exact: true }).click();
  await expect.poll(async () => (await music()).path).not.toBe(chosen);
  await expect(page.locator("#track-title")).not.toHaveText(initialTitle!);
  await expect.poll(async () => (await music()).paused).toBe(false);
  const manuallyChosen = (await music()).path;
  await submit(page, "דג");
  await expect(page.getByTestId("target-word")).toHaveText("גל");
  expect((await music()).path).toBe(manuallyChosen);
  await page.getByRole("button", { name: "הפסקה", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(true);
  await page.getByRole("button", { name: "ממשיכים", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(false);
  expect((await music()).path).toBe(manuallyChosen);
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page
    .getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true })
    .click();
  expect((await music()).path).toBe(manuallyChosen);
  await page.getByRole("button", { name: "מוזיקה פועלת", exact: true }).click();
  await expect.poll(async () => (await music()).paused).toBe(true);
  await page.getByRole("button", { name: "מנגינה אחרת", exact: true }).click();
  const mutedChoice = (await music()).path;
  expect(mutedChoice).not.toBe(manuallyChosen);
  expect((await music()).paused).toBe(true);
  for (let index = 1; index < 8; index++) {
    await page
      .getByRole("button", { name: "קשה כרגע? ממשיכים בסיפור", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: index === 7 ? "לרמז שמצאנו ←" : "למשימה הבאה ←",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "ממשיכים בעקבות הרמז ←", exact: true })
    .click();
  await expect.poll(async () => (await music()).path).not.toBe(mutedChoice);
  expect((await music()).paused).toBe(true);
});

test("retired games are hidden and their saved progress stays intact", async ({ page }) => {
  await quiet(page);
  await expect(page.getByText("פיצי במרדף", { exact: true })).toHaveCount(0);
  await expect(page.getByText("עקבות בחשיכה", { exact: true })).toHaveCount(0);
  await start(page);
  await page.evaluate(key => {
    const progress = JSON.parse(localStorage.getItem(key)!);
    const run = progress.sessions.find((s: { id: string }) => s.id === progress.currentId);
    run.stage = 1; run.phase = "play"; run.index = 2; run.standalone = true;
    localStorage.setItem(key, JSON.stringify(progress));
  }, storageKey);
  await page.reload();
  await expect(page.getByText(/המשחקון ששמרתם נח בינתיים/)).toBeVisible();
  await expect(page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו" })).toHaveCount(0);
  for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport); await fitsViewport(page);
  }
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).sessions[0].index, storageKey)).toBe(2);
  await start(page, "הדואר המבולבל");
  await expect(page.getByRole("textbox")).toBeVisible();
});

test("farm decorations can be bought, toggled and restored, including the expanded catalog", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await quiet(page); await start(page);
  await page.evaluate(key => {
    const p = JSON.parse(localStorage.getItem(key)!); p.balance = 2500; p.earned = 2500;
    localStorage.setItem(key, JSON.stringify(p));
  }, storageKey);
  await page.reload();
  await page.getByRole("button", { name: "משנים את החווה", exact: true }).click();
  await page.getByRole("button", { name: "לעוד שטויות ←", exact: true }).click();
  for (const article of await page.locator(".prize").all()) await article.getByRole("button", { name: "לפתוח", exact: true }).click();
  for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport); await fitsViewport(page);
    const clipped = await page.locator('.shop-screen .panel button:visible, .prize h2').evaluateAll(elements => elements.flatMap(el => {
      const rect = el.getBoundingClientRect(); let parent = el.parentElement;
      if (rect.top < 0 || rect.bottom > innerHeight || rect.left < 0 || rect.right > innerWidth) return [el.textContent];
      while (parent) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if ((/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2)) || (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < box.left - 2 || rect.right > box.right + 2))) return [el.textContent];
        parent = parent.parentElement;
      }
      return [];
    }));
    expect(clipped).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`new-decorations-${viewport.width}.png`) });
    await page.getByRole("button", { name: "לעמוד הקודם", exact: true }).click(); await fitsViewport(page);
    await page.getByRole("button", { name: "לעוד שטויות ←", exact: true }).click();
  }
  await page.getByRole("button", { name: "לעוד שטויות ←", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("עמוד 3 מתוך 3");
  await expect(page.getByText("420 פעמונים", { exact: true })).toBeVisible();
  for (const article of await page.locator(".prize").all()) await article.getByRole("button", { name: "לפתוח", exact: true }).click();
  for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await fitsViewport(page);
    for (const button of await page.locator(".prize button, .shop-pages button").all()) await expect(button).toBeInViewport({ ratio: 0.99 });
    await page.screenshot({ path: test.info().outputPath(`premium-decorations-${viewport.width}.png`) });
  }
  await page.getByRole("button", { name: "לעמוד הקודם", exact: true }).click();
  await page.locator(".prize").first().getByRole("button", { name: "להוריד", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "משנים את החווה", exact: true }).click();
  await page.getByRole("button", { name: "לעוד שטויות ←", exact: true }).click();
  await expect(page.locator(".prize").first().getByRole("button")).toHaveText("להפעיל");
  await expect(page.getByRole("button", { name: "להוריד", exact: true })).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("difficulty persists while saved games keep their original words and level", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await quiet(page);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await start(page, undefined, 3);
  const first = await expectedWord(page);
  expect(first.length).toBeGreaterThanOrEqual(4);
  await submit(page, first + "א");
  await expect(page.getByRole("status")).toContainText("אפשר לתקן");
  await submit(page, first);
  await expect(page.getByRole("status")).toContainText("כל הכבוד");
  await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  const next = await expectedWord(page);
  await page.getByRole("textbox").fill(next.slice(0, 2));
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }).click();
  await expect(page.getByText("רמה 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveValue(next.slice(0, 2));
  expect(await expectedWord(page)).toBe(next);
  for (let index = 1; index < 8; index++) {
    const expected = await expectedWord(page);
    if (index === 7) expect(expected.length).toBeGreaterThanOrEqual(8);
    await submit(page, expected);
    await expect(page.getByRole("status")).toContainText("כל הכבוד");
    await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  }
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page.getByRole("button", { name: "פרק חדש", exact: true }).click();
  await page.getByRole("button", { name: "מתחילים פרק חדש", exact: true }).click();
  await page.getByRole("button", { name: "מכירים את המשימה ←", exact: true }).click();
  await expect(page.getByRole("radio", { name: /4 · מתרגלים רצף/ })).toBeChecked();
  await page.getByRole("radio", { name: /1 · מתחילים/ }).check();
  await page.reload();
  await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }).click();
  await expect(page.getByRole("radio", { name: /1 · מתחילים/ })).toBeChecked();
  expect(errors).toEqual([]);
});

async function fitsViewport(page: Page) {
  try {
    await expect.poll(() => page.evaluate(() => ({
      width: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      height: Math.max(0, document.documentElement.scrollHeight - innerHeight),
    }))).toEqual({ width: 0, height: 0 });
  } catch (error) {
    await page.screenshot({ path: test.info().outputPath("overflow.png"), fullPage: true });
    console.log(await page.locator("main, .topbar, .play-panel, .section-title, .dialogue, .dialogue-thread, .dialogue-turn, .mission-brief, .world-column, footer").evaluateAll((elements) => elements.map((el) => ({
      className: el.className, height: el.getBoundingClientRect().height,
      top: el.getBoundingClientRect().top, margin: getComputedStyle(el).margin,
    }))));
    throw error;
  }
}
test("each mini-game proposes its own level and raises it only after a successful finish", async ({ page }) => {
  await quiet(page);
  await start(page, "צובעים ארגזים");
  for (let index = 0; index < 8; index++) {
    await submit(page, await expectedWord(page));
    await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
  }
  await page.reload();
  await start(page, "צובעים ארגזים", 1);
  // The proposal remains visible even when the child manually chooses another level.
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page.getByRole("button").filter({ has: page.getByText("צובעים ארגזים", { exact: true }) }).click();
  await page.getByRole("button", { name: "מכירים את המשימה ←", exact: true }).click();
  await expect(page.getByRole("radio", { name: /2 · מתקדמים/ })).toBeChecked();
  await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
  await page.getByRole("button").filter({ has: page.getByText("הדואר המבולבל", { exact: true }) }).click();
  await page.getByRole("button", { name: "מכירים את המשימה ←", exact: true }).click();
  await expect(page.getByRole("radio", { name: /1 · מתחילים/ })).toBeChecked();
});
test("game introductions, level selection, input, help, feedback and endings fit desktop viewports", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await quiet(page);
  await page.clock.install({ time: new Date("2026-11-11T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-11T12:00:01Z"));
  await page.getByRole("button", { name: "הקראה פועלת", exact: true }).click();
  for (const viewport of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const name of ["צובעים ארגזים", "הדואר המבולבל"]) {
      await page.getByRole("button").filter({ has: page.getByText(name, { exact: true }) }).click();
      await fitsViewport(page);
      await page.getByRole("button", { name: "מכירים את המשימה ←", exact: true }).click();
      await page.getByRole("radio", { name: name === "צובעים ארגזים" ? /5 · מילים ארוכות/ : /3 · מאתגרים/ }).check();
      await fitsViewport(page);
      await page.getByRole("button", { name: "מוכנים, מתחילים ←", exact: true }).click();
      if (name !== "צובעים ארגזים") await page.getByRole("button", { name: "פתיחת מקלדת עזר", exact: true }).click();
      if (name === "הדואר המבולבל") {
        await expect(page.getByTestId("revealed-word")).toHaveText(await expectedWord(page));
        await page.screenshot({ path: test.info().outputPath(`quiet-post-${viewport.width}.png`) });
      }
      await fitsViewport(page);
      if (name === "צובעים ארגזים") {
        await page.screenshot({ path: test.info().outputPath(`crate-${viewport.width}.png`) });
        const prompt = page.getByRole("region", { name: "אבא מציג את המילה" });
        const keyboard = page.getByRole("region", { name: "מקלדת עברית לעזרה" });
        for (const element of [prompt, keyboard, page.getByRole("textbox")]) {
          expect(await element.evaluate((el) => {
            const box = el.getBoundingClientRect();
            for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) {
              const style = getComputedStyle(ancestor);
              const bounds = ancestor.getBoundingClientRect();
              if (style.overflowY !== "visible" && (box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1)) return false;
              if (style.overflowX !== "visible" && (box.left < bounds.left - 1 || box.right > bounds.right + 1)) return false;
            }
            return true;
          })).toBe(true);
        }
        await page.getByRole("button", { name: "שמירה ויציאה", exact: true }).click();
        await page.reload();
        await page.getByRole("button", { name: "ממשיכים מאיפה שעצרנו", exact: true }).click();
        await expect(page.getByText("רמה 5", { exact: true })).toBeVisible();
        await fitsViewport(page);
      }
      if (name !== "פיצי במרדף") {
        await submit(page, "שגיאה");
        await fitsViewport(page);
      }
      const length = name === "הדואר המבולבל" ? 10 : 8;
      const seen = new Set<string>();
      for (let index = 0; index < length; index++) {
        const word = await expectedWord(page);
        seen.add(word);
        const verifyReducedMotion = name === "צובעים ארגזים" && viewport.width === 1440 && index === 1;
        if (verifyReducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
        await submit(page, word);
        if (name === "צובעים ארגזים") {
          await expect(page.getByRole("region", { name: "אבא מציג את המילה" })).toContainText("כל הכבוד!");
          if (index === 0) {
            const portrait = page.locator(".crate-prompt .character-portrait");
            await expect(portrait).toHaveCSS("animation-name", "dad-cheer");
            await page.getByRole("button", { name: "הפסקה", exact: true }).click();
            await expect(portrait).toHaveCSS("animation-play-state", "paused");
            await fitsViewport(page);
            await page.getByRole("button", { name: "חזרה למשחק", exact: true }).click();
            await expect(portrait).toHaveCSS("animation-play-state", "running");
          }
          if (verifyReducedMotion) {
            await expect(page.locator(".crate-prompt .character-portrait")).toHaveCSS("animation-name", "none");
            await page.emulateMedia({ reducedMotion: "no-preference" });
          }
          if (index === length - 1) {
            await page.screenshot({ path: test.info().outputPath(`crate-correct-${viewport.width}.png`) });
          }
        }
        await fitsViewport(page);
        await page.getByRole("button", { name: "המשך עכשיו ←", exact: true }).click();
      }
      if (name === "צובעים ארגזים") expect(seen.size).toBe(length);
      await fitsViewport(page);
      await page.getByRole("button", { name: "לסיום ←", exact: true }).click();
      await fitsViewport(page);
      await page.getByRole("button", { name: "לבחירת משחקון", exact: true }).click();
      await fitsViewport(page);
    }
  }
  expect(errors).toEqual([]);
});
